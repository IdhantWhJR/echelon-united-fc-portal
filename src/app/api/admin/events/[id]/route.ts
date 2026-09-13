import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { eventUpdateSchema } from "@/lib/validation";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        squad: true,
        match: true,
        attendanceRecords: {
          include: { playerProfile: { include: { user: { select: { name: true } } } } },
        },
      },
    });
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    return NextResponse.json({ event });
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const body = await req.json();
    const parsed = eventUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const { playerProfileIds, ...rest } = parsed.data;

    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(rest.date ? { date: new Date(rest.date) } : {}),
        ...(rest.startTime ? { startTime: new Date(rest.startTime) } : {}),
        ...(rest.endTime !== undefined ? { endTime: rest.endTime ? new Date(rest.endTime) : null } : {}),
      },
    });

    return NextResponse.json({ event });
  });
}

// Deletes the event and its attendance history. Events are simple enough
// (unlike players/payments) that a hard delete is fine here — there's no
// downstream record that depends on an event existing once it's cancelled
// outright, and admins have "Postponed"/"Cancelled" match statuses for the
// case where they want to keep the record instead of removing it.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    await prisma.event.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}
