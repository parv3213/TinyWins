import { TreePhase } from "@/lib/treeProgression";
import { Butterfly, Insect, Particle, Sparkle } from "./particles";

export class TreeRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private health: number;
    private displayHealth: number;
    private phase: TreePhase = "seed";
    private displayPhaseIndex: number;
    private targetPhaseIndex: number;
    private particles: Particle[] = [];
    private time: number = 0;
    private treeSeed: number = 1;
    private rngState: number = 1;
    private dpr: number = 1;
    private remainingBranchBudget: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.width = canvas.width;
        this.height = canvas.height;
        this.health = 50;
        this.displayHealth = 50;
        this.displayPhaseIndex = this.phaseToIndex(this.phase);
        this.targetPhaseIndex = this.displayPhaseIndex;
        this.setTreeSeed();
    }

    setHealth(health: number) {
        this.health = Math.max(0, Math.min(100, health));
    }

    setPhase(phase: TreePhase) {
        this.phase = phase;
        this.targetPhaseIndex = this.phaseToIndex(phase);
        this.setTreeSeed();
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;

        const rawDpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        this.dpr = Math.min(2, rawDpr);
        const pixelWidth = Math.max(1, Math.round(width * this.dpr));
        const pixelHeight = Math.max(1, Math.round(height * this.dpr));

        this.canvas.width = pixelWidth;
        this.canvas.height = pixelHeight;

        // Keep drawing coordinates in CSS pixels.
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.setTreeSeed();
    }

    update() {
        this.time += 0.05;

        this.displayHealth += (this.health - this.displayHealth) * 0.08;
        this.displayPhaseIndex += (this.targetPhaseIndex - this.displayPhaseIndex) * 0.1;
        this.displayPhaseIndex = Math.max(0, Math.min(4, this.displayPhaseIndex));

        const phaseWeight = this.getPhaseWeight(this.displayPhaseIndex);
        const particleChance = 0.015 + this.displayHealth * 0.00025 + phaseWeight * 0.025;
        const maxParticles = 70;

        // Spawn particles based on health
        if (this.particles.length < maxParticles && Math.random() < particleChance) {
            if (this.displayHealth > 70) {
                // Flourishing - butterflies and sparkles
                if (Math.random() > 0.5) {
                    this.particles.push(
                        new Butterfly(
                            this.width * 0.2 + Math.random() * this.width * 0.6,
                            this.height * 0.2 + Math.random() * this.height * 0.5,
                        ),
                    );
                } else if (Math.random() > 0.8) {
                    this.particles.push(
                        new Sparkle(
                            this.width * 0.2 + Math.random() * this.width * 0.6,
                            this.height * 0.1 + Math.random() * this.height * 0.6,
                        ),
                    );
                }
            } else if (this.displayHealth < 30) {
                // Struggling/Dying - insects
                this.particles.push(
                    new Insect(
                        this.width * 0.3 + Math.random() * this.width * 0.4,
                        this.height * 0.4 + Math.random() * this.height * 0.4,
                    ),
                );
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (
                this.particles[i].life >= this.particles[i].maxLife ||
                this.particles[i].y < 0 ||
                this.particles[i].y > this.height ||
                this.particles[i].x < 0 ||
                this.particles[i].x > this.width
            ) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.rngState = this.treeSeed;

        if (this.displayPhaseIndex < 0.4) {
            this.drawSeedStage();
            this.particles.forEach((p) => p.draw(this.ctx));
            return;
        }

        const phaseParams = this.getPhaseParams(this.displayPhaseIndex);

        // Calculate global tree parameters based on health
        const maxBranches = Math.floor(
            phaseParams.branchDepthMin + (this.displayHealth / 100) * phaseParams.branchDepthSpread,
        );
        const clampedMaxBranches = Math.min(8, Math.max(2, maxBranches));
        const trunkThickness =
            phaseParams.trunkThicknessMin + (this.displayHealth / 100) * phaseParams.trunkThicknessSpread;
        const trunkHeight =
            this.height * phaseParams.trunkHeightMin +
            (this.displayHealth / 100) * this.height * phaseParams.trunkHeightSpread;

        // Colors
        let trunkColor = "#5c4033"; // Base brown
        if (this.displayHealth < 30)
            trunkColor = "#5d504a"; // Greyish brown
        else if (this.displayHealth > 70) trunkColor = "#654321"; // Rich brown

        let leafColor = "#4a7c59"; // Success green
        if (this.displayHealth < 20)
            leafColor = "transparent"; // No leaves
        else if (this.displayHealth < 40)
            leafColor = "#9E9D24"; // Yellowish green
        else if (this.displayHealth < 60) leafColor = "#7CB342"; // Lighter green

        // Default "zoomed out" view with a bit of ground padding.
        // Healthier trees get bigger (more depth, thicker trunk, bigger leaves),
        // so we zoom out a bit more as health increases to avoid clipping.
        const viewScale = Math.min(
            phaseParams.viewScaleMax,
            Math.max(
                phaseParams.viewScaleMin,
                phaseParams.viewScaleMax - (this.displayHealth / 100) * phaseParams.viewScaleHealthFactor,
            ),
        );
        const groundPad = phaseParams.groundPad;

        this.ctx.save();
        this.ctx.scale(viewScale, viewScale);
        // Translate after scaling without scaling the translation distance.
        this.ctx.translate(this.width / 2 / viewScale, (this.height - groundPad) / viewScale);

        // Keep recursion bounded to avoid exponential work at high growth settings.
        this.remainingBranchBudget = Math.round(280 + this.displayHealth * 2.2 + this.displayPhaseIndex * 130);

        // Draw the tree recursively
        this.drawBranch(0, trunkHeight, trunkThickness, 0, clampedMaxBranches, trunkColor, leafColor, phaseParams);

        this.ctx.restore();

        // Draw particles
        this.particles.forEach((p) => p.draw(this.ctx));
    }

    private drawBranch(
        level: number,
        length: number,
        thickness: number,
        angle: number,
        maxLevel: number,
        trunkColor: string,
        leafColor: string,
        phaseParams: ReturnType<TreeRenderer["getPhaseParams"]>,
    ) {
        if (this.remainingBranchBudget <= 0) return;
        this.remainingBranchBudget -= 1;

        this.ctx.save();

        // Add wind sway effect
        // Lower branches sway less, higher branches sway more
        const sway = Math.sin(this.time + level) * 0.02 * (level + 1);
        this.ctx.rotate(angle + sway);

        // Draw branch
        this.ctx.lineWidth = thickness;
        this.ctx.lineCap = "round";
        this.ctx.strokeStyle = trunkColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, -length);
        this.ctx.stroke();

        // Move to end of branch
        this.ctx.translate(0, -length);

        if (level < maxLevel) {
            // Branch out
            // Higher health = more branches
            const branchCountBase = phaseParams.branchCountBase;
            const branchCountSpread = phaseParams.branchCountSpread;
            const branchCount = Math.max(
                1,
                Math.round(branchCountBase + (this.displayHealth / 100) * 0.8 + this.random() * branchCountSpread),
            );
            const limitedBranchCount = Math.min(3, branchCount);

            for (let i = 0; i < limitedBranchCount; i++) {
                if (this.remainingBranchBudget <= 0) break;
                const spread =
                    0.25 + phaseParams.spreadBase + (this.displayHealth / 100) * phaseParams.spreadHealthBoost;
                const newAngle = (this.random() - 0.5) * spread;
                const newLength = length * (phaseParams.lengthDecayMin + this.random() * phaseParams.lengthDecaySpread);
                const newThickness = thickness * phaseParams.thicknessDecay;

                this.drawBranch(
                    level + 1,
                    newLength,
                    newThickness,
                    newAngle,
                    maxLevel,
                    trunkColor,
                    leafColor,
                    phaseParams,
                );
            }
        } else {
            // Leaf/Fruit rendering at branch tips
            if (
                leafColor !== "transparent" &&
                this.random() < this.displayHealth / 100 + phaseParams.leafPresenceBoost
            ) {
                this.ctx.fillStyle = leafColor;
                this.ctx.globalAlpha = 0.8;

                // Draw leaf
                const leafSize = phaseParams.leafSizeMin + (this.displayHealth / 100) * phaseParams.leafSizeSpread;
                this.ctx.beginPath();
                if (this.displayHealth > 60) {
                    // Fluffy round leaves for healthy trees
                    this.ctx.arc(0, 0, leafSize, 0, Math.PI * 2);
                } else {
                    // Sparse elliptical leaves
                    this.ctx.ellipse(0, 0, leafSize / 2, leafSize, 0, 0, Math.PI * 2);
                }
                this.ctx.fill();
                this.ctx.globalAlpha = 1;

                // Draw fruits/flowers if very healthy
                if (this.displayHealth >= 80 && this.random() < phaseParams.fruitChance) {
                    this.ctx.fillStyle = "#ffb74d"; // Orange fruit
                    this.ctx.beginPath();
                    this.ctx.arc(leafSize / 2, -leafSize / 2, 4 + this.random() * 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }

            // Draw rotten fruits if dying
            if (this.displayHealth <= 20 && this.random() < 0.4) {
                this.ctx.fillStyle = "#4e342e"; // Dark rotten
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 3 + this.random() * 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        this.ctx.restore();
    }

    private setTreeSeed() {
        const phaseFactor = this.phaseToIndex(this.phase) + 1;
        const w = Math.max(1, Math.floor(this.width));
        const h = Math.max(1, Math.floor(this.height));
        // cheap hash -> 32-bit seed
        let seed = 2166136261;
        seed ^= 0x9e3779b9 + phaseFactor;
        seed = Math.imul(seed, 16777619);
        seed ^= w;
        seed = Math.imul(seed, 16777619);
        seed ^= h;
        seed = Math.imul(seed, 16777619);
        this.treeSeed = seed >>> 0;
        this.rngState = this.treeSeed;
    }

    private drawSeedStage() {
        const centerX = this.width / 2;
        const groundY = this.height - 44;

        this.ctx.save();
        this.ctx.translate(centerX, groundY);

        // Soil mound
        this.ctx.fillStyle = this.displayHealth >= 50 ? "#8d6e63" : "#7b6156";
        this.ctx.beginPath();
        this.ctx.ellipse(0, 10, 78, 22, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Seed body
        this.ctx.fillStyle = this.displayHealth >= 40 ? "#6d4c41" : "#5d4037";
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 10, 7, -0.35, 0, Math.PI * 2);
        this.ctx.fill();

        // Sprout appears as health improves
        if (this.displayHealth >= 35) {
            const sproutHeight = 8 + ((this.displayHealth - 35) / 65) * 24;

            this.ctx.strokeStyle = "#4a7c59";
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = "round";
            this.ctx.beginPath();
            this.ctx.moveTo(0, -1);
            this.ctx.quadraticCurveTo(2, -sproutHeight * 0.5, 0, -sproutHeight);
            this.ctx.stroke();

            this.ctx.fillStyle = this.displayHealth >= 65 ? "#66bb6a" : "#7cb342";
            this.ctx.beginPath();
            this.ctx.ellipse(-4, -sproutHeight + 2, 6, 3, -0.55, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.ellipse(4, -sproutHeight + 2, 6, 3, 0.55, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    private random() {
        // mulberry32
        let t = (this.rngState += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        const out = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        this.rngState = this.rngState >>> 0;
        return out;
    }

    private phaseToIndex(phase: TreePhase): number {
        if (phase === "seed") return 0;
        if (phase === "sprout") return 1;
        if (phase === "sapling") return 2;
        if (phase === "young-tree") return 3;
        return 4;
    }

    private getPhaseWeight(phaseIndex: number): number {
        return Math.max(0, Math.min(1, phaseIndex / 4));
    }

    private getPhaseParams(phaseIndex: number) {
        const presets = [
            {
                branchDepthMin: 2,
                branchDepthSpread: 2,
                trunkThicknessMin: 6,
                trunkThicknessSpread: 5,
                trunkHeightMin: 0.18,
                trunkHeightSpread: 0.05,
                viewScaleMin: 0.88,
                viewScaleMax: 0.96,
                viewScaleHealthFactor: 0.06,
                groundPad: 18,
                branchCountBase: 1,
                branchCountSpread: 1,
                spreadBase: 0.08,
                spreadHealthBoost: 0.35,
                lengthDecayMin: 0.64,
                lengthDecaySpread: 0.14,
                thicknessDecay: 0.68,
                leafPresenceBoost: 0.18,
                leafSizeMin: 5,
                leafSizeSpread: 6,
                fruitChance: 0.08,
            },
            {
                branchDepthMin: 3,
                branchDepthSpread: 3,
                trunkThicknessMin: 8,
                trunkThicknessSpread: 7,
                trunkHeightMin: 0.2,
                trunkHeightSpread: 0.07,
                viewScaleMin: 0.84,
                viewScaleMax: 0.94,
                viewScaleHealthFactor: 0.08,
                groundPad: 20,
                branchCountBase: 1,
                branchCountSpread: 1.4,
                spreadBase: 0.12,
                spreadHealthBoost: 0.42,
                lengthDecayMin: 0.62,
                lengthDecaySpread: 0.16,
                thicknessDecay: 0.66,
                leafPresenceBoost: 0.2,
                leafSizeMin: 6,
                leafSizeSpread: 8,
                fruitChance: 0.12,
            },
            {
                branchDepthMin: 4,
                branchDepthSpread: 4,
                trunkThicknessMin: 11,
                trunkThicknessSpread: 9,
                trunkHeightMin: 0.22,
                trunkHeightSpread: 0.09,
                viewScaleMin: 0.8,
                viewScaleMax: 0.92,
                viewScaleHealthFactor: 0.11,
                groundPad: 22,
                branchCountBase: 2,
                branchCountSpread: 1.4,
                spreadBase: 0.18,
                spreadHealthBoost: 0.48,
                lengthDecayMin: 0.6,
                lengthDecaySpread: 0.2,
                thicknessDecay: 0.65,
                leafPresenceBoost: 0.24,
                leafSizeMin: 8,
                leafSizeSpread: 10,
                fruitChance: 0.18,
            },
            {
                branchDepthMin: 5,
                branchDepthSpread: 5,
                trunkThicknessMin: 14,
                trunkThicknessSpread: 12,
                trunkHeightMin: 0.24,
                trunkHeightSpread: 0.1,
                viewScaleMin: 0.76,
                viewScaleMax: 0.9,
                viewScaleHealthFactor: 0.14,
                groundPad: 24,
                branchCountBase: 2,
                branchCountSpread: 1.8,
                spreadBase: 0.24,
                spreadHealthBoost: 0.54,
                lengthDecayMin: 0.58,
                lengthDecaySpread: 0.22,
                thicknessDecay: 0.64,
                leafPresenceBoost: 0.28,
                leafSizeMin: 9,
                leafSizeSpread: 12,
                fruitChance: 0.24,
            },
            {
                branchDepthMin: 6,
                branchDepthSpread: 7,
                trunkThicknessMin: 16,
                trunkThicknessSpread: 16,
                trunkHeightMin: 0.25,
                trunkHeightSpread: 0.11,
                viewScaleMin: 0.72,
                viewScaleMax: 0.88,
                viewScaleHealthFactor: 0.16,
                groundPad: 26,
                branchCountBase: 2,
                branchCountSpread: 2,
                spreadBase: 0.3,
                spreadHealthBoost: 0.62,
                lengthDecayMin: 0.56,
                lengthDecaySpread: 0.24,
                thicknessDecay: 0.63,
                leafPresenceBoost: 0.3,
                leafSizeMin: 10,
                leafSizeSpread: 15,
                fruitChance: 0.3,
            },
        ] as const;

        const clamped = Math.max(0, Math.min(4, phaseIndex));
        const low = Math.floor(clamped);
        const high = Math.min(4, low + 1);
        const t = clamped - low;
        const from = presets[low];
        const to = presets[high];

        return {
            branchDepthMin: from.branchDepthMin + (to.branchDepthMin - from.branchDepthMin) * t,
            branchDepthSpread: from.branchDepthSpread + (to.branchDepthSpread - from.branchDepthSpread) * t,
            trunkThicknessMin: from.trunkThicknessMin + (to.trunkThicknessMin - from.trunkThicknessMin) * t,
            trunkThicknessSpread: from.trunkThicknessSpread + (to.trunkThicknessSpread - from.trunkThicknessSpread) * t,
            trunkHeightMin: from.trunkHeightMin + (to.trunkHeightMin - from.trunkHeightMin) * t,
            trunkHeightSpread: from.trunkHeightSpread + (to.trunkHeightSpread - from.trunkHeightSpread) * t,
            viewScaleMin: from.viewScaleMin + (to.viewScaleMin - from.viewScaleMin) * t,
            viewScaleMax: from.viewScaleMax + (to.viewScaleMax - from.viewScaleMax) * t,
            viewScaleHealthFactor:
                from.viewScaleHealthFactor + (to.viewScaleHealthFactor - from.viewScaleHealthFactor) * t,
            groundPad: from.groundPad + (to.groundPad - from.groundPad) * t,
            branchCountBase: from.branchCountBase + (to.branchCountBase - from.branchCountBase) * t,
            branchCountSpread: from.branchCountSpread + (to.branchCountSpread - from.branchCountSpread) * t,
            spreadBase: from.spreadBase + (to.spreadBase - from.spreadBase) * t,
            spreadHealthBoost: from.spreadHealthBoost + (to.spreadHealthBoost - from.spreadHealthBoost) * t,
            lengthDecayMin: from.lengthDecayMin + (to.lengthDecayMin - from.lengthDecayMin) * t,
            lengthDecaySpread: from.lengthDecaySpread + (to.lengthDecaySpread - from.lengthDecaySpread) * t,
            thicknessDecay: from.thicknessDecay + (to.thicknessDecay - from.thicknessDecay) * t,
            leafPresenceBoost: from.leafPresenceBoost + (to.leafPresenceBoost - from.leafPresenceBoost) * t,
            leafSizeMin: from.leafSizeMin + (to.leafSizeMin - from.leafSizeMin) * t,
            leafSizeSpread: from.leafSizeSpread + (to.leafSizeSpread - from.leafSizeSpread) * t,
            fruitChance: from.fruitChance + (to.fruitChance - from.fruitChance) * t,
        };
    }
}
