"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LeaderboardKey } from "@/lib/leaderboards";

export function LeaderboardVisibilityToggle({ boardKey, initialVisible }: { boardKey: LeaderboardKey; initialVisible: boolean }) {
  const router = useRouter();
  const [visible, setVisible] = useState(initialVisible);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !visible;
    setVisible(next);
    setSaving(true);
    const res = await fetch("/api/admin/leaderboard-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: boardKey, visible: next }),
    });
    setSaving(false);
    if (!res.ok) {
      setVisible(!next); // revert on failure
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={visible}
      aria-label={visible ? "Visible to players — click to hide" : "Hidden from players — click to show"}
      onClick={toggle}
      disabled={saving}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-60 ${
        visible ? "border-gold-deep bg-gold/30" : "border-line bg-ink-700"
      }`}
    >
      <span
        className={`absolute top-0.5 rounded-full transition-transform ${
          visible ? "translate-x-[22px] bg-gold" : "translate-x-0.5 bg-paper-faint"
        }`}
        style={{ height: "18px", width: "18px" }}
      />
    </button>
  );
}
