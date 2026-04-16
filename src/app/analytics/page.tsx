'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import CompletionRing from '@/components/charts/CompletionRing';
import MonthlyBarChart from '@/components/charts/MonthlyBarChart';
import PageShell from '@/components/PageShell';
import { useAuth } from '@/contexts/AuthContext';
import { getHabits, getRecentDayLogs, getTodayStr, getUserStats } from '@/lib/habits';
import { DayLog, Habit, HabitStatus, UserStats } from '@/lib/types';

type DailyCount = { date: string; positive: number; negative: number };
type ActiveDayRow = { dateStr: string; dateIso: string; good: number; bad: number; total: number };

const toDateStr = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const countDay = (habits: Habit[], log: DayLog) => {
  let good = 0;
  let bad = 0;

  for (const habit of habits) {
    const rawState = (log.entries?.[habit.id] || 'pending') as HabitStatus;
    const state: HabitStatus = rawState === 'failed' ? 'pending' : rawState; // legacy compat

    // Same semantics as dashboard tree:
    // - Positive habit: completed => good, pending => bad
    // - Negative habit: pending => good (avoided), completed => bad (did it)
    const isCompleted = state === 'completed';
    if (habit.category === 'positive') {
      if (isCompleted) good += 1;
      else bad += 1;
    } else {
      if (isCompleted) bad += 1;
      else good += 1;
    }
  }

  return { good, bad };
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({ currentStreak: 0, longestStreak: 0, totalDaysLogged: 0, treeHealth: 50 });
  const [monthlyData, setMonthlyData] = useState<DailyCount[]>([]);
  const [weeklyPct, setWeeklyPct] = useState(0);
  const [goodPct, setGoodPct] = useState(0);
  const [badPct, setBadPct] = useState(0);
  const [activeRows, setActiveRows] = useState<ActiveDayRow[]>([]);
  const [isDataOpen, setIsDataOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const todayStr = getTodayStr();
        const fetchedHabits = await getHabits(user.uid);
        const fetchedStats = await getUserStats(user.uid);
        const recentLogs = await getRecentDayLogs(user.uid, 90);

        const logByDate = new Map<string, DayLog>();
        for (const r of recentLogs) logByDate.set(r.dateStr, r.log);

        const rows30: ActiveDayRow[] = [];
        let good30 = 0;
        let bad30 = 0;
        let good7 = 0;
        let total7 = 0;

        for (let i = 29; i >= 0; i--) {
          const d = new Date(todayStr + 'T00:00:00');
          d.setDate(d.getDate() - i);
          const dateStr = toDateStr(d);
          const log = logByDate.get(dateStr) ?? null;
          if (!log?.loggedAt) continue; // hide missing/inactive days

          const { good, bad } = countDay(fetchedHabits, log);
          const total = good + bad;
          if (total <= 0) continue;

          const dateIso = d.toISOString();
          rows30.push({ dateStr, dateIso, good, bad, total });

          good30 += good;
          bad30 += bad;
          if (i < 7) {
            good7 += good;
            total7 += total;
          }
        }

        const totalActions = good30 + bad30;
        const nextGoodPct = totalActions > 0 ? Math.round((good30 / totalActions) * 100) : 0;
        const nextBadPct = totalActions > 0 ? 100 - nextGoodPct : 0;
        const nextWeeklyPct = total7 > 0 ? Math.round((good7 / total7) * 100) : 0;

        if (cancelled) return;
        setStats(fetchedStats ?? { currentStreak: 0, longestStreak: 0, totalDaysLogged: 0, treeHealth: 50 });
        setMonthlyData(rows30.map((r) => ({ date: r.dateIso, positive: r.good, negative: r.bad })));
        setWeeklyPct(nextWeeklyPct);
        setGoodPct(nextGoodPct);
        setBadPct(nextBadPct);
        setActiveRows(rows30);
      } catch (e) {
        console.error('Failed to load analytics', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const ratioBar = useMemo(() => {
    const good = Math.max(0, Math.min(100, goodPct));
    const bad = Math.max(0, Math.min(100, badPct));
    const total = good + bad;
    if (total === 0) return { good: 0, bad: 0 };
    const normGood = Math.round((good / total) * 100);
    return { good: normGood, bad: 100 - normGood };
  }, [goodPct, badPct]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <PageShell className="relative">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid z-[-1]"></div>
      
      <Header title="Trends & Analytics" showDate={false} />

      <main className="flex flex-col gap-5 mt-4">
        
        <div className="grid grid-cols-2 gap-4">
          {/* Weekly Ring */}
          <div className="card-flat flex flex-col items-center p-5">
            <h3 className="text-sm font-medium text-[var(--fg)] mb-1">Weekly</h3>
            <p className="text-xs text-[var(--muted-fg)] mb-4 text-center">Good outcomes across active days (last 7)</p>
            <CompletionRing percentage={weeklyPct} label="Weekly" />
          </div>

          {/* Streak Card */}
          <div className="card-flat flex flex-col items-center justify-center p-5 text-center relative overflow-hidden">
             {/* Subtle animated glow behind fire */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[var(--pending)] rounded-full blur-[40px] opacity-20 animate-pulse pointer-events-none"></div>
             
             <span className="text-4xl relative z-10 animate-bounce" style={{ animationDuration: '2s' }}>🔥</span>
             <div className="flex items-baseline gap-1 mt-2 relative z-10">
                <span className="stat-number">{stats.currentStreak}</span>
                <span className="text-[var(--muted-fg)] font-medium">days</span>
             </div>
             <p className="text-xs text-[var(--muted-fg)] mt-2 relative z-10">Longest: {stats.longestStreak} days</p>
          </div>
        </div>

        {/* Good vs Bad Ratio */}
        <div className="card-flat p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-medium mb-1">Behavior Ratio</h3>
              <p className="text-xs text-[var(--muted-fg)]">Last 30 days (active days only)</p>
            </div>
            <div className="text-xs text-[var(--muted-fg)] whitespace-nowrap">{activeRows.length} days</div>
          </div>

          <div className="mt-4">
            <div className="w-full h-3 rounded-full overflow-hidden bg-[var(--border)]">
              <div className="h-full flex">
                <div className="h-full bg-[var(--success)]" style={{ width: `${ratioBar.good}%` }} />
                <div className="h-full bg-[var(--danger)]" style={{ width: `${ratioBar.bad}%` }} />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--success)]" />
                <div className="text-sm font-medium">{ratioBar.good}% Good</div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--danger)]" />
                <div className="text-sm font-medium">{ratioBar.bad}% Bad</div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Chart */}
        <div className="card-flat p-5">
           <div className="flex items-center justify-between mb-6">
              <div>
                 <h3 className="text-base font-medium">30 Day History</h3>
                 <p className="text-xs text-[var(--muted-fg)]">Daily completions</p>
              </div>
              <button
                className="text-xs text-[var(--primary)] font-medium hover:underline disabled:opacity-60 disabled:no-underline"
                onClick={() => setIsDataOpen(true)}
                disabled={activeRows.length === 0}
              >
                 View Data
              </button>
           </div>
           
           <MonthlyBarChart dataPoints={monthlyData} />
        </div>

      </main>

      <BottomNav activePath="/analytics" />

      {isDataOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDataOpen(false);
          }}
        >
          <div className="modal-content relative">
            <div className="modal-handle"></div>
            <button
              onClick={() => setIsDataOpen(false)}
              className="absolute top-4 right-4 p-2 text-[var(--muted-fg)] hover:text-[var(--fg)] transition-colors"
              aria-label="Close"
            >
              ✕
            </button>

            <h2 className="mb-2">View Data</h2>
            <p className="text-sm text-[var(--muted-fg)] mb-6">Active days in last 30 days.</p>

            {activeRows.length === 0 ? (
              <div className="card-flat p-6 text-center bg-[var(--card)]/50 border-dashed border-2">
                <div className="text-3xl mb-2">📭</div>
                <div className="text-sm text-[var(--muted-fg)]">No logged days yet.</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[60vh] overflow-auto pr-1">
                {activeRows
                  .slice()
                  .reverse()
                  .map((r) => (
                    <div key={r.dateStr} className="card-flat p-4 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-medium">{r.dateStr}</div>
                        <div className="text-xs text-[var(--muted-fg)] mt-1">
                          Total: {r.total}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-[var(--success)]">Good {r.good}</div>
                        <div className="text-sm font-medium text-[var(--danger)]">Bad {r.bad}</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
