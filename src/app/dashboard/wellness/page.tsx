import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { WellnessCheckinForm } from "@/components/dashboard/wellness-checkin-form";
import { InjuryReportForm } from "@/components/dashboard/injury-report-form";

const FEELING_LABEL: Record<string, string> = {
  GREAT: "Feeling great",
  SLIGHTLY_FATIGUED: "Slightly fatigued",
  TIRED: "Tired",
  NOT_WELL: "Not feeling well",
  INJURED: "Injured",
  UNABLE_TO_TRAIN: "Unable to train",
};

const FEELING_COLOR: Record<string, string> = {
  GREAT: "border-signal-success/50 text-signal-success",
  SLIGHTLY_FATIGUED: "border-line text-paper-dim",
  TIRED: "border-signal-warn/50 text-signal-warn",
  NOT_WELL: "border-signal-warn/50 text-signal-warn",
  INJURED: "border-signal-danger/50 text-signal-danger",
  UNABLE_TO_TRAIN: "border-signal-danger/50 text-signal-danger",
};

const INJURY_STATUS_COLOR: Record<string, string> = {
  REPORTED: "border-signal-danger/50 text-signal-danger",
  ASSESSING: "border-signal-warn/50 text-signal-warn",
  RECOVERING: "border-signal-warn/50 text-signal-warn",
  CLEARED: "border-signal-success/50 text-signal-success",
};

export default async function WellnessPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await prisma.playerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/admin");

  const [checkins, injuryReports] = await Promise.all([
    prisma.wellnessCheckin.findMany({
      where: { playerProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 14,
    }),
    prisma.injuryReport.findMany({
      where: { playerProfileId: profile.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Private to you & your coaches</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Wellness</h1>
        <p className="mt-1 text-sm text-paper-faint">
          Daily check-ins and injury reporting. This information is never shown to teammates.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <WellnessCheckinForm playerProfileId={profile.id} />
        <InjuryReportForm playerProfileId={profile.id} />
      </div>

      <section className="mt-8">
        <p className="eyebrow mb-3">Check-in history</p>
        {checkins.length === 0 ? (
          <EmptyState icon="heart" text="No check-ins yet." hint="Log how you're feeling to start a history." />
        ) : (
          <div className="card divide-y divide-line overflow-hidden">
            {checkins.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <span className={`badge ${FEELING_COLOR[c.feeling]}`}>{FEELING_LABEL[c.feeling]}</span>
                  {c.note && <p className="mt-1.5 text-xs text-paper-faint">{c.note}</p>}
                </div>
                <div className="flex items-center gap-4 text-xs text-paper-faint">
                  {c.sleepQuality != null && <span>Sleep {c.sleepQuality}/5</span>}
                  {c.sorenessLevel != null && <span>Soreness {c.sorenessLevel}/5</span>}
                  <span>{format(c.createdAt, "d MMM, h:mm a")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <p className="eyebrow mb-3">Injury history</p>
        {injuryReports.length === 0 ? (
          <EmptyState icon="alert" text="No injury reports on file." hint="Nothing to report — that's a good thing." />
        ) : (
          <div className="space-y-3">
            {injuryReports.map((r) => (
              <article key={r.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold text-paper">
                      {r.bodyArea.replace("_", " ")}
                    </span>
                    <span className="badge border-line text-paper-faint">Pain {r.painLevel}/10</span>
                  </div>
                  <span className={`badge ${INJURY_STATUS_COLOR[r.status]}`}>{r.status}</span>
                </div>
                <p className="mt-2 text-xs text-paper-faint">
                  Reported {format(r.createdAt, "d MMM yyyy")} · onset {format(r.onsetDate, "d MMM yyyy")}
                  {r.occurredDuring ? ` · during ${r.occurredDuring}` : ""}
                </p>
                {r.description && <p className="mt-2 text-sm leading-relaxed text-paper-dim">{r.description}</p>}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-paper-faint">
                  <span>Walk: {r.canWalk ? "Yes" : "No"}</span>
                  <span>Train: {r.canTrain ? "Yes" : "No"}</span>
                  <span>Play: {r.canPlay ? "Yes" : "No"}</span>
                </div>
                {r.coachNotes && (
                  <div className="mt-3 border-l-2 border-gold-deep pl-3 text-sm leading-relaxed text-paper-dim">
                    <span className="text-paper-faint">Coach notes · </span>
                    {r.coachNotes}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ icon, text, hint }: { icon: string; text: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line py-12 text-center">
      <Icon name={icon} width={20} height={20} className="mb-3 text-paper-faint" />
      <p className="text-sm font-medium text-paper">{text}</p>
      <p className="mt-1 text-xs text-paper-faint">{hint}</p>
    </div>
  );
}
