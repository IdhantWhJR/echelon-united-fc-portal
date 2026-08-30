import Link from "next/link";
import { Icon } from "@/components/icons";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "border-pitch-green/40 text-pitch-green bg-pitch-green/10",
  INJURED: "border-signal-danger/40 text-signal-danger bg-signal-danger/10",
  SUSPENDED: "border-signal-warn/40 text-signal-warn bg-signal-warn/10",
  ON_LOAN: "border-signal-info/40 text-signal-info bg-signal-info/10",
  INACTIVE: "border-line text-paper-faint bg-ink-700",
};

export function ProfileCard({
  name,
  jerseyNumber,
  position,
  preferredFoot,
  heightCm,
  weightKg,
  squadName,
  status,
}: {
  name: string;
  jerseyNumber: number | null;
  position: string | null;
  preferredFoot: string | null;
  heightCm: number | null;
  weightKg: number | null;
  squadName: string | null;
  status: string;
}) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="card p-5 lg:p-6">
      <div className="mb-5 flex items-center justify-between">
        <p className="eyebrow">Player Profile</p>
        <Link
          href="/dashboard/account"
          className="text-xs font-medium text-paper-faint hover:text-gold"
        >
          Edit
        </Link>
      </div>

      <div className="mb-5 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-line bg-ink-700 font-display text-xl font-bold text-gold">
          {initials}
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-display text-xl font-bold text-paper">{name}</h2>
          <p className="text-sm text-paper-faint">
            {position ? formatEnum(position) : "Position not set"}
            {squadName ? ` · ${squadName}` : ""}
          </p>
          <span className={`badge mt-1.5 ${STATUS_STYLES[status] ?? STATUS_STYLES.ACTIVE}`}>
            {formatEnum(status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
        <Stat label="Number" value={jerseyNumber ? `#${jerseyNumber}` : "—"} />
        <Stat label="Foot" value={preferredFoot ? formatEnum(preferredFoot) : "—"} />
        <Stat label="Height" value={heightCm ? `${heightCm} cm` : "—"} />
        <Stat label="Weight" value={weightKg ? `${weightKg} kg` : "—"} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-paper-faint">{label}</p>
      <p className="stat-figure mt-0.5 text-sm font-semibold text-paper">{value}</p>
    </div>
  );
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}
