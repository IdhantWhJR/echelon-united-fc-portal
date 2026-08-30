import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, withErrorHandling } from "@/lib/guard";
import { matchUpdateSchema } from "@/lib/validation";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: {
        event: { include: { attendanceRecords: { include: { playerProfile: { include: { user: true } } } } } },
        appearances: { include: { playerProfile: { include: { user: true } } } },
        media: true,
      },
    });
    if (!match) return NextResponse.json({ error: "Match not found." }, { status: 404 });
    return NextResponse.json({ match });
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const body = await req.json();
    const parsed = matchUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    const data = parsed.data;

    const match = await prisma.match.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(data.date ? { date: new Date(data.date) } : {}),
        ...(data.kickoff ? { kickoff: new Date(data.kickoff) } : {}),
      },
    });

    // Keep the linked calendar Event's status-relevant fields in sync so the
    // player calendar/dashboard never shows a stale opponent, date, or venue.
    if (data.opponent || data.venue !== undefined || data.date || data.kickoff) {
      await prisma.event.updateMany({
        where: { matchId: match.id },
        data: {
          ...(data.opponent ? { title: `Match vs ${data.opponent}` } : {}),
          ...(data.venue !== undefined ? { location: data.venue } : {}),
          ...(data.date ? { date: new Date(data.date) } : {}),
          ...(data.kickoff ? { startTime: new Date(data.kickoff) } : {}),
        },
      });
    }

    return NextResponse.json({ match });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    await requireStaff();
    const match = await prisma.match.findUnique({ where: { id: params.id } });
    if (!match) return NextResponse.json({ error: "Match not found." }, { status: 404 });
    // Deleting the Match cascades to appearances/media; the linked Event
    // references matchId with onDelete not cascading, so clear it first.
    await prisma.event.updateMany({ where: { matchId: match.id }, data: { matchId: null } });
    await prisma.event.deleteMany({ where: { matchId: match.id } });
    await prisma.match.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}
