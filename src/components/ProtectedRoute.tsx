'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

// Wrap the app to require login on specific routes
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute =
    pathname === '/login' ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname.startsWith('/profile/');

  useEffect(() => {
    if (!loading && !user) {
      // Don't redirect if we're on the login page or public profile
      if (!isPublicRoute) {
         router.push('/login');
      }
    }
  }, [user, loading, router, isPublicRoute]);

  if (loading) {
     return (
        <div className="loading-screen">
          <div className="spinner"></div>
        </div>
      );
  }

  // If not logged in, return null while router redirects
  if (!user && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}
