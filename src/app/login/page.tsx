'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInAnonymously } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Router will push in useEffect
    } catch (error) {
      console.error(error);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      await signInAnonymously();
      // Router will push in useEffect
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md animate-slideUp">
        <div className="text-center mb-8">
          <h1 className="mb-2">Welcome Back</h1>
          <p className="text-[var(--muted-fg)]">Sign in to watch your forest grow.</p>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          className="btn btn-secondary btn-full btn-lg font-medium mb-6 relative hover:scale-[1.02] transition-transform"
        >
          {/* Simple Google SVG Icon */}
          <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          Continue with Google
        </button>

        <button
          onClick={handleGuestSignIn}
          className="btn btn-primary btn-full btn-lg font-medium mb-6 hover:scale-[1.02] transition-transform"
        >
          Continue as guest
        </button>

        <div className="divider mb-6">Or continue with email</div>

        <form className="flex flex-col gap-4">
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email</label>
            <input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              className="input"
              disabled
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              className="input"
              disabled
            />
          </div>
          <button type="button" className="btn btn-primary btn-full btn-lg mt-2" disabled>
            Email login coming soon
          </button>
        </form>

        <p className="text-center text-sm text-[var(--muted-fg)] mt-6">
          By signing in, you agree to our <Link href="#" className="hover:underline">Terms</Link> and <Link href="#" className="hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
