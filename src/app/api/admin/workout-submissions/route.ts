import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";

export async function GET() {
  return withErrorHandling(async () => {
    await requireStaff();
    const submissions = await prisma.workoutSubmission.findMany({
      where: { reviewStatus: { in: ["VIDEO_SUBMITTED", "UNDER_REVIEW"] } },
      orderBy: { submittedAt: "asc" },
      include: {
        workoutAssignment: {
          include: {
            workout: { include: { exercises: { orderBy: { order: "asc" } } } },
            playerProfile: { include: { user: { select: { name: true, email: true } } } },
          },
        },
      },
    });
    return NextResponse.json({ submissions });
  });
}