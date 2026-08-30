import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";

const POSITIONS = ["GOALKEEPER", "DEFENDER", "MIDFIELDER", "ATTACKER"];
const STATUSES = ["ACTIVE", "INJURED", "SUSPENDED", "ON_LOAN", "INACTIVE"];

export default async function AdminPlayersPage({
  searchParams,
}: {
  searchParams: { q?: string; squadId?: string; position?: string; status?: string };
}) {
  const { q, squadId, position, status } = searchParams;

  const [players, squads] = await Promise.all([
    prisma.playerProfile.findMany({
      where: {
        ...(squadId ? { squadId } : {}),
        ...(position ? { position: position as any } : {}),
        ...(status ? { status: status as any } : {}),
        ...(q
          ? {
              user: {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                ],
              },
            }
          : {}),
      },
      include: {
        user: { select: { name: true, email: true, isActive: true } },
        squad: { select: { name: true } },
      },
      orderBy: [{ jerseyNumber: "asc" }, { createdAt: "asc" }],
    }),
    prisma.squad.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-1">Squad</p>
          <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Players</h1>
          <p className="mt-1 text-sm text-paper-faint">{players.length} player{players.length === 1 ? "" : "s"}</p>
        </div>
        <Link href="/admin/players/new" className="btn-primary text-xs">
          <Icon name="plus" width={14} height={14} />
          Add player
        </Link>
      </div>

      <form method="get" className="card mb-5 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="players-search" className="mb-1 block text-xs text-paper-dim">Search</label>
          <input id="players-search" name="q" defaultValue={q} placeholder="Name or email" className="input-field" />
        </div>
        <div>
          <label htmlFor="players-squad" className="mb-1 block text-xs text-paper-dim">Squad</label>
          <select id="players-squad" name="squadId" defaultValue={squadId ?? ""} className="input-field">
            <option value="">All squads</option>
            {squads.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="players-position" className="mb-1 block text-xs text-paper-dim">Position</label>
          <select id="players-position" name="position" defaultValue={position ?? ""} className="input-field">
            <option value="">All positions</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p[0] + p.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="players-status" className="mb-1 block text-xs text-paper-dim">Status</label>
          <select id="players-status" name="status" defaultValue={status ?? ""} className="input-field">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0] + s.slice(1).toLowerCase().replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-secondary text-xs">
          <Icon name="search" width={14} height={14} />
          Filter
        </button>
        {(q || squadId || position || status) && (
          <Link href="/admin/players" className="text-xs text-paper-faint hover:text-gold">
            Clear
          </Link>
        )}
      </form>

      {players.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line py-16 text-center">
          <Icon name="users" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No players match these filters.</p>
          <p className="mt-1 text-xs text-paper-faint">Try clearing filters, or add your first player.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-paper-faint">
                <th className="px-4 py-3 font-medium">Player</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Position</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Squad</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-b border-line/60 last:border-0 hover:bg-ink-700/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/players/${p.id}`} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-700 font-display text-xs font-bold text-gold">
                        {p.jerseyNumber ?? "—"}
                      </span>
                      <span>
                        <span className="block font-medium text-paper">{p.user.name}</span>
                        <span className="block text-xs text-paper-faint">{p.user.email}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-paper-dim sm:table-cell">
                    {p.position ? p.position[0] + p.position.slice(1).toLowerCase() : "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-paper-dim md:table-cell">{p.squad?.name ?? "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} active={p.user.isActive} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/players/${p.id}`} className="text-xs font-semibold text-gold hover:underline">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, active }: { status: string; active: boolean }) {
  if (!active) {
    return <span className="badge border-line text-paper-faint">Deactivated</span>;
  }
  const styles: Record<string, string> = {
    ACTIVE: "border-pitch-green/40 text-pitch-green",
    INJURED: "border-signal-danger/40 text-signal-danger",
    SUSPENDED: "border-signal-warn/40 text-signal-warn",
    ON_LOAN: "border-signal-info/40 text-signal-info",
    INACTIVE: "border-line text-paper-faint",
  };
  return (
    <span className={`badge ${styles[status] ?? "border-line text-paper-faint"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
