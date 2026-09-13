import { prisma } from "@/lib/prisma";
import { Icon } from "@/components/icons";
import { AchievementFormToggle } from "@/components/admin/achievement-form-toggle";
import { AchievementList } from "@/components/admin/achievement-list";
import { computeSuggestedAwards, ACHIEVEMENT_RULES } from "@/lib/achievement-rules";

export default async function AdminAchievementsPage() {
  const [achievements, players, suggestions] = await Promise.all([
    prisma.achievement.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { awarded: true } } },
    }),
    prisma.playerProfile.findMany({
      where: { user: { isActive: true } },
      orderBy: [{ jerseyNumber: "asc" }, { user: { name: "asc" } }],
      include: { user: { select: { name: true } }, squad: { select: { name: true } } },
    }),
    computeSuggestedAwards(),
  ]);

  const playerOptions = players.map((p) => ({
    id: p.id,
    name: p.user.name,
    jerseyNumber: p.jerseyNumber,
    squadName: p.squad?.name ?? null,
  }));

  const suggestionsByAchievement: Record<string, string[]> = {};
  for (const s of suggestions) {
    suggestionsByAchievement[s.achievementId] = [...(suggestionsByAchievement[s.achievementId] ?? []), s.playerProfileId];
  }

  const achievementList = achievements.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    iconKey: a.iconKey,
    awardedCount: a._count.awarded,
  }));

  const existingTitles = new Set(achievements.map((a) => a.title));
  const missingRuleTitles = ACHIEVEMENT_RULES.map((r) => r.title).filter((t) => !existingTitles.has(t));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-1">Recognition</p>
          <h1 className="font-display text-2xl font-bold text-paper lg:text-3xl">Achievements</h1>
          <p className="mt-1 text-sm text-paper-faint">
            {achievements.length} milestone{achievements.length === 1 ? "" : "s"} defined. Professional club
            recognition, awarded by a coach or admin — never self-claimed by a player.
          </p>
        </div>
        <AchievementFormToggle />
      </div>

      {suggestions.length > 0 && (
        <div className="mb-6 rounded-lg border border-gold-deep/40 bg-gold/5 p-4">
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-gold">
            <Icon name="trending" width={15} height={15} />
            {suggestions.length} player{suggestions.length === 1 ? "" : "s"} newly qualify for an achievement
          </p>
          <p className="text-xs leading-relaxed text-paper-faint">
            Detected automatically from real attendance, workout, and match data — nothing is awarded until you
            confirm it from the "Award" button on the matching achievement below.
          </p>
        </div>
      )}

      {missingRuleTitles.length > 0 && (
        <div className="mb-6 rounded-lg border border-dashed border-line p-4">
          <p className="mb-1 text-xs font-semibold text-paper-dim">Suggested milestones you haven't created yet</p>
          <p className="mb-2 text-xs text-paper-faint">
            Create an achievement with one of these exact titles to enable automatic eligibility detection for it:
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {missingRuleTitles.map((t) => (
              <li key={t} className="badge border-line text-paper-faint">{t}</li>
            ))}
          </ul>
        </div>
      )}

      {achievements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-6 py-16 text-center">
          <Icon name="medal" width={22} height={22} className="mb-3 text-paper-faint" />
          <p className="text-sm font-medium text-paper">No achievements defined yet.</p>
          <p className="mt-1 text-xs text-paper-faint">
            Create your first milestone, e.g. "First Goal" or "100% Training Attendance".
          </p>
        </div>
      ) : (
        <AchievementList achievements={achievementList} players={playerOptions} suggestionsByAchievement={suggestionsByAchievement} />
      )}
    </div>
  );
}
