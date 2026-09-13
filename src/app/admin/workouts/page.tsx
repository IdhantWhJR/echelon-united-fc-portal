import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { WorkoutForm } from "@/components/admin/workout-form";
import { Icon } from "@/components/icons";

export default async function AdminWorkoutsPage() {
  const [workouts, squads, players] = await Promise.all([
    prisma.workout.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 30,
      include: { exercises: { orderBy: { order: "asc" } }, _count: { select: { assignments: true } } },
    }),
    prisma.squad.findMany({ orderBy: { name: "asc" } }),
    prisma.playerProfile.findMany({
      where: { status: { not: "INACTIVE" }, user: { isActive: true } },
      orderBy: [{ jerseyNumber: "asc" }, { user: { name: "asc" } }],
      include: { user: { select: { name: true } }, squad: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Player development</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Workouts</h1>
        <p className="mt-1 max-w-xl text-sm text-paper-faint">Assign structured work to the whole club, a squad, or selected players. Completion always requires video review.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section>
          <p className="eyebrow mb-3">Recent assignments</p>
          {workouts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line px-6 py-16 text-center"><Icon name="clipboard" width={22} height={22} className="mx-auto mb-3 text-paper-faint" /><p className="text-sm text-paper">No workouts assigned yet.</p><p className="mt-1 text-xs text-paper-faint">Create the first one from the panel on the right.</p></div>
          ) : (
            <div className="space-y-3">
              {workouts.map((workout) => (
                <div key={workout.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-display text-lg font-bold text-paper">{workout.title}</p><p className="mt-1 text-xs text-paper-faint">{format(workout.date, "EEE d MMM yyyy, h:mm a")}{workout.deadline ? ` · due ${format(workout.deadline, "d MMM, h:mm a")}` : ""}</p></div>
                    <span className="badge border-line text-paper-faint">{workout._count.assignments} player{workout._count.assignments === 1 ? "" : "s"}</span>
                  </div>
                  {workout.description && <p className="mt-3 text-sm leading-relaxed text-paper-dim">{workout.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">{workout.exercises.map((exercise) => <span key={exercise.id} className="badge border-line text-paper-faint">{exercise.name}{exercise.sets ? ` · ${exercise.sets} sets` : ""}{exercise.reps ? ` · ${exercise.reps}` : ""}</span>)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
        <WorkoutForm squads={squads.map((squad) => ({ id: squad.id, name: squad.name }))} players={players.map((player) => ({ id: player.id, name: player.user.name, squadName: player.squad?.name ?? null, jerseyNumber: player.jerseyNumber }))} />
      </div>
    </div>
  );
}
