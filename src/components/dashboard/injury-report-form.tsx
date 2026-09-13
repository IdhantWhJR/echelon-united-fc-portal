"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

const BODY_AREAS = [
  "HEAD", "NECK", "SHOULDER", "CHEST", "BACK", "LOWER_BACK", "HIP",
  "GROIN", "THIGH", "KNEE", "CALF", "ANKLE", "FOOT", "OTHER",
];

export function InjuryReportForm({ playerProfileId }: { playerProfileId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bodyArea, setBodyArea] = useState("");
  const [painLevel, setPainLevel] = useState(5);
  const [onsetDate, setOnsetDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mechanism, setMechanism] = useState("");
  const [occurredDuring, setOccurredDuring] = useState("training");
  const [canWalk, setCanWalk] = useState(true);
  const [canTrain, setCanTrain] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bodyArea) {
      setError("Select the affected area.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/injury-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerProfileId,
        bodyArea,
        painLevel,
        onsetDate: new Date(onsetDate).toISOString(),
        mechanism: mechanism || undefined,
        occurredDuring,
        canWalk,
        canTrain,
        canPlay,
        description: description || undefined,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not submit report.");
      return;
    }
    setBodyArea("");
    setMechanism("");
    setDescription("");
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="card p-5 lg:p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="eyebrow mb-1">Injury reporting</p>
          <h2 className="font-display text-lg font-bold text-paper">Report an injury</h2>
          <p className="mt-1 text-xs text-paper-faint">
            Visible only to you and the coaching staff.
          </p>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="btn-secondary !px-3 !py-2 text-xs shrink-0">
          <Icon name={open ? "x" : "alert"} width={14} height={14} />
          {open ? "Cancel" : "New report"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="animate-rise-in space-y-4 rounded-md border border-line bg-ink-900 p-4">
          <div>
            <label className="mb-1.5 block text-xs text-paper-dim">Affected area</label>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
              {BODY_AREAS.map((area) => (
                <button
                  type="button"
                  key={area}
                  onClick={() => setBodyArea(area)}
                  className={`rounded-sm border px-2 py-2 text-[11px] font-medium transition-colors ${
                    bodyArea === area
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-line bg-ink-800 text-paper-dim hover:border-gold-deep"
                  }`}
                >
                  {area.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="injury-pain-level" className="mb-1 block text-xs text-paper-dim">Pain level — {painLevel}/10</label>
              <input id="injury-pain-level" type="range" min={1} max={10} value={painLevel} onChange={(e) => setPainLevel(Number(e.target.value))} className="w-full accent-gold" />
            </div>
            <div>
              <label htmlFor="injury-onset-date" className="mb-1 block text-xs text-paper-dim">When did it start</label>
              <input id="injury-onset-date" type="date" required className="input-field" value={onsetDate} onChange={(e) => setOnsetDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="injury-mechanism" className="mb-1 block text-xs text-paper-dim">How it happened (optional)</label>
              <input id="injury-mechanism" className="input-field" value={mechanism} onChange={(e) => setMechanism(e.target.value)} placeholder="Landed awkwardly after a jump" />
            </div>
            <div>
              <label htmlFor="injury-occurred-during" className="mb-1 block text-xs text-paper-dim">Occurred during</label>
              <select id="injury-occurred-during" className="input-field" value={occurredDuring} onChange={(e) => setOccurredDuring(e.target.value)}>
                <option value="training">Training</option>
                <option value="match">Match</option>
                <option value="outside">Outside club activity</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <ToggleField label="Can walk" checked={canWalk} onChange={setCanWalk} />
            <ToggleField label="Can train" checked={canTrain} onChange={setCanTrain} />
            <ToggleField label="Can play" checked={canPlay} onChange={setCanPlay} />
          </div>

          <div>
            <label htmlFor="injury-description" className="mb-1 block text-xs text-paper-dim">Description (optional)</label>
            <textarea id="injury-description" className="input-field min-h-20 resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Sharp pain on the outside of the ankle when pushing off." />
          </div>

          {error && <p className="text-sm text-signal-danger">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary text-xs">
            {submitting ? "Submitting…" : "Submit report"}
          </button>
        </form>
      )}
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-md border px-3 py-2.5 text-xs font-medium transition-colors ${
        checked
          ? "border-signal-success/50 bg-signal-success/10 text-signal-success"
          : "border-line bg-ink-800 text-paper-faint"
      }`}
    >
      {label}: {checked ? "Yes" : "No"}
    </button>
  );
}
