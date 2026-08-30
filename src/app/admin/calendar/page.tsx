import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format, startOfDay } from "date-fns";
import { Icon } from "@/components/icons";
import { EventFormToggle } from "@/components/admin/event-form-toggle";
import { DeleteEventButton } from "@/components/admin/delete-event-button";
import { AttendanceSummary } from "@/components/admin/attendance-summary";

const TYPE_ICON: Record<string, string> = {
  TRAINING: "activity",
  MATCH: "trophy",
  TEAM_EVENT: "users",
  OTHER: "calendar",
};

const TYPE_LABEL: Record<string, string> = {
  TRAINING: "Training",
  MATCH: "Match",
  TEAM_EVENT: "Team event",
  OTHER: "Other",
};

export default async function AdminCalendarPage() {
  const [events, squads, past] = await Promise.all([
    prisma.event.findMany({
      where: { date: { gte: startOfDay(new Date()) } },
      orderBy: { startTime: "asc" },
      include: {
        squad: { select: { name: true } },
        match: { select: { id: true, opponent: true } },
        attendanceRecords: { select: { status: true } },
      },
    }),
    prisma.squad.findMany({ orderBy: { name: "asc" } }),
    prisma.event.count({ where: { date: { lt: startOfDay(new Date()) } } }),
  ]);

  const grouped = groupByMonth<(typeof events)[number]>(events);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-1">Schedule</p>
          <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Calendar</h1>
          <p className="mt-1 text-sm text-paper-faint">
            {events.length} upcoming event{events.length === 1 ? "" : "s"}
            {past > 0 && ` · ${past} past`}
          </p>
        </div>
      </div>

      <div className="mb-5">
        <EventFormToggle squads={squads.map((s) => ({ id: s.id, name: s.name }))} />
      </div>

      <div className="mb-5 rounded-md border border-line bg-ink-800/60 p-3 text-xs text-paper-faint">
        Matches are created from{" "}
        <Link href="/admin/matches" className="font-semibold text-gold hover:underline">
          Match Center
        </Link>{" "}
        so score and lineup stay attached — they still appear here automatically once scheduled.
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line py-16 text-center">
          <Icon name="calendar" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No upcoming events.</p>
          <p className="mt-1 text-xs text-paper-faint">Create a training session or team event to get started.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([month, monthEvents]) => (
            <div key={month}>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest2 text-paper-faint">{month}</p>
              <div className="space-y-3">
                {monthEvents.map((e) => (
                  <div key={e.id} className="card flex items-start gap-4 p-4">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-line bg-ink-700 text-center">
                      <span className="font-display text-[10px] font-semibold uppercase text-paper-faint">
                        {format(e.date, "MMM")}
                      </span>
                      <span className="stat-figure -mt-0.5 text-base font-bold text-paper">
                        {format(e.date, "d")}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <Icon name={TYPE_ICON[e.type]} width={13} height={13} className="text-gold" />
                            <span className="badge border-line text-paper-faint">{TYPE_LABEL[e.type]}</span>
                            {e.squad && <span className="text-xs text-paper-faint">· {e.squad.name}</span>}
                          </div>
                          <p className="font-display text-base font-bold text-paper">
                            {e.match ? `vs ${e.match.opponent}` : e.title}
                          </p>
                          <p className="mt-0.5 text-xs text-paper-faint">
                            {format(e.startTime, "h:mm a")}
                            {e.endTime ? ` – ${format(e.endTime, "h:mm a")}` : ""}
                            {e.location ? ` · ${e.location}` : ""}
                          </p>
                        </div>
                        {!e.match && <DeleteEventButton eventId={e.id} label={`Delete ${e.title}`} />}
                      </div>
                      <div className="mt-2">
                        <AttendanceSummary records={e.attendanceRecords} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByMonth<T extends { date: Date }>(events: T[]): [string, T[]][] {
  const groups: [string, T[]][] = [];
  for (const e of events) {
    const label = format(e.date, "MMMM yyyy");
    const existing = groups.find(([m]) => m === label);
    if (existing) existing[1].push(e);
    else groups.push([label, [e]]);
  }
  return groups;
}
