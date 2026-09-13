import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { fineCreateSchema } from "@/lib/validation";
import { notifyUsers } from "@/lib/notify";

// GET /api/admin/fines?playerProfileId=xxx (optional filter)
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireStaff();
    const { searchParams } = new URL(req.url);
    const playerProfileId = searchParams.get("playerProfileId");

    const fines = await prisma.fine.findMany({
      where: playerProfileId ? { playerProfileId } : undefined,
      include: {
        playerProfile: { include: { user: { select: { name: true } } } },
        issuedBy: { select: { name: true } },
      },
      orderBy: [{ status: "asc" }, { issuedAt: "desc" }],
      take: 300,
    });

    return NextResponse.json({ fines });
  });
}

// POST /api/admin/fines  { playerProfileId, reason, amount, currency?, note? }
// Staff-only. Creates the fine and notifies the player it's assigned to.
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireStaff();
    const parsed = fineCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const data = parsed.data;

    const player = await prisma.playerProfile.findUnique({
      where: { id: data.playerProfileId },
      select: { id: true, userId: true },
    });
    if (!player) return NextResponse.json({ error: "Player not found." }, { status: 404 });

    const fine = await prisma.fine.create({
      data: {
        playerProfileId: player.id,
        issuedById: session.user.id,
        reason: data.reason,
        amountMinor: Math.round(data.amount * 100),
        currency: data.currency,
        note: data.note,
      },
    });

    await notifyUsers([{ userId: player.userId }], {
      type: "FINE_ISSUED",
      title: "A fine has been added to your account",
      body: `${data.reason} — ${data.currency} ${data.amount.toFixed(2)}`,
      link: "/dashboard/payments",
    });

    return NextResponse.json({ fine }, { status: 201 });
  });
}
