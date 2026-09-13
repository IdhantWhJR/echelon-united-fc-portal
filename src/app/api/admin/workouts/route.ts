import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { workoutCreateSchema } from "@/lib/validation";

export async function GET() {
  return withErrorHandling(async () => {
    await requireStaff();
    const workouts = await prisma.workout.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 50,
      include: {
        exercises: { orderBy: { order: "asc" } },
        assignments: {
          include: { playerProfile: { include: { user: { select: { name: true } } } } },
        },
      },
    });
    return NextResponse.json({ workouts });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requireStaff();
    const parsed = workoutCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const data = parsed.data;

    if (data.targetType === "SQUAD" && !data.squadId) {
      return NextResponse.json({ error: "Choose a squad for a squad workout." }, { status: 400 });
    }
    if (data.targetType === "INDIVIDUAL" && !data.playerProfileIds?.length) {
      return NextResponse.json({ error: "Choose at least one player." }, { status: 400 });
    }
    if (data.squadId) {
      const squad = await prisma.squad.findUnique({ where: { id: data.squadId }, select: { id: true } });
      if (!squad) return NextResponse.json({ error: "Selected squad was not found." }, { status: 400 });
    }

    const players = await prisma.playerProfile.findMany({
      where:
        data.targetType === "SQUAD"
          ? { squadId: data.squadId, status: { not: "INACTIVE" } }
          : data.targetType === "INDIVIDUAL"
          ? { id: { in: data.playerProfileIds ?? [] }, status: { not: "INACTIVE" } }
          : { status: { not: "INACTIVE" } },
      select: { id: true, userId: true },
    });
    if (data.targetType === "INDIVIDUAL" && players.length !== data.playerProfileIds?.length) {
      return NextResponse.json({ error: "One or more selected players are no longer active." }, { status: 400 });
    }

    const workout = await prisma.$transaction(async (tx) => {
      const created = await tx.workout.create({
        data: {
          title: data.title,
          description: data.description,
          date: new Date(data.date),
          deadline: data.deadline ? new Date(data.deadline) : null,
          instructions: data.instructions,
          coachNotes: data.coachNotes,
          videoDemoUrl: data.videoDemoUrl || null,
          targetType: data.targetType,
          squadId: data.squadId ?? null,
          createdById: session.user.id,
          exercises: {
            create: data.exercises.map((exercise, index) => ({
              name: exercise.name,
              sets: exercise.sets ?? null,
              reps: exercise.reps || null,
              durationSec: exercise.durationSec ?? null,
              restSec: exercise.restSec ?? null,
              order: exercise.order ?? index,
            })),
          },
          assignments: {
            create: players.map((player) => ({
              playerProfileId: player.id,
              squadId: data.targetType === "SQUAD" ? data.squadId : null,
            })),
          },
        },
        include: { exercises: true, assignments: true },
      });

      if (players.length > 0) {
        await tx.notification.createMany({
          data: players.map((player) => ({
            userId: player.userId,
            type: "WORKOUT_ASSIGNED" as const,
            title: "New workout assigned",
            body: `${data.title} is ready to complete.`,
            link: "/dashboard/training",
          })),
        });
      }
      return created;
    });

    return NextResponse.json({ workout, assignedCount: players.length }, { status: 201 });
  });
}