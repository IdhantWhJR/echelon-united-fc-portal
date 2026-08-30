import { Icon } from "@/components/icons";
import { computeLeaderboards, getLeaderboardVisibility } from "@/lib/leaderboards";
import { LeaderboardVisibilityToggle } from "@/components/admin/leaderboard-visibility-toggle";

export default async function AdminLeaderboardsPage() {
  const [boards, visibility] = await Promise.all([computeLeaderboards(false), getLeaderboardVisibility()]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Recognition</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Leaderboards</h1>
        <p className="mt-1 text-sm text-paper-faint">
          Every ranking is computed live from real attendance, workout, match, and performance data — nothing here is
          stored or faked. Toggle which boards players can see on their own Leaderboard page. Wellness and injury
          data is never surfaced through a leaderboard, regardless of these settings.
        </p>
      </div>

      <div className="space-y-4">
        {boards.map((board) => (
          <div key={board.key} className="card p-4">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-base font-bold text-paper">{board.label}</p>
                <p className="text-xs text-paper-faint">{board.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-paper-faint">{visibility[board.key] ? "Visible to players" : "Hidden"}</span>
                <LeaderboardVisibilityToggle boardKey={board.key} initialVisible={visibility[board.key]} />
              </div>
            </div>

            {!board.available ? (
              <p className="rounded-md border border-dashed border-line px-3 py-3 text-xs text-paper-faint">
                {board.unavailableReason}
              </p>
            ) : board.rows.length === 0 ? (
              <p className="rounded-md border border-dashed border-line px-3 py-3 text-xs text-paper-faint">
                No qualifying data yet — this board will populate as real records come in.
              </p>
            ) : (
              <ol className="divide-y divide-line">
                {board.rows.slice(0, 5).map((row, i) => (
                  <li key={row.playerProfileId} className="flex items-center justify-between py-2 text-sm">
                    <span className="flex items-center gap-2.5">
                      <span className="w-4 shrink-0 font-mono text-xs text-paper-faint">{i + 1}</span>
                      <span className="text-paper-dim">
                        {row.jerseyNumber ? `#${row.jerseyNumber} ` : ""}
                        {row.name}
                      </span>
                    </span>
                    <span className="font-mono text-paper">{row.display}</span>
                  </li>
                ))}
              </ol>
            )}
            {board.available && board.rows.length > 5 && (
              <p className="mt-1 text-[11px] text-paper-faint">+{board.rows.length - 5} more on the full board</p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-paper-faint">
        <Icon name="medal" width={13} height={13} />
        Manage individual milestones and awards from Achievements.
      </p>
    </div>
  );
}
