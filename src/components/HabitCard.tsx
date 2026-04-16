'use client';

import { Habit, HabitStatus } from '@/lib/types';

interface HabitCardProps {
  habit: Habit;
  status: HabitStatus;
  onToggle: (habitId: string, newStatus: HabitStatus) => void;
  onEdit: (habit: Habit) => void;
  index: number;
  disabled?: boolean;
}

export default function HabitCard({ habit, status, onToggle, onEdit, index, disabled }: HabitCardProps) {
  
  // This app treats habits as a simple checkbox:
  // - pending = unchecked
  // - completed = checked
  // We keep legacy compatibility for older logs that may contain `failed`.
  const effectiveStatus: HabitStatus = status === 'failed' ? 'pending' : status;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening edit modal
    if (disabled) return;
    
    const newStatus: HabitStatus = effectiveStatus === 'completed' ? 'pending' : 'completed';
    
    onToggle(habit.id, newStatus);
  };

  // Determine styling based on current status and habit category
  let cardClass = 'habit-card flex items-center justify-between cursor-pointer transition-all duration-300';
  let badgeClass = 'badge ';
  let iconBgClass = 'w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors duration-300 ';
  
  if (effectiveStatus === 'completed') {
    cardClass += habit.category === 'positive' 
      ? ' border-[var(--success)] shadow-[0_0_12px_var(--success-glow)] bg-[var(--card)]'
      : ' border-[var(--danger)] shadow-[0_0_12px_var(--danger-glow)] bg-[var(--card)]'; // you "completed" a bad habit = failure
    
    iconBgClass += habit.category === 'positive' ? 'bg-[var(--success-light)]' : 'bg-[var(--danger-light)]';
    badgeClass += habit.category === 'positive' ? 'badge-positive' : 'badge-negative';
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
      onClick={() => {
        if (disabled) return;
        onEdit(habit);
      }}
      title={disabled ? "Day finalized" : "Tap to Edit"}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={iconBgClass}>
          {habit.icon}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-[var(--fg)] text-base leading-snug truncate">{habit.name}</span>
          <div className="flex gap-2 items-center">
            <span className={badgeClass}>
              {habit.category === 'positive' ? 'Good' : 'Bad'}
            </span>
          </div>
        </div>
      </div>

      <button 
        onClick={handleToggle}
        className={`w-9 h-9 rounded-full border-2 border-[var(--border)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 z-10 flex-shrink-0 ${disabled ? 'opacity-60 cursor-not-allowed hover:scale-100 active:scale-100' : ''}`}
        style={{
           backgroundColor: effectiveStatus === 'completed' 
              ? (habit.category === 'positive' ? 'var(--success)' : 'var(--danger)')
              : 'transparent',
           borderColor: effectiveStatus !== 'pending' ? 'transparent' : 'var(--border)'
        }}
        disabled={!!disabled}
        title={disabled ? "Day finalized" : (effectiveStatus === 'completed' ? "Mark as not done" : "Mark as done")}
      >
        {effectiveStatus === 'completed' && <span className="text-white text-sm">✓</span>}
      </button>
    </div>
  );
}
