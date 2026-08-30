import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { z } from "zod";

const appearanceSchema = z.object({
  playerProfileId: z.string().cuid(),
  role: z.enum(["STARTER", "SUBSTITUTE", "UNUSED_SUB", "NOT_SQUAD"]),
  minutesPlayed: z.number().int().min(0).max(120).optional(),
  goals: z.number().int().min(0).optional(),
  assists: z.number().int().min(0).optional(),
  yellowCards: z.number().int().min(0).max(2).optional(),
  redCards: z.number().int().min(0).max(1).optional(),
  ratingOutOf10: z.number().min(0).max(10).optional().nullable(),
});

// POST /api/admin/matches/[id]/appearances — upserts a single player's
// appearance for this match (role + stats). Called once per row edited on
// the admin match detail page, so partial saves never lose other players.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const body = await req.json();
    const parsed = appearanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const data = parsed.data;

    const appearance = await prisma.matchAppearance.upsert({
      where: { matchId_playerProfileId: { matchId: params.id, playerProfileId: data.playerProfileId } },
      update: {
        role: data.role,
        minutesPlayed: data.minutesPlayed ?? 0,
        goals: data.goals ?? 0,
        assists: data.assists ?? 0,
        yellowCards: data.yellowCards ?? 0,
        redCards: data.redCards ?? 0,
        ratingOutOf10: data.ratingOutOf10 ?? null,
      },
      create: {
        matchId: params.id,
        playerProfileId: data.playerProfileId,
        role: data.role,
        minutesPlayed: data.minutesPlayed ?? 0,
        goals: data.goals ?? 0,
        assists: data.assists ?? 0,
        yellowCards: data.yellowCards ?? 0,
        redCards: data.redCards ?? 0,
        ratingOutOf10: data.ratingOutOf10 ?? null,
      },
    });

    return NextResponse.json({ appearance });
  });
}
