import { prisma } from "@/lib/prisma";
import { WorkoutReviewCard } from "@/components/admin/workout-review-card";
import { Icon } from "@/components/icons";

export default async function AdminWorkoutReviewsPage() {
  const submissions = await prisma.workoutSubmission.findMany({
    where: { reviewStatus: { in: ["VIDEO_SUBMITTED", "UNDER_REVIEW"] } },
    orderBy: { submittedAt: "asc" },
    include: {
      workoutAssignment: {
        include: {
          workout: { select: { title: true } },
          playerProfile: { include: { user: { select: { name: true } } } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Verification queue</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Workout Reviews</h1>
        <p className="mt-1 text-sm text-paper-faint">{submissions.length} submission{submissions.length === 1 ? "" : "s"} waiting for a coach or admin decision.</p>
      </div>
      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line py-16 text-center"><Icon name="video" width={22} height={22} className="mb-3 text-paper-faint" /><p className="text-sm font-medium text-paper">Review queue is clear.</p><p className="mt-1 text-xs text-paper-faint">New player video submissions will appear here.</p></div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => <WorkoutReviewCard key={submission.id} submission={{ id: submission.id, videoUrl: submission.videoUrl, playerNote: submission.playerNote, submittedAt: submission.submittedAt.toISOString(), playerName: submission.workoutAssignment.playerProfile.user.name, workoutTitle: submission.workoutAssignment.workout.title }} />)}
        </div>
      )}
    </div>
  );
}
