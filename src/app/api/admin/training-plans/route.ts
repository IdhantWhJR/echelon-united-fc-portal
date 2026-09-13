import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { trainingPlanDayCreateSchema } from "@/lib/validation";

export async function GET() {
  return withErrorHandling(async () => {
    await requireStaff();
    const days = await prisma.trainingPlanDay.findMany({
      orderBy: [{ dayOfWeek: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ days });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireStaff();
    const parsed = trainingPlanDayCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const day = await prisma.trainingPlanDay.create({ data: parsed.data });
    return NextResponse.json({ day }, { status: 201 });
  });
}