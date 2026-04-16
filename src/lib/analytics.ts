import { Habit } from './types';

export function normalizeDailyScore(
    dailyScore: number,
    habits: Habit[] | null,
    totalActiveHabitsFallback?: number
): number {
    const totalActiveHabits = habits?.length ?? totalActiveHabitsFallback ?? 0;
    if (totalActiveHabits === 0) return 0;

    const POS_DONE = 1.0;
    const POS_MISSED = -0.25;
    const NEG_AVOIDED = 1.0;
    const NEG_DID = -1.0;

    const canUseExact = !!habits && (totalActiveHabitsFallback == null || totalActiveHabitsFallback === habits.length);
    let totalMax = 0;
    let totalMin = 0;

    if (canUseExact) {
        for (const h of habits) {
            if (h.category === 'positive') {
                totalMax += POS_DONE;
                totalMin += POS_MISSED;
            } else {
                totalMax += NEG_AVOIDED;
                totalMin += NEG_DID;
            }
        }
    } else {
        const assumedPos = Math.ceil(totalActiveHabits / 2);
        const assumedNeg = totalActiveHabits - assumedPos;
        totalMax = assumedPos * POS_DONE + assumedNeg * NEG_AVOIDED;
        totalMin = assumedPos * POS_MISSED + assumedNeg * NEG_DID;
    }

    const denom = totalMax - totalMin;
    if (denom <= 0) return 0;

    const normalized = ((dailyScore - totalMin) / denom) * 2 - 1;
    // Clamp to avoid numeric drift outside [-1, 1]
    return Math.max(-1, Math.min(1, normalized));
}

export function calculateTreeHealth(entries: Record<string, 'pending' | 'completed' | 'failed'>, habits: Habit[]): number {
    let score = 0;

    // Habit scoring model (simple + lenient):
    // - Positive habits: checked/completed = good boost, unchecked/pending = small penalty.
    // - Negative habits: checked/completed = penalty (did the bad thing), unchecked/pending = boost (avoided).
    //
    // We keep legacy compatibility for older logs that may contain `failed` by treating it as `pending`.
    const POS_DONE = 1.0;
    const POS_MISSED = -0.25;
    const NEG_AVOIDED = 1.0;
    const NEG_DID = -1.0;

    for (const habit of habits) {
        const rawState = entries[habit.id] || 'pending';
        const state = rawState === 'failed' ? 'pending' : rawState;

        const isCompleted = state === 'completed';
        if (habit.category === 'positive') {
            score += isCompleted ? POS_DONE : POS_MISSED;
        } else {
            score += isCompleted ? NEG_DID : NEG_AVOIDED;
        }
    }

    return score;
}

// In a real app we'd fetch the last 7 days and average this, but for now we'll update the global tree score
// gradually based on the day's delta.
export function applyDailyScoreToHealth(
    currentHealth: number,
    dailyScore: number,
    habits: Habit[] | null,
    totalActiveHabitsFallback?: number
): number {
    const totalActiveHabits = habits?.length ?? totalActiveHabitsFallback ?? 0;
    if (totalActiveHabits === 0) return currentHealth;
    
    // Max possible daily swing is capped
    const maxSwing = 15; // 15 points max change per day
    
    // Normalize dailyScore into [-1, 1].
    // With weighted scoring, the min/max daily score may not be ±habitCount.
    // This maps the theoretical minimum outcome to -1, and maximum to +1.
    //
    // Note: dailyScore is computed by `calculateTreeHealth`, so it already encodes
    // category-aware semantics (positive vs negative).
    //
    const normalized = normalizeDailyScore(dailyScore, habits, totalActiveHabitsFallback);
    const swing = normalized * maxSwing;
    
    let newHealth = currentHealth + swing;
    
    // Clamp between 0 and 100
    if (newHealth > 100) newHealth = 100;
    if (newHealth < 0) newHealth = 0;
    
    return Math.round(newHealth);
}
