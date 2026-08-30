import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { adminUpdatePlayerSchema } from "@/lib/validation";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const profile = await prisma.playerProfile.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, isActive: true, phone: true, createdAt: true } },
        squad: true,
        weightEntries: { orderBy: { date: "asc" } },
        performanceStats: { orderBy: { createdAt: "desc" } },
        attendanceRecords: true,
        workoutAssignments: { include: { workout: true }, orderBy: { createdAt: "desc" }, take: 10 },
        injuryReports: { orderBy: { createdAt: "desc" } },
        achievements: { include: { achievement: true } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!profile) return NextResponse.json({ error: "Player not found." }, { status: 404 });

    const totalAttendance = profile.attendanceRecords.length;
    const attended = profile.attendanceRecords.filter((a) => a.status === "ATTENDING").length;
    const attendancePct = totalAttendance > 0 ? Math.round((attended / totalAttendance) * 100) : null;

    return NextResponse.json({ player: profile, attendancePct });
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const body = await req.json();
    const parsed = adminUpdatePlayerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const { name, isActive, ...profileFields } = parsed.data;

    const profile = await prisma.playerProfile.findUnique({ where: { id: params.id } });
    if (!profile) return NextResponse.json({ error: "Player not found." }, { status: 404 });

    if (name !== undefined || isActive !== undefined) {
      await prisma.user.update({
        where: { id: profile.userId },
        data: { ...(name !== undefined ? { name } : {}), ...(isActive !== undefined ? { isActive } : {}) },
      });
    }

    const updated = await prisma.playerProfile.update({
      where: { id: params.id },
      data: profileFields,
      include: { user: true, squad: true },
    });

    return NextResponse.json({ player: updated });
  });
}

// Players are never hard-deleted (their history has to stay intact for
// attendance/performance/payment records) — this deactivates the account.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const profile = await prisma.playerProfile.findUnique({ where: { id: params.id } });
    if (!profile) return NextResponse.json({ error: "Player not found." }, { status: 404 });
    await prisma.user.update({ where: { id: profile.userId }, data: { isActive: false } });
    await prisma.playerProfile.update({ where: { id: params.id }, data: { status: "INACTIVE" } });
    return NextResponse.json({ ok: true });
  });
}
