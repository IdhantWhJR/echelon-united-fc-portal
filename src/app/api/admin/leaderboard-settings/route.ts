import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { leaderboardVisibilitySchema } from "@/lib/validation";

// PATCH /api/admin/leaderboard-settings
// Staff-only. Toggles whether one leaderboard is visible to players. Upserts
// so the first toggle for a given key creates its settings row.
export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireStaff();
    const parsed = leaderboardVisibilitySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const { key, visible } = parsed.data;

    const setting = await prisma.leaderboardSetting.upsert({
      where: { key },
      update: { visible },
      create: { key, visible },
    });

    return NextResponse.json({ setting });
  });
}
