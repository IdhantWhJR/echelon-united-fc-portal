import { prisma } from "@/lib/prisma";

/**
 * Leaderboards are never stored — every board here is computed fresh from
 * the same models the rest of the app already trusts (AttendanceRecord,
 * WorkoutAssignment, PerformanceStat, MatchAppearance). There is nothing to
 * fake: if a player has no data yet, they simply don't rank.
 *
 * Wellness/injury data is intentionally never touched by this file — no
 * leaderboard is allowed to expose it, per the spec.
 */

export type LeaderboardKey =
  | "ATTENDANCE"
  | "WORKOUTS_COMPLETED"
  | "GOALS"
  | "ASSISTS"
  | "MATCH_APPEARANCES"
  | "FITNESS_SCORE";

export type LeaderboardRow = {
  playerProfileId: string;
  name: string;
  jerseyNumber: number | null;
  squadName: string | null;
  value: number;
  display: string;
};

export type LeaderboardBoard = {
  key: LeaderboardKey;
  label: string;
  unit: string;
  description: string;
  available: boolean;
  unavailableReason?: string;
  rows: LeaderboardRow[];
};

export const LEADERBOARD_META: Record<LeaderboardKey, { label: string; unit: string; description: string }> = {
  ATTENDANCE: {
    label: "Training Attendance",
    unit: "%",
    description: "Share of responded sessions marked Attending, all-time.",
  },
  WORKOUTS_COMPLETED: {
    label: "Workouts Completed",
    unit: "verified",
    description: "Workouts marked Verified by a coach after video review.",
  },
  GOALS: {
    label: "Goals",
    unit: "goals",
    description: "Goals scored across recorded match appearances.",
  },
  ASSISTS: {
    label: "Assists",
    unit: "assists",
    description: "Assists recorded across recorded match appearances.",
  },
  MATCH_APPEARANCES: {
    label: "Match Appearances",
    unit: "apps",
    description: "Matches where the player was a starter or substitute who played.",
  },
  FITNESS_SCORE: {
    label: "Fitness Score",
    unit: "score",
    description: "Most recent coach-entered fitness score (0–100).",
  },
};

const TOP_N = 15;

function playerLabel(p: { user: { name: string }; jerseyNumber: number | null; squad: { name: string } | null }) {
  return { name: p.user.name, jerseyNumber: p.jerseyNumber, squadName: p.squad?.name ?? null };
}

/** Fetches admin-configured visibility for every board, defaulting to visible for any key without a row yet. */
export async function getLeaderboardVisibility(): Promise<Record<LeaderboardKey, boolean>> {
  const rows = await prisma.leaderboardSetting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.visible])) as Partial<Record<LeaderboardKey, boolean>>;
  const keys = Object.keys(LEADERBOARD_META) as LeaderboardKey[];
  return Object.fromEntries(keys.map((k) => [k, map[k] ?? true])) as Record<LeaderboardKey, boolean>;
}

/**
 * Computes every board. `onlyVisible` restricts to boards the admin has
 * enabled — used on the player-facing page. Admin pages pass `false` to see
 * everything regardless of visibility, since they're the ones controlling it.
 */
