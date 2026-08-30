import webpush from "web-push";
import { prisma } from "@/lib/prisma";

/**
 * Real browser Web Push, on top of the existing in-app Notification model.
 * This does NOT replace Notification rows (the notification center still
 * reads those) — it's an additional delivery channel for users who have
 * both pushEnabled=true AND a saved pushSubscriptionJson (from actually
 * granting permission + subscribing in the browser, see
 * src/components/dashboard/push-subscribe-toggle.tsx).
 *
 * Requires in .env:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 * Generate with: npx web-push generate-vapid-keys
 */

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return false;
  }
  webpush.setVapidDetails("mailto:admin@echelonunited.example", publicKey, privateKey);
  configured = true;
  return true;
}

type PushPayload = {
  title: string;
  body: string;
  link?: string;
};

/**
 * Sends a real push notification to every subscribed, opted-in device for
 * the given user IDs. Silently no-ops (logging once) if VAPID keys aren't
 * configured, so this is safe to call in every environment — dev boxes
 * without push configured just get the existing in-app notification.
 *
 * `preferenceKey` should match the same NotificationPreference boolean the
 * caller already checked before creating the in-app Notification rows, so
 * push respects the exact same opt-outs.
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (userIds.length === 0) return;
  if (!ensureConfigured()) {
    console.warn("Web Push not configured (missing VAPID keys) — skipping push, in-app notification still sent.");
    return;
  }

  const prefs = await prisma.notificationPreference.findMany({
    where: {
      userId: { in: userIds },
      pushEnabled: true,
      pushSubscriptionJson: { not: null },
    },
    select: { userId: true, pushSubscriptionJson: true },
  });

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    link: payload.link ?? "/dashboard/notifications",
  });

  await Promise.all(
    prefs.map(async (pref) => {
      if (!pref.pushSubscriptionJson) return;
      try {
        const subscription = JSON.parse(pref.pushSubscriptionJson);
        await webpush.sendNotification(subscription, notificationPayload);
      } catch (err: any) {
        // 410/404 means the subscription is gone (browser data cleared, etc.)
        // — clean it up so we stop trying.
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await prisma.notificationPreference
            .update({ where: { userId: pref.userId }, data: { pushSubscriptionJson: null } })
            .catch(() => {});
        } else {
          console.error("Push send failed for user", pref.userId, err?.message ?? err);
        }
      }
    })
  );
}
