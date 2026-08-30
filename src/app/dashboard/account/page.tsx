import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationPreferencesForm } from "@/components/dashboard/notification-preferences-form";
import { ProfileEditForm } from "@/components/dashboard/profile-edit-form";
import { PasswordChangeForm } from "@/components/dashboard/password-change-form";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [user, prefs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true },
    }),
    prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id },
    }),
  ]);
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <p className="eyebrow mb-1">Account</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">{session.user.name}</h1>
        <p className="mt-1 text-sm text-paper-faint">{session.user.email}</p>
      </div>

      <ProfileEditForm initial={{ name: user.name, email: user.email, phone: user.phone ?? "" }} />

      <PasswordChangeForm />

      <NotificationPreferencesForm
        initial={{
          pushEnabled: prefs.pushEnabled,
          announcements: prefs.announcements,
          trainingReminders: prefs.trainingReminders,
          matchReminders: prefs.matchReminders,
          workoutUpdates: prefs.workoutUpdates,
          learningContent: prefs.learningContent,
          polls: prefs.polls,
          paymentReminders: prefs.paymentReminders,
        }}
      />

      <p className="text-xs text-paper-faint">
        Jersey number, position, squad, and player status are staff-controlled — contact a coach or admin for changes
        to those. Account deletion isn't available self-service yet; contact an admin.
      </p>
    </div>
  );
}
