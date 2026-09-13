import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnerOrStaff, requireSession, withErrorHandling } from "@/lib/guard";
import { weightEntrySchema } from "@/lib/validation";

// GET /api/weight?playerProfileId=xxx  (defaults to the signed-in player's own profile)
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
      if (!own) return NextResponse.json({ entries: [] });
      playerProfileId = own.id;
    }

    await requireOwnerOrStaff(playerProfileId as string);

    const entries = await prisma.weightEntry.findMany({
      where: { playerProfileId },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ entries });
  });
}

// POST /api/weight  { playerProfileId, weightKg, date?, note? }
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const body = await req.json();
    const parsed = weightEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    await requireOwnerOrStaff(parsed.data.playerProfileId);

    const entry = await prisma.weightEntry.create({
      data: {
        playerProfileId: parsed.data.playerProfileId,
        weightKg: parsed.data.weightKg,
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
        note: parsed.data.note,
        recordedById: session.user.id,
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  });
}
