"use client";

import { useEffect, useState } from "react";

/**
 * The actual browser-side half of Web Push. Wraps the same visual Toggle
 * used elsewhere in NotificationPreferencesForm, but on top of the plain
 * pushEnabled boolean it does the real work:
 *   turning ON  -> registers /sw.js, requests Notification permission,
 *                  subscribes via PushManager, POSTs the subscription to
 *                  /api/notification-preferences/push-subscription
 *   turning OFF -> unsubscribes locally and DELETEs the saved subscription
 *
 * Server-side delivery (src/lib/push.ts) already existed and requires
 * BOTH pushEnabled=true AND a saved pushSubscriptionJson — this component
 * is what actually produces that subscription. Without it the master
 * toggle only recorded a preference with nothing behind it.
 *
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY must be set (see .env.example) or this
 * safely degrades to "not supported here" rather than throwing.
 */
export function PushSubscribeToggle({
  checked,
  onSettled,
}: {
  checked: boolean;
  onSettled: (v: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !publicKey
    ) {
      setUnsupported(true);
    }
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "denied") {
      setPermissionDenied(true);
    }
  }, []);

  async function handleToggle(next: boolean) {
    setError(null);
    setBusy(true);
    try {
      if (next) {
        await subscribe();
      } else {
        await unsubscribe();
      }
      onSettled(next);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong enabling push notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function subscribe() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) throw new Error("Push notifications aren't configured for this deployment yet.");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setPermissionDenied(permission === "denied");
      throw new Error("Notification permission was not granted.");
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const res = await fetch("/api/notification-preferences/push-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Could not save your subscription.");
    }
  }

  async function unsubscribe() {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      await subscription?.unsubscribe().catch(() => {});
    }
    await fetch("/api/notification-preferences/push-subscription", { method: "DELETE" });
  }

  return (
    <div>
      <Toggle checked={checked} onChange={handleToggle} disabled={busy || unsupported} />
      {unsupported && (
        <p className="mt-1 text-[11px] text-paper-faint">Push notifications aren't supported on this device/browser.</p>
      )}
      {permissionDenied && !unsupported && (
        <p className="mt-1 text-[11px] text-signal-danger">
          Notifications are blocked for this site in your browser settings. Allow them there to enable this.
        </p>
      )}
      {error && !permissionDenied && <p className="mt-1 text-[11px] text-signal-danger">{error}</p>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "border-gold-deep bg-gold/30" : "border-line bg-ink-700"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-transform ${
          checked ? "translate-x-[22px] bg-gold" : "translate-x-0.5 bg-paper-faint"
        }`}
        style={{ height: "18px", width: "18px" }}
      />
    </button>
  );
}

// Web Push requires the VAPID key as a Uint8Array, but it's distributed/
// stored as a URL-safe base64 string. Standard conversion per the Push API
// spec (same snippet used in the MDN Web Push guide).
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
