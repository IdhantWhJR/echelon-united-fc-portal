import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const playerCount = await prisma.playerProfile.count({ where: { squadId: params.id } });
    if (playerCount > 0) {
      return NextResponse.json(
        { error: "Move players out of this squad before deleting it." },
        { status: 409 }
      );
    }
    await prisma.squad.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}
