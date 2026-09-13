import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, withErrorHandling } from "@/lib/guard";

// GET /api/notifications — the signed-in user's own notifications only.
export async function GET() {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ notifications });
  });
}

// PATCH /api/notifications  { markAllRead: true } — marks every unread
// notification belonging to the signed-in user as read. Never touches
// another user's notifications, since the where clause is scoped to the
// session's own userId regardless of what the client sends.
export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    if (body.markAllRead !== true) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  });
}
