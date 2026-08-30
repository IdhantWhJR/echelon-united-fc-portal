import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { squadSchema } from "@/lib/validation";

export async function GET() {
  return withErrorHandling(async () => {
    await requireStaff();
    const squads = await prisma.squad.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { players: true } } },
    });
    return NextResponse.json({ squads });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireStaff();
    const body = await req.json();
    const parsed = squadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const existing = await prisma.squad.findUnique({ where: { name: parsed.data.name } });
    if (existing) {
      return NextResponse.json({ error: "A squad with that name already exists." }, { status: 409 });
    }
    const squad = await prisma.squad.create({ data: parsed.data });
    return NextResponse.json({ squad }, { status: 201 });
  });
}
