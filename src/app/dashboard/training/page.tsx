import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { format, isBefore } from "date-fns";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { WorkoutSubmissionForm } from "@/components/dashboard/workout-submission-form";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  VIDEO_SUBMITTED: "Video submitted",
  UNDER_REVIEW: "Under review",
  VERIFIED: "Verified",
  NEEDS_REVISION: "Needs revision",
  OVERDUE: "Overdue",
};

export default async function PlayerTrainingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const profile = await prisma.playerProfile.findUnique({ where: { userId: session.user.id }, include: { squad: true } });
  if (!profile) redirect("/admin");

  const [planDays, assignments] = await Promise.all([
    prisma.trainingPlanDay.findMany({
      where: { OR: profile.squadId ? [{ squadId: null }, { squadId: profile.squadId }] : [{ squadId: null }] },
      orderBy: [{ dayOfWeek: "asc" }, { createdAt: "asc" }],
    }),
    prisma.workoutAssignment.findMany({
      where: { playerProfileId: profile.id },
      orderBy: [{ workout: { date: "desc" } }, { createdAt: "desc" }],
      include: {
        workout: { include: { exercises: { orderBy: { order: "asc" } } } },
        submissions: { orderBy: { submittedAt: "desc" }, take: 1 },
      },
    }),
  ]);

  const activeAssignments = assignments.filter((assignment) => assignment.status !== "VERIFIED");
  const verifiedCount = assignments.filter((assignment) => assignment.status === "VERIFIED").length;
  const now = new Date();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Player development</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Training</h1>
        <p className="mt-1 text-sm text-paper-faint">Your weekly focus and assigned workouts, with every completion verified by staff.</p>
      </div>

      {planDays.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-end justify-between"><div><p className="eyebrow mb-1">Weekly focus</p><p className="text-xs text-paper-faint">{profile.squad?.name ?? "Club-wide plan"}</p></div></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {planDays.map((day) => <div key={day.id} className="rounded-md border border-line bg-ink-800/60 p-3"><p className="font-display text-xs font-bold uppercase text-gold">{DAYS[day.dayOfWeek]}</p><p className="mt-1 text-sm font-semibold text-paper">{day.focus}</p>{day.description && <p className="mt-1 text-xs leading-relaxed text-paper-faint">{day.description}</p>}</div>)}
          </div>
        </section>
      )}

      <div className="mb-3 flex items-end justify-between"><div><p className="eyebrow mb-1">Assigned workouts</p><p className="text-xs text-paper-faint">{activeAssignments.length} active · {verifiedCount} verified</p></div><div className="badge border-gold-deep/50 text-gold"><Icon name="shield" width={12} height={12} /> Staff verified</div></div>
      {assignments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line px-6 py-16 text-center"><Icon name="activity" width={22} height={22} className="mx-auto mb-3 text-paper-faint" /><p className="text-sm font-medium text-paper">No workouts assigned yet.</p><p className="mt-1 text-xs text-paper-faint">Your coach will add work here when it is ready.</p></div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const overdue = assignment.status !== "VERIFIED" && assignment.workout.deadline && isBefore(assignment.workout.deadline, now);
            const displayStatus = overdue ? "OVERDUE" : assignment.status;
            const latest = assignment.submissions[0];
            return (
              <article key={assignment.id} className="card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-lg font-bold text-paper">{assignment.workout.title}</h2><span className={`badge ${displayStatus === "VERIFIED" ? "border-signal-success/50 text-signal-success" : displayStatus === "NEEDS_REVISION" || displayStatus === "OVERDUE" ? "border-signal-danger/50 text-signal-danger" : "border-line text-paper-faint"}`}>{STATUS_LABEL[displayStatus]}</span></div><p className="mt-1 text-xs text-paper-faint">{format(assignment.workout.date, "EEE d MMM yyyy, h:mm a")}{assignment.workout.deadline ? ` · due ${format(assignment.workout.deadline, "d MMM, h:mm a")}` : ""}</p></div>
                  {assignment.status === "VERIFIED" && <Icon name="check" width={20} height={20} className="text-signal-success" />}
                </div>
                {assignment.workout.description && <p className="mt-4 text-sm leading-relaxed text-paper-dim">{assignment.workout.description}</p>}
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {assignment.workout.exercises.map((exercise) => <div key={exercise.id} className="rounded-md border border-line/70 bg-ink-900/60 px-3 py-2"><p className="text-sm font-medium text-paper">{exercise.name}</p><p className="mt-0.5 text-xs text-paper-faint">{[exercise.sets && `${exercise.sets} sets`, exercise.reps, exercise.durationSec && `${Math.round(exercise.durationSec / 60)} min`, exercise.restSec && `${exercise.restSec}s rest`].filter(Boolean).join(" · ") || "Complete as instructed"}</p></div>)}
                </div>
                {assignment.workout.instructions && <div className="mt-4 border-l-2 border-gold-deep pl-3 text-sm leading-relaxed text-paper-dim"><span className="text-paper-faint">Instructions · </span>{assignment.workout.instructions}</div>}
                {assignment.status === "VERIFIED" ? (
                  <p className="mt-4 text-xs text-signal-success">Verified by your coaching team. This is recorded as complete.</p>
                ) : assignment.status === "VIDEO_SUBMITTED" || assignment.status === "UNDER_REVIEW" ? (
                  <p className="mt-4 text-xs text-paper-faint">Your video has been sent to the coaching team{latest ? ` on ${format(latest.submittedAt, "d MMM")}` : ""}. Wait for verification.</p>
                ) : (
                  <>
                    {latest?.coachFeedback && <p className="mt-4 border-l-2 border-signal-danger pl-3 text-sm leading-relaxed text-paper-dim"><span className="text-paper-faint">Coach feedback · </span>{latest.coachFeedback}</p>}
                    <WorkoutSubmissionForm assignmentId={assignment.id} />
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}