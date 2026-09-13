import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { paymentCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireStaff();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const payments = await prisma.payment.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        playerProfile: { include: { user: { select: { name: true } } } },
        event: { select: { title: true } },
        match: { select: { opponent: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 300,
    });

    return NextResponse.json({ payments });
  });
}

// POST /api/admin/payments
// Staff-only. Creates one Payment row per targeted player (fee/transport/etc,
// stored in minor units) and notifies each player, respecting their
// paymentReminders preference — same fan-out shape as announcements.
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireStaff();
    const parsed = paymentCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const data = parsed.data;

    if (data.eventId) {
      const event = await prisma.event.findUnique({ where: { id: data.eventId }, select: { id: true } });
      if (!event) return NextResponse.json({ error: "Selected event was not found." }, { status: 400 });
    }
    if (data.matchId) {
      const match = await prisma.match.findUnique({ where: { id: data.matchId }, select: { id: true } });
      if (!match) return NextResponse.json({ error: "Selected match was not found." }, { status: 400 });
    }

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
    if (players.length === 0) {
      return NextResponse.json({ error: "No active players match this target." }, { status: 400 });
    }

    const amountMinor = Math.round(data.amount * 100);

    const createdCount = await prisma.$transaction(async (tx) => {
      await tx.payment.createMany({
        data: players.map((p) => ({
          playerProfileId: p.id,
          userId: p.userId,
          eventId: data.eventId || null,
          matchId: data.matchId || null,
          label: data.label,
          amountMinor,
          currency: data.currency,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        })),
      });

      const prefs = await tx.notificationPreference.findMany({
        where: { userId: { in: players.map((p) => p.userId) } },
        select: { userId: true, paymentReminders: true },
      });
      const optedOut = new Set(prefs.filter((p) => !p.paymentReminders).map((p) => p.userId));
      const recipients = players.filter((p) => !optedOut.has(p.userId));

      if (recipients.length > 0) {
        await tx.notification.createMany({
          data: recipients.map((p) => ({
            userId: p.userId,
            type: "PAYMENT_REMINDER" as const,
            title: "New payment due",
            body: `${data.label} — ${(amountMinor / 100).toFixed(2)} ${data.currency}`,
            link: "/dashboard/payments",
          })),
        });
      }

      return players.length;
    });

    return NextResponse.json({ createdCount }, { status: 201 });
  });
}
