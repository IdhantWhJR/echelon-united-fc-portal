import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { Icon } from "@/components/icons";

export default async function PlayerMatchesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [nextMatch, pastMatches] = await Promise.all([
    prisma.match.findFirst({
      where: { status: { in: ["SCHEDULED", "LIVE"] } },
      orderBy: { date: "asc" },
    }),
    prisma.match.findMany({
      where: { status: "COMPLETED" },
      orderBy: { date: "desc" },
      include: {
        appearances: {
          include: { playerProfile: { include: { user: { select: { name: true } } } } },
          orderBy: { goals: "desc" },
        },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Fixtures & Results</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Match Center</h1>
      </div>

      {/* Next match hero */}
      {nextMatch ? (
        <div className="card relative mb-8 overflow-hidden p-6 lg:p-8">
          <div className="absolute inset-0 bg-gold-fade opacity-[0.04]" />
          <p className="eyebrow mb-4">Next Match</p>
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="font-display text-2xl font-bold text-paper lg:text-4xl">Echelon United FC</p>
            <p className="font-display text-sm font-semibold uppercase tracking-widest text-paper-faint">
              {nextMatch.homeAway === "HOME" ? "vs" : nextMatch.homeAway === "AWAY" ? "at" : "vs (neutral)"}
            </p>
            <p className="font-display text-2xl font-bold text-gold lg:text-4xl">{nextMatch.opponent}</p>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-line/60 pt-5 text-sm text-paper-dim">
            <span className="flex items-center gap-1.5">
              <Icon name="calendar" width={14} height={14} className="text-gold" />
              {format(nextMatch.date, "EEEE, MMMM d")}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="clock" width={14} height={14} className="text-gold" />
              {format(nextMatch.kickoff, "h:mm a")}
            </span>
            {nextMatch.venue && (
              <span className="flex items-center gap-1.5">
                <Icon name="mapPin" width={14} height={14} className="text-gold" />
                {nextMatch.venue}
              </span>
            )}
            {nextMatch.competition && <span>{nextMatch.competition}</span>}
          </div>
        </div>
      ) : (
        <div className="mb-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-line py-12 text-center">
          <Icon name="trophy" width={20} height={20} className="mb-2 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No upcoming match scheduled.</p>
        </div>
      )}

      {/* Results history */}
      <p className="eyebrow mb-3">Results</p>
      {pastMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line py-14 text-center">
          <Icon name="clock" width={20} height={20} className="mb-2 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No completed matches yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pastMatches.map((m) => {
            const scorers = m.appearances.filter((a) => a.goals > 0);
            return (
              <div key={m.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-base font-bold text-paper">
                      Echelon United <span className="text-paper-faint">{m.homeAway === "HOME" ? "vs" : "@"}</span>{" "}
                      {m.opponent}
                    </p>
                    <p className="mt-0.5 text-xs text-paper-faint">
                      {format(m.date, "EEE d MMM yyyy")}
                      {m.competition ? ` · ${m.competition}` : ""}
                    </p>
                  </div>
                  {m.homeScore !== null && m.awayScore !== null ? (
                    <span className="stat-figure text-2xl font-bold text-gold">
                      {m.homeAway === "AWAY" ? `${m.awayScore}–${m.homeScore}` : `${m.homeScore}–${m.awayScore}`}
                    </span>
                  ) : (
                    <span className="text-xs text-paper-faint">Score not recorded</span>
                  )}
                </div>
                {scorers.length > 0 && (
                  <p className="mt-3 border-t border-line/60 pt-3 text-xs text-paper-dim">
                    <span className="text-paper-faint">Goals: </span>
                    {scorers
                      .map((a) => `${a.playerProfile.user.name}${a.goals > 1 ? ` (${a.goals})` : ""}`)
                      .join(", ")}
                  </p>
                )}
                {m.matchReport && <p className="mt-2 text-xs leading-relaxed text-paper-dim">{m.matchReport}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
