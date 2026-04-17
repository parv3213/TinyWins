export type TreePhase = "seed" | "sprout" | "sapling" | "young-tree" | "mature-tree";

const XP_PER_LEVEL_BASE = 100;
const XP_PER_LEVEL_STEP = 25;

export const STREAK_XP_MULTIPLIER_STEP = 0.05;
export const STREAK_XP_MULTIPLIER_CAP = 0.4;

export function getTreeLevelFromXp(xp: number): number {
    const safeXp = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
    return Math.floor(safeXp / XP_PER_LEVEL_BASE) + 1;
}

export function getXpToNextLevel(level: number): number {
    const safeLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
    return XP_PER_LEVEL_BASE + Math.max(0, safeLevel - 1) * XP_PER_LEVEL_STEP;
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
    const level = getTreeLevelFromXp(xp);
    return getTreePhaseFromLevel(level);
}

export function getTreePhaseLabel(phase: TreePhase): string {
    if (phase === "seed") return "Seed";
    if (phase === "sprout") return "Sprout";
    if (phase === "sapling") return "Sapling";
    if (phase === "young-tree") return "Young Tree";
    return "Mature Tree";
}
