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

type Entry = { id: string; metricName: string; unit: string | null; value: number; date: string; note: string | null };

export function CustomMetricsChart({
  playerProfileId,
  entries,
}: {
  playerProfileId: string;
  entries: Entry[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [metricName, setMetricName] = useState("");
  const [unit, setUnit] = useState("");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metricNames = useMemo(() => {
    const seen: string[] = [];
    for (const e of entries) if (!seen.includes(e.metricName)) seen.push(e.metricName);
    return seen;
  }, [entries]);

  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const selected = activeMetric ?? metricNames[0] ?? null;

  const metricEntries = useMemo(
    () => (selected ? entries.filter((e) => e.metricName === selected) : []),
    [entries, selected]
  );

  const chartData = useMemo(
    () =>
      metricEntries.map((e) => ({
        date: format(new Date(e.date), "MMM d"),
        value: e.value,
      })),
    [metricEntries]
  );

  const latest = metricEntries.at(-1);
  const previous = metricEntries.at(-2);
  const delta = latest && previous ? +(latest.value - previous.value).toFixed(2) : null;
  const unitLabel = latest?.unit ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const numericValue = parseFloat(value);
    if (!metricName.trim()) {
      setError("Give the metric a name.");
      return;
    }
    if (Number.isNaN(numericValue)) {
      setError("Enter a valid value.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/custom-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerProfileId,
        metricName: metricName.trim(),
        unit: unit.trim() || undefined,
        value: numericValue,
        note: note || undefined,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save entry.");
      return;
    }
    setActiveMetric(metricName.trim());
    setMetricName("");
    setUnit("");
    setValue("");
    setNote("");
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="card p-5 lg:p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="eyebrow mb-1">Custom Metrics</p>
          <h2 className="font-display text-lg font-bold text-paper">Your metrics</h2>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="btn-secondary !px-3 !py-2 text-xs">
          <Icon name="plus" width={14} height={14} />
          Log metric
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mb-5 animate-rise-in rounded-md border border-line bg-ink-900 p-4">
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="metric-name" className="mb-1 block text-xs text-paper-dim">Metric name</label>
              <input
                id="metric-name"
                list="existing-metric-names"
                className="input-field"
                value={metricName}
                onChange={(e) => setMetricName(e.target.value)}
                placeholder="5k time"
              />
              <datalist id="existing-metric-names">
                {metricNames.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="metric-unit" className="mb-1 block text-xs text-paper-dim">Unit (optional)</label>
              <input
                id="metric-unit"
                className="input-field"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="min"
              />
            </div>
            <div>
              <label htmlFor="metric-value" className="mb-1 block text-xs text-paper-dim">Value</label>
              <input
                id="metric-value"
                type="number"
                step="any"
                required
                className="input-field"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="22.5"
              />
            </div>
            <div>
              <label htmlFor="metric-note" className="mb-1 block text-xs text-paper-dim">Note (optional)</label>
              <input
                id="metric-note"
                className="input-field"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Felt strong today"
              />
            </div>
          </div>
          {error && <p className="mb-3 text-sm text-signal-danger">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary text-xs">
            {submitting ? "Saving…" : "Save entry"}
          </button>
        </form>
      )}

      {metricNames.length === 0 ? (
        <EmptyMetricsState />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {metricNames.map((m) => (
              <button
                key={m}
                onClick={() => setActiveMetric(m)}
                className={`badge ${
                  selected === m
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-line text-paper-faint hover:text-paper"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-xs text-paper-faint">Current</p>
              <p className="stat-figure font-display text-3xl font-bold text-paper">
                {latest?.value} <span className="text-base font-normal text-paper-faint">{unitLabel}</span>
              </p>
            </div>
            {previous && (
              <div>
                <p className="text-xs text-paper-faint">Previous</p>
                <p className="stat-figure text-lg text-paper-dim">
                  {previous.value} {unitLabel}
                </p>
              </div>
            )}
            {delta !== null && (
              <div>
                <p className="text-xs text-paper-faint">Change</p>
                <p className="stat-figure text-lg font-semibold text-gold">
                  {delta > 0 ? "+" : ""}
                  {delta} {unitLabel}
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
                  domain={["auto", "auto"]}
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
                  dataKey="value"
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

function EmptyMetricsState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-line py-10 text-center">
      <Icon name="trending" width={22} height={22} className="mb-3 text-paper-faint" />
      <p className="text-sm font-medium text-paper">No custom metrics yet.</p>
      <p className="mt-1 text-xs text-paper-faint">
        Track anything you want — 5k time, vertical jump, resting HR — over time.
      </p>
    </div>
  );
}
