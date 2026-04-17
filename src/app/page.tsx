"use client";

import GrowthDemoHabits from "@/components/tree/GrowthDemoHabits";
import TreeCanvas from "@/components/tree/TreeCanvas";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push("/dashboard");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col">
            {/* Ambient background */}
            <div className="absolute inset-0 bg-dotted opacity-50 z-[-1]"></div>

            {/* Header */}
            <header className="p-6 flex items-center justify-between">
                <div className="text-2xl text-[var(--primary)] font-bold flex items-center gap-2">
                    <span className="text-3xl">🌳</span> TinyWins
                </div>
                <Link href="/login" className="btn btn-ghost hover:bg-[var(--card)] hover:shadow-sm">
                    Sign In
                </Link>
            </header>

            {/* Hero Section */}
            <main className="flex-1 app-container flex flex-col pt-12 pb-24 text-center">
                <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6 tracking-tight">
                    Tiny wins.
                    <br />
                    <span className="text-[var(--success)] italic">Real</span> momentum.
                </h1>

                <p className="text-lg text-[var(--muted-fg)] mb-6 max-w-md mx-auto">
                    A minimalist habit tracker that makes consistency feel calm, clear, and rewarding.
                </p>

                <Link
                    href="/login"
                    className="btn btn-primary btn-lg inline-flex self-center rounded-full px-8 text-lg font-medium shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all mb-16"
                >
                    Start Free — Always
                </Link>

                {/* Demo Tree Canvas */}
                <div className="relative max-w-sm mx-auto w-full transition-transform hover:scale-[1.02] duration-500 cursor-default">
                    <div className="absolute -inset-4 bg-[var(--primary)] blur-[60px] opacity-10 rounded-full z-[-1]"></div>
                    <TreeCanvas growthCycleDemo showGrowthTip={false} />
                    <GrowthDemoHabits />
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left">
                    <div className="card-flat bg-[var(--card)]/80 hover:bg-[var(--card)] transition-colors">
                        <div className="text-3xl mb-4">🌱</div>
                        <h3 className="text-lg font-semibold mb-2">Build Better Habits</h3>
                        <p className="text-sm text-[var(--muted-fg)]">
                            Track positive routines and avoid negative ones. Takes less than 30 seconds a day.
                        </p>
                    </div>
                    <div className="card-flat bg-[var(--card)]/80 hover:bg-[var(--card)] transition-colors">
                        <div className="text-3xl mb-4">🌳</div>
                        <h3 className="text-lg font-semibold mb-2">Visual Growth</h3>
                        <p className="text-sm text-[var(--muted-fg)]">
                            Your tree reflects your choices. Complete habits to see it flourish, ignore them and watch
                            it decay.
                        </p>
                    </div>
                    <div className="card-flat bg-[var(--card)]/80 hover:bg-[var(--card)] transition-colors">
                        <div className="text-3xl mb-4">📊</div>
                        <h3 className="text-lg font-semibold mb-2">Insightful Trends</h3>
                        <p className="text-sm text-[var(--muted-fg)]">
                            View Apple Fitness-style completion rings, monthly bars, and track your longest streaks.
                        </p>
                    </div>
                </div>
            </main>

            <footer className="site-footer mt-8 py-8 text-sm text-[var(--muted-fg)]">
                <div className="app-container mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="text-2xl text-[var(--primary)] font-bold flex items-center gap-2">
                            <span className="text-3xl">🌳</span> TinyWins
                        </div>
                    </div>

                    <div className="text-xs text-[var(--muted-fg)]">© {new Date().getFullYear()} TinyWins.</div>
                </div>
            </footer>
        </div>
    );
}
