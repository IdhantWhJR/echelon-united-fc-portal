import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, withErrorHandling } from "@/lib/guard";

// GET /api/matches — every match, most recent first. Match Center is
// visible to the whole squad (spec section 14), no per-player filtering.
export async function GET() {
  return withErrorHandling(async () => {
    await requireSession();
    const matches = await prisma.match.findMany({
      orderBy: { date: "desc" },
      include: {
        appearances: {
          include: { playerProfile: { include: { user: { select: { name: true } } } } },
        },
      },
    });
    return NextResponse.json({ matches });
  });
}
