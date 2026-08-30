import { prisma } from "@/lib/prisma";
import { ClubSettingsForm } from "@/components/admin/club-settings-form";

export default async function AdminSettingsPage() {
  const settings = await prisma.clubSettings.upsert({
    where: { id: "club" },
    update: {},
    create: { id: "club" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Settings</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Club settings</h1>
        <p className="mt-1 text-sm text-paper-faint">
          Club-wide info. Visual branding lives in the app's design system and platform roles are fixed,
          so only genuinely club-wide details are editable here.
        </p>
      </div>
      <ClubSettingsForm settings={settings} />
    </div>
  );
}
