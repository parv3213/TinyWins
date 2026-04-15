import { DayLog, Habit } from './types';

export function calculateTreeHealth(entries: Record<string, 'pending' | 'completed' | 'failed'>, habits: Habit[]): number {
    let score = 0;
    
    // basic daily score based on habits
    // completed positive: +1
    // avoided negative (pending): 0 
    // failed positive: -1
    // completed negative (failed avoiding): -1
    
    for (const habit of habits) {
        const state = entries[habit.id] || 'pending';
        
        if (habit.category === 'positive') {
            if (state === 'completed') score += 1;
            else if (state === 'failed') score -= 1;
        } else { // negative
            if (state === 'failed') score -= 1; // if you did a negative habit, it's a fail
            else if (state === 'completed') score += 1; // successfully avoided? actually standard is just 'pending' for avoided, but if they mark it completed maybe we reward. Let's stick to standard formula.
        }
    }
    
    return score;
}

// In a real app we'd fetch the last 7 days and average this, but for now we'll update the global tree score
// gradually based on the day's delta.
export function applyDailyScoreToHealth(currentHealth: number, dailyScore: number, totalActiveHabits: number): number {
    if (totalActiveHabits === 0) return currentHealth;
    
    // Max possible daily swing is capped
    const maxSwing = 15; // 15 points max change per day
    
    // Normalize score to swing: 
    // if dailyScore == totalActiveHabits (perfect), swing is +maxSwing
    // if dailyScore == -totalActiveHabits (terrible), swing is -maxSwing
    
    const swingRatio = dailyScore / totalActiveHabits; 
    const swing = swingRatio * maxSwing;
    
    let newHealth = currentHealth + swing;
    
    // Clamp between 0 and 100
    if (newHealth > 100) newHealth = 100;
    if (newHealth < 0) newHealth = 0;
    
    return Math.round(newHealth);
}
