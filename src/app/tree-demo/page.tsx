"use client";

import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import PageShell from "@/components/PageShell";
import TreeCanvas from "@/components/tree/TreeCanvas";
import { getTreeLevelFromXp, getTreePhaseFromXp, getTreePhaseLabel } from "@/lib/treeProgression";
import { useMemo, useState } from "react";

const XP_MIN = 0;
const XP_MAX = 1200;
const HEALTH_MIN = 0;
const HEALTH_MAX = 100;

export default function TreeDemoPage() {
    const [xp, setXp] = useState(0);
    const [health, setHealth] = useState(70);

    const phase = useMemo(() => getTreePhaseFromXp(xp), [xp]);
    const level = useMemo(() => getTreeLevelFromXp(xp), [xp]);

    const applyPreset = (nextXp: number, nextHealth: number) => {
        setXp(nextXp);
        setHealth(nextHealth);
    };

    return (
        <PageShell>
            <Header />

            <main className="flex flex-col gap-6">
                <section className="card-flat p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                            <h1 className="text-2xl">Tree Demo Lab</h1>
                            <p className="text-sm text-[var(--muted-fg)] mt-1">
                                Public testing controls for tree progression and health.
                            </p>
                        </div>
                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-[var(--muted)] text-[var(--muted-fg)]">
                            phase: {getTreePhaseLabel(phase).toLowerCase()}
                        </span>
                    </div>
                </section>

                <section>
                    <TreeCanvas health={health} phase={phase} />
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card-flat p-5">
                        <label htmlFor="demo-xp" className="text-sm font-medium text-[var(--muted-fg)] block mb-2">
                            XP ({xp})
                        </label>
                        <input
                            id="demo-xp"
                            type="range"
                            min={XP_MIN}
                            max={XP_MAX}
                            value={xp}
                            onChange={(e) => setXp(Number(e.target.value))}
                            className="w-full"
                        />
                        <div className="mt-3 text-sm text-[var(--muted-fg)]">
                            Tree Level: <span className="text-[var(--fg)] font-semibold">{level}</span>
                        </div>
                        <div className="mt-1 text-sm text-[var(--muted-fg)]">
                            Tree State:{" "}
                            <span className="text-[var(--fg)] font-semibold">{getTreePhaseLabel(phase)}</span>
                        </div>
                    </div>

                    <div className="card-flat p-5">
                        <label htmlFor="demo-health" className="text-sm font-medium text-[var(--muted-fg)] block mb-2">
                            Health ({health}%)
                        </label>
                        <input
                            id="demo-health"
                            type="range"
                            min={HEALTH_MIN}
                            max={HEALTH_MAX}
                            value={health}
                            onChange={(e) => setHealth(Number(e.target.value))}
                            className="w-full"
                        />
                        <div className="mt-3 text-sm text-[var(--muted-fg)]">
                            Health band:{" "}
                            <span className="text-[var(--fg)] font-semibold">
                                {health >= 80
                                    ? "flourishing"
                                    : health >= 60
                                      ? "healthy"
                                      : health >= 40
                                        ? "growing"
                                        : health >= 20
                                          ? "struggling"
                                          : "dying"}
                            </span>
                        </div>
                    </div>
                </section>

                <section className="card-flat p-5">
                    <h2 className="text-base">Quick Presets</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button className="btn btn-ghost" onClick={() => applyPreset(0, 25)}>
                            Seed + Low Health
                        </button>
                        <button className="btn btn-ghost" onClick={() => applyPreset(120, 78)}>
                            Seed + High Health
                        </button>
                        <button className="btn btn-ghost" onClick={() => applyPreset(260, 65)}>
                            Sapling + Mid Health
                        </button>
                        <button className="btn btn-ghost" onClick={() => applyPreset(360, 90)}>
                            Sapling + Flourishing
                        </button>
                        <button className="btn btn-ghost" onClick={() => applyPreset(620, 82)}>
                            Tree + Healthy
                        </button>
                        <button className="btn btn-ghost" onClick={() => applyPreset(980, 15)}>
                            Tree + Dying
                        </button>
                    </div>
                </section>
            </main>

            <BottomNav />
        </PageShell>
    );
}
