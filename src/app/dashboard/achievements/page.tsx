import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";

export default async function AchievementsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await prisma.playerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      achievements: {
        include: { achievement: true },
        orderBy: { awardedAt: "desc" },
      },
    },
  });
  if (!profile) redirect("/admin");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="eyebrow mb-1">Recognition</p>
        <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Achievements</h1>
        <p className="mt-1 text-sm text-paper-faint">
          Club milestones awarded by your coaching staff, based on your real training and match record.
        </p>
      </div>

      {profile.achievements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-6 py-16 text-center">
          <Icon name="medal" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No achievements yet.</p>
          <p className="mt-1 text-xs text-paper-faint">
            Milestones like full attendance, verified workouts, or first goal will appear here once your coach
            awards them.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {profile.achievements.map((pa) => (
            <div key={pa.id} className="card flex items-start gap-3 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-deep/40 bg-gold/10 text-gold">
                <Icon name={pa.achievement.iconKey ?? "medal"} width={18} height={18} />
              </span>
              <div>
                <p className="font-display text-base font-bold text-paper">{pa.achievement.title}</p>
                {pa.achievement.description && (
                  <p className="mt-0.5 text-sm leading-relaxed text-paper-dim">{pa.achievement.description}</p>
                )}
                <p className="mt-1.5 text-xs text-paper-faint">Awarded {format(pa.awardedAt, "d MMM yyyy")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
