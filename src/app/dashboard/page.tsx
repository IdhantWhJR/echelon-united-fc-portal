import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { startOfDay, endOfDay, format } from "date-fns";

import { WelcomeHeader } from "@/components/dashboard/welcome-header";
import { TodaysPlan, PlanItem } from "@/components/dashboard/todays-plan";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { WeightChart } from "@/components/dashboard/weight-chart";
import { CustomMetricsChart } from "@/components/dashboard/custom-metrics-chart";
import { AttendanceSummaryCard } from "@/components/dashboard/attendance-summary-card";
import { PerformanceSnapshot } from "@/components/dashboard/performance-snapshot";
import { AnnouncementsPreview } from "@/components/dashboard/announcements-preview";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      playerProfile: {
        include: {
          squad: true,
          weightEntries: { orderBy: { date: "asc" } },
          customMetricEntries: { orderBy: { date: "asc" } },
          performanceStats: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  // A staff account (coach/admin) landing here by mistake is sent to their own panel.
  if (!user?.playerProfile) redirect("/admin");

  const profile = user.playerProfile;
  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);

  // Same counting logic as the admin attendance page's per-player schedule
  // route: every Event the player is eligible for (club-wide, their squad,
  // or individually assigned) plus every WorkoutAssignment, each workout
  // counting as one "event". ATTENDING / VERIFIED = present.
  const [allEvents, allWorkoutAssignments, todaysEvents, todaysWorkouts, announcements] = await Promise.all([
    prisma.event.findMany({
      where: {
        OR: [
          { squadId: null },
          { squadId: profile.squadId ?? undefined },
          { assignments: { some: { playerProfileId: profile.id } } },
        ],
      },
      include: {
        attendanceRecords: { where: { playerProfileId: profile.id }, select: { status: true } },
      },
    }),
    prisma.workoutAssignment.findMany({
      where: { playerProfileId: profile.id },
      select: { status: true },
    }),
    prisma.event.findMany({
      where: {
        date: { gte: dayStart, lte: dayEnd },
        OR: [
          { squadId: null }, // club-wide events
          { squadId: profile.squadId ?? undefined },
          { assignments: { some: { playerProfileId: profile.id } } },
        ],
      },
      orderBy: { startTime: "asc" },
      include: { match: true },
    }),
    prisma.workoutAssignment.findMany({
      where: {
        playerProfileId: profile.id,
        workout: { deadline: { gte: dayStart, lte: dayEnd } },
        status: { notIn: ["VERIFIED"] },
      },
      include: { workout: true },
    }),
    prisma.announcement.findMany({
      where: {
        OR: [
          { targetType: "EVERYONE" },
          { targetType: "SQUAD", squadId: profile.squadId ?? undefined },
        ],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
  ]);

  const planItems: PlanItem[] = [
    ...todaysEvents.map((e) => ({
      id: e.id,
      kind: e.type,
      title: e.match ? `vs ${e.match.opponent}` : e.title,
      subtitle: e.location ?? undefined,
      time: format(e.startTime, "h:mm a"),
    })),
    ...todaysWorkouts.map((w) => ({
      id: w.id,
      kind: "WORKOUT" as const,
      title: w.workout.title,
      subtitle: "Assigned workout — due today",
    })),
  ];

  const eventsTotal = allEvents.length;
  const eventsPresent = allEvents.filter((e) => e.attendanceRecords[0]?.status === "ATTENDING").length;
  const workoutsTotal = allWorkoutAssignments.length;
  const workoutsPresent = allWorkoutAssignments.filter((w) => w.status === "VERIFIED").length;
  const attendanceTotal = eventsTotal + workoutsTotal;
  const presentRate =
    attendanceTotal > 0 ? Math.round(((eventsPresent + workoutsPresent) / attendanceTotal) * 100) : null;

  const firstName = user.name.split(" ")[0];
  const summary =
    planItems.length > 0
      ? `You have ${planItems.length} thing${planItems.length > 1 ? "s" : ""} lined up today.`
      : "Nothing scheduled today — a good day to recover.";

  return (
    <div className="mx-auto max-w-6xl">
      <WelcomeHeader firstName={firstName} summary={summary} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <TodaysPlan items={planItems} today={today} />
          <WeightChart
            playerProfileId={profile.id}
            entries={profile.weightEntries.map((e) => ({
              id: e.id,
              weightKg: e.weightKg,
              date: e.date.toISOString(),
              note: e.note,
            }))}
          />
          <CustomMetricsChart
            playerProfileId={profile.id}
            entries={profile.customMetricEntries.map((e) => ({
              id: e.id,
              metricName: e.metricName,
              unit: e.unit,
              value: e.value,
              date: e.date.toISOString(),
              note: e.note,
            }))}
          />
          <PerformanceSnapshot stat={profile.performanceStats[0] ?? null} />
        </div>

        <div className="space-y-5">
          <AttendanceSummaryCard
            presentRate={presentRate}
            eventsPresent={eventsPresent}
            eventsTotal={eventsTotal}
            workoutsPresent={workoutsPresent}
            workoutsTotal={workoutsTotal}
          />
          <ProfileCard
            name={user.name}
            jerseyNumber={profile.jerseyNumber}
            position={profile.position}
            preferredFoot={profile.preferredFoot}
            heightCm={profile.heightCm}
            weightKg={profile.weightEntries.at(-1)?.weightKg ?? null}
            squadName={profile.squad?.name ?? null}
            status={profile.status}
          />
          <AnnouncementsPreview
            announcements={announcements.map((a) => ({
              id: a.id,
              title: a.title,
              message: a.message,
              category: a.category,
              createdAt: a.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
