'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
     if (!user) return;
     const link = `${window.location.origin}/profile/${user.uid}`;
     navigator.clipboard.writeText(link);
     
     // Show toast
     const toast = document.getElementById('share-toast');
     if (toast) {
        toast.className = "toast show";
        setTimeout(() => { toast.className = "toast"; }, 2500);
     }
  };

  if (!user) return null;

  return (
    <div className="container pb-24">
      <Header title="Settings" showDate={false} />

      <main className="flex flex-col gap-6 mt-4">
        
        {/* Profile Card */}
        <div className="card-flat flex items-center gap-4 p-5">
           {user.photoURL ? (
             // eslint-disable-next-line @next/next/no-img-element
             <img src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-full border-2 border-[var(--border)]" />
           ) : (
             <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center text-xl text-[var(--muted-fg)]">
               {user.displayName?.charAt(0).toUpperCase() || '?'}
             </div>
           )}
           <div>
              <h2 className="text-xl mb-1">{user.displayName || 'Anonymous Forester'}</h2>
              <p className="text-sm text-[var(--muted-fg)]">{user.email}</p>
           </div>
        </div>

        {/* Settings List */}
        <div className="card-flat p-0 overflow-hidden">
           <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <h3 className="text-sm font-medium text-[var(--muted-fg)] uppercase tracking-wider">Account</h3>
           </div>
           
           <div className="p-4 border-b border-[var(--border)] flex items-center justify-between hover:bg-[var(--muted)]/20 transition-colors">
              <div>
                 <p className="font-medium">Public Profile</p>
                 <p className="text-xs text-[var(--muted-fg)] mt-1">Let others view your tree and stats.</p>
              </div>
              <button onClick={handleCopyLink} className="btn btn-secondary btn-sm">
                 Copy Link
              </button>
           </div>

           <div 
              onClick={handleSignOut}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--danger-light)] transition-colors group"
           >
              <div>
                 <p className="font-medium text-[var(--danger)]">Sign Out</p>
              </div>
              {loading ? (
                <div className="spinner w-5 h-5 border-[var(--danger)]"></div>
              ) : (
                <div className="text-[var(--danger)] opacity-50 group-hover:opacity-100 transition-opacity">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                   </svg>
                </div>
              )}
           </div>
        </div>

        <div className="text-center mt-4">
           <p className="text-xs text-[var(--muted-fg)]">Habit Tracker v1.0.0</p>
           <p className="text-xs text-[var(--muted-fg)] mt-1">Built with Next.js & Firebase</p>
        </div>

      </main>

      <div id="share-toast" className="toast">
         Link copied to clipboard!
      </div>

      <BottomNav activePath="/settings" />
    </div>
  );
}
