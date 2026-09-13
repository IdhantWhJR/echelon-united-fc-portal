"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { PlayerAttendanceModal } from "@/components/admin/player-attendance-modal";

type Player = {
  id: string;
  name: string;
  jerseyNumber: number | null;
  squadName: string | null;
};

export function PlayerAttendanceList({ players }: { players: Player[] }) {
  const [active, setActive] = useState<Player | null>(null);

  return (
    <>
      <div className="card overflow-hidden">
        <ul>
          {players.map((p) => (
            <li key={p.id} className="border-b border-line/60 last:border-0">
              <button
                onClick={() => setActive(p)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-ink-700/40"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-700 font-display text-xs font-bold text-gold">
                    {p.jerseyNumber ?? "—"}
                  </span>
                  <span>
                    <span className="block font-medium text-paper">{p.name}</span>
                    {p.squadName && <span className="block text-xs text-paper-faint">{p.squadName}</span>}
                  </span>
                </span>
                <Icon name="calendar" width={16} height={16} className="text-paper-faint" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {active && (
        <PlayerAttendanceModal
          playerProfileId={active.id}
          playerName={active.name}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}
