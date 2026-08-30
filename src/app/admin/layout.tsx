import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/nav/admin-sidebar";
import { AdminTopbar } from "@/components/nav/admin-topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // Belt-and-braces: middleware already blocks PLAYER at the edge, but every
  // page under /admin re-checks the role here too, so this layout is safe
  // even if it's ever reached a different way.
  if (session.user.role === "PLAYER") redirect("/dashboard");

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return (
    <div className="flex min-h-screen bg-ink">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar name={session.user.name ?? "Staff"} role={session.user.role} unreadCount={unreadCount} />
        <main id="main-content" tabIndex={-1} className="flex-1 px-4 pb-10 pt-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
