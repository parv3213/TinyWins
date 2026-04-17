"use client";

import { useEffect, useState } from "react";

const DEMO_HABITS = [
    { emoji: "💧", label: "Drink water" },
    { emoji: "📖", label: "Read 10 min" },
    { emoji: "🚶", label: "Walk outside" },
    { emoji: "🧘", label: "Stretch" },
    { emoji: "📝", label: "Journal" },
    { emoji: "🍎", label: "Eat something green" },
    { emoji: "😴", label: "Sleep by 11" },
    { emoji: "🎯", label: "Deep work block" },
] as const;

type Step = "enter" | "check" | "leave";

function pickIndex(prev: number): number {
    if (DEMO_HABITS.length <= 1) return 0;
    let n = Math.floor(Math.random() * DEMO_HABITS.length);
    if (n === prev) n = (n + 1) % DEMO_HABITS.length;
    return n;
}

/**
 * Landing-page loop: habit slides in → checkmark → leaves → next random habit.
 */
export default function GrowthDemoHabits() {
    const [index, setIndex] = useState(0);
    const [step, setStep] = useState<Step>("enter");

    useEffect(() => {
        let cancelled = false;
        const timers: number[] = [];
        const after = (ms: number, fn: () => void) => {
            timers.push(window.setTimeout(() => {
                if (!cancelled) fn();
            }, ms));
        };

        let habitIdx = pickIndex(-1);

        const cycle = () => {
            if (cancelled) return;
            setIndex(habitIdx);
            setStep("enter");
            after(525, () => setStep("check"));
            after(1200, () => setStep("leave"));
            after(1650, () => {
                habitIdx = pickIndex(habitIdx);
                cycle();
            });
        };

        cycle();

        return () => {
            cancelled = true;
            timers.forEach((id) => window.clearTimeout(id));
        };
    }, []);

    const habit = DEMO_HABITS[index] ?? DEMO_HABITS[0];

    const transform =
        step === "enter"
            ? "translateY(10px) scale(0.96)"
            : step === "leave"
              ? "translateX(14px) scale(0.94)"
              : "translateY(0) scale(1)";

    const opacity = step === "leave" ? 0 : 1;

    return (
        <div
            className="pointer-events-none absolute inset-x-0 bottom-3 z-[40] flex justify-center px-2 md:bottom-4"
            aria-hidden
        >
            <div
                className="flex max-w-[min(100%,280px)] items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]/92 px-3 py-2 shadow-md backdrop-blur-sm transition-all duration-[375ms] ease-out"
                style={{
                    opacity,
                    transform,
                }}
            >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--success-light)] text-base">
                    {habit.emoji}
                </span>
                <span className="min-w-0 flex-1 text-left text-xs font-medium text-[var(--fg)]">{habit.label}</span>
                <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-200 ${
                        step === "check"
                            ? "scale-100 border-[var(--success)] bg-[var(--success)] text-white"
                            : "scale-75 border-[var(--border)] bg-[var(--muted)] text-transparent"
                    }`}
                >
                    ✓
                </span>
            </div>
        </div>
    );
}
