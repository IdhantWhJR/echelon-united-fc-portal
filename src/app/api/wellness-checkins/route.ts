import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnerOrStaff, requireSession, withErrorHandling } from "@/lib/guard";
import { wellnessCheckinSchema } from "@/lib/validation";

// GET /api/wellness-checkins?playerProfileId=xxx  (defaults to the signed-in player's own profile)
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
      if (!own) return NextResponse.json({ checkins: [] });
      playerProfileId = own.id;
    }

    await requireOwnerOrStaff(playerProfileId as string);

    const checkins = await prisma.wellnessCheckin.findMany({
      where: { playerProfileId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json({ checkins });
  });
}

// POST /api/wellness-checkins  { playerProfileId, feeling, sleepQuality?, sorenessLevel?, note? }
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const parsed = wellnessCheckinSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    await requireOwnerOrStaff(parsed.data.playerProfileId);

    const checkin = await prisma.wellnessCheckin.create({
      data: {
        playerProfileId: parsed.data.playerProfileId,
        userId: session.user.id,
        feeling: parsed.data.feeling,
        sleepQuality: parsed.data.sleepQuality,
        sorenessLevel: parsed.data.sorenessLevel,
        note: parsed.data.note,
      },
    });

    return NextResponse.json({ checkin }, { status: 201 });
  });
}
