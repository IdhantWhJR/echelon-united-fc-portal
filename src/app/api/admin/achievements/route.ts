import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { achievementCreateSchema } from "@/lib/validation";

export async function GET() {
  return withErrorHandling(async () => {
    await requireStaff();
    const achievements = await prisma.achievement.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { awarded: true } } },
    });
    return NextResponse.json({ achievements });
  });
}

// POST /api/admin/achievements
// Staff-only. Creates a new achievement definition (not yet awarded to
// anyone — awarding is a separate step per achievement, see [id]/award).
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireStaff();
    const parsed = achievementCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const data = parsed.data;

    const existing = await prisma.achievement.findUnique({ where: { title: data.title } });
    if (existing) {
      return NextResponse.json({ error: "An achievement with this title already exists." }, { status: 409 });
    }

    const achievement = await prisma.achievement.create({
      data: { title: data.title, description: data.description || null, iconKey: data.iconKey || null },
    });
    return NextResponse.json({ achievement }, { status: 201 });
  });
}
