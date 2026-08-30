"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type Player = { id: string; name: string; jerseyNumber: number | null; squadName: string | null };

export function AwardAchievementDialog({
  achievementId,
  achievementTitle,
  players,
  suggestedPlayerIds,
  onClose,
}: {
  achievementId: string;
  achievementTitle: string;
  players: Player[];
  suggestedPlayerIds: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(suggestedPlayerIds);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function submit() {
    if (selected.length === 0) return setError("Choose at least one player.");
    setError(null);
    setSubmitting(true);
    const res = await fetch(`/api/admin/achievements/${achievementId}/award`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerProfileIds: selected }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not award this achievement.");
      return;
    }
    const data = await res.json();
    setResult(`Awarded to ${data.awardedCount} player${data.awardedCount === 1 ? "" : "s"}.`);
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true">
      <div className="card w-full max-w-md p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow mb-1">Award achievement</p>
            <h2 className="font-display text-lg font-bold text-paper">{achievementTitle}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-paper-faint hover:text-paper">
            <Icon name="x" width={16} height={16} />
          </button>
        </div>

        {suggestedPlayerIds.length > 0 && (
          <p className="mb-3 rounded-md border border-gold-deep/40 bg-gold/10 px-3 py-2 text-xs text-gold">
            {suggestedPlayerIds.length} player{suggestedPlayerIds.length === 1 ? "" : "s"} already qualify based on
            their stats and {suggestedPlayerIds.length === 1 ? "is" : "are"} pre-selected below.
          </p>
        )}

        <div className="mb-4 grid max-h-64 gap-2 overflow-y-auto rounded-md border border-line bg-ink-900 p-3">
          {players.length === 0 ? (
            <p className="text-xs text-paper-faint">No active players.</p>
          ) : (
            players.map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm text-paper-dim">
                <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="accent-gold" />
                <span>
                  {p.jerseyNumber ? `#${p.jerseyNumber} ` : ""}
                  {p.name}
                </span>
                {p.squadName && <span className="text-[10px] text-paper-faint">· {p.squadName}</span>}
                {suggestedPlayerIds.includes(p.id) && <span className="badge border-gold-deep/50 text-gold text-[10px]">Qualifies</span>}
              </label>
            ))
          )}
        </div>

        {error && <p className="mb-3 text-sm text-signal-danger">{error}</p>}
        {result && <p className="mb-3 text-sm text-signal-success">{result}</p>}

        <div className="flex items-center gap-3">
          <button onClick={submit} disabled={submitting} className="btn-primary text-xs">
            <Icon name="medal" width={14} height={14} />
            {submitting ? "Awarding…" : "Award"}
          </button>
          <button onClick={onClose} className="text-xs font-medium text-paper-faint hover:text-paper">
            {result ? "Close" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
