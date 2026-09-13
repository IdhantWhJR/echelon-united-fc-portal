import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationList } from "@/components/dashboard/notification-list";

// This is deliberately separate from /admin/notifications, which is the
// club-wide delivery/engagement dashboard for staff to review. This page is
// the personal inbox for the signed-in staff member's own notifications
// (e.g. "New injury report submitted", "Workout video submitted for review") —
// same underlying data and API as the player-facing notification center at
// /dashboard/notifications, just rendered inside the admin shell so staff
// don't have to leave it.
export default async function AdminMyNotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Your notifications</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Notifications</h1>
        <p className="mt-1 text-sm text-paper-faint">
          Things that need your attention — new injury reports, workout submissions, and more.
        </p>
      </div>

      <NotificationList
        notifications={notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          link: n.link,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
