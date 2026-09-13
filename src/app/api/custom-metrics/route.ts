import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnerOrStaff, requireSession, withErrorHandling } from "@/lib/guard";
import { customMetricEntrySchema } from "@/lib/validation";

// GET /api/custom-metrics?playerProfileId=xxx (defaults to the signed-in player's own profile)
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

    const entries = await prisma.customMetricEntry.findMany({
      where: { playerProfileId },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ entries });
  });
}

// POST /api/custom-metrics  { playerProfileId?, metricName, unit?, value, date?, note? }
// playerProfileId defaults to the signed-in player's own profile, so a player
// logging their own metric doesn't need to know their profile id.
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const body = await req.json();
    const parsed = customMetricEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    let playerProfileId = parsed.data.playerProfileId;
    if (!playerProfileId) {
      const own = await prisma.playerProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!own) return NextResponse.json({ error: "No player profile found." }, { status: 403 });
      playerProfileId = own.id;
    }

    await requireOwnerOrStaff(playerProfileId);

    const entry = await prisma.customMetricEntry.create({
      data: {
        playerProfileId,
        metricName: parsed.data.metricName,
        unit: parsed.data.unit,
        value: parsed.data.value,
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
        note: parsed.data.note,
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  });
}

// DELETE /api/custom-metrics?id=xxx
export async function DELETE(req: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    const existing = await prisma.customMetricEntry.findUnique({
      where: { id },
      select: { playerProfileId: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

    await requireOwnerOrStaff(existing.playerProfileId);
    await prisma.customMetricEntry.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  });
}
