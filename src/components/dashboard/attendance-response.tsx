"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

const OPTIONS: { value: string; label: string }[] = [
  { value: "ATTENDING", label: "Attending" },
  { value: "MAYBE", label: "Maybe" },
  { value: "UNAVAILABLE", label: "Can't attend" },
];

export function AttendanceResponse({ eventId, currentStatus }: { eventId: string; currentStatus: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus ?? "PENDING");
  const [saving, setSaving] = useState<string | null>(null);

  async function respond(value: string) {
    setSaving(value);
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, status: value }),
    });
    setSaving(null);
    if (res.ok) {
      setStatus(value);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => respond(opt.value)}
          disabled={saving === opt.value}
          className={clsx(
            "min-h-[44px] rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors disabled:opacity-50 sm:min-h-0 sm:py-1.5",
            status === opt.value
              ? "border-gold bg-gold/10 text-gold"
              : "border-line text-paper-dim hover:border-gold-deep hover:text-gold"
          )}
        >
          {saving === opt.value ? "Saving…" : opt.label}
        </button>
      ))}
    </div>
  );
}
