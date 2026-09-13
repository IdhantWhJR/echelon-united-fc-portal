import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";

// Announcements are simple posts with no downstream records depending on
// them (unlike players/payments), so a hard delete is fine here — matching
// the reasoning already used for /api/admin/events/[id].
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const announcement = await prisma.announcement.findUnique({ where: { id: params.id } });
    if (!announcement) return NextResponse.json({ error: "Announcement not found." }, { status: 404 });
    await prisma.announcement.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}
