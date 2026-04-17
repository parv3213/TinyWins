'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Habit, DayLog, UserStats } from '@/lib/types';
import { getHabits, getDayLog, saveDayLog, getRecentDayLogs, getRecentDayLogsBefore, finalizeDayWithHealth, getUserStats, updateUserStats, getTodayStr } from '@/lib/habits';
import { calculateTreeHealth, applyDailyScoreToHealth } from '@/lib/analytics';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import HabitCard from '@/components/HabitCard';
import AddHabitButton from '@/components/AddHabitButton';
import HabitForm from '@/components/HabitForm';
import TreeCanvas from '@/components/tree/TreeCanvas';
import PageShell from '@/components/PageShell';
import { getTreePhaseFromXp } from '@/lib/treeProgression';

export default function DashboardPage() {
  const { user } = useAuth();
  
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dayLog, setDayLog] = useState<DayLog>({ entries: {}, treeScore: 0, loggedAt: '' });
  const [stats, setStats] = useState<UserStats>({ currentStreak: 0, longestStreak: 0, totalDaysLogged: 0, treeHealth: 50, treeLevel: 1, treeXp: 0 });
  
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);

  const [todayStr, setTodayStr] = useState(getTodayStr());

  const computeCurrentStreakFromLogDates = (logDates: Set<string>, anchorDateStr: string) => {
    let streak = 0;
    const d = new Date(anchorDateStr + 'T00:00:00');
    // cap to reasonable lookback to avoid infinite loops if input weird
    for (let i = 0; i < 365; i++) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      if (!logDates.has(dateStr)) break;
      streak += 1;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  const dayHasActivity = (entries: Record<string, 'pending' | 'completed' | 'failed'>) => {
    return Object.values(entries).some((status) => status === 'completed' || status === 'failed');
  };

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const fetchedHabits = await getHabits(user.uid);
      setHabits(fetchedHabits);

      const fetchedStats = await getUserStats(user.uid);
      // We'll update stats once at the end to avoid multiple rapid canvas updates.
      let nextStats = fetchedStats ?? null;

      // Catch-up: finalize recent unfinalized days before today (auto-finalize for users who didn't click).
      // We only look back a bounded window to avoid heavy reads.
      if (nextStats) {
        const pendingFinalize = await getRecentDayLogsBefore(user.uid, todayStr, 14);
        const toFinalize = pendingFinalize
          .filter((r) => r.log.loggedAt && !r.log.finalizedAt)
          .sort((a, b) => a.dateStr.localeCompare(b.dateStr));

        if (toFinalize.length > 0) {
          let lastHealth = nextStats.treeHealth;
          for (const { dateStr, log } of toFinalize) {
            const habitCount = log.habitCount ?? fetchedHabits.length;
            const res = await finalizeDayWithHealth(user.uid, dateStr, fetchedHabits, habitCount);
            // Keep local copy in sync (transaction reads/writes the source of truth).
            lastHealth = res.newHealth;
          }
          nextStats = { ...nextStats, treeHealth: lastHealth };
        }
      }

      const fetchedLog = await getDayLog(user.uid, todayStr);
      if (fetchedLog) {
         // Recompute score from entries + current habits so preview never drifts.
         const recomputedScore = calculateTreeHealth(fetchedLog.entries || {}, fetchedHabits);
         setDayLog({
           ...fetchedLog,
           treeScore: recomputedScore,
           habitCount: fetchedLog.habitCount ?? fetchedHabits.length
         });
      } else {
         // Empty log for today
         setDayLog({ entries: {}, treeScore: 0, loggedAt: '' });
      }

      if (nextStats) {
        setStats(nextStats);
      }
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  }, [user, todayStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getMsUntilNextMidnight = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return next.getTime() - now.getTime();
  };

  const finalizeDateIfNeeded = useCallback(async (dateStr: string, log: DayLog, baseHealth: number, fallbackHabitCount: number) => {
    if (!user) return baseHealth;
    if (!log.loggedAt) return baseHealth;
    if (log.finalizedAt) return baseHealth;

    const habitCount = log.habitCount ?? fallbackHabitCount;
    const res = await finalizeDayWithHealth(user.uid, dateStr, habits, habitCount);

    setStats(prev => ({ ...prev, treeHealth: res.newHealth }));
    if (res.applied && dateStr === todayStr) {
      setDayLog(prev => ({ ...prev, finalizedAt: new Date().toISOString() }));
    }

    return res.newHealth;
  }, [user, todayStr, habits]);

  useEffect(() => {
    if (!user) return;
    const ms = getMsUntilNextMidnight() + 250; // small buffer to cross date boundary
    const t = window.setTimeout(async () => {
      try {
        // Auto-finalize current day if user didn't click.
        await finalizeDateIfNeeded(todayStr, dayLog, stats.treeHealth, dayLog.habitCount ?? habits.length);
      } catch (e) {
        console.error("Auto-finalize failed", e);
      } finally {
        setTodayStr(getTodayStr());
      }
    }, ms);

    return () => window.clearTimeout(t);
  }, [user, todayStr, dayLog, stats.treeHealth, habits.length, finalizeDateIfNeeded]);

  const handleToggle = async (habitId: string, newTargetStatus: 'pending' | 'completed' | 'failed') => {
      if (!user) return;
      if (dayLog.finalizedAt) return;
      if (habits.length === 0) return;

      const wasActiveBefore = dayHasActivity(dayLog.entries);

      // Optimistic update
      const newEntries = { ...dayLog.entries, [habitId]: newTargetStatus };
      
      // Calculate new tree score
      const dailyScore = calculateTreeHealth(newEntries, habits);
      const isActiveNow = dayHasActivity(newEntries);
      
      setDayLog(prev => ({
         ...prev,
         entries: newEntries,
         treeScore: dailyScore,
         habitCount: habits.length,
         loggedAt: prev.loggedAt || new Date().toISOString()
      }));

      try {
         await saveDayLog(user.uid, todayStr, newEntries, dailyScore, habits.length);
        const recent = await getRecentDayLogs(user.uid, 90);
        const activeDateSet = new Set(
          recent
           .filter((r) => dayHasActivity(r.log.entries || {}))
           .map((r) => r.dateStr)
        );

        if (isActiveNow) activeDateSet.add(todayStr);
        else activeDateSet.delete(todayStr);

        const currentStreak = computeCurrentStreakFromLogDates(activeDateSet, todayStr);
        const totalDaysLogged = Math.max(
          0,
          stats.totalDaysLogged + (isActiveNow ? 1 : 0) - (wasActiveBefore ? 1 : 0)
        );
        const longestStreak = Math.max(stats.longestStreak, currentStreak);
        const nextStats = { currentStreak, longestStreak, totalDaysLogged };
        setStats(prev => ({ ...prev, ...nextStats }));
        await updateUserStats(user.uid, nextStats);
      } catch(e) {
         console.error("Failed to save habit toggle", e);
         // Revert on failure (simple reload for now)
         loadData();
      }
  };

  const effectiveTreeHealth = (() => {
    if (dayLog.finalizedAt) return stats.treeHealth;
    const habitCount = dayLog.habitCount ?? habits.length;
    return applyDailyScoreToHealth(stats.treeHealth, dayLog.treeScore || 0, habits, habitCount);
  })();

  const treeLevel = stats.treeLevel ?? 1;
  const treeXp = stats.treeXp ?? 0;
  const treePhase = getTreePhaseFromXp(treeXp);
  const xpToNext = 100 + Math.max(0, treeLevel - 1) * 25;
  const xpPct = xpToNext > 0 ? Math.min(100, Math.round((treeXp / xpToNext) * 100)) : 0;
  const healthLabel =
    effectiveTreeHealth >= 80 ? 'Thriving' :
    effectiveTreeHealth >= 55 ? 'Growing' :
    effectiveTreeHealth >= 35 ? 'Struggling' :
    'Withering';
  const completedTodayCount = habits.filter((habit) => dayLog.entries[habit.id] === 'completed').length;
  const slotsLeft = Math.max(0, 10 - habits.length);
  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingHabit(undefined);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    loadData(); // Reload habits
  };

  return (
    <PageShell>
      <Header />

      <main className="flex flex-col gap-6">
        {/* Tree Gamification Widget */}
        <section>
          {loading ? (
            <div className="w-full h-[350px] rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center">
              <div className="spinner"></div>
            </div>
          ) : (
            <TreeCanvas health={effectiveTreeHealth} phase={treePhase} />
          )}
        </section>

        {/* Quick Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
           <div className="card-flat p-4 flex flex-col items-center justify-center text-center">
              <span className="stat-label">Current Streak</span>
              <div className="flex items-center gap-1 mt-1">
                 <span className="stat-number">{stats.currentStreak}</span>
                 <span className="text-2xl animate-pulse">🔥</span>
              </div>
           </div>
           
           <div className="card-flat p-4 flex flex-col items-center justify-center text-center">
              <span className="stat-label">Tree Level</span>
              <div className="flex items-baseline gap-2 mt-1">
                 <span className="stat-number">{treeLevel}</span>
                 <span className="text-sm font-medium text-[var(--muted-fg)]">({healthLabel})</span>
              </div>
              <div className="w-full mt-2">
                <div className="w-full h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-700"
                    style={{ width: `${xpPct}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-xs font-medium text-[var(--muted-fg)]">
                  {treeXp}/{xpToNext} XP
                </div>
              </div>
           </div>
        </section>

        {/* Habits Checklist */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl">Today&apos;s Habits</h2>
             <span className="text-sm font-medium text-[var(--muted-fg)] bg-[var(--muted)] px-2 py-0.5 rounded-full">
               {completedTodayCount}/{habits.length || 0} done • {slotsLeft} slots left
             </span>
          </div>
          
          {loading ? (
            <div className="card-flat p-8 flex items-center justify-center bg-[var(--card)]/50">
              <div className="spinner"></div>
            </div>
          ) : habits.length === 0 ? (
            <div className="card-flat p-8 text-center bg-[var(--card)]/50 border-dashed border-2">
               <div className="text-4xl mb-3">🌱</div>
               <h3 className="mb-2">Plant your first seed</h3>
               <p className="text-[var(--muted-fg)] text-sm mb-4">Create a habit to start growing your tree.</p>
               <button onClick={handleAddNew} className="btn btn-primary">
                 Add Habit
               </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 relative rounded-xl p-1 -mx-1">
               <div className="absolute inset-0 bg-dotted rounded-xl pointer-events-none"></div>
               
               {habits.map((habit, index) => (
                  <HabitCard 
                    key={habit.id}
                    habit={habit}
                    status={dayLog.entries[habit.id] || 'pending'}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    index={index}
                    disabled={!!dayLog.finalizedAt}
                  />
               ))}
            </div>
          )}
        </section>
      </main>

      {/* FAB & Bottom Nav */}
      {habits.length < 10 && <AddHabitButton onClick={handleAddNew} />}
      <BottomNav />

      {/* Habit Form Modal */}
      {isFormOpen && (
        <HabitForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={handleFormSuccess}
          existingHabit={editingHabit}
        />
      )}
    </PageShell>
  );
}
