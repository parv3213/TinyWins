export interface Habit {
  id: string;
  name: string;
  category: 'positive' | 'negative';
  icon: string;
  order: number;
  createdAt: string; // ISO string to avoid timestamp serialization issues
  archived: boolean;
}

export type HabitStatus = 'pending' | 'completed' | 'failed';

export interface DayLog {
  entries: Record<string, HabitStatus>; // habitId -> status
  treeScore: number;
  loggedAt: string;
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalDaysLogged: number;
  treeHealth: number; // 0-100
}