export async function computeLeaderboards(onlyVisible: boolean): Promise<LeaderboardBoard[]> {
  const visibility = await getLeaderboardVisibility();

  const activePlayers = await prisma.playerProfile.findMany({
    where: { user: { isActive: true } },
    include: { user: { select: { name: true } }, squad: { select: { name: true } } },
  });
  const playerMeta = new Map(activePlayers.map((p) => [p.id, playerLabel(p)]));

  const boards: LeaderboardBoard[] = [];

  // ---- Attendance % ----
  if (!onlyVisible || visibility.ATTENDANCE) {
    const records = await prisma.attendanceRecord.findMany({
      where: { playerProfileId: { in: activePlayers.map((p) => p.id) }, status: { not: "PENDING" } },
      select: { playerProfileId: true, status: true },
    });
    const totals = new Map<string, { attended: number; total: number }>();
    for (const r of records) {
      const cur = totals.get(r.playerProfileId) ?? { attended: 0, total: 0 };
      cur.total += 1;
      if (r.status === "ATTENDING") cur.attended += 1;
      totals.set(r.playerProfileId, cur);
    }
    const rows = rankRows(
      [...totals.entries()].map(([playerProfileId, { attended, total }]) => ({
        playerProfileId,
        value: total > 0 ? Math.round((attended / total) * 100) : 0,
      })),
      playerMeta,
      (v) => `${v}%`
    );
    boards.push(boardFor("ATTENDANCE", rows));
  }

  // ---- Workouts completed (VERIFIED) ----
  if (!onlyVisible || visibility.WORKOUTS_COMPLETED) {
    const verified = await prisma.workoutAssignment.groupBy({
      by: ["playerProfileId"],
      where: { playerProfileId: { in: activePlayers.map((p) => p.id) }, status: "VERIFIED" },
      _count: { _all: true },
    });
    const rows = rankRows(
      verified.map((v) => ({ playerProfileId: v.playerProfileId, value: v._count._all })),
      playerMeta,
      (v) => `${v}`
    );
    boards.push(boardFor("WORKOUTS_COMPLETED", rows));
  }

  // ---- Goals / Assists / Match appearances (from MatchAppearance) ----
  const appearances = await prisma.matchAppearance.findMany({
    where: { playerProfileId: { in: activePlayers.map((p) => p.id) } },
    select: { playerProfileId: true, goals: true, assists: true, role: true, minutesPlayed: true },
  });

  if (!onlyVisible || visibility.GOALS) {
    const totals = new Map<string, number>();
    for (const a of appearances) totals.set(a.playerProfileId, (totals.get(a.playerProfileId) ?? 0) + a.goals);
    const rows = rankRows(
      [...totals.entries()].map(([playerProfileId, value]) => ({ playerProfileId, value })),
      playerMeta,
      (v) => `${v}`
    );
    boards.push(boardFor("GOALS", rows));
  }

  if (!onlyVisible || visibility.ASSISTS) {
    const totals = new Map<string, number>();
    for (const a of appearances) totals.set(a.playerProfileId, (totals.get(a.playerProfileId) ?? 0) + a.assists);
    const rows = rankRows(
      [...totals.entries()].map(([playerProfileId, value]) => ({ playerProfileId, value })),
      playerMeta,
      (v) => `${v}`
    );
    boards.push(boardFor("ASSISTS", rows));
  }

  if (!onlyVisible || visibility.MATCH_APPEARANCES) {
    const totals = new Map<string, number>();
    for (const a of appearances) {
      if (a.role === "STARTER" || (a.role === "SUBSTITUTE" && a.minutesPlayed > 0)) {
        totals.set(a.playerProfileId, (totals.get(a.playerProfileId) ?? 0) + 1);
      }
    }
    const rows = rankRows(
      [...totals.entries()].map(([playerProfileId, value]) => ({ playerProfileId, value })),
      playerMeta,
      (v) => `${v}`
    );
    boards.push(boardFor("MATCH_APPEARANCES", rows));
  }

  // ---- Fitness score (most recent PerformanceStat per player) ----
  if (!onlyVisible || visibility.FITNESS_SCORE) {
    const stats = await prisma.performanceStat.findMany({
      where: { playerProfileId: { in: activePlayers.map((p) => p.id) }, fitnessScore: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { playerProfileId: true, fitnessScore: true, createdAt: true },
    });
    const latest = new Map<string, number>();
    for (const s of stats) {
      if (!latest.has(s.playerProfileId) && s.fitnessScore != null) latest.set(s.playerProfileId, s.fitnessScore);
    }
    const rows = rankRows(
      [...latest.entries()].map(([playerProfileId, value]) => ({ playerProfileId, value })),
      playerMeta,
      (v) => `${v.toFixed(0)}`
    );
    boards.push(boardFor("FITNESS_SCORE", rows));
  }

  // Preserve a stable, spec-ordered sequence regardless of which visibility branches ran.
  const order: LeaderboardKey[] = [
    "ATTENDANCE",
    "WORKOUTS_COMPLETED",
    "GOALS",
    "ASSISTS",
    "MATCH_APPEARANCES",
    "FITNESS_SCORE",
  ];
  return order.map((k) => boards.find((b) => b.key === k)).filter(Boolean) as LeaderboardBoard[];
}

function boardFor(key: LeaderboardKey, rows: LeaderboardRow[]): LeaderboardBoard {
  return { key, ...LEADERBOARD_META[key], available: true, rows };
}

function rankRows(
  entries: { playerProfileId: string; value: number }[],
  meta: Map<string, { name: string; jerseyNumber: number | null; squadName: string | null }>,
  display: (v: number) => string
): LeaderboardRow[] {
  return entries
    .filter((e) => e.value > 0 && meta.has(e.playerProfileId))
    .sort((a, b) => b.value - a.value)
    .slice(0, TOP_N)
    .map((e) => {
      const m = meta.get(e.playerProfileId)!;
      return {
        playerProfileId: e.playerProfileId,
        name: m.name,
        jerseyNumber: m.jerseyNumber,
        squadName: m.squadName,
        value: e.value,
        display: display(e.value),
      };
    });
}
