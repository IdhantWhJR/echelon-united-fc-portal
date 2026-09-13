import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { achievementUpdateSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const parsed = achievementUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const data = parsed.data;

    const existing = await prisma.achievement.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Achievement not found." }, { status: 404 });

    if (data.title && data.title !== existing.title) {
      const clash = await prisma.achievement.findUnique({ where: { title: data.title } });
      if (clash) return NextResponse.json({ error: "An achievement with this title already exists." }, { status: 409 });
    }

    const achievement = await prisma.achievement.update({
      where: { id: params.id },
      data: {
        title: data.title,
        description: data.description === "" ? null : data.description,
        iconKey: data.iconKey === "" ? null : data.iconKey,
      },
    });
    return NextResponse.json({ achievement });
  });
}

// DELETE removes the achievement definition and every award of it (a coach
// deciding a milestone shouldn't exist anymore) — never hides player history
// silently, this is an explicit destructive admin action.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const existing = await prisma.achievement.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Achievement not found." }, { status: 404 });

    await prisma.achievement.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  });
}
