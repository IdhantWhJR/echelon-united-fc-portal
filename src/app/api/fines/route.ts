import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, withErrorHandling } from "@/lib/guard";

// GET /api/fines
// Any signed-in player. Always scoped to their own profile — there is no
// way to pass a different target id, so a player can never read someone
// else's fines through this route.
export async function GET() {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) return NextResponse.json({ fines: [] });

    const fines = await prisma.fine.findMany({
      where: { playerProfileId: profile.id },
      orderBy: [{ status: "asc" }, { issuedAt: "desc" }],
    });

    return NextResponse.json({ fines });
  });
}
