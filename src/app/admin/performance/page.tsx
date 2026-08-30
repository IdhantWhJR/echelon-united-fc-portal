import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";

export default async function AdminPerformancePage() {
  const players = await prisma.playerProfile.findMany({
    where: { user: { isActive: true } },
    include: {
      user: { select: { name: true } },
      squad: { select: { name: true } },
      performanceStats: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: [{ jerseyNumber: "asc" }, { createdAt: "asc" }],
  });

  const withData = players.filter((p) => p.performanceStats.length > 0);
  const withoutData = players.filter((p) => p.performanceStats.length === 0);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Development</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Performance</h1>
        <p className="mt-1 text-sm text-paper-faint">
          {withData.length} of {players.length} active player{players.length === 1 ? "" : "s"} have performance data on
          file. Open a player to enter or update their statistics — these numbers power their dashboard and, later,
          the leaderboards.
        </p>
      </div>

      {players.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line py-16 text-center">
          <Icon name="trending" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No active players yet.</p>
          <p className="mt-1 text-xs text-paper-faint">Add players first, then enter their performance data here.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-paper-faint">
                <th className="px-4 py-3 font-medium">Player</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Squad</th>
                <th className="px-4 py-3 font-medium">Latest period</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Goals</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Assists</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Fitness</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Rating</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {[...withoutData, ...withData].map((p) => {
                const stat = p.performanceStats[0] ?? null;
                return (
                  <tr key={p.id} className="border-b border-line/60 last:border-0 hover:bg-ink-700/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/players/${p.id}`} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-700 font-display text-xs font-bold text-gold">
                          {p.jerseyNumber ?? "—"}
                        </span>
                        <span className="font-medium text-paper">{p.user.name}</span>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-paper-dim sm:table-cell">{p.squad?.name ?? "Unassigned"}</td>
                    <td className="px-4 py-3">
                      {stat ? (
                        <span className="text-paper-dim">{stat.periodLabel}</span>
                      ) : (
                        <span className="badge border-line text-paper-faint">No data yet</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-paper-dim sm:table-cell">{stat?.goals ?? "—"}</td>
                    <td className="hidden px-4 py-3 text-paper-dim sm:table-cell">{stat?.assists ?? "—"}</td>
                    <td className="hidden px-4 py-3 text-paper-dim md:table-cell">{stat?.fitnessScore ?? "—"}</td>
                    <td className="hidden px-4 py-3 text-paper-dim md:table-cell">{stat?.coachRating ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/players/${p.id}`} className="text-xs font-semibold text-gold hover:underline">
                        {stat ? "Update" : "Enter data"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
