import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { computeLeaderboards } from "@/lib/leaderboards";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await prisma.playerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/admin");

  // computeLeaderboards(true) already filters to boards the admin has made visible.
  const visibleBoards = await computeLeaderboards(true);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Recognition</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Leaderboards</h1>
        <p className="mt-1 text-sm text-paper-faint">
          Rankings pulled from real club records. Wellness and injury information is never shown here.
        </p>
      </div>

      {visibleBoards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-6 py-16 text-center">
          <Icon name="medal" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No leaderboards are visible right now.</p>
          <p className="mt-1 text-xs text-paper-faint">Check back once your club enables one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleBoards.map((board) => (
            <div key={board.key} className="card p-4">
              <p className="mb-1 font-display text-base font-bold text-paper">{board.label}</p>
              <p className="mb-3 text-xs text-paper-faint">{board.description}</p>

              {!board.available ? (
                <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-xs text-paper-faint">
                  {board.unavailableReason}
                </p>
              ) : board.rows.length === 0 ? (
                <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-xs text-paper-faint">
                  No data yet — this board fills in as results come in.
                </p>
              ) : (
                <ol className="divide-y divide-line">
                  {board.rows.map((row, i) => {
                    const isMe = row.playerProfileId === profile.id;
                    return (
                      <li
                        key={row.playerProfileId}
                        className={`flex items-center justify-between py-2 text-sm ${isMe ? "rounded-md bg-gold/10 px-2" : ""}`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="w-5 shrink-0 font-mono text-xs text-paper-faint">
                            {i < 3 ? <Icon name="medal" width={13} height={13} className="text-gold" /> : i + 1}
                          </span>
                          <span className={isMe ? "font-semibold text-gold" : "text-paper-dim"}>
                            {row.jerseyNumber ? `#${row.jerseyNumber} ` : ""}
                            {row.name}
                            {isMe ? " (you)" : ""}
                          </span>
                        </span>
                        <span className="font-mono text-paper">{row.display}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
