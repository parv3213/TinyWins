"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
    const { user, loading, signInWithGoogle, signInAnonymously } = useAuth();
    const router = useRouter();
    const [submitting, setSubmitting] = useState<"google" | "guest" | null>(null);

    useEffect(() => {
        if (user && !loading) {
            router.push("/dashboard");
        }
    }, [user, loading, router]);

    const handleGoogleSignIn = async () => {
        try {
            setSubmitting("google");
            await signInWithGoogle();
            // Router will push in useEffect
        } catch (error) {
            console.error(error);
            setSubmitting(null);
        }
    };

    const handleGuestSignIn = async () => {
        try {
            setSubmitting("guest");
            await signInAnonymously();
            // Router will push in useEffect
        } catch (error) {
            console.error(error);
            setSubmitting(null);
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

    const isBusy = submitting !== null;

    return (
        <div
            className="relative z-10"
            style={{
                minHeight: "100dvh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 16px",
            }}
        >
            <div
                className="card w-full animate-slideUp"
                style={{
                    maxWidth: 448,
                    padding: 24,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 20,
                    }}
                >
                    <div>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-fg)] hover:text-[var(--fg)] transition-colors"
                        >
                            <span aria-hidden="true">←</span>
                            Back to home
                        </Link>
                    </div>

                    <div style={{ textAlign: "center" }}>
                        <h1 style={{ marginBottom: 8 }}>Welcome Back</h1>
                        <p style={{ margin: 0, color: "var(--muted-fg)" }}>Sign in to watch your forest grow.</p>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                        }}
                    >
                        <button
                            onClick={handleGoogleSignIn}
                            className="btn btn-primary btn-full btn-lg font-medium relative hover:scale-[1.02] transition-transform"
                            disabled={isBusy}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                width="24"
                                height="24"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                                focusable="false"
                                className="shrink-0"
                            >
                                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                    <path
                                        fill="#4285F4"
                                        d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                                    />
                                </g>
                            </svg>
                            {submitting === "google" ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="spinner w-5 h-5 border-2"></span>
                                    Signing in…
                                </span>
                            ) : (
                                "Continue with Google"
                            )}
                        </button>

                        <button
                            onClick={handleGuestSignIn}
                            className="btn btn-secondary btn-full btn-lg font-medium hover:scale-[1.02] transition-transform"
                            disabled={isBusy}
                        >
                            {submitting === "guest" ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="spinner w-5 h-5 border-2"></span>
                                    Signing in…
                                </span>
                            ) : (
                                "Continue as guest"
                            )}
                        </button>
                    </div>

                    <p
                        style={{
                            textAlign: "center",
                            fontSize: 14,
                            lineHeight: 1.5,
                            color: "var(--muted-fg)",
                            margin: 0,
                        }}
                    >
                        By signing in, you agree to our{" "}
                        <Link href="/terms" className="hover:underline">
                            Terms
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="hover:underline">
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}
