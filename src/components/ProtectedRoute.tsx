'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

// Wrap the app to require login on specific routes
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      // Don't redirect if we're on the login page or public profile
      if (pathname !== '/login' && !pathname.startsWith('/profile/')) {
         router.push('/login');
      }
    }
  }, [user, loading, router, pathname]);

  if (loading) {
     return (
        <div className="loading-screen">
          <div className="spinner"></div>
        </div>
      );
  }

  // If not logged in, return null while router redirects
  if (!user && pathname !== '/login' && !pathname.startsWith('/profile/')) {
    return null;
  }

  return <>{children}</>;
}
