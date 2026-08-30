"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type AttendanceRow = {
  playerProfileId: string;
  status: string;
  markedByCoach: boolean;
  playerProfile: { user: { name: string }; jerseyNumber: number | null };
};

const STATUS_STYLE: { [k: string]: string } = {
  ATTENDING: "border-pitch-green/40 text-pitch-green",
  UNAVAILABLE: "border-signal-danger/40 text-signal-danger",
  MAYBE: "border-signal-warn/40 text-signal-warn",
  PENDING: "border-line text-paper-faint",
};

const OPTIONS = ["ATTENDING", "MAYBE", "UNAVAILABLE", "PENDING"];

export function AttendanceRoster({ eventId, records }: { eventId: string; records: AttendanceRow[] }) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);

  async function setStatus(playerProfileId: string, status: string) {
    setSavingId(playerProfileId);
    await fetch("/api/attendance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, playerProfileId, status }),
    });
    setSavingId(null);
    router.refresh();
  }

  if (records.length === 0) {
    return <p className="px-4 py-4 text-xs text-paper-faint">No players targeted by this event.</p>;
  }

  return (
    <div className="divide-y divide-line/60">
      {records.map((r) => (
        <div key={r.playerProfileId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <span className="text-sm text-paper">
            {r.playerProfile.jerseyNumber ? `#${r.playerProfile.jerseyNumber} ` : ""}
            {r.playerProfile.user.name}
            {r.markedByCoach && <span className="ml-2 text-[10px] uppercase tracking-wide text-paper-faint">Staff-set</span>}
          </span>
          <div className="flex items-center gap-2">
            <span className={`badge ${STATUS_STYLE[r.status] ?? "border-line text-paper-faint"}`}>{r.status}</span>
            <label htmlFor={`attendance-${r.playerProfileId}`} className="sr-only">
              {`Attendance status for ${r.playerProfile.user.name}`}
            </label>
            <select
              id={`attendance-${r.playerProfileId}`}
              className="input-field !w-auto !py-1 !text-xs"
              value={r.status}
              disabled={savingId === r.playerProfileId}
              onChange={(e) => setStatus(r.playerProfileId, e.target.value)}
            >
              {OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
