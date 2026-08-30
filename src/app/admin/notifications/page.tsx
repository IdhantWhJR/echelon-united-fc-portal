import { format } from "date-fns";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";

const TYPE_LABEL: Record<string, string> = {
  ANNOUNCEMENT: "Announcement",
  TRAINING_REMINDER: "Training reminder",
  MATCH_REMINDER: "Match reminder",
  LOCATION_CHANGE: "Location change",
  WORKOUT_ASSIGNED: "Workout assigned",
  WORKOUT_APPROVED: "Workout approved",
  WORKOUT_REVISION: "Workout needs revision",
  LEARNING_CONTENT: "Learning content",
  POLL_AVAILABLE: "Poll available",
  PAYMENT_REMINDER: "Payment reminder",
  GENERAL: "General",
};

// Notifications themselves aren't composed here — they're generated
// automatically wherever a relevant action happens (announcement posted,
// workout assigned/reviewed, injury cleared, etc. — see the notification.create
// / createMany calls throughout the API routes). This page is the staff-facing
// view into what's actually being delivered and how engaged players are with it.
export default async function AdminNotificationsPage() {
  const [totalSent, totalRead, byType, recent, optOuts] = await Promise.all([
    prisma.notification.count(),
    prisma.notification.count({ where: { isRead: true } }),
    prisma.notification.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { user: { select: { name: true, role: true } } },
    }),
    prisma.notificationPreference.count({ where: { pushEnabled: false } }),
  ]);

  const readRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0;
  const typeCounts = [...byType].sort((a, b) => b._count._all - a._count._all);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Communication</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Notifications</h1>
        <p className="mt-1 max-w-xl text-sm text-paper-faint">
          Notifications are generated automatically by club activity — new announcements, workout assignments and
          reviews, injury clearances, and more. This is the delivery and engagement view.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total sent" value={totalSent} />
        <Stat label="Read" value={totalRead} />
        <Stat label="Read rate" value={`${readRate}%`} />
        <Stat label="Push not enabled" value={optOuts} />
      </div>

      <section className="mb-8">
        <p className="eyebrow mb-3">By type</p>
        {typeCounts.length === 0 ? (
          <EmptyState icon="bell" text="No notifications sent yet." hint="They'll appear here as the club uses the platform." />
        ) : (
          <div className="card divide-y divide-line overflow-hidden">
            {typeCounts.map((t) => (
              <div key={t.type} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-paper">{TYPE_LABEL[t.type] ?? t.type}</span>
                <span className="badge border-line text-paper-faint">{t._count._all}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow">Recent deliveries</p>
          <Link href="/admin/settings" className="text-xs font-medium text-paper-faint hover:text-gold">
            Preferences are managed per-player in Account settings →
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState icon="bell" text="Nothing sent yet." hint="Post an announcement or assign a workout to see it here." />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-paper-faint">
                  <th className="px-4 py-3 font-medium">Recipient</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Title</th>
                  <th className="px-4 py-3 font-medium">Sent</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((n) => (
                  <tr key={n.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-paper">{n.user.name}</td>
                    <td className="px-4 py-3 text-paper-dim">{TYPE_LABEL[n.type] ?? n.type}</td>
                    <td className="hidden max-w-xs truncate px-4 py-3 text-paper-dim sm:table-cell">{n.title}</td>
                    <td className="px-4 py-3 text-xs text-paper-faint">{format(n.createdAt, "d MMM, h:mm a")}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${n.isRead ? "border-signal-success/50 text-signal-success" : "border-line text-paper-faint"}`}>
                        {n.isRead ? "Read" : "Unread"}
                      </span>
                    </td>
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <p className="eyebrow mb-1.5">{label}</p>
      <p className="stat-figure text-2xl">{value}</p>
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
