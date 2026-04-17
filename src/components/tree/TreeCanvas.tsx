"use client";

import {
    STREAK_XP_MULTIPLIER_CAP,
    getEstimatedDaysToMatureTreeRange,
    getStreakXpMultiplier,
    getTreePhaseLabel,
    type TreePhase,
} from "@/lib/treeProgression";
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { TreeRenderer } from "./treeRenderer";

interface TreeCanvasProps {
    /** Ignored when `growthCycleDemo` is true (landing hero drives its own values). */
    health?: number;
    phase?: TreePhase;
    /** When set, the growth tip includes your current streak XP boost. */
    currentStreak?: number;
    /** Explains rough time to mature tree and streak benefits. Off for marketing hero. */
    showGrowthTip?: boolean;
    /**
     * Loops seed → mature with rising health, then resets (marketing / education).
     * Real dashboards should omit this.
     */
    growthCycleDemo?: boolean;
}

const HERO_PHASE_CYCLE: TreePhase[] = ["seed", "sprout", "sapling", "young-tree", "mature-tree"];
const HERO_HEALTH_BY_PHASE = [52, 62, 72, 82, 90];

export default function TreeCanvas({
    health = 70,
    phase,
    currentStreak,
    showGrowthTip = true,
    growthCycleDemo = false,
}: TreeCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<TreeRenderer | null>(null);
    const animationRef = useRef<number>(0);
    const lastFrameTimeRef = useRef<number>(0);
    const [isClient, setIsClient] = useState(false);
    const [demoPhase, setDemoPhase] = useState<TreePhase>("seed");
    const [demoHealth, setDemoHealth] = useState(HERO_HEALTH_BY_PHASE[0]!);
    const [growthTipHovered, setGrowthTipHovered] = useState(false);
    const [growthTipPinned, setGrowthTipPinned] = useState(false);
    const growthTipWrapRef = useRef<HTMLDivElement>(null);

    const growthTipOpen = growthTipHovered || growthTipPinned;

    const effectiveHealth = growthCycleDemo ? demoHealth : health;
    const displayPhase: TreePhase | undefined = growthCycleDemo ? demoPhase : phase;

    const growthTipLines = useMemo(() => {
        const { minDays, maxDays } = getEstimatedDaysToMatureTreeRange();
        const streakCapPct = Math.round(STREAK_XP_MULTIPLIER_CAP * 100);
        const lines: string[] = [
            `A mature tree is roughly ${minDays}–${maxDays} days away, depending on how much you complete when you finish each day.`,
            `Streaks add up to +${streakCapPct}% XP once your streak reaches 8 days, which pulls that range toward the lower end.`,
        ];
        if (currentStreak !== undefined) {
            const boost = Math.max(0, Math.round((getStreakXpMultiplier(currentStreak) - 1) * 100));
            lines.push(`Your streak today: +${boost}% XP.`);
        }
        return lines;
    }, [currentStreak]);

    useEffect(() => {
        if (!growthTipPinned) return;
        const onDocMouseDown = (e: globalThis.MouseEvent) => {
            const el = growthTipWrapRef.current;
            if (el && !el.contains(e.target as Node)) {
                setGrowthTipPinned(false);
            }
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setGrowthTipPinned(false);
        };
        document.addEventListener("mousedown", onDocMouseDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onDocMouseDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [growthTipPinned]);

    const toggleGrowthTipPin = useCallback((e: ReactMouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setGrowthTipPinned((p) => !p);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsClient(true);
    }, []);

    // Sync tree health to global UI tint (very subtle).
    useEffect(() => {
        if (!isClient) return;

        let tintColor = "transparent";
        if (effectiveHealth >= 80)
            tintColor = "rgba(74, 124, 89, 0.04)"; // healthy green
        else if (effectiveHealth >= 60)
            tintColor = "rgba(74, 124, 89, 0.028)"; // lighter green
        else if (effectiveHealth >= 40)
            tintColor = "rgba(196, 168, 130, 0.022)"; // warm neutral
        else tintColor = "rgba(156, 75, 75, 0.028)"; // struggling red

        document.documentElement.style.setProperty("--global-tint", tintColor);

        return () => {
            document.documentElement.style.setProperty("--global-tint", "transparent");
        };
    }, [effectiveHealth, isClient]);

    useEffect(() => {
        if (!growthCycleDemo || !isClient) return;

        let cancelled = false;
        const timers: number[] = [];
        const after = (ms: number, fn: () => void) => {
            timers.push(
                window.setTimeout(() => {
                    if (!cancelled) fn();
                }, ms),
            );
        };

        let i = 0;

        const advance = () => {
            if (cancelled) return;
            if (i < HERO_PHASE_CYCLE.length - 1) {
                i += 1;
                setDemoPhase(HERO_PHASE_CYCLE[i]!);
                setDemoHealth(HERO_HEALTH_BY_PHASE[i]!);
                after(1950, advance);
            } else {
                after(2100, () => {
                    if (cancelled) return;
                    i = 0;
                    setDemoPhase(HERO_PHASE_CYCLE[0]!);
                    setDemoHealth(HERO_HEALTH_BY_PHASE[0]!);
                    after(1950, advance);
                });
            }
        };

        after(1950, advance);

        return () => {
            cancelled = true;
            timers.forEach((id) => window.clearTimeout(id));
        };
    }, [growthCycleDemo, isClient]);

    useEffect(() => {
        if (!isClient || !canvasRef.current || !containerRef.current) return;

        // Initialize renderer if not exists
        if (!rendererRef.current) {
            rendererRef.current = new TreeRenderer(canvasRef.current);
        }

        const renderer = rendererRef.current;

        // Set initial and handle resize
        const handleResize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                renderer.resize(clientWidth, clientHeight);
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        // Animation Loop
        const targetFrameMs = 1000 / 30;
        const animate = (now: number) => {
            if (!lastFrameTimeRef.current) lastFrameTimeRef.current = now;
            const elapsed = now - lastFrameTimeRef.current;

            if (elapsed >= targetFrameMs) {
                lastFrameTimeRef.current = now - (elapsed % targetFrameMs);
                renderer.update();
                renderer.draw();
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationRef.current);
        };
    }, [isClient]);

    useEffect(() => {
        rendererRef.current?.setDemoMotion(!!growthCycleDemo);
    }, [growthCycleDemo, isClient]);

    useEffect(() => {
        rendererRef.current?.setHealth(effectiveHealth);
    }, [effectiveHealth]);

    useEffect(() => {
        if (!rendererRef.current) return;
        if (growthCycleDemo) {
            rendererRef.current.setPhase(demoPhase);
        } else if (phase) {
            rendererRef.current.setPhase(phase);
        }
    }, [growthCycleDemo, demoPhase, phase]);

    if (!isClient) {
        return (
            <div className="w-full h-64 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    // Determine glow class based on health
    let glowClass = "";
    if (effectiveHealth >= 60) glowClass = "glow-healthy";
    else if (effectiveHealth <= 40) glowClass = "glow-struggling";

    // Determine sky background
    let skyStyle = {};
    if (effectiveHealth >= 80) skyStyle = { background: "var(--tree-sky-healthy)" };
    else if (effectiveHealth >= 40) skyStyle = { background: "var(--tree-sky-growing)" };
    else skyStyle = { background: "var(--tree-sky-struggling)" };

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-[350px] rounded-2xl overflow-hidden border border-[var(--border)] shadow-[var(--shadow-sm)] glow-container ${glowClass}`}
            style={skyStyle}
            title={`Tree Health: ${effectiveHealth}%`}
        >
            {/* CSS Glow overlay */}
            <div className="absolute inset-0 z-0"></div>

            {/* Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 z-10 w-full h-full" />

            {/* Glass reflection overlays (subtle, mirror-like) */}
            <div
                className="absolute inset-0 z-[15] pointer-events-none"
                style={{
                    background:
                        "linear-gradient(130deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.16) 18%, rgba(255,255,255,0.06) 32%, rgba(255,255,255,0) 58%)",
                    opacity: 0.55,
                    mixBlendMode: "overlay",
                }}
            ></div>
            <div
                className="absolute inset-0 z-[15] pointer-events-none"
                style={{
                    background:
                        "linear-gradient(12deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 28%, rgba(255,255,255,0) 54%)",
                    opacity: 0.5,
                }}
            ></div>

            {/* Ground Overlay */}
            <div
                className="absolute bottom-0 left-0 right-0 h-12 z-20 transition-colors duration-1000"
                style={{
                    background:
                        effectiveHealth >= 60
                            ? "var(--tree-ground-healthy)"
                            : effectiveHealth >= 40
                              ? "var(--tree-ground-growing)"
                              : "var(--tree-ground-struggling)",
                    borderTopLeftRadius: "50% 20px",
                    borderTopRightRadius: "50% 20px",
                }}
            ></div>

            {/* State Badge */}
            <div className="absolute top-4 left-4 z-30 bg-[var(--card)]/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[var(--border)] shadow-sm">
                <span className="text-sm font-medium text-[var(--fg)]">
                    {displayPhase ? `${getTreePhaseLabel(displayPhase)} • ` : ""}
                    {effectiveHealth >= 80
                        ? "Flourishing"
                        : effectiveHealth >= 60
                          ? "Healthy"
                          : effectiveHealth >= 40
                            ? "Growing"
                            : effectiveHealth >= 20
                              ? "Struggling"
                              : "Dying"}
                </span>
            </div>

            {showGrowthTip && (
                <div
                    ref={growthTipWrapRef}
                    className="absolute bottom-3 right-3 z-[40] flex flex-col items-end gap-1.5"
                    onMouseEnter={() => setGrowthTipHovered(true)}
                    onMouseLeave={() => setGrowthTipHovered(false)}
                >
                    {growthTipOpen && (
                        <div
                            id="tree-growth-tip"
                            role="region"
                            aria-label="Tree growth and streaks"
                            className="relative mb-0.5 max-w-[min(272px,calc(100vw-3rem))] animate-fadeIn"
                        >
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 shadow-[0_1px_3px_rgba(74,63,53,0.08)]">
                                <p className="m-0 text-[11px] font-normal leading-[1.4] text-[var(--fg)]">
                                    {growthTipLines.map((line, i) => (
                                        <span key={i} className={i > 0 ? "mt-1.5 block text-[var(--muted-fg)]" : ""}>
                                            {line}
                                        </span>
                                    ))}
                                </p>
                            </div>
                            {/* Tooltip arrow (design system: pointer + rounded surface) */}
                            <div
                                className="pointer-events-none absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border border-[var(--border)] border-t-0 border-l-0 bg-[var(--card)] shadow-[1px_1px_0_rgba(74,63,53,0.04)]"
                                aria-hidden
                            />
                        </div>
                    )}
                    <button
                        type="button"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]/95 text-[var(--muted-fg)] shadow-[0_1px_3px_rgba(74,63,53,0.08)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--fg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                        aria-expanded={growthTipOpen}
                        aria-controls={growthTipOpen ? "tree-growth-tip" : undefined}
                        aria-label="Show how tree growth and streaks work"
                        title="Growth tips"
                        onClick={toggleGrowthTipPin}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path
                                d="M12 16v-4M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
