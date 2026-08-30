import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, withErrorHandling } from "@/lib/guard";
import { pushSubscribeSchema } from "@/lib/validation";

// POST /api/notification-preferences/push-subscription
// Own row only. Saves the browser's real PushSubscription object (from
// PushManager.subscribe(), see push-subscribe-toggle.tsx) so
// sendPushToUsers() in src/lib/push.ts can actually deliver to this
// device. This is separate from the pushEnabled boolean on
// NotificationPreference — pushEnabled is the user's stated preference,
// this is the concrete subscription that makes delivery possible. Both
// must be true for a push to send (see push.ts's query).
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const parsed = pushSubscribeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid subscription." }, { status: 400 });
    }

    await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: { pushSubscriptionJson: JSON.stringify(parsed.data), pushEnabled: true },
      create: { userId: session.user.id, pushSubscriptionJson: JSON.stringify(parsed.data), pushEnabled: true },
    });

    return NextResponse.json({ success: true });
  });
}

// DELETE /api/notification-preferences/push-subscription
// Own row only. Clears the saved subscription (called when the user turns
// the master toggle off, or when the browser's own subscription is gone).
export async function DELETE() {
  return withErrorHandling(async () => {
    const session = await requireSession();
    await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: { pushSubscriptionJson: null },
      create: { userId: session.user.id, pushSubscriptionJson: null },
    });
    return NextResponse.json({ success: true });
  });
}
