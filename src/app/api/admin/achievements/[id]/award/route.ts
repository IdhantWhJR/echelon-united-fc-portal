import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { achievementAwardSchema } from "@/lib/validation";

// POST /api/admin/achievements/[id]/award
// Staff-only. Awards one achievement to one or more players. Skips players
// who already have it (unique constraint) rather than erroring the whole
// batch, and notifies each newly-awarded player.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const session = await requireStaff();
    const parsed = achievementAwardSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const { playerProfileIds } = parsed.data;

    const achievement = await prisma.achievement.findUnique({ where: { id: params.id } });
    if (!achievement) return NextResponse.json({ error: "Achievement not found." }, { status: 404 });

    const players = await prisma.playerProfile.findMany({
      where: { id: { in: playerProfileIds } },
      select: { id: true, userId: true },
    });

    const alreadyAwarded = await prisma.playerAchievement.findMany({
      where: { achievementId: params.id, playerProfileId: { in: players.map((p) => p.id) } },
      select: { playerProfileId: true },
    });
    const alreadySet = new Set(alreadyAwarded.map((a) => a.playerProfileId));
    const toAward = players.filter((p) => !alreadySet.has(p.id));

    if (toAward.length === 0) {
      return NextResponse.json({ awardedCount: 0, message: "All selected players already have this achievement." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.playerAchievement.createMany({
        data: toAward.map((p) => ({
          achievementId: params.id,
          playerProfileId: p.id,
          awardedById: session.user.id,
        })),
      });
      await tx.notification.createMany({
        data: toAward.map((p) => ({
          userId: p.userId,
          type: "GENERAL" as const,
          title: "New achievement unlocked",
          body: achievement.title,
          link: "/dashboard/achievements",
        })),
      });
    });

    return NextResponse.json({ awardedCount: toAward.length }, { status: 201 });
  });
}
