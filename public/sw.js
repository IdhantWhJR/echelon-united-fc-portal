// Echelon United FC — Web Push service worker.
//
// Registered from src/components/dashboard/push-subscribe-toggle.tsx.
// This file must live at the site root (not under /public/something) so
// its scope covers the whole app — Next.js serves anything in /public/
// at the root path automatically, so public/sw.js -> /sw.js.
//
// Two jobs:
//   1. "push"         — server sent a notification (see src/lib/push.ts),
//                        show it as a real OS/browser notification.
//   2. "notificationclick" — user tapped the notification, focus/open the
//                             relevant page instead of leaving a dead
//                             notification behind.

self.addEventListener("push", (event) => {
  let data = { title: "Echelon United FC", body: "You have a new notification.", link: "/dashboard/notifications" };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (err) {
    // Payload wasn't JSON for some reason — fall back to the defaults
    // above rather than throwing and dropping the notification entirely.
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      // No app icon asset exists in this project yet (no /public/icon-*.png
      // was ever added in any session) — omitting these is safe, the
      // browser/OS falls back to its own default notification icon. Add
      // real icon files to /public/ and point these at them once branded
      // icons exist.
      data: { link: data.link },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.link || "/dashboard/notifications";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
