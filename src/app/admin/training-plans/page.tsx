import { prisma } from "@/lib/prisma";
import { TrainingPlanForm } from "@/components/admin/training-plan-form";
import { DeleteTrainingPlanDayButton } from "@/components/admin/delete-training-plan-day-button";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function AdminTrainingPlansPage() {
  const [days, squads] = await Promise.all([
    prisma.trainingPlanDay.findMany({ orderBy: [{ dayOfWeek: "asc" }, { createdAt: "asc" }] }),
    prisma.squad.findMany({ orderBy: { name: "asc" } }),
  ]);
  const squadNames = new Map(squads.map((squad) => [squad.id, squad.name]));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Player development</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Training Plans</h1>
        <p className="mt-1 max-w-xl text-sm text-paper-faint">Shape the weekly focus players see alongside their assigned workouts. Plan days are guidance; individual workouts remain separate assignments.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <p className="eyebrow mb-3">Weekly template</p>
          {days.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line px-6 py-16 text-center text-sm text-paper-faint">No weekly plan days yet. Add the first focus on the right.</div>
          ) : (
            <div className="space-y-3">
              {days.map((day) => (
                <div key={day.id} className="card flex items-start gap-4 p-4">
                  <div className="w-24 shrink-0"><p className="font-display text-sm font-bold uppercase text-gold">{DAYS[day.dayOfWeek]}</p><p className="mt-1 text-[10px] uppercase tracking-wide text-paper-faint">{day.squadId ? squadNames.get(day.squadId) : "Club-wide"}</p></div>
                  <div className="min-w-0 flex-1"><p className="font-display text-base font-bold text-paper">{day.focus}</p>{day.description && <p className="mt-1 text-sm leading-relaxed text-paper-dim">{day.description}</p>}</div>
                  <DeleteTrainingPlanDayButton id={day.id} />
                </div>
              ))}
            </div>
          )}
        </section>
        <TrainingPlanForm squads={squads.map((squad) => ({ id: squad.id, name: squad.name }))} />
      </div>
    </div>
  );
}
