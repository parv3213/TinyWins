export type TreePhase = "seed" | "sprout" | "sapling" | "young-tree" | "mature-tree";

const XP_PER_LEVEL_BASE = 100;
const XP_PER_LEVEL_STEP = 25;

/** XP to go from level 1 → 2 (seed → sprout). Lower than later levels so new users see growth sooner. */
export const XP_TO_LEAVE_SEED_LEVEL = 60;

/** Matches `finalizeDayWithHealth` base XP: `round(8 + quality * 16)`. */
export const TREE_XP_GAIN_MIN = 8;
export const TREE_XP_GAIN_MAX = 24;

export const STREAK_XP_MULTIPLIER_STEP = 0.05;
export const STREAK_XP_MULTIPLIER_CAP = 0.4;

/**
 * Total lifetime XP earned → current tree level (same bucket rules as Firestore progression).
 */
export function getTreeLevelFromLifetimeXp(totalXp: number): number {
    const safeXp = Number.isFinite(totalXp) ? Math.max(0, Math.floor(totalXp)) : 0;
    let level = 1;
    let remaining = safeXp;
    while (remaining >= getXpToNextLevel(level)) {
        remaining -= getXpToNextLevel(level);
        level += 1;
        if (level > 999) break;
    }
    return level;
}

/** @deprecated Prefer getTreeLevelFromLifetimeXp — kept for call sites that pass lifetime totals. */
export function getTreeLevelFromXp(xp: number): number {
    return getTreeLevelFromLifetimeXp(xp);
}

export function getXpToNextLevel(level: number): number {
    const safeLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
    if (safeLevel === 1) return XP_TO_LEAVE_SEED_LEVEL;
    return XP_PER_LEVEL_BASE + Math.max(0, safeLevel - 1) * XP_PER_LEVEL_STEP;
}

/** Cumulative lifetime XP required to *start* at `targetLevel` (level 1 starts at 0). */
export function getCumulativeXpToReachTreeLevel(targetLevel: number): number {
    const safeTarget = Number.isFinite(targetLevel) ? Math.max(1, Math.floor(targetLevel)) : 1;
    let sum = 0;
    for (let L = 1; L < safeTarget; L++) {
        sum += getXpToNextLevel(L);
    }
    return sum;
}

/**
 * Rough calendar-day range to reach mature tree (level 5), from habits.ts XP formula and streak cap.
 * Actual pace depends on daily completion quality and streak.
 */
export function getEstimatedDaysToMatureTreeRange(): { minDays: number; maxDays: number } {
    const totalXp = getCumulativeXpToReachTreeLevel(5);
    const maxMult = 1 + STREAK_XP_MULTIPLIER_CAP;
    const minDays = Math.ceil(totalXp / (TREE_XP_GAIN_MAX * maxMult));
    const maxDays = Math.ceil(totalXp / TREE_XP_GAIN_MIN);
    return { minDays, maxDays };
}

/**
 * Rolls extra XP into higher levels when thresholds change or legacy data is over-cap.
 */
export function normalizeTreeLevelAndXp(treeLevel: number, treeXp: number): { treeLevel: number; treeXp: number } {
    let level = Number.isFinite(treeLevel) ? Math.max(1, Math.floor(treeLevel)) : 1;
    let xp = Number.isFinite(treeXp) ? Math.max(0, Math.floor(treeXp)) : 0;
    let guard = 0;
    while (xp >= getXpToNextLevel(level) && guard < 500) {
        xp -= getXpToNextLevel(level);
        level += 1;
        guard += 1;
    }
    return { treeLevel: level, treeXp: xp };
}

export function getStreakXpMultiplier(streak: number): number {
    const safeStreak = Number.isFinite(streak) ? Math.max(0, Math.floor(streak)) : 0;
    const bonus = Math.min(STREAK_XP_MULTIPLIER_CAP, safeStreak * STREAK_XP_MULTIPLIER_STEP);
    return 1 + bonus;
}

export function getTreePhaseFromLevel(level: number): TreePhase {
    const safeLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;

    if (safeLevel <= 1) return "seed";
    if (safeLevel <= 2) return "sprout";
    if (safeLevel <= 3) return "sapling";
    if (safeLevel <= 4) return "young-tree";
    return "mature-tree";
}

export function getTreePhaseFromXp(xp: number): TreePhase {
    const level = getTreeLevelFromLifetimeXp(xp);
    return getTreePhaseFromLevel(level);
}

export function getTreePhaseLabel(phase: TreePhase): string {
    if (phase === "seed") return "Seed";
    if (phase === "sprout") return "Sprout";
    if (phase === "sapling") return "Sapling";
    if (phase === "young-tree") return "Young Tree";
    return "Mature Tree";
}
