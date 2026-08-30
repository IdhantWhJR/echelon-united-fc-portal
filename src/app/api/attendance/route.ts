import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireStaff, withErrorHandling } from "@/lib/guard";
import { attendanceRespondSchema, attendanceOverrideSchema } from "@/lib/validation";

// POST /api/attendance — a player responding for THEMSELVES to an event.
// { eventId, status: "ATTENDING" | "UNAVAILABLE" | "MAYBE" }
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const body = await req.json();
    const parsed = attendanceRespondSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Only players can respond to events." }, { status: 403 });
    }

    const record = await prisma.attendanceRecord.upsert({
      where: { eventId_playerProfileId: { eventId: parsed.data.eventId, playerProfileId: profile.id } },
      update: { status: parsed.data.status, respondedAt: new Date(), markedByCoach: false },
      create: {
        eventId: parsed.data.eventId,
        playerProfileId: profile.id,
        userId: session.user.id,
        status: parsed.data.status,
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({ record });
  });
}

// PATCH /api/attendance — staff overriding a specific player's attendance.
// { eventId, playerProfileId, status }
export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireStaff();
    const body = await req.json();
    const parsed = attendanceOverrideSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const profile = await prisma.playerProfile.findUnique({
      where: { id: parsed.data.playerProfileId },
      select: { userId: true },
    });
    if (!profile) return NextResponse.json({ error: "Player not found." }, { status: 404 });

    const record = await prisma.attendanceRecord.upsert({
      where: {
        eventId_playerProfileId: { eventId: parsed.data.eventId, playerProfileId: parsed.data.playerProfileId },
      },
      update: { status: parsed.data.status, respondedAt: new Date(), markedByCoach: true },
      create: {
        eventId: parsed.data.eventId,
        playerProfileId: parsed.data.playerProfileId,
        userId: profile.userId,
        status: parsed.data.status,
        respondedAt: new Date(),
        markedByCoach: true,
      },
    });

    return NextResponse.json({ record });
  });
}
