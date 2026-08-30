import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, withErrorHandling } from "@/lib/guard";

// GET /api/payments
// Any signed-in user. Always scoped to session.user.id — there is no way to
// pass a different target id, so a player can never read someone else's
// payment records through this route.
export async function GET() {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const payments = await prisma.payment.findMany({
      where: { userId: session.user.id },
      include: {
        event: { select: { title: true } },
        match: { select: { opponent: true } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });
    return NextResponse.json({ payments });
  });
}
