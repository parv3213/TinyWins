'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import CompletionRing from '@/components/charts/CompletionRing';
import MonthlyBarChart from '@/components/charts/MonthlyBarChart';
import { Doughnut } from 'react-chartjs-2';
import PageShell from '@/components/PageShell';
import { useAuth } from '@/contexts/AuthContext';
import { getHabits, getRecentDayLogs, getTodayStr, getUserStats } from '@/lib/habits';
import { DayLog, Habit, HabitStatus, UserStats } from '@/lib/types';

type DailyCount = { date: string; positive: number; negative: number };

const toDateStr = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const countDay = (habits: Habit[], log: DayLog | null) => {
  let good = 0;
  let bad = 0;

  if (!log) return { good, bad };

  for (const habit of habits) {
    const state = (log.entries[habit.id] || 'pending') as HabitStatus;
    if (state === 'pending') continue;
    if (state === 'completed') good += 1;
    else bad += 1;
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

        const data30: DailyCount[] = [];
        let good30 = 0;
        let bad30 = 0;
        let good7 = 0;
        const denom7 = fetchedHabits.length * 7;

        for (let i = 29; i >= 0; i--) {
          const d = new Date(todayStr + 'T00:00:00');
          d.setDate(d.getDate() - i);
          const dateStr = toDateStr(d);
          const log = logByDate.get(dateStr) ?? null;

          const { good, bad } = countDay(fetchedHabits, log);
          data30.push({ date: d.toISOString(), positive: good, negative: bad });

          good30 += good;
          bad30 += bad;
          if (i < 7) good7 += good;
        }

        const totalActions = good30 + bad30;
        const nextGoodPct = totalActions > 0 ? Math.round((good30 / totalActions) * 100) : 0;
        const nextBadPct = totalActions > 0 ? 100 - nextGoodPct : 0;
        const nextWeeklyPct = denom7 > 0 ? Math.round((good7 / denom7) * 100) : 0;

        if (cancelled) return;
        setStats(fetchedStats ?? { currentStreak: 0, longestStreak: 0, totalDaysLogged: 0, treeHealth: 50 });
        setMonthlyData(data30);
        setWeeklyPct(nextWeeklyPct);
        setGoodPct(nextGoodPct);
        setBadPct(nextBadPct);
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

  const ratioData = useMemo(() => {
    const total = goodPct + badPct;
    const safe = total === 0 ? [1, 1] : [goodPct, badPct];
    return {
      labels: ['Good Habits', 'Bad Habits'],
      datasets: [{
        data: safe,
        backgroundColor: ['var(--success)', 'var(--danger)'],
        borderWidth: 0,
        cutout: '70%',
      }]
    };
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
            <h3 className="text-sm font-medium text-[var(--fg)] mb-4">Weekly Goal</h3>
            <CompletionRing percentage={weeklyPct} />
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
        <div className="card-flat p-5 flex items-center justify-between">
           <div>
              <h3 className="text-base font-medium mb-1">Behavior Ratio</h3>
              <p className="text-xs text-[var(--muted-fg)]">Positive vs Negative actions</p>
              
              <div className="flex flex-col gap-2 mt-4">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--success)]"></div>
                    <span className="text-sm font-medium">{goodPct}% Good</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--danger)]"></div>
                    <span className="text-sm font-medium">{badPct}% Bad</span>
                 </div>
              </div>
           </div>
           
           <div className="w-[100px] h-[100px] relative">
              <Doughnut 
                 data={ratioData} 
                 options={{ plugins: { tooltip: { enabled: false } }, maintainAspectRatio: false }} 
              />
           </div>
        </div>

        {/* Monthly Chart */}
        <div className="card-flat p-5">
           <div className="flex items-center justify-between mb-6">
              <div>
                 <h3 className="text-base font-medium">30 Day History</h3>
                 <p className="text-xs text-[var(--muted-fg)]">Daily completions</p>
              </div>
              <button className="text-xs text-[var(--primary)] font-medium hover:underline">
                 View Data
              </button>
           </div>
           
           <MonthlyBarChart dataPoints={monthlyData} />
        </div>

      </main>

      <BottomNav activePath="/analytics" />
    </PageShell>
  );
}
