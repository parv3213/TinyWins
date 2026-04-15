'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Habit, DayLog, UserStats } from '@/lib/types';
import { getHabits, getDayLog, saveDayLog, getUserStats, updateUserStats, getTodayStr } from '@/lib/habits';
import { calculateTreeHealth, applyDailyScoreToHealth } from '@/lib/analytics';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import HabitCard from '@/components/HabitCard';
import AddHabitButton from '@/components/AddHabitButton';
import HabitForm from '@/components/HabitForm';
import TreeCanvas from '@/components/tree/TreeCanvas';

export default function DashboardPage() {
  const { user } = useAuth();
  
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dayLog, setDayLog] = useState<DayLog>({ entries: {}, treeScore: 0, loggedAt: '' });
  const [stats, setStats] = useState<UserStats>({ currentStreak: 0, longestStreak: 0, totalDaysLogged: 0, treeHealth: 50 });
  
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);

  const todayStr = getTodayStr();

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const fetchedHabits = await getHabits(user.uid);
      setHabits(fetchedHabits);
      
      const fetchedLog = await getDayLog(user.uid, todayStr);
      if (fetchedLog) {
         setDayLog(fetchedLog);
      } else {
         // Empty log for today
         setDayLog({ entries: {}, treeScore: 0, loggedAt: '' });
      }
      
      const fetchedStats = await getUserStats(user.uid);
      if (fetchedStats) {
         setStats(fetchedStats);
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

  const handleToggle = async (habitId: string, newTargetStatus: 'pending' | 'completed' | 'failed') => {
      if (!user) return;
      
      // Optimistic update
      const newEntries = { ...dayLog.entries, [habitId]: newTargetStatus };
      
      // Calculate new tree score
      const dailyScore = calculateTreeHealth(newEntries, habits);
      
      setDayLog(prev => ({
         ...prev,
         entries: newEntries,
         treeScore: dailyScore
      }));
      
      // Apply to global health (stub logic, in a real app this might be more complex)
      const newHealth = applyDailyScoreToHealth(stats.treeHealth, dailyScore, habits.length);
      setStats(prev => ({
         ...prev,
         treeHealth: newHealth
      }));

      try {
         await saveDayLog(user.uid, todayStr, newEntries, dailyScore);
         await updateUserStats(user.uid, { treeHealth: newHealth });
      } catch(e) {
         console.error("Failed to save habit toggle", e);
         // Revert on failure (simple reload for now)
         loadData();
      }
  };

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

  if (loading) {
     return (
       <div className="loading-screen">
          <div className="spinner"></div>
       </div>
     );
  }

  return (
    <div className="container pb-24">
      <Header />

      <main className="flex flex-col gap-6">
        {/* Tree Gamification Widget */}
        <section>
          <TreeCanvas health={stats.treeHealth} />
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
              <span className="stat-label">Tree Health</span>
              <div className="flex items-center gap-1 mt-1">
                 <span className="stat-number">{stats.treeHealth}%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--muted)] rounded-full mt-2 overflow-hidden">
                 <div 
                   className="h-full bg-[var(--primary)] transition-all duration-1000" 
                   style={{ width: `${stats.treeHealth}%` }}
                 ></div>
              </div>
           </div>
        </section>

        {/* Habits Checklist */}
        <section>
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl">Today&apos;s Habits</h2>
             <span className="text-sm font-medium text-[var(--muted-fg)] bg-[var(--muted)] px-2 py-0.5 rounded-full">
                {habits.length}/10
             </span>
          </div>
          
          {habits.length === 0 ? (
            <div className="card-flat p-8 text-center bg-[var(--card)]/50 border-dashed border-2">
               <div className="text-4xl mb-3">🌱</div>
               <h3 className="mb-2">Plant your first seed</h3>
               <p className="text-[var(--muted-fg)] text-sm mb-4">Create a habit to start growing your tree.</p>
               <button onClick={handleAddNew} className="btn btn-primary">
                 Add Habit
               </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 relative rounded-xl bg-dotted p-1 -mx-1">
               {/* Background pattern layer */}
               <div className="absolute inset-0 bg-dotted rounded-xl pointer-events-none -m-1"></div>
               
               {habits.map((habit, index) => (
                  <HabitCard 
                    key={habit.id}
                    habit={habit}
                    status={dayLog.entries[habit.id] || 'pending'}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    index={index}
                  />
               ))}
            </div>
          )}
        </section>
      </main>

      {/* FAB & Bottom Nav */}
      {habits.length < 10 && <AddHabitButton onClick={handleAddNew} />}
      <BottomNav activePath="/dashboard" />

      {/* Habit Form Modal */}
      {isFormOpen && (
        <HabitForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={handleFormSuccess}
          existingHabit={editingHabit}
        />
      )}
    </div>
  );
}
