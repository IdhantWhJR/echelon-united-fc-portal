import { prisma } from "@/lib/prisma";
import { format, startOfDay } from "date-fns";
import { Icon } from "@/components/icons";
import { AttendanceEventCard } from "@/components/admin/attendance-event-card";

export default async function AdminAttendancePage() {
  const events = await prisma.event.findMany({
    where: { date: { gte: startOfDay(new Date()) } },
    orderBy: { startTime: "asc" },
    include: {
      match: { select: { opponent: true } },
      squad: { select: { name: true } },
      attendanceRecords: {
        include: { playerProfile: { include: { user: { select: { name: true } } } } },
        orderBy: { playerProfile: { jerseyNumber: "asc" } },
      },
    },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Schedule</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Attendance</h1>
        <p className="mt-1 text-sm text-paper-faint">
          Live totals for every upcoming session. Expand an event to override an individual player's response.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line py-16 text-center">
          <Icon name="check" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No upcoming events.</p>
          <p className="mt-1 text-xs text-paper-faint">
            Attendance tracking starts once you create an event or match from the Calendar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <AttendanceEventCard
              key={e.id}
              eventId={e.id}
              title={e.match ? `vs ${e.match.opponent}` : e.title}
              subtitle={`${format(e.date, "EEE d MMM")} · ${format(e.startTime, "h:mm a")}${
                e.squad ? ` · ${e.squad.name}` : ""
              }`}
              records={e.attendanceRecords.map((r) => ({
                playerProfileId: r.playerProfileId,
                status: r.status,
                markedByCoach: r.markedByCoach,
                playerProfile: {
                  user: { name: r.playerProfile.user.name },
                  jerseyNumber: r.playerProfile.jerseyNumber,
                },
              }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
