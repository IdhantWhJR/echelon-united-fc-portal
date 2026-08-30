import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, withErrorHandling } from "@/lib/guard";

// PATCH /api/notifications/[id]  { isRead: boolean }
// A user may only ever mark their own notifications read/unread — this is
// checked against the session's userId, not trusted from the request body.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    if (typeof body.isRead !== "boolean") {
      return NextResponse.json({ error: "isRead must be a boolean." }, { status: 400 });
    }

    const existing = await prisma.notification.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: { isRead: body.isRead },
    });
    return NextResponse.json({ notification });
  });
}
