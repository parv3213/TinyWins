import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

interface HeaderProps {
  title?: string;
  showDate?: boolean;
}

export default function Header({ title, showDate = true }: HeaderProps) {
  const { user } = useAuth();
  
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="flex items-center justify-between py-4 mb-2">
      <div>
        {title ? (
          <h1 className="text-2xl">{title}</h1>
        ) : (
          <h1 className="text-2xl text-[var(--primary)] flex items-center gap-2">
            <span className="text-3xl">🌳</span> TinyWins
          </h1>
        )}
        {showDate && (
          <p className="text-sm font-medium text-[var(--muted-fg)] mt-1">{today}</p>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {user?.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={user.photoURL} 
            alt="Profile" 
            className="w-10 h-10 rounded-full border border-[var(--border)] shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center text-[var(--muted-fg)] font-medium">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : '?'}
          </div>
        )}
      </div>
    </header>
  );
}
