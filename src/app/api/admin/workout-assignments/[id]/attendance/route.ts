import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { workoutAttendanceUpdateSchema } from "@/lib/validation";

// PATCH /api/admin/workout-assignments/[id]/attendance  { attended: boolean }
// Staff-only quick toggle for the player-attendance page — separate from
// the full video-review flow in /api/admin/workout-submissions. Reuses the
// existing WorkoutStatus enum as the attendance proxy: VERIFIED = present,
// ASSIGNED = not present, so no new field or model was needed. Does not
// touch any WorkoutSubmission records.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const parsed = workoutAttendanceUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const existing = await prisma.workoutAssignment.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });

    const assignment = await prisma.workoutAssignment.update({
      where: { id: params.id },
      data: { status: parsed.data.attended ? "VERIFIED" : "ASSIGNED" },
    });

    return NextResponse.json({ assignment });
  });
}
