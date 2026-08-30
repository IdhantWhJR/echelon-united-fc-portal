import Link from "next/link";
import { Icon } from "@/components/icons";

export function PerformanceSnapshot({
  stat,
}: {
  stat: {
    periodLabel: string;
    matchesPlayed: number;
    goals: number;
    assists: number;
    minutesPlayed: number;
    fitnessScore: number | null;
    coachRating: number | null;
  } | null;
}) {
  return (
    <div className="card p-5 lg:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="eyebrow mb-1">Performance</p>
          <h2 className="font-display text-lg font-bold text-paper">
            {stat ? stat.periodLabel : "Season snapshot"}
          </h2>
        </div>
        <Link href="/dashboard/performance" className="text-xs font-medium text-paper-faint hover:text-gold">
          View all →
        </Link>
      </div>

      {!stat ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-line py-8 text-center">
          <Icon name="trending" width={20} height={20} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No performance data yet.</p>
          <p className="mt-1 text-xs text-paper-faint">Your coach will update this after your first matches.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Matches" value={stat.matchesPlayed} />
          <Metric label="Goals" value={stat.goals} highlight />
          <Metric label="Assists" value={stat.assists} highlight />
          <Metric label="Minutes" value={stat.minutesPlayed} />
          <Metric label="Fitness" value={stat.fitnessScore ? `${stat.fitnessScore}` : "—"} suffix="/100" />
          <Metric label="Coach rating" value={stat.coachRating ? `${stat.coachRating}` : "—"} suffix="/10" />
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-md border border-line bg-ink-900 p-3">
      <p className="text-[11px] uppercase tracking-wide text-paper-faint">{label}</p>
      <p className={`stat-figure mt-1 text-xl font-bold ${highlight ? "text-gold" : "text-paper"}`}>
        {value}
        {suffix && <span className="text-xs font-normal text-paper-faint">{suffix}</span>}
      </p>
    </div>
  );
}
