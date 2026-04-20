'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import CompletionRing from '@/components/charts/CompletionRing';
import GoodBadTower, { DailyBucket, TowerGranularity } from '@/components/charts/GoodBadTower';
import PageShell from '@/components/PageShell';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { getTodayStr } from '@/lib/habits';
import { DayLog, Habit, UserStats } from '@/lib/types';
import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';

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
    const state = log?.entries?.[habit.id] ?? 'pending';

    // Legacy support: some older logs may contain 'failed'. We treat it as "not completed".
    const isCompleted = state === 'completed';
    if (habit.category === 'positive') {
      if (isCompleted) good += 1;
      else bad += 1;
    } else {
      // Negative habit: unchecked/pending means "avoided" (good), checked/completed means "did it" (bad).
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
  const [towerBuckets, setTowerBuckets] = useState<DailyBucket[]>([]);
  const [weeklyPct, setWeeklyPct] = useState(0);
  const [goodPct, setGoodPct] = useState(0);
  const [badPct, setBadPct] = useState(0);
  const [activeRows, setActiveRows] = useState<ActiveDayRow[]>([]);
  const [isDataOpen, setIsDataOpen] = useState(false);
  const [todayStr, setTodayStr] = useState(getTodayStr());
  const [granularity, setGranularity] = useState<TowerGranularity>('daily');

  useEffect(() => {
    if (!user) return;

    const getMsUntilNextMidnight = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      return next.getTime() - now.getTime();
    };

    const t = window.setTimeout(() => {
      setTodayStr(getTodayStr());
    }, getMsUntilNextMidnight() + 250);

    return () => window.clearTimeout(t);
  }, [user, todayStr]);

  useEffect(() => {
    if (!user) return;

    let habits: Habit[] = [];
    let logByDate = new Map<string, DayLog>();
    let overview: UserStats | null = null;

    let gotHabits = false;
    let gotLogs = false;
    let gotStats = false;

    const recompute = () => {
      if (!gotHabits || !gotLogs || !gotStats) return;

      const rows30: ActiveDayRow[] = [];
      const buckets: DailyBucket[] = [];
      let good30 = 0;
      let bad30 = 0;
      let good7 = 0;
      let total7 = 0;

      for (let i = 364; i >= 0; i--) {
        const d = new Date(todayStr + 'T00:00:00');
        d.setDate(d.getDate() - i);
        const dateStr = toDateStr(d);
        const log = logByDate.get(dateStr) ?? null;
        const hasLog = !!log?.loggedAt;
        const { good, bad } = hasLog ? countDay(habits, log) : { good: 0, bad: 0 };
        const total = good + bad;

        buckets.push({ date: dateStr, good, bad });

        if (i < 30 && hasLog && total > 0) {
          rows30.push({ dateStr, dateIso: d.toISOString(), good, bad, total });
          good30 += good;
          bad30 += bad;
          if (i < 7) {
            good7 += good;
            total7 += total;
          }
        }
      }

      const totalOutcomes = good30 + bad30;
      const nextGoodPct = totalOutcomes > 0 ? Math.round((good30 / totalOutcomes) * 100) : 0;
      const nextBadPct = totalOutcomes > 0 ? 100 - nextGoodPct : 0;
      const nextWeeklyPct = total7 > 0 ? Math.round((good7 / total7) * 100) : 0;

      setStats(overview ?? { currentStreak: 0, longestStreak: 0, totalDaysLogged: 0, treeHealth: 50 });
      setTowerBuckets(buckets);
      setWeeklyPct(nextWeeklyPct);
      setGoodPct(nextGoodPct);
      setBadPct(nextBadPct);
      setActiveRows(rows30);
      setLoading(false);
    };

    const habitsRef = collection(db, 'users', user.uid, 'habits');
    const habitsQuery = query(habitsRef, where('archived', '==', false), orderBy('order', 'asc'));
    const unsubHabits = onSnapshot(
      habitsQuery,
      (snap) => {
        habits = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Habit, 'id'>) })) as Habit[];
        gotHabits = true;
        recompute();
      },
      (err) => {
        console.error('Failed to subscribe to habits', err);
        gotHabits = true;
        habits = [];
        recompute();
      }
    );

    const logsRef = collection(db, 'users', user.uid, 'logs');
    const logsQuery = query(logsRef, orderBy('__name__', 'desc'), limit(400));
    const unsubLogs = onSnapshot(
      logsQuery,
      (snap) => {
        logByDate = new Map<string, DayLog>();
        for (const d of snap.docs) logByDate.set(d.id, d.data() as DayLog);
        gotLogs = true;
        recompute();
      },
      (err) => {
        console.error('Failed to subscribe to logs', err);
        gotLogs = true;
        logByDate = new Map<string, DayLog>();
        recompute();
      }
    );

    const statsRef = doc(db, 'users', user.uid, 'stats', 'overview');
    const unsubStats = onSnapshot(
      statsRef,
      (snap) => {
        overview = (snap.exists() ? (snap.data() as UserStats) : null);
        gotStats = true;
        recompute();
      },
      (err) => {
        console.error('Failed to subscribe to stats', err);
        gotStats = true;
        overview = null;
        recompute();
      }
    );

    return () => {
      unsubHabits();
      unsubLogs();
      unsubStats();
    };
  }, [user, todayStr]);

  const ratioBar = useMemo(() => {
    const good = Math.max(0, Math.min(100, goodPct));
    const bad = Math.max(0, Math.min(100, badPct));
    const total = good + bad;
    if (total === 0) return { good: 0, bad: 0 };
    const normGood = Math.round((good / total) * 100);
    return { good: normGood, bad: 100 - normGood };
  }, [goodPct, badPct]);

  return (
    <PageShell className="relative">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid z-[-1]"></div>
      
      <Header title="Trends & Analytics" showDate={false} />

      <main className="flex flex-col gap-5 mt-4">
        {loading ? (
          <div className="card-flat p-8 flex items-center justify-center bg-[var(--card)]/50">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
        
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

        {/* Good vs Bad Tower */}
        <div className="card-flat p-5">
           <div className="flex items-center justify-between gap-3 mb-4">
              <div className="min-w-0">
                 <h3 className="text-base font-medium">Good vs Bad Tower</h3>
                 <p className="text-xs text-[var(--muted-fg)]">
                   {granularity === 'daily' ? 'Last 30 days' : granularity === 'weekly' ? 'Last 12 weeks' : 'Last 12 months'}
                 </p>
              </div>
              <button
                className="text-xs text-[var(--primary)] font-medium hover:underline disabled:opacity-60 disabled:no-underline"
                onClick={() => setIsDataOpen(true)}
                disabled={activeRows.length === 0}
              >
                 View Data
              </button>
           </div>

           <div className="mb-4 inline-flex rounded-full border border-[var(--border)] bg-[var(--card)] p-0.5 text-xs">
             {(['daily', 'weekly', 'monthly'] as TowerGranularity[]).map((g) => {
               const active = granularity === g;
               return (
                 <button
                   key={g}
                   type="button"
                   onClick={() => setGranularity(g)}
                   className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
                     active
                       ? 'bg-[var(--primary)] text-[var(--primary-fg,white)]'
                       : 'text-[var(--muted-fg)] hover:text-[var(--fg)]'
                   }`}
                   aria-pressed={active}
                 >
                   {g === 'daily' ? 'Daily' : g === 'weekly' ? 'Weekly' : 'Monthly'}
                 </button>
               );
             })}
           </div>

           <GoodBadTower buckets={towerBuckets} granularity={granularity} />
        </div>

          </>
        )}
      </main>

      <BottomNav />

      {isDataOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDataOpen(false);
          }}
        >
          <div className="modal-content relative flex flex-col" style={{ overflow: 'hidden' }}>
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
              <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-auto pr-1">
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
