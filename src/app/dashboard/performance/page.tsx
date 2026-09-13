import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { PerformanceTrendChart } from "@/components/dashboard/performance-trend-chart";

export default async function PlayerPerformancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await prisma.playerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/admin");

  const [stats, attendanceRecords] = await Promise.all([
    prisma.performanceStat.findMany({
      where: { playerProfileId: profile.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.attendanceRecord.findMany({
      where: { playerProfileId: profile.id },
    }),
  ]);

  const latest = stats[0] ?? null;
  const totalAttendance = attendanceRecords.length;
  const attended = attendanceRecords.filter((a) => a.status === "ATTENDING").length;
  const attendancePct = totalAttendance > 0 ? Math.round((attended / totalAttendance) * 100) : null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Player development</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Performance</h1>
        <p className="mt-1 text-sm text-paper-faint">
          Entered and updated by your coaching staff. You can view this at any time, but only staff can change it.
        </p>
      </div>

      {!latest ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line py-16 text-center">
          <Icon name="trending" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No performance data yet.</p>
          <p className="mt-1 text-xs text-paper-faint">Your coach will update this after your first matches or assessments.</p>
        </div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Metric label="Matches" value={latest.matchesPlayed} />
            <Metric label="Starts" value={latest.starts} />
            <Metric label="Goals" value={latest.goals} highlight />
            <Metric label="Assists" value={latest.assists} highlight />
            <Metric label="Minutes" value={latest.minutesPlayed} />
            <Metric label="Clean sheets" value={latest.cleanSheets} />
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric label="Fitness score" value={latest.fitnessScore ?? "—"} suffix={latest.fitnessScore != null ? "/100" : undefined} />
            <Metric label="Coach rating" value={latest.coachRating ?? "—"} suffix={latest.coachRating != null ? "/10" : undefined} />
            <Metric label="Attendance" value={attendancePct !== null ? attendancePct : "—"} suffix={attendancePct !== null ? "%" : undefined} />
          </div>

          {latest.notes && (
            <div className="mb-6 border-l-2 border-gold-deep pl-3 text-sm leading-relaxed text-paper-dim">
              <span className="text-paper-faint">Coach notes · </span>
              {latest.notes}
            </div>
          )}

          {stats.length > 1 && (
            <section className="card mb-6 p-5 lg:p-6">
              <p className="eyebrow mb-3">Trend across periods</p>
              <PerformanceTrendChart stats={stats} />
            </section>
          )}

          <section>
            <p className="eyebrow mb-3">By period</p>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-paper-faint">
                    <th className="px-4 py-3 font-medium">Period</th>
                    <th className="px-4 py-3 font-medium">Matches</th>
                    <th className="px-4 py-3 font-medium">Goals</th>
                    <th className="px-4 py-3 font-medium">Assists</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Minutes</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Fitness</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => (
                    <tr key={s.id} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-3 font-medium text-paper">{s.periodLabel}</td>
                      <td className="px-4 py-3 text-paper-dim">{s.matchesPlayed}</td>
                      <td className="px-4 py-3 text-paper-dim">{s.goals}</td>
                      <td className="px-4 py-3 text-paper-dim">{s.assists}</td>
                      <td className="hidden px-4 py-3 text-paper-dim sm:table-cell">{s.minutesPlayed}</td>
                      <td className="hidden px-4 py-3 text-paper-dim sm:table-cell">{s.fitnessScore ?? "—"}</td>
                      <td className="hidden px-4 py-3 text-paper-dim sm:table-cell">{s.coachRating ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, suffix, highlight }: { label: string; value: string | number; suffix?: string; highlight?: boolean }) {
  return (
    <div className="rounded-md border border-line bg-ink-900 p-3">
      <p className="text-[11px] uppercase tracking-wide text-paper-faint">{label}</p>
      <p className={`stat-figure mt-1 text-xl font-bold ${highlight ? "text-gold" : "text-paper"}`}>
        {value}
        {suffix && <span className="text-xs font-normal text-paper-faint">{suffix}</span>}
      </p>
    </div>
  );
}
