'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 sm:py-16">
      <div className="card card-auth w-full max-w-2xl animate-slideUp">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-center">Privacy Policy</h1>
            <p className="text-center text-[var(--muted-fg)]">
              This is a placeholder. Replace with your real privacy policy.
            </p>
          </div>

          <div className="flex flex-col gap-3 text-sm text-[var(--muted-fg)]">
            <p>
              We store authentication information via your selected sign-in method and keep
              your habit data in the app’s database so the product can function.
            </p>
            <p>
              If you prefer, you can host your privacy policy elsewhere and link to it from
              the login screen.
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

