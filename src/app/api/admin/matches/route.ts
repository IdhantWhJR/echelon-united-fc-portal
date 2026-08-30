import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { matchCreateSchema } from "@/lib/validation";

export async function GET() {
  return withErrorHandling(async () => {
    await requireStaff();
    const matches = await prisma.match.findMany({
      orderBy: { date: "desc" },
      include: { event: { include: { attendanceRecords: true } } },
    });
    return NextResponse.json({ matches });
  });
}

// POST /api/admin/matches — creates the Match plus its linked calendar Event
// in one call (the schema models a match as an Event with type MATCH via
// Event.matchId), and seeds attendance for the target squad the same way
// the events route does, so admins see live RSVPs building up pre-kickoff.
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireStaff();
    const body = await req.json();
    const parsed = matchCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const data = parsed.data;

    const match = await prisma.match.create({
      data: {
        opponent: data.opponent,
        competition: data.competition,
        date: new Date(data.date),
        kickoff: new Date(data.kickoff),
        venue: data.venue,
        homeAway: data.homeAway,
        description: data.description,
        createdById: session.user.id,
      },
    });

    const event = await prisma.event.create({
      data: {
        title: `Match vs ${data.opponent}`,
        type: "MATCH",
        date: new Date(data.date),
        startTime: new Date(data.kickoff),
        location: data.venue ?? data.location,
        squadId: data.squadId ?? undefined,
        matchId: match.id,
        createdById: session.user.id,
      },
    });

    const players = await prisma.playerProfile.findMany({
      where: data.squadId ? { squadId: data.squadId } : {},
      select: { id: true, userId: true },
    });
    if (players.length > 0) {
      await prisma.attendanceRecord.createMany({
        data: players.map((p) => ({
          eventId: event.id,
          playerProfileId: p.id,
          userId: p.userId,
          status: "PENDING" as const,
        })),
        skipDuplicates: true,
      });
      await prisma.notification.createMany({
        data: players.map((p) => ({
          userId: p.userId,
          type: "MATCH_REMINDER" as const,
          title: "New match scheduled",
          body: `Echelon United vs ${data.opponent} — please confirm your availability.`,
          link: "/dashboard/matches",
        })),
      });
    }

    return NextResponse.json({ match, event }, { status: 201 });
  });
}
