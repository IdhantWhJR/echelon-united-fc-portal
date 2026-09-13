import { prisma } from "@/lib/prisma";
import { sendPushToUsers } from "@/lib/push";
import { NotificationType } from "@prisma/client";

/**
 * Creates one Notification row per recipient (same as the existing
 * tx.notification.createMany call sites) and additionally fires real Web
 * Push to whichever of those recipients have pushEnabled + a saved
 * subscription. Use this instead of a bare notification.createMany when you
 * want both channels — the in-app row is still the source of truth for the
 * notification center; push is best-effort on top.
 *
 * `recipients` should already be filtered for the relevant preference
 * opt-out (e.g. `announcements`, `workoutUpdates`) exactly as the existing
 * call sites already do before calling this.
 */
export async function notifyUsers(
  recipients: { userId: string }[],
  notification: { type: NotificationType; title: string; body: string; link?: string }
) {
  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((r) => ({
      userId: r.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      link: notification.link,
    })),
  });

  // Best-effort — never let a push failure break the request that created
  // the notification. sendPushToUsers already swallows individual errors;
  // this catch is a final backstop for unexpected failures (e.g. DB hiccup
  // reading NotificationPreference).
  sendPushToUsers(
    recipients.map((r) => r.userId),
    { title: notification.title, body: notification.body, link: notification.link }
  ).catch((err) => console.error("notifyUsers: push dispatch failed", err));
}
