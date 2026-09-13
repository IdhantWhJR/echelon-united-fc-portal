import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, format } from "date-fns";
import { Icon } from "@/components/icons";

export default async function AdminOverviewPage() {
  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);

  const [
    activePlayerCount,
    todaysTraining,
    injuredCount,
    workoutStats,
    announcementCount,
    upcomingMatch,
  ] = await Promise.all([
    prisma.playerProfile.count({ where: { user: { isActive: true } } }),
    prisma.event.findFirst({
      where: { type: "TRAINING", date: { gte: dayStart, lte: dayEnd } },
      include: { attendanceRecords: true },
    }),
    prisma.playerProfile.count({ where: { status: "INJURED" } }),
    Promise.all([
      prisma.workoutAssignment.count({ where: { status: "VERIFIED" } }),
      prisma.workoutAssignment.count({
        where: { status: { in: ["VIDEO_SUBMITTED", "UNDER_REVIEW"] } },
      }),
      prisma.workoutAssignment.count({ where: { status: "OVERDUE" } }),
    ]),
    prisma.announcement.count(),
    prisma.match.findFirst({
      where: { status: "SCHEDULED", date: { gte: dayStart } },
      orderBy: { date: "asc" },
    }),
  ]);

  const [verified, awaitingReview, overdue] = workoutStats;

  const attending = todaysTraining?.attendanceRecords.filter((a) => a.status === "ATTENDING").length ?? 0;
  const unavailable = todaysTraining?.attendanceRecords.filter((a) => a.status === "UNAVAILABLE").length ?? 0;
  const pending = todaysTraining?.attendanceRecords.filter((a) => a.status === "PENDING").length ?? 0;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Staff Panel</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Club overview</h1>
        <p className="mt-1 text-sm text-paper-faint">{format(today, "EEEE, MMMM d, yyyy")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon="users"
          label="Squad"
          value={`${activePlayerCount}`}
          sub="Active players"
          href="/admin/players"
        />

        <StatCard
          icon="activity"
          label="Today's Training"
          value={todaysTraining ? `${attending}` : "—"}
          sub={
            todaysTraining
              ? `Attending · ${unavailable} unavailable · ${pending} pending`
              : "No session scheduled today"
          }
          href="/admin/attendance"
        />

        <StatCard
          icon="heart"
          label="Wellness"
          value={`${injuredCount}`}
          sub={injuredCount === 1 ? "Player injured" : "Players injured"}
          href="/admin/wellness"
          tone={injuredCount > 0 ? "warn" : "default"}
        />

        <StatCard
          icon="clipboard"
          label="Workouts"
          value={`${verified}`}
          sub={`Completed · ${awaitingReview} awaiting review · ${overdue} overdue`}
          href="/admin/workout-reviews"
          tone={awaitingReview > 0 ? "warn" : "default"}
        />

        <StatCard
          icon="alert"
          label="Announcements"
          value={`${announcementCount}`}
          sub="Total posted"
          href="/admin/announcements"
        />

        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2 text-paper-faint">
            <Icon name="trophy" width={16} height={16} />
            <p className="eyebrow !text-paper-faint">Upcoming Match</p>
          </div>
          {upcomingMatch ? (
            <>
              <p className="font-display text-lg font-bold text-paper">
                Echelon United <span className="text-paper-faint">vs</span> {upcomingMatch.opponent}
              </p>
              <p className="mt-1 text-sm text-paper-dim">
                {format(upcomingMatch.date, "EEE d MMM")} · {upcomingMatch.venue ?? "Venue TBC"}
              </p>
            </>
          ) : (
            <p className="text-sm text-paper-faint">No upcoming match scheduled.</p>
          )}
          <Link href="/admin/matches" className="mt-3 inline-block text-xs font-semibold text-gold hover:underline">
            Manage matches →
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <p className="eyebrow mb-3">Quick actions</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/players/new" className="btn-primary text-xs">
            <Icon name="plus" width={14} height={14} />
            Add player
          </Link>
          <Link href="/admin/squad" className="btn-secondary text-xs">
            <Icon name="shield" width={14} height={14} />
            Manage squads
          </Link>
          <Link href="/admin/announcements" className="btn-secondary text-xs">
            <Icon name="alert" width={14} height={14} />
            Post announcement
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  href,
  tone = "default",
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  href: string;
  tone?: "default" | "warn";
}) {
  return (
    <Link href={href} className="card block p-5 transition-colors hover:border-gold-deep">
      <div className="mb-3 flex items-center gap-2 text-paper-faint">
        <Icon name={icon} width={16} height={16} />
        <p className="eyebrow !text-paper-faint">{label}</p>
      </div>
      <p
        className={`stat-figure font-display text-3xl font-bold ${
          tone === "warn" ? "text-gold" : "text-paper"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-paper-faint">{sub}</p>
    </Link>
  );
}
