"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { format } from "date-fns";
import { Icon } from "@/components/icons";

type Entry = { id: string; weightKg: number; date: string; note: string | null };

export function WeightChart({
  playerProfileId,
  entries,
}: {
  playerProfileId: string;
  entries: Entry[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chartData = useMemo(
    () =>
      entries.map((e) => ({
        date: format(new Date(e.date), "MMM d"),
        weight: e.weightKg,
      })),
    [entries]
  );

  const latest = entries.at(-1);
  const previous = entries.at(-2);
  const delta = latest && previous ? +(latest.weightKg - previous.weightKg).toFixed(1) : null;

  const trendLabel =
    delta === null ? null : delta > 0.05 ? "Trending up" : delta < -0.05 ? "Trending down" : "Stable";
  const trendColor =
    delta === null
      ? "text-paper-faint"
      : Math.abs(delta) < 0.05
      ? "text-paper-dim"
      : "text-gold";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const weightKg = parseFloat(weight);
    if (Number.isNaN(weightKg) || weightKg <= 0) {
      setError("Enter a valid weight.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerProfileId, weightKg, note: note || undefined }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save entry.");
      return;
    }
    setWeight("");
    setNote("");
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="card p-5 lg:p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="eyebrow mb-1">Weight Tracking</p>
          <h2 className="font-display text-lg font-bold text-paper">Weight progress</h2>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="btn-secondary !px-3 !py-2 text-xs">
          <Icon name="plus" width={14} height={14} />
          Log weight
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mb-5 animate-rise-in rounded-md border border-line bg-ink-900 p-4">
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="weight-entry-kg" className="mb-1 block text-xs text-paper-dim">Weight (kg)</label>
              <input
                id="weight-entry-kg"
                type="number"
                step="0.1"
                required
                className="input-field"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="79.5"
              />
            </div>
            <div>
              <label htmlFor="weight-entry-note" className="mb-1 block text-xs text-paper-dim">Note (optional)</label>
              <input
                id="weight-entry-note"
                className="input-field"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Morning weigh-in"
              />
            </div>
          </div>
          {error && <p className="mb-3 text-sm text-signal-danger">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary text-xs">
            {submitting ? "Saving…" : "Save entry"}
          </button>
        </form>
      )}

      {entries.length === 0 ? (
        <EmptyWeightState />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-xs text-paper-faint">Current</p>
              <p className="stat-figure font-display text-3xl font-bold text-paper">
                {latest?.weightKg} <span className="text-base font-normal text-paper-faint">kg</span>
              </p>
            </div>
            {previous && (
              <div>
                <p className="text-xs text-paper-faint">Previous</p>
                <p className="stat-figure text-lg text-paper-dim">{previous.weightKg} kg</p>
              </div>
            )}
            {delta !== null && (
              <div>
                <p className="text-xs text-paper-faint">Change</p>
                <p className={`stat-figure text-lg font-semibold ${trendColor}`}>
                  {delta > 0 ? "+" : ""}
                  {delta} kg · {trendLabel}
                </p>
              </div>
            )}
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1C1D20" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#7B7C81"
                  tick={{ fontSize: 11, fill: "#7B7C81" }}
                  tickLine={false}
                  axisLine={{ stroke: "#26272B" }}
                />
                <YAxis
                  stroke="#7B7C81"
                  tick={{ fontSize: 11, fill: "#7B7C81" }}
                  tickLine={false}
                  axisLine={false}
                  domain={["dataMin - 2", "dataMax + 2"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#121315",
                    border: "1px solid #26272B",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#B9B9BC" }}
                  itemStyle={{ color: "#D9A62E" }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#D9A62E"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#08090A", stroke: "#D9A62E", strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyWeightState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-line py-10 text-center">
      <Icon name="scale" width={22} height={22} className="mb-3 text-paper-faint" />
      <p className="text-sm font-medium text-paper">No weight data yet.</p>
      <p className="mt-1 text-xs text-paper-faint">Add your first measurement to start tracking your trend.</p>
    </div>
  );
}
