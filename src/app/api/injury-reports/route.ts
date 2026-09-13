import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnerOrStaff, requireSession, withErrorHandling } from "@/lib/guard";
import { injuryReportSchema } from "@/lib/validation";

// GET /api/injury-reports?playerProfileId=xxx  (defaults to the signed-in player's own profile)
export async function GET(req: Request) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    let playerProfileId = searchParams.get("playerProfileId");

    if (!playerProfileId) {
      const own = await prisma.playerProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!own) return NextResponse.json({ reports: [] });
      playerProfileId = own.id;
    }

    await requireOwnerOrStaff(playerProfileId as string);

    const reports = await prisma.injuryReport.findMany({
      where: { playerProfileId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reports });
  });
}

// POST /api/injury-reports  { playerProfileId, bodyArea, painLevel, onsetDate, ... }
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const parsed = injuryReportSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    await requireOwnerOrStaff(parsed.data.playerProfileId);

    // Reporting an injury also flags the player's status so staff and
    // teammates' attendance/availability views reflect it immediately —
    // matches the same soft-status pattern used by deactivate/reactivate.
    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.injuryReport.create({
        data: {
          playerProfileId: parsed.data.playerProfileId,
          userId: session.user.id,
          bodyArea: parsed.data.bodyArea,
          painLevel: parsed.data.painLevel,
          onsetDate: new Date(parsed.data.onsetDate),
          mechanism: parsed.data.mechanism,
          occurredDuring: parsed.data.occurredDuring,
          canWalk: parsed.data.canWalk,
          canTrain: parsed.data.canTrain,
          canPlay: parsed.data.canPlay,
          description: parsed.data.description,
          mediaUrl: parsed.data.mediaUrl,
        },
      });

      if (!parsed.data.canPlay) {
        await tx.playerProfile.update({
          where: { id: parsed.data.playerProfileId },
          data: { status: "INJURED" },
        });
      }

      // Notify staff so a new injury report doesn't sit unseen. Every
      // coach/admin gets one so nobody has to remember to check the queue.
      const staff = await tx.user.findMany({
        where: { role: { in: ["COACH", "ADMIN"] }, isActive: true },
        select: { id: true },
      });
      const player = await tx.playerProfile.findUnique({
        where: { id: parsed.data.playerProfileId },
        select: { user: { select: { name: true } } },
      });
      if (staff.length > 0) {
        await tx.notification.createMany({
          data: staff.map((s) => ({
            userId: s.id,
            type: "GENERAL" as const,
            title: "New injury report",
            body: `${player?.user.name ?? "A player"} reported a ${parsed.data.bodyArea.toLowerCase().replace("_", " ")} issue.`,
            link: "/admin/wellness",
          })),
        });
      }

      return created;
    });

    return NextResponse.json({ report }, { status: 201 });
  });
}
