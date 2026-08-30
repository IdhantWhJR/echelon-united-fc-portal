import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, withErrorHandling } from "@/lib/guard";

// GET /api/events?from=iso&to=iso — events visible to the signed-in player:
// club-wide, their squad's, or individually assigned to them.
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, squadId: true },
    });

    // Staff viewing their own calendar sees everything club-wide.
    const where = profile
      ? {
          OR: [
            { squadId: null },
            { squadId: profile.squadId ?? undefined },
            { assignments: { some: { playerProfileId: profile.id } } },
          ],
        }
      : {};

    const events = await prisma.event.findMany({
      where: {
        ...where,
        ...(from || to
          ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
          : {}),
      },
      include: {
        match: true,
        squad: { select: { name: true } },
        attendanceRecords: profile
          ? { where: { playerProfileId: profile.id }, select: { status: true } }
          : false,
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({ events });
  });
}
