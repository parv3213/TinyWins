'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 sm:py-16">
      <div className="card card-auth w-full max-w-2xl animate-slideUp">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-center">Terms</h1>
            <p className="text-center text-[var(--muted-fg)]">
              This is a placeholder. Replace with your real Terms of Service.
            </p>
          </div>

          <div className="flex flex-col gap-3 text-sm text-[var(--muted-fg)]">
            <p>
              Habit Tracker is provided as-is. You’re responsible for how you use the app and
              for any data you enter.
            </p>
            <p>
              If you’d like, you can link to an external hosted policy page instead of using
              these routes.
            </p>
          </div>

          <div className="flex items-center justify-center pt-2">
            <Link href="/login" className="btn btn-ghost">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

