import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { InjuryStatusForm } from "@/components/admin/injury-status-form";

const FEELING_LABEL: Record<string, string> = {
  GREAT: "Great",
  SLIGHTLY_FATIGUED: "Slightly fatigued",
  TIRED: "Tired",
  NOT_WELL: "Not well",
  INJURED: "Injured",
  UNABLE_TO_TRAIN: "Unable to train",
};

const CONCERNING_FEELINGS = ["NOT_WELL", "INJURED", "UNABLE_TO_TRAIN"];

const INJURY_STATUS_COLOR: Record<string, string> = {
  REPORTED: "border-signal-danger/50 text-signal-danger",
  ASSESSING: "border-signal-warn/50 text-signal-warn",
  RECOVERING: "border-signal-warn/50 text-signal-warn",
  CLEARED: "border-signal-success/50 text-signal-success",
};

export default async function AdminWellnessPage() {
  const [activeInjuries, clearedInjuries, recentCheckins] = await Promise.all([
    prisma.injuryReport.findMany({
      where: { status: { not: "CLEARED" } },
      orderBy: [{ painLevel: "desc" }, { createdAt: "desc" }],
      include: { playerProfile: { include: { user: { select: { name: true } } } } },
    }),
    prisma.injuryReport.findMany({
      where: { status: "CLEARED" },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { playerProfile: { include: { user: { select: { name: true } } } } },
    }),
    prisma.wellnessCheckin.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { playerProfile: { include: { user: { select: { name: true } } } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Development</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Wellness</h1>
        <p className="mt-1 text-sm text-paper-faint">
          {activeInjuries.length} open injury report{activeInjuries.length === 1 ? "" : "s"} · {recentCheckins.length} recent check-in{recentCheckins.length === 1 ? "" : "s"}
        </p>
      </div>

      <section className="mb-8">
        <p className="eyebrow mb-3">Active injuries</p>
        {activeInjuries.length === 0 ? (
          <EmptyState icon="heart" text="No open injury reports." hint="Everything's clear across the squad." />
        ) : (
          <div className="space-y-3">
            {activeInjuries.map((r) => (
              <article key={r.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/players/${r.playerProfileId}`} className="font-display text-sm font-bold text-paper hover:text-gold">
                        {r.playerProfile.user.name}
                      </Link>
                      <span className="badge border-line text-paper-faint">{r.bodyArea.replace("_", " ")}</span>
                      <span className="badge border-signal-danger/40 text-signal-danger">Pain {r.painLevel}/10</span>
                    </div>
                    <p className="mt-1 text-xs text-paper-faint">
                      Reported {format(r.createdAt, "d MMM yyyy")} · onset {format(r.onsetDate, "d MMM yyyy")}
                      {r.occurredDuring ? ` · during ${r.occurredDuring}` : ""}
                    </p>
                  </div>
                  <span className={`badge ${INJURY_STATUS_COLOR[r.status]}`}>{r.status}</span>
                </div>
                {r.description && <p className="mt-2 text-sm leading-relaxed text-paper-dim">{r.description}</p>}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-paper-faint">
                  <span>Walk: {r.canWalk ? "Yes" : "No"}</span>
                  <span>Train: {r.canTrain ? "Yes" : "No"}</span>
                  <span>Play: {r.canPlay ? "Yes" : "No"}</span>
                  {r.mediaUrl && (
                    <a href={r.mediaUrl} target="_blank" rel="noreferrer" className="text-gold hover:underline">
                      View attached media
                    </a>
                  )}
                </div>
                <InjuryStatusForm reportId={r.id} currentStatus={r.status} currentNotes={r.coachNotes} />
              </article>
            ))}
          </div>
        )}
      </section>

      {clearedInjuries.length > 0 && (
        <section className="mb-8">
          <p className="eyebrow mb-3">Recently cleared</p>
          <div className="card divide-y divide-line overflow-hidden">
            {clearedInjuries.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-paper">{r.playerProfile.user.name} · {r.bodyArea.replace("_", " ")}</span>
                <span className="text-xs text-paper-faint">Cleared {format(r.updatedAt, "d MMM yyyy")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="eyebrow mb-3">Recent check-ins</p>
        {recentCheckins.length === 0 ? (
          <EmptyState icon="activity" text="No check-ins yet." hint="Players' daily check-ins will appear here." />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-paper-faint">
                  <th className="px-4 py-3 font-medium">Player</th>
                  <th className="px-4 py-3 font-medium">Feeling</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Sleep</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Soreness</th>
                  <th className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {recentCheckins.map((c) => (
                  <tr key={c.id} className={`border-b border-line/60 last:border-0 ${CONCERNING_FEELINGS.includes(c.feeling) ? "bg-signal-danger/5" : ""}`}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/players/${c.playerProfileId}`} className="font-medium text-paper hover:text-gold">
                        {c.playerProfile.user.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={CONCERNING_FEELINGS.includes(c.feeling) ? "text-signal-danger" : "text-paper-dim"}>
                        {FEELING_LABEL[c.feeling]}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-paper-dim sm:table-cell">{c.sleepQuality ?? "—"}/5</td>
                    <td className="hidden px-4 py-3 text-paper-dim sm:table-cell">{c.sorenessLevel ?? "—"}/5</td>
                    <td className="px-4 py-3 text-xs text-paper-faint">{format(c.createdAt, "d MMM, h:mm a")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
