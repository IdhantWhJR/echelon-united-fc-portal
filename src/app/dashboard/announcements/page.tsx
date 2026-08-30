import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";

const CATEGORY_STYLES: Record<string, string> = {
  URGENT: "border-signal-danger/40 text-signal-danger bg-signal-danger/10",
  IMPORTANT: "border-gold-deep/50 text-gold bg-gold/10",
  MATCH: "border-signal-info/40 text-signal-info bg-signal-info/10",
  TRAINING: "border-signal-warn/40 text-signal-warn bg-signal-warn/10",
  GENERAL: "border-line text-paper-dim bg-ink-700",
};

export default async function AnnouncementsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await prisma.playerProfile.findUnique({
    where: { userId: session.user.id },
    select: { squadId: true },
  });
  if (!profile) redirect("/admin");

  const announcements = await prisma.announcement.findMany({
    where: {
      OR: [{ targetType: "EVERYONE" }, { targetType: "SQUAD", squadId: profile.squadId ?? undefined }],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 50,
    include: { author: { select: { name: true } }, squad: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Club</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Announcements</h1>
        <p className="mt-1 text-sm text-paper-faint">
          {announcements.length} announcement{announcements.length === 1 ? "" : "s"} from the club and your squad.
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-6 py-16 text-center">
          <Icon name="alert" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No announcements yet.</p>
          <p className="mt-1 text-xs text-paper-faint">Club updates will appear here as soon as they're posted.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <article key={a.id} className="card p-4">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`badge ${CATEGORY_STYLES[a.category] ?? CATEGORY_STYLES.GENERAL}`}>{a.category}</span>
                  {a.squad && <span className="badge border-line text-paper-faint">{a.squad.name}</span>}
                </div>
                <span className="text-[11px] text-paper-faint">
                  {formatDistanceToNow(a.createdAt, { addSuffix: true })}
                </span>
              </div>
              <p className="font-display text-base font-bold text-paper">{a.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-paper-dim">{a.message}</p>
              {a.attachmentUrl && (
                <a href={a.attachmentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-gold hover:underline">
                  View attachment
                </a>
              )}
              <p className="mt-3 text-xs text-paper-faint">From {a.author.name}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
