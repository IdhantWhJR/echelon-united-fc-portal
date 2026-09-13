"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type Values = {
  periodLabel: string;
  matchesPlayed: string;
  starts: string;
  goals: string;
  assists: string;
  minutesPlayed: string;
  cleanSheets: string;
  trainingAttendancePct: string;
  fitnessScore: string;
  coachRating: string;
  notes: string;
};

const EMPTY: Values = {
  periodLabel: "",
  matchesPlayed: "0",
  starts: "0",
  goals: "0",
  assists: "0",
  minutesPlayed: "0",
  cleanSheets: "0",
  trainingAttendancePct: "",
  fitnessScore: "",
  coachRating: "",
  notes: "",
};

export function PerformanceForm({
  playerProfileId,
  existingPeriods,
}: {
  playerProfileId: string;
  existingPeriods: { periodLabel: string; matchesPlayed: number; starts: number; goals: number; assists: number; minutesPlayed: number; cleanSheets: number; trainingAttendancePct: number; fitnessScore: number | null; coachRating: number | null; notes: string | null }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Values>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function set<K extends keyof Values>(key: K, val: Values[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  // Selecting an existing period label loads that period's numbers so
  // staff are editing, not accidentally overwriting with zeros — the API
  // upserts by (playerProfileId, periodLabel), so this must match exactly.
  function loadPeriod(label: string) {
    const existing = existingPeriods.find((p) => p.periodLabel === label);
    if (!existing) {
      set("periodLabel", label);
      return;
    }
    setValues({
      periodLabel: existing.periodLabel,
      matchesPlayed: String(existing.matchesPlayed),
      starts: String(existing.starts),
      goals: String(existing.goals),
      assists: String(existing.assists),
      minutesPlayed: String(existing.minutesPlayed),
      cleanSheets: String(existing.cleanSheets),
      trainingAttendancePct: existing.trainingAttendancePct != null ? String(existing.trainingAttendancePct) : "",
      fitnessScore: existing.fitnessScore != null ? String(existing.fitnessScore) : "",
      coachRating: existing.coachRating != null ? String(existing.coachRating) : "",
      notes: existing.notes ?? "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.periodLabel.trim()) {
      setError("Enter a period label, e.g. \"2026-08\" or \"Season 2026/27\".");
      return;
    }
    setSubmitting(true);
    const body: Record<string, unknown> = {
      playerProfileId,
      periodLabel: values.periodLabel.trim(),
      matchesPlayed: Number(values.matchesPlayed) || 0,
      starts: Number(values.starts) || 0,
      goals: Number(values.goals) || 0,
      assists: Number(values.assists) || 0,
      minutesPlayed: Number(values.minutesPlayed) || 0,
      cleanSheets: Number(values.cleanSheets) || 0,
    };
    if (values.trainingAttendancePct !== "") body.trainingAttendancePct = Number(values.trainingAttendancePct);
    if (values.fitnessScore !== "") body.fitnessScore = Number(values.fitnessScore);
    if (values.coachRating !== "") body.coachRating = Number(values.coachRating);
    if (values.notes.trim()) body.notes = values.notes.trim();

    const res = await fetch("/api/admin/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save performance data.");
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <div className="rounded-md border border-line bg-ink-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-paper-dim">
          {open ? "Enter or update a period" : "Enter match, fitness and training statistics for this player."}
        </p>
        <button onClick={() => setOpen((v) => !v)} className="btn-secondary !px-3 !py-1.5 text-xs shrink-0">
          <Icon name={open ? "x" : "edit"} width={13} height={13} />
          {open ? "Close" : "Enter data"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="animate-rise-in space-y-4">
          <div>
            <label className="mb-1 block text-xs text-paper-dim">Period label</label>
            {existingPeriods.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <select
                  className="input-field flex-1"
                  value={existingPeriods.some((p) => p.periodLabel === values.periodLabel) ? values.periodLabel : ""}
                  onChange={(e) => e.target.value && loadPeriod(e.target.value)}
                >
                  <option value="">Existing period…</option>
                  {existingPeriods.map((p) => (
                    <option key={p.periodLabel} value={p.periodLabel}>{p.periodLabel}</option>
                  ))}
                </select>
                <input
                  className="input-field flex-1"
                  placeholder="Or type a new one, e.g. 2026-09"
                  value={values.periodLabel}
                  onChange={(e) => set("periodLabel", e.target.value)}
                />
              </div>
            ) : (
              <input
                className="input-field"
                placeholder='e.g. "2026-08" or "Season 2026/27"'
                value={values.periodLabel}
                onChange={(e) => set("periodLabel", e.target.value)}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <NumberField label="Matches" value={values.matchesPlayed} onChange={(v) => set("matchesPlayed", v)} />
            <NumberField label="Starts" value={values.starts} onChange={(v) => set("starts", v)} />
            <NumberField label="Goals" value={values.goals} onChange={(v) => set("goals", v)} />
            <NumberField label="Assists" value={values.assists} onChange={(v) => set("assists", v)} />
            <NumberField label="Minutes" value={values.minutesPlayed} onChange={(v) => set("minutesPlayed", v)} />
            <NumberField label="Clean sheets" value={values.cleanSheets} onChange={(v) => set("cleanSheets", v)} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <NumberField label="Attendance %" value={values.trainingAttendancePct} onChange={(v) => set("trainingAttendancePct", v)} step="0.1" placeholder="0–100" />
            <NumberField label="Fitness score" value={values.fitnessScore} onChange={(v) => set("fitnessScore", v)} step="0.1" placeholder="0–100" />
            <NumberField label="Coach rating" value={values.coachRating} onChange={(v) => set("coachRating", v)} step="0.1" placeholder="0–10" />
          </div>

          <div>
            <label htmlFor="perf-notes" className="mb-1 block text-xs text-paper-dim">Notes (optional, visible to the player)</label>
            <textarea id="perf-notes" className="input-field min-h-16 resize-y" value={values.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Strong month — keep building on aerobic capacity." />
          </div>

          {error && <p className="text-sm text-signal-danger">{error}</p>}
          {success && !error && <p className="text-sm text-signal-success">Saved. The player's performance page now reflects this.</p>}

          <button type="submit" disabled={submitting} className="btn-primary text-xs">
            {submitting ? "Saving…" : "Save period"}
          </button>
        </form>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-paper-dim">{label}</label>
      <input
        type="number"
        step={step ?? "1"}
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
