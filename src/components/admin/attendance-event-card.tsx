"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { AttendanceRoster } from "@/components/admin/attendance-roster";

type AttendanceRow = {
  playerProfileId: string;
  status: string;
  markedByCoach: boolean;
  playerProfile: { user: { name: string }; jerseyNumber: number | null };
};

export function AttendanceEventCard({
  eventId,
  title,
  subtitle,
  records,
}: {
  eventId: string;
  title: string;
  subtitle: string;
  records: AttendanceRow[];
}) {
  const [open, setOpen] = useState(false);
  const attending = records.filter((r) => r.status === "ATTENDING").length;
  const unavailable = records.filter((r) => r.status === "UNAVAILABLE").length;
  const pending = records.filter((r) => r.status === "PENDING").length;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div>
          <p className="font-display text-sm font-bold text-paper">{title}</p>
          <p className="mt-0.5 text-xs text-paper-faint">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden text-right text-xs sm:block">
            <span className="font-semibold text-pitch-green">{attending} attending</span>
            {unavailable > 0 && <span className="ml-2 text-signal-danger">{unavailable} out</span>}
            {pending > 0 && <span className="ml-2 text-paper-faint">{pending} pending</span>}
          </div>
          <Icon
            name="chevronDown"
            width={16}
            height={16}
            className={`text-paper-faint transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {open && (
        <div className="border-t border-line">
          <AttendanceRoster eventId={eventId} records={records} />
        </div>
      )}
    </div>
  );
}
