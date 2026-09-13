"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { PushSubscribeToggle } from "@/components/dashboard/push-subscribe-toggle";

type Prefs = {
  pushEnabled: boolean;
  announcements: boolean;
  trainingReminders: boolean;
  matchReminders: boolean;
  workoutUpdates: boolean;
  learningContent: boolean;
  polls: boolean;
  paymentReminders: boolean;
};

const TOGGLES: { key: keyof Prefs; label: string; hint: string }[] = [
  { key: "announcements", label: "Announcements", hint: "New posts from the club or your squad" },
  { key: "trainingReminders", label: "Training reminders", hint: "Upcoming sessions and location changes" },
  { key: "matchReminders", label: "Match reminders", hint: "Upcoming fixtures and kickoff times" },
  { key: "workoutUpdates", label: "Workout updates", hint: "New assignments, verifications, and revisions" },
  { key: "paymentReminders", label: "Payment reminders", hint: "Fees due for matches and events" },
];

export function NotificationPreferencesForm({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await fetch("/api/notification-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save that change — try again.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-1">Notification preferences</p>
          <p className="text-xs text-paper-faint">Choose what the club can notify you about.</p>
        </div>
        {saving && <span className="text-xs text-paper-faint">Saving…</span>}
        {saved && <span className="text-xs text-signal-success">Saved</span>}
      </div>

      <label className="mb-4 flex items-center justify-between rounded-md border border-line bg-ink-900 px-3.5 py-3">
        <div className="flex items-center gap-2.5">
          <Icon name="bell" width={15} height={15} className="text-gold" />
          <div>
            <p className="text-sm font-medium text-paper">Push notifications</p>
            <p className="text-xs text-paper-faint">Master switch — turn off to receive nothing on this device.</p>
          </div>
        </div>
        <PushSubscribeToggle
          checked={prefs.pushEnabled}
          onSettled={(v) => {
            // The toggle component already did the real subscribe/unsubscribe
            // work (or saved the subscription server-side, which also sets
            // pushEnabled=true) — this just syncs local state + shows
            // "Saved" the same way every other toggle in this form does.
            setPrefs((p) => ({ ...p, pushEnabled: v }));
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
          }}
        />
      </label>

      <div className="space-y-1">
        {TOGGLES.map((t) => (
          <label key={t.key} className="flex items-center justify-between rounded-md px-3.5 py-2.5 hover:bg-ink-900">
            <div>
              <p className="text-sm text-paper">{t.label}</p>
              <p className="text-xs text-paper-faint">{t.hint}</p>
            </div>
            <Toggle checked={prefs[t.key]} onChange={(v) => update({ [t.key]: v } as Partial<Prefs>)} />
          </label>
        ))}
      </div>

      {error && <p className="mt-3 text-xs text-signal-danger">{error}</p>}

      <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-paper-faint">
        These preferences control in-app and (once enabled on your device) push notifications. Turning something off
        here won't remove notifications you've already received.
      </p>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
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
