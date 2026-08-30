import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { AnnouncementFormToggle } from "@/components/admin/announcement-form-toggle";
import { DeleteAnnouncementButton } from "@/components/admin/delete-announcement-button";

const CATEGORY_STYLES: Record<string, string> = {
  URGENT: "border-signal-danger/40 text-signal-danger bg-signal-danger/10",
  IMPORTANT: "border-gold-deep/50 text-gold bg-gold/10",
  MATCH: "border-signal-info/40 text-signal-info bg-signal-info/10",
  TRAINING: "border-signal-warn/40 text-signal-warn bg-signal-warn/10",
  GENERAL: "border-line text-paper-dim bg-ink-700",
};

export default async function AdminAnnouncementsPage() {
  const [announcements, squads, players] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 50,
      include: { author: { select: { name: true } }, squad: { select: { name: true } } },
    }),
    prisma.squad.findMany({ orderBy: { name: "asc" } }),
    prisma.playerProfile.findMany({
      where: { status: { not: "INACTIVE" }, user: { isActive: true } },
      orderBy: [{ jerseyNumber: "asc" }, { user: { name: "asc" } }],
      include: { user: { select: { name: true } }, squad: { select: { name: true } } },
    }),
  ]);

  const playerOptions = players.map((p) => ({
    id: p.id,
    name: p.user.name,
    squadName: p.squad?.name ?? null,
    jerseyNumber: p.jerseyNumber,
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-1">Communication</p>
          <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Announcements</h1>
          <p className="mt-1 text-sm text-paper-faint">
            {announcements.length} posted · every announcement appears on the club-wide feed and, unless a player
            has opted out, sends them a notification.
          </p>
        </div>
        <AnnouncementFormToggle squads={squads.map((s) => ({ id: s.id, name: s.name }))} players={playerOptions} />
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-6 py-16 text-center">
          <Icon name="alert" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No announcements posted yet.</p>
          <p className="mt-1 text-xs text-paper-faint">Post the first one — it will show up on every player's dashboard.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <article key={a.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className={`badge ${CATEGORY_STYLES[a.category] ?? CATEGORY_STYLES.GENERAL}`}>{a.category}</span>
                    {a.squad && <span className="badge border-line text-paper-faint">{a.squad.name} only</span>}
                    {a.priority > 0 && <span className="badge border-gold-deep/50 text-gold">Priority {a.priority}</span>}
                  </div>
                  <p className="font-display text-base font-bold text-paper">{a.title}</p>
                </div>
                <DeleteAnnouncementButton announcementId={a.id} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-paper-dim">{a.message}</p>
              {a.attachmentUrl && (
                <a href={a.attachmentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-gold hover:underline">
                  View attachment
                </a>
              )}
              <p className="mt-3 text-xs text-paper-faint">
                By {a.author.name} · {format(a.createdAt, "d MMM yyyy, h:mm a")}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
