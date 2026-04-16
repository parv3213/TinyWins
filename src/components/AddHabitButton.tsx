'use client';

export default function AddHabitButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fab transition-transform hover:scale-110"
      aria-label="Add new habit"
    >
      <span className="fab-ring" aria-hidden="true"></span>
      
      {/* Plus icon */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  );
}
