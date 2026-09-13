import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { trainingPlanDayUpdateSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const parsed = trainingPlanDayUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const existing = await prisma.trainingPlanDay.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Training plan day not found." }, { status: 404 });
    const day = await prisma.trainingPlanDay.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json({ day });
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const existing = await prisma.trainingPlanDay.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Training plan day not found." }, { status: 404 });
    await prisma.trainingPlanDay.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}