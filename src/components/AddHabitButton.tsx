'use client';

export default function AddHabitButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-[80px] right-6 w-14 h-14 rounded-full bg-[var(--primary)] text-white shadow-[0_4px_12px_rgba(166,124,82,0.4)] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-40 outline-none focus:ring-4 focus:ring-[var(--accent)]"
      aria-label="Add new habit"
    >
      {/* Decorative inner ring */}
      <div className="absolute inset-1 rounded-full border border-[rgba(255,255,255,0.3)]"></div>
      
      {/* Plus icon */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  );
}
