import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";

const GROUPS: { key: string; label: string }[] = [
  { key: "GOALKEEPER", label: "Goalkeepers" },
  { key: "DEFENDER", label: "Defenders" },
  { key: "MIDFIELDER", label: "Midfielders" },
  { key: "ATTACKER", label: "Attackers" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function SquadPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // Deliberately selects only fields safe for team-wide viewing — no
  // wellness, injury, payment, or contact information, per the spec's rule
  // that the squad page must never expose private player data.
  const players = await prisma.playerProfile.findMany({
    where: { status: { not: "INACTIVE" }, user: { isActive: true } },
    select: {
      id: true,
      jerseyNumber: true,
      position: true,
      user: { select: { name: true } },
      squad: { select: { name: true } },
    },
    orderBy: [{ jerseyNumber: "asc" }, { user: { name: "asc" } }],
  });

  const byPosition = GROUPS.map((g) => ({
    ...g,
    players: players.filter((p) => p.position === g.key),
  }));
  const unassigned = players.filter((p) => !p.position);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Club</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Squad</h1>
        <p className="mt-1 text-sm text-paper-faint">{players.length} active player{players.length === 1 ? "" : "s"}</p>
      </div>

      {players.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-6 py-16 text-center">
          <Icon name="users" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No players to show yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {byPosition
            .filter((g) => g.players.length > 0)
            .map((g) => (
              <section key={g.key}>
                <p className="eyebrow mb-3">{g.label}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {g.players.map((p) => (
                    <div key={p.id} className="card flex flex-col items-center gap-2 p-4 text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-700 font-display text-base font-bold text-gold">
                        {initials(p.user.name)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-paper">{p.user.name}</p>
                        <p className="text-xs text-paper-faint">
                          {p.jerseyNumber ? `#${p.jerseyNumber}` : "—"}
                          {p.squad?.name ? ` · ${p.squad.name}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

          {unassigned.length > 0 && (
            <section>
              <p className="eyebrow mb-3">Unassigned position</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {unassigned.map((p) => (
                  <div key={p.id} className="card flex flex-col items-center gap-2 p-4 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-700 font-display text-base font-bold text-gold">
                      {initials(p.user.name)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-paper">{p.user.name}</p>
                      <p className="text-xs text-paper-faint">{p.jerseyNumber ? `#${p.jerseyNumber}` : "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
