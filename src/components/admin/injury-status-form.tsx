"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

const STATUSES = ["REPORTED", "ASSESSING", "RECOVERING", "CLEARED"];

export function InjuryStatusForm({
  reportId,
  currentStatus,
  currentNotes,
}: {
  reportId: string;
  currentStatus: string;
  currentNotes: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/injury-reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, coachNotes: notes || undefined }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not update.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="injury-status-select" className="mb-1 block text-xs text-paper-dim">Status</label>
        <select id="injury-status-select" className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="flex-[2]">
        <label htmlFor="injury-coach-notes" className="mb-1 block text-xs text-paper-dim">Coach notes</label>
        <input id="injury-coach-notes" className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Cleared by physio, light training only" />
      </div>
      <button onClick={save} disabled={saving} className="btn-secondary shrink-0 text-xs">
        <Icon name="check" width={14} height={14} />
        {saving ? "Saving…" : "Update"}
      </button>
      {error && <p className="text-xs text-signal-danger sm:ml-2">{error}</p>}
    </div>
  );
}
