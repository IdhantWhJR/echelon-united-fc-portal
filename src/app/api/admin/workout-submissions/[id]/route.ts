import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { workoutReviewSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const session = await requireStaff();
    const parsed = workoutReviewSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const existing = await prisma.workoutSubmission.findUnique({
      where: { id: params.id },
      include: { workoutAssignment: { include: { playerProfile: true, workout: { select: { title: true } } } } },
    });
    if (!existing) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    if (existing.reviewStatus !== "VIDEO_SUBMITTED" && existing.reviewStatus !== "UNDER_REVIEW") {
      return NextResponse.json({ error: "This submission has already been reviewed." }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.workoutSubmission.update({
        where: { id: params.id },
        data: {
          reviewStatus: parsed.data.status,
          coachFeedback: parsed.data.coachFeedback,
          reviewedById: session.user.id,
          reviewedAt: new Date(),
        },
      });
      await tx.workoutAssignment.update({
        where: { id: existing.workoutAssignmentId },
        data: { status: parsed.data.status },
      });
      await tx.notification.create({
        data: {
          userId: existing.workoutAssignment.playerProfile.userId,
          type: parsed.data.status === "VERIFIED" ? "WORKOUT_APPROVED" : "WORKOUT_REVISION",
          title: parsed.data.status === "VERIFIED" ? "Workout verified" : "Workout needs revision",
          body:
            parsed.data.status === "VERIFIED"
              ? `${existing.workoutAssignment.workout.title} has been verified by your coach.`
              : `${existing.workoutAssignment.workout.title} needs another submission.`,
          link: "/dashboard/training",
        },
      });
      return submission;
    });

    return NextResponse.json({ submission: result });
  });
}