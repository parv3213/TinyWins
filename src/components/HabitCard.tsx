'use client';

import { Habit, HabitStatus } from '@/lib/types';

interface HabitCardProps {
  habit: Habit;
  status: HabitStatus;
  onToggle: (habitId: string, newStatus: HabitStatus) => void;
  onEdit: (habit: Habit) => void;
  index: number;
}

export default function HabitCard({ habit, status, onToggle, onEdit, index }: HabitCardProps) {
  
  // Cycle states: pending -> completed -> failed -> pending
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening edit modal
    
    let newStatus: HabitStatus;
    if (status === 'pending') newStatus = 'completed';
    else if (status === 'completed') newStatus = 'failed';
    else newStatus = 'pending';
    
    onToggle(habit.id, newStatus);
  };

  // Determine styling based on current status and habit category
  let cardClass = 'card flex items-center justify-between cursor-pointer transition-all duration-300';
  let badgeClass = 'badge ';
  let iconBgClass = 'w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-colors duration-300 ';
  
  if (status === 'completed') {
    cardClass += habit.category === 'positive' 
      ? ' border-[var(--success)] shadow-[0_0_12px_var(--success-glow)] bg-[var(--card)]'
      : ' border-[var(--danger)] shadow-[0_0_12px_var(--danger-glow)] bg-[var(--card)]'; // you "completed" a bad habit = failure
    
    iconBgClass += habit.category === 'positive' ? 'bg-[var(--success-light)]' : 'bg-[var(--danger-light)]';
    badgeClass += habit.category === 'positive' ? 'badge-positive' : 'badge-negative';
  } else if (status === 'failed') {
     cardClass += habit.category === 'positive' 
      ? ' border-[var(--danger)] shadow-[0_0_12px_var(--danger-glow)] bg-[var(--card)]' // failed a good habit
      : ' border-[var(--success)] shadow-[0_0_12px_var(--success-glow)] bg-[var(--card)]'; // failed to "do" a bad habit = success
      
    iconBgClass += habit.category === 'positive' ? 'bg-[var(--danger-light)]' : 'bg-[var(--success-light)]';
    badgeClass += habit.category === 'positive' ? 'badge-negative' : 'badge-positive';
  } else {
    // Pending
    cardClass += ' hover:border-[var(--primary)]';
    iconBgClass += 'bg-[var(--muted)]';
    badgeClass += 'badge-pending';
  }

  // Animation delay based on index
  const staggerClass = index < 10 ? `animate-slideUp stagger-${index + 1}` : '';

  return (
    <div 
      className={`${cardClass} ${staggerClass}`}
      onClick={() => onEdit(habit)}
      title="Tap to Edit"
    >
      <div className="flex items-center gap-4">
        <div className={iconBgClass}>
          {habit.icon}
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-[var(--fg)] text-lg mb-1">{habit.name}</span>
          <div className="flex gap-2">
            <span className={badgeClass}>
              {habit.category === 'positive' ? 'Good' : 'Bad'}
            </span>
            {status !== 'pending' && (
              <span className="text-xs font-medium text-[var(--muted-fg)] uppercase tracking-wider self-center">
                {status}
              </span>
            )}
          </div>
        </div>
      </div>

      <button 
        onClick={handleToggle}
        className="w-10 h-10 rounded-full border-2 border-[var(--border)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 z-10"
        style={{
           backgroundColor: status === 'completed' 
              ? (habit.category === 'positive' ? 'var(--success)' : 'var(--danger)')
              : status === 'failed'
                 ? (habit.category === 'positive' ? 'var(--danger)' : 'var(--success)')
                 : 'transparent',
           borderColor: status !== 'pending' ? 'transparent' : 'var(--border)'
        }}
        title="Cycle Status: Pending → Completed → Failed"
      >
        {status === 'completed' && <span className="text-white text-sm">✓</span>}
        {status === 'failed' && <span className="text-white text-sm">✕</span>}
      </button>
    </div>
  );
}
