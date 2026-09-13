import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { eventCreateSchema } from "@/lib/validation";

// GET /api/admin/events?from=iso&to=iso — used by the admin calendar view
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireStaff();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const events = await prisma.event.findMany({
      where: {
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      include: {
        squad: { select: { id: true, name: true } },
        match: true,
        assignments: { select: { playerProfileId: true } },
        attendanceRecords: { select: { status: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({ events });
  });
}

// POST /api/admin/events — creates an event and seeds PENDING attendance
// records for every player it targets, so admins see live totals from the
// moment it's created rather than only once players respond.
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireStaff();
    const body = await req.json();
    const parsed = eventCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const data = parsed.data;

    const event = await prisma.event.create({
      data: {
        title: data.title,
        type: data.type,
        date: new Date(data.date),
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        location: data.location,
        description: data.description,
        notes: data.notes,
        squadId: data.squadId ?? undefined,
        createdById: session.user.id,
        ...(data.playerProfileIds?.length
          ? { assignments: { create: data.playerProfileIds.map((id) => ({ playerProfileId: id })) } }
          : {}),
      },
    });

    // Work out which players this event targets: individually-assigned
    // players, or everyone in the squad, or the whole club if club-wide.
    let targetProfileIds: string[];
    if (data.playerProfileIds?.length) {
      targetProfileIds = data.playerProfileIds;
    } else {
      const players = await prisma.playerProfile.findMany({
        where: data.squadId ? { squadId: data.squadId } : {},
        select: { id: true, userId: true },
      });
      targetProfileIds = players.map((p) => p.id);
    }

    if (targetProfileIds.length > 0) {
      const players = await prisma.playerProfile.findMany({
        where: { id: { in: targetProfileIds } },
        select: { id: true, userId: true },
      });
      await prisma.attendanceRecord.createMany({
        data: players.map((p) => ({
          eventId: event.id,
          playerProfileId: p.id,
          userId: p.userId,
          status: "PENDING" as const,
        })),
        skipDuplicates: true,
      });

      // Notify targeted players so this shows up in their notification center.
      await prisma.notification.createMany({
        data: players.map((p) => ({
          userId: p.userId,
          type:
            data.type === "TRAINING"
              ? ("TRAINING_REMINDER" as const)
              : data.type === "MATCH"
              ? ("MATCH_REMINDER" as const)
              : ("GENERAL" as const),
          title: data.type === "TRAINING" ? "New training session" : "New event scheduled",
          body: `${data.title} — please confirm your attendance.`,
          link: "/dashboard/calendar",
        })),
      });
    }

    return NextResponse.json({ event }, { status: 201 });
  });
}
