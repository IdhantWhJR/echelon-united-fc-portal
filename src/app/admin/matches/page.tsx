import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { Icon } from "@/components/icons";

const STATUS_STYLE: Record<string, string> = {
  SCHEDULED: "border-signal-info/40 text-signal-info",
  LIVE: "border-gold/50 text-gold",
  COMPLETED: "border-pitch-green/40 text-pitch-green",
  POSTPONED: "border-signal-warn/40 text-signal-warn",
  CANCELLED: "border-line text-paper-faint",
};

export default async function AdminMatchesPage() {
  const matches = await prisma.match.findMany({
    orderBy: { date: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-1">Fixtures</p>
          <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Match Center</h1>
          <p className="mt-1 text-sm text-paper-faint">{matches.length} match{matches.length === 1 ? "" : "es"}</p>
        </div>
        <Link href="/admin/matches/new" className="btn-primary text-xs">
          <Icon name="plus" width={14} height={14} />
          New match
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line py-16 text-center">
          <Icon name="trophy" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No matches yet.</p>
          <p className="mt-1 text-xs text-paper-faint">Create your first fixture to populate the Match Center.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <Link
              key={m.id}
              href={`/admin/matches/${m.id}`}
              className="card flex flex-col gap-3 p-4 transition-colors hover:border-gold-deep sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-line bg-ink-700 text-center">
                  <span className="font-display text-[10px] font-semibold uppercase text-paper-faint">
                    {format(m.date, "MMM")}
                  </span>
                  <span className="stat-figure -mt-0.5 text-base font-bold text-paper">{format(m.date, "d")}</span>
                </div>
                <div>
                  <p className="font-display text-base font-bold text-paper">
                    Echelon United <span className="text-paper-faint">{m.homeAway === "HOME" ? "vs" : "@"}</span>{" "}
                    {m.opponent}
                  </p>
                  <p className="mt-0.5 text-xs text-paper-faint">
                    {format(m.kickoff, "h:mm a")}
                    {m.venue ? ` · ${m.venue}` : ""}
                    {m.competition ? ` · ${m.competition}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {m.status === "COMPLETED" && m.homeScore !== null && m.awayScore !== null && (
                  <span className="stat-figure text-lg font-bold text-paper">
                    {m.homeAway === "AWAY" ? `${m.awayScore}–${m.homeScore}` : `${m.homeScore}–${m.awayScore}`}
                  </span>
                )}
                <span className={`badge ${STATUS_STYLE[m.status] ?? "border-line text-paper-faint"}`}>{m.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
