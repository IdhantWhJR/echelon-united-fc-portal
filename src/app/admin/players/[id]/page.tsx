import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { PlayerForm } from "@/components/admin/player-form";
import { PerformanceForm } from "@/components/admin/performance-form";
import { WeightChart } from "@/components/dashboard/weight-chart";
import { DeactivatePlayerButton } from "@/components/admin/deactivate-player-button";

export default async function PlayerDetailPage({ params }: { params: { id: string } }) {
  const [profile, squads] = await Promise.all([
    prisma.playerProfile.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        squad: true,
        weightEntries: { orderBy: { date: "asc" } },
        performanceStats: { orderBy: { createdAt: "desc" } },
        attendanceRecords: true,
        workoutAssignments: {
          include: { workout: true },
          orderBy: { createdAt: "desc" },
          take: 8,
        },
        injuryReports: { orderBy: { createdAt: "desc" }, take: 5 },
        achievements: { include: { achievement: true }, orderBy: { awardedAt: "desc" } },
        payments: { orderBy: { createdAt: "desc" }, take: 8 },
      },
    }),
    prisma.squad.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!profile) notFound();

  const stat = profile.performanceStats[0] ?? null;
  const totalAttendance = profile.attendanceRecords.length;
  const attended = profile.attendanceRecords.filter((a) => a.status === "ATTENDING").length;
  const attendancePct = totalAttendance > 0 ? Math.round((attended / totalAttendance) * 100) : null;

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/players" className="mb-4 inline-flex items-center gap-2 text-xs text-paper-faint hover:text-gold">
        <Icon name="arrowLeft" width={14} height={14} />
        Back to players
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-700 font-display text-lg font-bold text-gold">
            {profile.jerseyNumber ?? "—"}
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-paper">{profile.user.name}</h1>
            <p className="text-sm text-paper-faint">
              {profile.user.email} · {profile.squad?.name ?? "Unassigned"}
            </p>
          </div>
        </div>
        <DeactivatePlayerButton playerId={profile.id} isActive={profile.user.isActive} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section>
            <p className="eyebrow mb-3">Profile</p>
            <PlayerForm
              mode="edit"
              playerId={profile.id}
              squads={squads}
              initial={{
                name: profile.user.name,
                jerseyNumber: profile.jerseyNumber?.toString() ?? "",
                position: profile.position ?? "",
                preferredFoot: profile.preferredFoot ?? "",
                heightCm: profile.heightCm?.toString() ?? "",
                squadId: profile.squadId ?? "",
                status: profile.status,
                bio: profile.bio ?? "",
              }}
            />
          </section>

          <WeightChart
            playerProfileId={profile.id}
            entries={profile.weightEntries.map((e) => ({
              id: e.id,
              weightKg: e.weightKg,
              date: e.date.toISOString(),
              note: e.note,
            }))}
          />

          <section className="card p-5 lg:p-6">
            <p className="eyebrow mb-3">Recent workouts</p>
            {profile.workoutAssignments.length === 0 ? (
              <EmptyRow text="No workouts assigned yet." />
            ) : (
              <ul className="divide-y divide-line">
                {profile.workoutAssignments.map((wa) => (
                  <li key={wa.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-paper">{wa.workout.title}</span>
                    <WorkoutStatusBadge status={wa.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5 lg:p-6">
            <p className="eyebrow mb-3">Injury history</p>
            {profile.injuryReports.length === 0 ? (
              <EmptyRow text="No injury reports on file." />
            ) : (
              <ul className="divide-y divide-line">
                {profile.injuryReports.map((r) => (
                  <li key={r.id} className="py-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-paper">
                        {r.bodyArea.replace("_", " ")} · Pain {r.painLevel}/10
                      </span>
                      <span className="text-xs text-paper-faint">{format(r.onsetDate, "MMM d, yyyy")}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-paper-faint">Status: {r.status}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className="card p-5">
            <p className="eyebrow mb-3">Attendance</p>
            <p className="stat-figure font-display text-3xl font-bold text-paper">
              {attendancePct !== null ? `${attendancePct}%` : "—"}
            </p>
            <p className="mt-1 text-xs text-paper-faint">
              {totalAttendance > 0 ? `${attended} of ${totalAttendance} sessions attended` : "No attendance history yet."}
            </p>
          </section>

          <section className="card p-5">
            <p className="eyebrow mb-3">Performance snapshot</p>
            {stat ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <StatRow label="Matches" value={stat.matchesPlayed} />
                <StatRow label="Goals" value={stat.goals} />
                <StatRow label="Assists" value={stat.assists} />
                <StatRow label="Minutes" value={stat.minutesPlayed} />
                <StatRow label="Fitness" value={stat.fitnessScore ?? "—"} />
                <StatRow label="Coach rating" value={stat.coachRating ?? "—"} />
              </div>
            ) : (
              <EmptyRow text="No performance data entered yet." />
            )}
            <div className="mt-4">
              <PerformanceForm
                playerProfileId={profile.id}
                existingPeriods={profile.performanceStats.map((s) => ({
                  periodLabel: s.periodLabel,
                  matchesPlayed: s.matchesPlayed,
                  starts: s.starts,
                  goals: s.goals,
                  assists: s.assists,
                  minutesPlayed: s.minutesPlayed,
                  cleanSheets: s.cleanSheets,
                  trainingAttendancePct: s.trainingAttendancePct,
                  fitnessScore: s.fitnessScore,
                  coachRating: s.coachRating,
                  notes: s.notes,
                }))}
              />
            </div>
          </section>

          <section className="card p-5">
            <p className="eyebrow mb-3">Achievements</p>
            {profile.achievements.length === 0 ? (
              <EmptyRow text="No achievements awarded yet." />
            ) : (
              <ul className="space-y-2">
                {profile.achievements.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-sm text-paper">
                    <Icon name="medal" width={14} height={14} className="text-gold" />
                    {a.achievement.title}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <p className="eyebrow mb-3">Payments</p>
            {profile.payments.length === 0 ? (
              <EmptyRow text="No payments on record." />
            ) : (
              <ul className="divide-y divide-line">
                {profile.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-paper-dim">{p.label}</span>
                    <span className="font-mono text-paper">£{(p.amountMinor / 100).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-xs text-paper-faint">{label}</p>
      <p className="stat-figure font-semibold text-paper">{value}</p>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="py-2 text-sm text-paper-faint">{text}</p>;
}

function WorkoutStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ASSIGNED: "border-line text-paper-faint",
    IN_PROGRESS: "border-signal-info/40 text-signal-info",
    VIDEO_SUBMITTED: "border-signal-warn/40 text-signal-warn",
    UNDER_REVIEW: "border-signal-warn/40 text-signal-warn",
    VERIFIED: "border-pitch-green/40 text-pitch-green",
    NEEDS_REVISION: "border-signal-danger/40 text-signal-danger",
    OVERDUE: "border-signal-danger/40 text-signal-danger",
  };
  return (
    <span className={`badge ${styles[status] ?? "border-line text-paper-faint"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
