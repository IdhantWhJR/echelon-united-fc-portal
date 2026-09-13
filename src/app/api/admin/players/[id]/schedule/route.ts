import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";

// GET /api/admin/players/[id]/schedule
// Staff-only. Returns everything ever scheduled for this player — Events
// (squad-wide, club-wide, or individually assigned, same OR-clause pattern
// used to resolve "today's events" on the player dashboard) merged with
// their WorkoutAssignments (each workout counts as one "event" per the
// admin attendance spec), plus the present-rate stats the attendance page
// needs. One route, one round trip, since no existing endpoint returns
// this combined shape.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();

    const profile = await prisma.playerProfile.findUnique({
      where: { id: params.id },
      select: { id: true, squadId: true, user: { select: { name: true } } },
    });
    if (!profile) return NextResponse.json({ error: "Player not found." }, { status: 404 });

    const [events, workoutAssignments] = await Promise.all([
      prisma.event.findMany({
        where: {
          OR: [
            { squadId: null },
            { squadId: profile.squadId ?? undefined },
            { assignments: { some: { playerProfileId: profile.id } } },
          ],
        },
        orderBy: { startTime: "asc" },
        include: {
          match: { select: { opponent: true } },
          attendanceRecords: {
            where: { playerProfileId: profile.id },
            select: { status: true, markedByCoach: true },
          },
        },
      }),
      prisma.workoutAssignment.findMany({
        where: { playerProfileId: profile.id },
        orderBy: { createdAt: "asc" },
        include: { workout: { select: { title: true, date: true, deadline: true } } },
      }),
    ]);

    const eventItems = events.map((e) => ({
      kind: "EVENT" as const,
      id: e.id,
      title: e.match ? `vs ${e.match.opponent}` : e.title,
      type: e.type,
      date: e.date.toISOString(),
      startTime: e.startTime.toISOString(),
      status: e.attendanceRecords[0]?.status ?? "PENDING",
      markedByCoach: e.attendanceRecords[0]?.markedByCoach ?? false,
    }));

    const workoutItems = workoutAssignments.map((w) => ({
      kind: "WORKOUT" as const,
      id: w.id,
      title: w.workout.title,
      type: "WORKOUT" as const,
      date: (w.workout.deadline ?? w.workout.date).toISOString(),
      startTime: (w.workout.deadline ?? w.workout.date).toISOString(),
      status: w.status,
      markedByCoach: false,
    }));

    const eventsPresent = eventItems.filter((e) => e.status === "ATTENDING").length;
    const workoutsPresent = workoutItems.filter((w) => w.status === "VERIFIED").length;
    const totalPresent = eventsPresent + workoutsPresent;
    const totalItems = eventItems.length + workoutItems.length;
    const presentRate = totalItems > 0 ? Math.round((totalPresent / totalItems) * 100) : null;

    return NextResponse.json({
      player: { id: profile.id, name: profile.user.name },
      items: [...eventItems, ...workoutItems].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
      stats: {
        presentRate,
        eventsTotal: eventItems.length,
        eventsPresent,
        workoutsTotal: workoutItems.length,
        workoutsPresent,
      },
    });
  });
}
