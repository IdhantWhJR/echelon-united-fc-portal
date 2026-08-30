import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationList } from "@/components/dashboard/notification-list";

export default async function NotificationsPage() {
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
        <p className="eyebrow mb-1">Notification Center</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Notifications</h1>
        <p className="mt-1 text-sm text-paper-faint">
          Everything the club has sent you — tap one to mark it read and jump to it.
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
