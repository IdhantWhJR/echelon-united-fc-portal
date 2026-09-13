"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type Player = { id: string; name: string; jerseyNumber: number | null };
type Appearance = {
  playerProfileId: string;
  role: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  ratingOutOf10: number | null;
};

const ROLES = [
  { value: "NOT_SQUAD", label: "Not in squad" },
  { value: "STARTER", label: "Starter" },
  { value: "SUBSTITUTE", label: "Substitute" },
  { value: "UNUSED_SUB", label: "Unused sub" },
];

export function AppearanceEditor({
  matchId,
  players,
  appearances,
}: {
  matchId: string;
  players: Player[];
  appearances: Appearance[];
}) {
  const router = useRouter();
  const byId = new Map(appearances.map((a) => [a.playerProfileId, a]));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, Appearance>>(
    Object.fromEntries(
      players.map((p) => [
        p.id,
        byId.get(p.id) ?? {
          playerProfileId: p.id,
          role: "NOT_SQUAD",
          minutesPlayed: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          ratingOutOf10: null,
        },
      ])
    )
  );

  function update(playerId: string, patch: Partial<Appearance>) {
    setRows((r) => ({ ...r, [playerId]: { ...r[playerId], ...patch } }));
  }

  async function save(playerId: string) {
    setSavingId(playerId);
    const row = rows[playerId];
    await fetch(`/api/admin/matches/${matchId}/appearances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    setSavingId(null);
    router.refresh();
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line px-4 py-3">
        <p className="eyebrow">Lineup & player stats</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-line text-left uppercase tracking-wide text-paper-faint">
              <th className="px-4 py-2.5 font-medium">Player</th>
              <th className="px-3 py-2.5 font-medium">Role</th>
              <th className="px-3 py-2.5 font-medium">Mins</th>
              <th className="px-3 py-2.5 font-medium">Goals</th>
              <th className="px-3 py-2.5 font-medium">Assists</th>
              <th className="px-3 py-2.5 font-medium">YC</th>
              <th className="px-3 py-2.5 font-medium">RC</th>
              <th className="px-3 py-2.5 font-medium">Rating</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const row = rows[p.id];
              return (
                <tr key={p.id} className="border-b border-line/60 last:border-0">
                  <td className="whitespace-nowrap px-4 py-2 text-paper">
                    {p.jerseyNumber ? `#${p.jerseyNumber} ` : ""}
                    {p.name}
                  </td>
                  <td className="px-3 py-2">
                    <label htmlFor={`role-${p.id}`} className="sr-only">{`Role for ${p.name}`}</label>
                    <select
                      id={`role-${p.id}`}
                      className="input-field !py-1.5 !text-xs"
                      value={row.role}
                      onChange={(e) => update(p.id, { role: e.target.value })}
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <NumCell id={`mins-${p.id}`} label={`Minutes played by ${p.name}`} value={row.minutesPlayed} onChange={(v) => update(p.id, { minutesPlayed: v })} />
                  <NumCell id={`goals-${p.id}`} label={`Goals by ${p.name}`} value={row.goals} onChange={(v) => update(p.id, { goals: v })} />
                  <NumCell id={`assists-${p.id}`} label={`Assists by ${p.name}`} value={row.assists} onChange={(v) => update(p.id, { assists: v })} />
                  <NumCell id={`yc-${p.id}`} label={`Yellow cards for ${p.name}`} value={row.yellowCards} onChange={(v) => update(p.id, { yellowCards: v })} max={2} />
                  <NumCell id={`rc-${p.id}`} label={`Red cards for ${p.name}`} value={row.redCards} onChange={(v) => update(p.id, { redCards: v })} max={1} />
                  <td className="px-3 py-2">
                    <label htmlFor={`rating-${p.id}`} className="sr-only">{`Rating out of 10 for ${p.name}`}</label>
                    <input
                      id={`rating-${p.id}`}
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      className="input-field !w-16 !py-1.5 !text-xs"
                      value={row.ratingOutOf10 ?? ""}
                      onChange={(e) => update(p.id, { ratingOutOf10: e.target.value === "" ? null : Number(e.target.value) })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => save(p.id)}
                      disabled={savingId === p.id}
                      className="text-paper-faint transition-colors hover:text-gold disabled:opacity-50"
                      aria-label={`Save ${p.name}`}
                    >
                      <Icon name="check" width={15} height={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NumCell({
  id,
  label,
  value,
  onChange,
  max,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <td className="px-3 py-2">
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        type="number"
        min={0}
        max={max}
        className="input-field !w-14 !py-1.5 !text-xs"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </td>
  );
}
