"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type Match = {
  id: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  matchReport: string | null;
  homeAway: string;
};

const STATUSES = ["SCHEDULED", "LIVE", "COMPLETED", "POSTPONED", "CANCELLED"];

export function MatchEditor({ match }: { match: Match }) {
  const router = useRouter();
  const [status, setStatus] = useState(match.status);
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() ?? "");
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() ?? "");
  const [matchReport, setMatchReport] = useState(match.matchReport ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const res = await fetch(`/api/admin/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        homeScore: homeScore === "" ? null : Number(homeScore),
        awayScore: awayScore === "" ? null : Number(awayScore),
        matchReport: matchReport || null,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save.");
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-5 lg:p-6">
      <p className="eyebrow mb-1">Result & status</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="match-status-select" className="mb-1 block text-xs text-paper-dim">Status</label>
          <select id="match-status-select" className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0] + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="match-echelon-score" className="mb-1 block text-xs text-paper-dim">Echelon score</label>
            <input
              id="match-echelon-score"
              type="number"
              min={0}
              max={99}
              className="input-field"
              value={match.homeAway === "AWAY" ? awayScore : homeScore}
              onChange={(e) => (match.homeAway === "AWAY" ? setAwayScore(e.target.value) : setHomeScore(e.target.value))}
              placeholder="—"
            />
          </div>
          <div>
            <label htmlFor="match-opponent-score" className="mb-1 block text-xs text-paper-dim">Opponent score</label>
            <input
              id="match-opponent-score"
              type="number"
              min={0}
              max={99}
              className="input-field"
              value={match.homeAway === "AWAY" ? homeScore : awayScore}
              onChange={(e) => (match.homeAway === "AWAY" ? setHomeScore(e.target.value) : setAwayScore(e.target.value))}
              placeholder="—"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="match-report" className="mb-1 block text-xs text-paper-dim">Match report (optional)</label>
        <textarea id="match-report"
          className="input-field min-h-[100px] resize-y"
          value={matchReport}
          onChange={(e) => setMatchReport(e.target.value)}
          placeholder="Summary of how the match went…"
        />
      </div>

      {error && <p className="text-sm text-signal-danger">{error}</p>}
      {success && <p className="text-sm text-pitch-green">Saved.</p>}

      <button type="submit" disabled={submitting} className="btn-primary text-xs">
        <Icon name="check" width={14} height={14} />
        {submitting ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
