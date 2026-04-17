export type TreePhase = 'seed' | 'sapling' | 'tree';

const XP_PER_LEVEL = 100;

export function getTreeLevelFromXp(xp: number): number {
  const safeXp = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  return Math.floor(safeXp / XP_PER_LEVEL) + 1;
}

export function getTreePhaseFromXp(xp: number): TreePhase {
  const level = getTreeLevelFromXp(xp);

  if (level <= 1) return 'seed';
  if (level <= 3) return 'sapling';
  return 'tree';
}

export function getTreePhaseLabel(phase: TreePhase): string {
  if (phase === 'seed') return 'Seed';
  if (phase === 'sapling') return 'Sapling';
  return 'Tree';
}
