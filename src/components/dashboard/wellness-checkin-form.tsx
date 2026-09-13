"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

const FEELINGS: { value: string; label: string }[] = [
  { value: "GREAT", label: "Feeling great" },
  { value: "SLIGHTLY_FATIGUED", label: "Slightly fatigued" },
  { value: "TIRED", label: "Tired" },
  { value: "NOT_WELL", label: "Not feeling well" },
  { value: "INJURED", label: "Injured" },
  { value: "UNABLE_TO_TRAIN", label: "Unable to train" },
];

export function WellnessCheckinForm({ playerProfileId }: { playerProfileId: string }) {
  const router = useRouter();
  const [feeling, setFeeling] = useState("");
  const [sleepQuality, setSleepQuality] = useState(3);
  const [sorenessLevel, setSorenessLevel] = useState(1);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feeling) {
      setError("Choose how you're feeling today.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/wellness-checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerProfileId,
        feeling,
        sleepQuality,
        sorenessLevel,
        note: note || undefined,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save check-in.");
      return;
    }
    setFeeling("");
    setNote("");
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 lg:p-6">
      <div className="mb-4">
        <p className="eyebrow mb-1">Daily check-in</p>
        <h2 className="font-display text-lg font-bold text-paper">How are you feeling today?</h2>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {FEELINGS.map((f) => (
          <button
            type="button"
            key={f.value}
            onClick={() => setFeeling(f.value)}
            className={`rounded-md border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
              feeling === f.value
                ? "border-gold bg-gold/10 text-gold"
                : "border-line bg-ink-900 text-paper-dim hover:border-gold-deep"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sleep-quality" className="mb-1 block text-xs text-paper-dim">
            Sleep quality — {sleepQuality}/5
          </label>
          <input
            id="sleep-quality"
            type="range"
            min={1}
            max={5}
            value={sleepQuality}
            onChange={(e) => setSleepQuality(Number(e.target.value))}
            className="w-full accent-gold"
          />
        </div>
        <div>
          <label htmlFor="soreness-level" className="mb-1 block text-xs text-paper-dim">
            Soreness — {sorenessLevel}/5
          </label>
          <input
            id="soreness-level"
            type="range"
            min={1}
            max={5}
            value={sorenessLevel}
            onChange={(e) => setSorenessLevel(Number(e.target.value))}
            className="w-full accent-gold"
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="wellness-note" className="mb-1 block text-xs text-paper-dim">Note (optional)</label>
        <input
          id="wellness-note"
          className="input-field"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tight hamstring after yesterday's session"
        />
      </div>

      {error && <p className="mb-3 text-sm text-signal-danger">{error}</p>}
      {success && !error && (
        <p className="mb-3 text-sm text-signal-success">Check-in saved. Thanks for keeping your coach informed.</p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary text-xs">
        <Icon name="heart" width={14} height={14} />
        {submitting ? "Saving…" : "Save check-in"}
      </button>
    </form>
  );
}
