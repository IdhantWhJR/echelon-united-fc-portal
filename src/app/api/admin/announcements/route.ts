import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { announcementCreateSchema } from "@/lib/validation";
import { sendPushToUsers } from "@/lib/push";

export async function GET() {
  return withErrorHandling(async () => {
    await requireStaff();
    const announcements = await prisma.announcement.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 50,
      include: {
        author: { select: { name: true } },
        squad: { select: { name: true } },
      },
    });
    return NextResponse.json({ announcements });
  });
}

// POST /api/admin/announcements
// Staff-only. Creates one Announcement row (the club-facing post) and fans out
// a Notification to every targeted, active user who hasn't opted out of
// announcement notifications in their NotificationPreference.
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireStaff();
    const parsed = announcementCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const data = parsed.data;

    if (data.targetType === "SQUAD" && !data.squadId) {
      return NextResponse.json({ error: "Choose a squad for a squad announcement." }, { status: 400 });
    }
    if (data.targetType === "INDIVIDUAL" && !data.playerProfileIds?.length) {
      return NextResponse.json({ error: "Choose at least one player." }, { status: 400 });
    }
    if (data.squadId) {
      const squad = await prisma.squad.findUnique({ where: { id: data.squadId }, select: { id: true } });
      if (!squad) return NextResponse.json({ error: "Selected squad was not found." }, { status: 400 });
    }

    // Resolve which users this announcement is actually visible to, the same
    // way the dashboard query already filters (EVERYONE / SQUAD / player's own
    // list of INDIVIDUAL assignments isn't modeled on Announcement directly,
    // so INDIVIDUAL targeting here fans out a Notification only — the
    // Announcement row itself stays EVERYONE/SQUAD-shaped per the schema).
    const players = await prisma.playerProfile.findMany({
      where:
        data.targetType === "SQUAD"
          ? { squadId: data.squadId, status: { not: "INACTIVE" } }
          : data.targetType === "INDIVIDUAL"
          ? { id: { in: data.playerProfileIds ?? [] }, status: { not: "INACTIVE" } }
          : { status: { not: "INACTIVE" } },
      select: { id: true, userId: true },
    });
    if (data.targetType === "INDIVIDUAL" && players.length !== data.playerProfileIds?.length) {
      return NextResponse.json({ error: "One or more selected players are no longer active." }, { status: 400 });
    }

    let pushRecipientIds: string[] = [];

    const announcement = await prisma.$transaction(async (tx) => {
      const created = await tx.announcement.create({
        data: {
          title: data.title,
          message: data.message,
          category: data.category,
          priority: data.priority ?? 0,
          // INDIVIDUAL targeting notifies specific players but the announcement
          // feed itself (dashboard, /dashboard/announcements) reads EVERYONE/SQUAD,
          // so store it as club-wide visibility and rely on the notification for
          // the individual case.
          targetType: data.targetType === "INDIVIDUAL" ? "EVERYONE" : data.targetType,
          squadId: data.targetType === "SQUAD" ? data.squadId : null,
          authorId: session.user.id,
          attachmentUrl: data.attachmentUrl || null,
        },
      });

      if (players.length > 0) {
        const prefs = await tx.notificationPreference.findMany({
          where: { userId: { in: players.map((p) => p.userId) } },
          select: { userId: true, announcements: true },
        });
        const optedOut = new Set(prefs.filter((p) => !p.announcements).map((p) => p.userId));
        const recipients = players.filter((p) => !optedOut.has(p.userId));

        if (recipients.length > 0) {
          await tx.notification.createMany({
            data: recipients.map((player) => ({
              userId: player.userId,
              type: "ANNOUNCEMENT" as const,
              title: data.title,
              body: data.message.length > 140 ? `${data.message.slice(0, 137)}...` : data.message,
              link: "/dashboard/announcements",
            })),
          });
          pushRecipientIds = recipients.map((r) => r.userId);
        }
      }

      return created;
    });

    // Web Push runs after the transaction commits (it's a separate,
    // best-effort side effect, never allowed to roll back the announcement).
    sendPushToUsers(pushRecipientIds, {
      title: data.title,
      body: data.message.length > 140 ? `${data.message.slice(0, 137)}...` : data.message,
      link: "/dashboard/announcements",
    }).catch((err) => console.error("Push dispatch failed for announcement", announcement.id, err));

    return NextResponse.json({ announcement, notifiedCount: players.length }, { status: 201 });
  });
}
