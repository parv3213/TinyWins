'use client';

import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserStats } from '@/lib/habits';
import { UserStats } from '@/lib/types';
import TreeCanvas from '@/components/tree/TreeCanvas';
import PageShell from '@/components/PageShell';
import { getTreePhaseFromXp } from '@/lib/treeProgression';

type PublicUserDoc = {
  displayName?: string | null;
  photoURL?: string | null;
  createdAt?: Timestamp | { seconds: number; nanoseconds: number } | string | null;
  shareEnabled?: boolean;
};

function yearFromCreatedAt(createdAt: PublicUserDoc['createdAt']): number | null {
  if (!createdAt) return null;
  if (typeof createdAt === 'string') {
    const d = new Date(createdAt);
    return Number.isFinite(d.getTime()) ? d.getFullYear() : null;
  }
  // Firestore Timestamp
  if (createdAt instanceof Timestamp) return createdAt.toDate().getFullYear();
  // Plain object timestamp (in case of serialization)
  if (typeof createdAt === 'object' && 'seconds' in createdAt) {
    const ms = createdAt.seconds * 1000;
    const d = new Date(ms);
    return Number.isFinite(d.getTime()) ? d.getFullYear() : null;
  }
  return null;
}

export default function ProfilePage({
  params
}: {
  params: { uid: string } | Promise<{ uid: string }>;
}) {
  const [uid, setUid] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [profile, setProfile] = useState<PublicUserDoc | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(params)
      .then((p) => {
        if (!cancelled) setUid(p?.uid ?? null);
      })
      .catch((e) => {
        console.error('Failed to resolve route params', e);
        if (!cancelled) setUid(null);
      });
    return () => {
      cancelled = true;
    };
  }, [params]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!uid) return;
      setLoading(true);
      setError(false);
      setShareEnabled(false);
      setProfile(null);
      setStats(null);

      try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          if (!cancelled) setShareEnabled(false);
          return;
        }

        const userData = userSnap.data() as PublicUserDoc;
        const enabled = userData.shareEnabled === true;
        if (!cancelled) {
          setProfile(userData);
          setShareEnabled(enabled);
        }

        if (!enabled) return;

        const fetchedStats = await getUserStats(uid);
        if (!cancelled) setStats(fetchedStats);
      } catch (e) {
        console.error('Failed to load public profile', e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const trackingYear = useMemo(() => yearFromCreatedAt(profile?.createdAt), [profile?.createdAt]);
  const displayName = profile?.displayName || 'Forester';
  const treePhase = getTreePhaseFromXp(stats?.treeXp ?? 0);

  if (!uid || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dotted">
        <div className="card text-center max-w-sm">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-[var(--muted-fg)] text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (error || !shareEnabled || !stats) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-dotted">
          <div className="card text-center max-w-sm">
             <div className="text-4xl mb-4">🙈</div>
             <h2 className="mb-2">Profile Unavailable</h2>
             <p className="text-[var(--muted-fg)] text-sm mb-4">This profile may be private or does not exist.</p>
          </div>
       </div>
    );
  }

  return (
    <PageShell className="pt-8">
      <header className="flex flex-col items-center justify-center text-center mb-8 animate-fadeIn">
        {profile?.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photoURL}
            alt="Profile"
            className="w-20 h-20 rounded-full border-2 border-[var(--border)] mb-3 shadow-[var(--shadow-md)] object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-3xl font-medium mb-3 shadow-[var(--shadow-md)]">
            {(displayName?.[0] ?? uid?.[0] ?? 'F').toUpperCase()}
          </div>
        )}
        <h1 className="text-3xl mb-1">{displayName}&apos;s Forest</h1>
        <p className="text-[var(--muted-fg)] font-medium">
          Tracking habits{trackingYear ? ` since ${trackingYear}` : ''}
        </p>
      </header>

      <main className="flex flex-col gap-6">
        
        {/* Tree Gamification Widget */}
        <section className="animate-slideUp" style={{ animationDelay: '100ms' }}>
          <TreeCanvas health={stats.treeHealth} phase={treePhase} />
        </section>

        {/* Quick Stats Grid */}
        <section className="grid grid-cols-2 gap-4 animate-slideUp" style={{ animationDelay: '200ms' }}>
           <div className="card-flat p-4 flex flex-col items-center justify-center text-center">
              <span className="stat-label">Current Streak</span>
              <div className="flex items-center gap-1 mt-1">
                 <span className="stat-number">{stats.currentStreak}</span>
                 <span className="text-2xl">🔥</span>
              </div>
           </div>
           
           <div className="card-flat p-4 flex flex-col items-center justify-center text-center">
              <span className="stat-label">Tree Health</span>
              <div className="flex items-center gap-1 mt-1">
                 <span className="stat-number">{stats.treeHealth}%</span>
              </div>
           </div>
        </section>
        
        {/* CTA */}
        <section className="mt-8 text-center animate-fadeIn" style={{ animationDelay: '500ms' }}>
             <p className="text-sm text-[var(--muted-fg)] mb-4">Want to start your own forest?</p>
             <a
               href="/login"
               className="btn btn-primary btn-lg rounded-full px-8 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
             >
               Build Better Habits
             </a>
        </section>
      </main>
    </PageShell>
  );
}
