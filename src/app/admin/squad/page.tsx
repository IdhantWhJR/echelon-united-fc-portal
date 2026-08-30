import { prisma } from "@/lib/prisma";
import { SquadManager } from "@/components/admin/squad-manager";

export default async function AdminSquadPage() {
  const squads = await prisma.squad.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { players: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Squad</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Squads</h1>
        <p className="mt-1 text-sm text-paper-faint">
          Organize players into squads (First Team, U21s, etc.) to target events, workouts and announcements.
        </p>
      </div>
      <SquadManager squads={squads} />
    </div>
  );
}
