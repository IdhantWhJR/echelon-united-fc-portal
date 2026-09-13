import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, startOfDay } from "date-fns";
import { Icon } from "@/components/icons";
import { AttendanceResponse } from "@/components/dashboard/attendance-response";

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

export default async function PlayerCalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await prisma.playerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, squadId: true },
  });

  // Staff viewing their own calendar (e.g. a coach who's also curious) sees
  // everything club-wide since they don't have a playerProfile to scope to.
  const where = profile
    ? {
        OR: [
          { squadId: null },
          { squadId: profile.squadId ?? undefined },
          { assignments: { some: { playerProfileId: profile.id } } },
        ],
      }
    : {};

  const events = await prisma.event.findMany({
    where: { ...where, date: { gte: startOfDay(new Date()) } },
    orderBy: { startTime: "asc" },
    include: {
      match: { select: { opponent: true } },
      squad: { select: { name: true } },
      attendanceRecords: profile
        ? { where: { playerProfileId: profile.id }, select: { status: true } }
        : false,
    },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Schedule</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Calendar</h1>
        <p className="mt-1 text-sm text-paper-faint">
          {events.length} upcoming event{events.length === 1 ? "" : "s"}
        </p>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line py-16 text-center">
          <Icon name="calendar" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No upcoming events.</p>
          <p className="mt-1 text-xs text-paper-faint">Training sessions and matches will appear here once scheduled.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((e) => {
            const myStatus = profile ? e.attendanceRecords?.[0]?.status ?? null : null;
            return (
              <div key={e.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md border border-line bg-ink-700 text-center">
                      <span className="font-display text-[10px] font-semibold uppercase text-paper-faint">
                        {format(e.date, "MMM")}
                      </span>
                      <span className="stat-figure -mt-0.5 text-lg font-bold text-paper">{format(e.date, "d")}</span>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <Icon name={TYPE_ICON[e.type]} width={13} height={13} className="text-gold" />
                        <span className="badge border-line text-paper-faint">{TYPE_LABEL[e.type]}</span>
                      </div>
                      <p className="font-display text-base font-bold text-paper">
                        {e.match ? `vs ${e.match.opponent}` : e.title}
                      </p>
                      <p className="mt-0.5 text-xs text-paper-faint">
                        {format(e.startTime, "h:mm a")}
                        {e.endTime ? ` – ${format(e.endTime, "h:mm a")}` : ""}
                        {e.location ? ` · ${e.location}` : ""}
                      </p>
                      {e.description && <p className="mt-2 max-w-md text-xs text-paper-dim">{e.description}</p>}
                    </div>
                  </div>
                </div>

                {profile && (
                  <div className="mt-4 border-t border-line/60 pt-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest2 text-paper-faint">
                      {e.type === "MATCH" ? "Your availability" : "Your response"}
                    </p>
                    <AttendanceResponse eventId={e.id} currentStatus={myStatus} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
