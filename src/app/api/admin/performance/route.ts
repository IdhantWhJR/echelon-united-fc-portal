import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { performanceUpdateSchema } from "@/lib/validation";

// POST /api/admin/performance  { playerProfileId, periodLabel, matchesPlayed?, goals?, ... }
// Staff-only. One record per (player, periodLabel) — posting again for the
// same period updates that record rather than creating a duplicate, so the
// "current" snapshot shown on the player dashboard stays a single source of
// truth per period.
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const session = await requireStaff();
    const parsed = performanceUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const { playerProfileId, periodLabel, ...rest } = parsed.data;

    const existing = await prisma.performanceStat.findFirst({
      where: { playerProfileId, periodLabel },
      select: { id: true },
    });

    const stat = existing
      ? await prisma.performanceStat.update({
          where: { id: existing.id },
          data: { ...rest, updatedById: session.user.id },
        })
      : await prisma.performanceStat.create({
          data: { playerProfileId, periodLabel, ...rest, updatedById: session.user.id },
        });

    return NextResponse.json({ stat }, { status: existing ? 200 : 201 });
  });
}
