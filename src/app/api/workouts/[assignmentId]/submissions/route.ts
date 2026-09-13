import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, withErrorHandling } from "@/lib/guard";
import { workoutSubmissionSchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: { assignmentId: string } }) {
  return withErrorHandling(async () => {
    const session = await requireSession();
    const parsed = workoutSubmissionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const assignment = await prisma.workoutAssignment.findUnique({
      where: { id: params.assignmentId },
      include: { playerProfile: true, workout: { select: { title: true } } },
    });
    if (!assignment) return NextResponse.json({ error: "Workout assignment not found." }, { status: 404 });
    if (session.user.role === "PLAYER" && assignment.playerProfile.userId !== session.user.id) {
      return NextResponse.json({ error: "You do not have permission to submit for this workout." }, { status: 403 });
    }
    if (assignment.status === "VERIFIED") {
      return NextResponse.json({ error: "This workout has already been verified." }, { status: 409 });
    }

    const submission = await prisma.$transaction(async (tx) => {
      const created = await tx.workoutSubmission.create({
        data: {
          workoutAssignmentId: assignment.id,
          videoUrl: parsed.data.videoUrl,
          playerNote: parsed.data.playerNote,
        },
      });
      await tx.workoutAssignment.update({
        where: { id: assignment.id },
        data: { status: "VIDEO_SUBMITTED" },
      });
      return created;
    });

    return NextResponse.json({ submission }, { status: 201 });
  });
}