import { prisma } from "@/lib/prisma";

/**
 * Auto-detection, not auto-awarding: this file only tells an admin who
 * already qualifies for a milestone, based on real data, so they can review
 * and award with one click from /admin/achievements. Nothing here writes to
 * the database — awarding always goes through the explicit
 * POST /api/admin/achievements/[id]/award endpoint, which is a deliberate
 * staff action every time, not a background job silently granting
 * achievements. This keeps the "who gets credit and when" decision with a
 * human, while still saving them from manually checking every player's
 * stats by hand.
 *
 * Rule titles are matched by exact Achievement.title, so this only proposes
 * an award when the admin has actually created a matching-titled
 * achievement (see ACHIEVEMENT_RULES below and the seed-suggested titles
 * shown on /admin/achievements). If no achievement with that title exists
 * yet, the rule is silently skipped — nothing is invented.
 */

type RuleCheck = {
  title: string;
  hint: string;
  qualifies: (stats: PlayerStatBundle) => boolean;
};

export type PlayerStatBundle = {
  playerProfileId: string;
  name: string;
  attendancePct: number | null;
  verifiedWorkouts: number;
  goals: number;
  assists: number;
  matchAppearances: number;
};

export const ACHIEVEMENT_RULES: RuleCheck[] = [
  { title: "100% Training Attendance", hint: "Every responded session marked Attending", qualifies: (s) => s.attendancePct === 100 },
  { title: "10 Workouts Completed", hint: "10+ coach-verified workouts", qualifies: (s) => s.verifiedWorkouts >= 10 },
  { title: "25 Workouts Completed", hint: "25+ coach-verified workouts", qualifies: (s) => s.verifiedWorkouts >= 25 },
  { title: "First Goal", hint: "At least 1 goal on record", qualifies: (s) => s.goals >= 1 },
  { title: "10 Goals", hint: "10+ goals on record", qualifies: (s) => s.goals >= 10 },
  { title: "10 Assists", hint: "10+ assists on record", qualifies: (s) => s.assists >= 10 },
  { title: "10 Matches", hint: "10+ match appearances", qualifies: (s) => s.matchAppearances >= 10 },
];

export async function computePlayerStatBundles(): Promise<PlayerStatBundle[]> {
  const players = await prisma.playerProfile.findMany({
    where: { user: { isActive: true } },
    include: {
      user: { select: { name: true } },
      attendanceRecords: { select: { status: true } },
      workoutAssignments: { select: { status: true } },
      matchAppearances: { select: { goals: true, assists: true, role: true, minutesPlayed: true } },
    },
  });

  return players.map((p) => {
    const responded = p.attendanceRecords.filter((a) => a.status !== "PENDING");
    const attended = responded.filter((a) => a.status === "ATTENDING");
    const attendancePct = responded.length > 0 ? Math.round((attended.length / responded.length) * 100) : null;
    const verifiedWorkouts = p.workoutAssignments.filter((w) => w.status === "VERIFIED").length;
    const goals = p.matchAppearances.reduce((sum, a) => sum + a.goals, 0);
    const assists = p.matchAppearances.reduce((sum, a) => sum + a.assists, 0);
    const matchAppearances = p.matchAppearances.filter(
      (a) => a.role === "STARTER" || (a.role === "SUBSTITUTE" && a.minutesPlayed > 0)
    ).length;

    return { playerProfileId: p.id, name: p.user.name, attendancePct, verifiedWorkouts, goals, assists, matchAppearances };
  });
}

export type SuggestedAward = {
  achievementId: string;
  achievementTitle: string;
  playerProfileId: string;
  playerName: string;
};

/** Cross-references live achievements + live stats + existing awards to find who's newly eligible. */
export async function computeSuggestedAwards(): Promise<SuggestedAward[]> {
  const [achievements, statBundles, existingAwards] = await Promise.all([
    prisma.achievement.findMany({ select: { id: true, title: true } }),
    computePlayerStatBundles(),
    prisma.playerAchievement.findMany({ select: { achievementId: true, playerProfileId: true } }),
  ]);

  const awardedSet = new Set(existingAwards.map((a) => `${a.achievementId}:${a.playerProfileId}`));
  const achievementByTitle = new Map(achievements.map((a) => [a.title, a]));

  const suggestions: SuggestedAward[] = [];
  for (const rule of ACHIEVEMENT_RULES) {
    const achievement = achievementByTitle.get(rule.title);
    if (!achievement) continue; // admin hasn't created this milestone yet — nothing to suggest
    for (const stats of statBundles) {
      if (!rule.qualifies(stats)) continue;
      if (awardedSet.has(`${achievement.id}:${stats.playerProfileId}`)) continue;
      suggestions.push({
        achievementId: achievement.id,
        achievementTitle: achievement.title,
        playerProfileId: stats.playerProfileId,
        playerName: stats.name,
      });
    }
  }
  return suggestions;
}
