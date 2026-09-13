"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { Icon } from "@/components/icons";

type ScheduleItem = {
  kind: "EVENT" | "WORKOUT";
  id: string;
  title: string;
  type: string;
  date: string;
  startTime: string;
  status: string;
  markedByCoach: boolean;
};

type Stats = {
  presentRate: number | null;
  eventsTotal: number;
  eventsPresent: number;
  workoutsTotal: number;
  workoutsPresent: number;
};

const EVENT_ICON: Record<string, string> = {
  TRAINING: "activity",
  MATCH: "trophy",
  TEAM_EVENT: "users",
  OTHER: "calendar",
  WORKOUT: "clipboard",
};

export function PlayerAttendanceModal({
  playerProfileId,
  playerName,
  onClose,
}: {
  playerProfileId: string;
  playerName: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/players/${playerProfileId}/schedule`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setItems(data.items);
          setStats(data.stats);
        }
      })
      .catch(() => !cancelled && setError("Could not load schedule."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [playerProfileId]);

  async function markEvent(item: ScheduleItem, status: "ATTENDING" | "UNAVAILABLE") {
    setPendingId(item.id);
    const res = await fetch("/api/attendance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: item.id, playerProfileId, status }),
    });
    setPendingId(null);
    if (!res.ok) return;
    applyLocalUpdate(item.id, status);
  }

  async function markWorkout(item: ScheduleItem, attended: boolean) {
    setPendingId(item.id);
    const res = await fetch(`/api/admin/workout-assignments/${item.id}/attendance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attended }),
    });
    setPendingId(null);
    if (!res.ok) return;
    applyLocalUpdate(item.id, attended ? "VERIFIED" : "ASSIGNED");
  }

  function applyLocalUpdate(id: string, status: string) {
    setItems((current) => {
      const next = current.map((i) => (i.id === id ? { ...i, status } : i));
      const eventsPresent = next.filter((i) => i.kind === "EVENT" && i.status === "ATTENDING").length;
      const workoutsPresent = next.filter((i) => i.kind === "WORKOUT" && i.status === "VERIFIED").length;
      const eventsTotal = next.filter((i) => i.kind === "EVENT").length;
      const workoutsTotal = next.filter((i) => i.kind === "WORKOUT").length;
      const total = eventsTotal + workoutsTotal;
      const presentRate = total > 0 ? Math.round(((eventsPresent + workoutsPresent) / total) * 100) : null;
      setStats({ presentRate, eventsTotal, eventsPresent, workoutsTotal, workoutsPresent });
      return next;
    });
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="card max-h-[85vh] w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="eyebrow mb-1">Attendance</p>
            <h2 className="font-display text-lg font-bold text-paper">{playerName}</h2>
          </div>
          <button onClick={onClose} className="btn-secondary !px-2.5 !py-2">
            <Icon name="x" width={14} height={14} />
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-3 border-b border-line px-5 py-4">
            <div>
              <p className="text-xs text-paper-faint">Present rate</p>
              <p className="stat-figure font-display text-xl font-bold text-gold">
                {stats.presentRate === null ? "—" : `${stats.presentRate}%`}
              </p>
            </div>
            <div>
              <p className="text-xs text-paper-faint">Events</p>
              <p className="stat-figure text-lg text-paper">
                {stats.eventsPresent}/{stats.eventsTotal}
              </p>
            </div>
            <div>
              <p className="text-xs text-paper-faint">Workouts</p>
              <p className="stat-figure text-lg text-paper">
                {stats.workoutsPresent}/{stats.workoutsTotal}
              </p>
            </div>
          </div>
        )}

        <div className="max-h-[50vh] overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-paper-faint">Loading schedule…</p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-signal-danger">{error}</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-paper-faint">Nothing scheduled for this player yet.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <ScheduleRow
                  key={`${item.kind}-${item.id}`}
                  item={item}
                  pending={pendingId === item.id}
                  onMark={(present) =>
                    item.kind === "EVENT"
                      ? markEvent(item, present ? "ATTENDING" : "UNAVAILABLE")
                      : markWorkout(item, present)
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function ScheduleRow({
  item,
  pending,
  onMark,
}: {
  item: ScheduleItem;
  pending: boolean;
  onMark: (present: boolean) => void;
}) {
  const present = item.kind === "EVENT" ? item.status === "ATTENDING" : item.status === "VERIFIED";
  const notPresent = item.kind === "EVENT" ? item.status === "UNAVAILABLE" : item.status === "ASSIGNED";

  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-line bg-ink-900 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon
          name={EVENT_ICON[item.type] ?? "calendar"}
          width={15}
          height={15}
          className="shrink-0 text-paper-faint"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-paper">{item.title}</p>
          <p className="text-xs text-paper-faint">
            {format(new Date(item.startTime), "EEE d MMM · h:mm a")}
            {item.kind === "WORKOUT" && " · Workout"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button
          disabled={pending}
          onClick={() => onMark(true)}
          className={`badge ${present ? "border-pitch-green bg-pitch-green/15 text-pitch-green" : "border-line text-paper-faint hover:text-pitch-green"}`}
        >
          <Icon name="check" width={12} height={12} />
          Present
        </button>
        <button
          disabled={pending}
          onClick={() => onMark(false)}
          className={`badge ${notPresent ? "border-signal-danger bg-signal-danger/15 text-signal-danger" : "border-line text-paper-faint hover:text-signal-danger"}`}
        >
          <Icon name="x" width={12} height={12} />
          Not present
        </button>
      </div>
    </li>
  );
}
