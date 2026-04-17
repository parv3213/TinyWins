import { TreePhase } from "@/lib/treeProgression";
import { Butterfly, Insect, Particle, Sparkle } from "./particles";

interface TreeCondition {
    trunkColor: string;
    leafColor: string;
    leafDensity: number;
    leafDroop: number;
    barkDamageChance: number;
    deadwoodChance: number;
    saturation: number;
    leafClusterSize: number;
    leafClusterRadius: number;
    fruitChance: number;
}

interface PhasePreset {
    maxDepth: number;
    trunkThickness: number;
    trunkHeight: number;
    branchFan: number;
    spreadRad: number;
    lengthDecay: number;
    lengthJitter: number;
    thicknessDecay: number;
    branchBudget: number;
    viewScale: number;
    groundPad: number;
    leafTipSizeMul: number;
    hasFruit: boolean;
}

export class TreeRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private health: number;
    private displayHealth: number;
    private phase: TreePhase = "seed";
    private particles: Particle[] = [];
    private time: number = 0;
    private treeSeed: number = 1;
    private rngState: number = 1;
    private dpr: number = 1;
    private remainingBranchBudget: number = 0;
    /** Stronger sway / seed pulse for marketing hero loop. */
    private demoMotion: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.width = canvas.width;
        this.height = canvas.height;
        this.health = 50;
        this.displayHealth = 50;
        this.setTreeSeed();
    }

    setHealth(health: number) {
        this.health = Math.max(0, Math.min(100, health));
    }

    setPhase(phase: TreePhase) {
        if (phase === this.phase) return;
        this.phase = phase;
        this.setTreeSeed();
    }

    setDemoMotion(enabled: boolean) {
        this.demoMotion = enabled;
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

        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.setTreeSeed();
    }

    update() {
        this.time += 0.05;

        this.displayHealth += (this.health - this.displayHealth) * 0.08;

        // Particle spawn frequency scales with phase size and health.
        const phaseParticleWeight = this.getPhaseParticleWeight();
        const particleChance = 0.015 + this.displayHealth * 0.00025 + phaseParticleWeight * 0.025;
        const maxParticles = 70;

        if (this.particles.length < maxParticles && Math.random() < particleChance) {
            if (this.displayHealth > 70) {
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
                this.particles.push(
                    new Insect(
                        this.width * 0.3 + Math.random() * this.width * 0.4,
                        this.height * 0.4 + Math.random() * this.height * 0.4,
                    ),
                );
            }
        }

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

        const condition = this.getCondition();

        switch (this.phase) {
            case "seed":
                this.drawSeed(condition);
                break;
            case "sprout":
                this.drawSprout(condition);
                break;
            case "sapling":
                this.drawSapling(condition);
                break;
            case "young-tree":
                this.drawYoungTree(condition);
                break;
            case "mature-tree":
                this.drawMatureTree(condition);
                break;
        }

        this.particles.forEach((p) => p.draw(this.ctx));
    }

    private getCondition(): TreeCondition {
        const h = this.displayHealth;
        const h01 = Math.max(0, Math.min(1, h / 100));

        let trunkColor: string;
        if (h >= 70) trunkColor = "#5a3a24";
        else if (h >= 40) trunkColor = "#5c4033";
        else if (h >= 20) trunkColor = "#655048";
        else trunkColor = "#6a5a52";

        let leafColor: string;
        if (h >= 80) leafColor = "#4a7c59";
        else if (h >= 60) leafColor = "#7CB342";
        else if (h >= 40) leafColor = "#c7a93a";
        else if (h >= 20) leafColor = "#a07a25";
        else leafColor = "transparent";

        const leafDensity = Math.min(1, Math.max(0, (h - 10) / 70));
        const leafDroop = h < 45 ? ((45 - h) / 45) * 0.55 : 0;
        const barkDamageChance = h < 40 ? ((40 - h) / 40) * 0.22 : 0;
        const deadwoodChance = h < 35 ? ((35 - h) / 35) * 0.3 : 0;
        const saturation = Math.max(0.4, Math.min(1.15, 0.55 + h01 * 0.65));

        let leafClusterSize: number;
        if (h >= 80) leafClusterSize = 5;
        else if (h >= 60) leafClusterSize = 4;
        else if (h >= 40) leafClusterSize = 3;
        else if (h >= 20) leafClusterSize = 2;
        else leafClusterSize = 1;

        const leafClusterRadius = 4 + h01 * 4;
        const fruitChance = h >= 70 ? ((h - 70) / 30) * 0.35 : 0;

        return {
            trunkColor,
            leafColor,
            leafDensity,
            leafDroop,
            barkDamageChance,
            deadwoodChance,
            saturation,
            leafClusterSize,
            leafClusterRadius,
            fruitChance,
        };
    }

    private getPhaseParticleWeight(): number {
        switch (this.phase) {
            case "seed":
                return 0;
            case "sprout":
                return 0.1;
            case "sapling":
                return 0.35;
            case "young-tree":
                return 0.65;
            case "mature-tree":
                return 1;
        }
    }

    private drawSeed(condition: TreeCondition) {
        const centerX = this.width / 2;
        const groundY = this.height - 44;

        this.ctx.save();
        this.ctx.filter = `saturate(${condition.saturation})`;
        this.ctx.translate(centerX, groundY);

        // Soil mound — slightly compact so the sprout phase feels like a clear step up.
        this.ctx.fillStyle = this.displayHealth >= 50 ? "#8d6e63" : "#7b6156";
        this.ctx.beginPath();
        this.ctx.ellipse(0, 9, 62, 17, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Dormant seed half-buried in the mound — subtle “breathing” in hero demo.
        const seedPulse = this.demoMotion ? 1 + Math.sin(this.time * 1.1) * 0.04 : 1;
        this.ctx.fillStyle = this.displayHealth >= 40 ? "#6d4c41" : "#5d4037";
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 9.5 * seedPulse, 6.5 * seedPulse, -0.35, 0, Math.PI * 2);
        this.ctx.fill();

        // Subtle crack on the seed to hint at germination as health rises.
        if (this.displayHealth >= 45) {
            this.ctx.strokeStyle = "rgba(255,255,255,0.22)";
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(-3, -1.5);
            this.ctx.lineTo(2.5, 1.5);
            this.ctx.stroke();
        }

        // Tiny moss fleck on the mound when thriving.
        if (this.displayHealth >= 70) {
            this.ctx.fillStyle = "rgba(124, 179, 66, 0.55)";
            this.ctx.beginPath();
            this.ctx.ellipse(-18, 6, 5, 1.8, 0.1, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.ellipse(15, 9, 4, 1.6, -0.1, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    private drawSprout(condition: TreeCondition) {
        const centerX = this.width / 2;
        const groundY = this.height - 40;

        this.ctx.save();
        this.ctx.filter = `saturate(${condition.saturation})`;
        this.ctx.translate(centerX, groundY);

        // Small soil bump anchors the sprout so seed→sprout transition feels continuous.
        this.ctx.fillStyle = this.displayHealth >= 50 ? "#8d6e63" : "#7b6156";
        this.ctx.beginPath();
        this.ctx.ellipse(0, 8, 48, 14, 0, 0, Math.PI * 2);
        this.ctx.fill();

        const stemHeight = 58;
        const droop = condition.leafDroop;
        // Stem curves gently to one side; droop at low health.
        const curveX = 6 - droop * 14;
        const tipX = -2 + droop * 6;
        const tipY = -stemHeight + droop * 18;

        // Dying: stem is greyish-green instead of vivid.
        let stemColor = "#4a7c59";
        if (this.displayHealth < 40) stemColor = "#7a8b4a";
        if (this.displayHealth < 20) stemColor = "#6a6b52";

        this.ctx.strokeStyle = stemColor;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = "round";
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.quadraticCurveTo(curveX, -stemHeight * 0.55, tipX, tipY);
        this.ctx.stroke();

        // Two cotyledon leaves at the tip — this is the sprout's signature.
        this.ctx.save();
        this.ctx.translate(tipX, tipY);
        // Droop rotates the whole leaf pair downward.
        this.ctx.rotate(droop * 0.4);

        const leafColor = this.displayHealth < 20 ? "#8a6d1a" : this.displayHealth < 45 ? "#c7a93a" : "#7cb342";
        this.ctx.fillStyle = leafColor;
        this.ctx.globalAlpha = 0.92;

        // Left cotyledon.
        this.ctx.beginPath();
        this.ctx.ellipse(-7, 1, 9, 4.5, -0.55, 0, Math.PI * 2);
        this.ctx.fill();
        // Right cotyledon.
        this.ctx.beginPath();
        this.ctx.ellipse(7, 1, 9, 4.5, 0.55, 0, Math.PI * 2);
        this.ctx.fill();

        // Tiny highlight on the healthy pair.
        if (this.displayHealth >= 70) {
            this.ctx.fillStyle = "rgba(255,255,255,0.35)";
            this.ctx.beginPath();
            this.ctx.ellipse(-7, 0, 4, 1.6, -0.55, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.ellipse(7, 0, 4, 1.6, 0.55, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
        this.ctx.restore();

        // Optional mid-stem pair when thriving adds a bit of richness.
        if (this.displayHealth >= 65) {
            this.ctx.save();
            this.ctx.translate(curveX * 0.55, -stemHeight * 0.45);
            this.ctx.fillStyle = leafColor;
            this.ctx.globalAlpha = 0.85;
            this.ctx.beginPath();
            this.ctx.ellipse(-5, 0, 5, 2.2, -0.6, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.ellipse(5, 0, 5, 2.2, 0.6, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    private drawSapling(condition: TreeCondition) {
        const preset: PhasePreset = {
            maxDepth: 2,
            trunkThickness: 7,
            trunkHeight: 0.22,
            branchFan: 2,
            spreadRad: 0.9,
            lengthDecay: 0.68,
            lengthJitter: 0.12,
            thicknessDecay: 0.6,
            branchBudget: 60,
            viewScale: 0.95,
            groundPad: 20,
            leafTipSizeMul: 0.7,
            hasFruit: false,
        };
        this.drawTreeFromPreset(preset, condition);
    }

    private drawYoungTree(condition: TreeCondition) {
        const preset: PhasePreset = {
            maxDepth: 3,
            trunkThickness: 11,
            trunkHeight: 0.26,
            branchFan: 3,
            spreadRad: 1.1,
            lengthDecay: 0.72,
            lengthJitter: 0.15,
            thicknessDecay: 0.64,
            branchBudget: 160,
            viewScale: 0.88,
            groundPad: 24,
            leafTipSizeMul: 0.85,
            hasFruit: false,
        };
        this.drawTreeFromPreset(preset, condition);
    }

    private drawMatureTree(condition: TreeCondition) {
        const preset: PhasePreset = {
            maxDepth: 4,
            trunkThickness: 18,
            trunkHeight: 0.3,
            branchFan: 3,
            spreadRad: 1.35,
            lengthDecay: 0.74,
            lengthJitter: 0.18,
            thicknessDecay: 0.66,
            branchBudget: 320,
            viewScale: 0.78,
            groundPad: 28,
            leafTipSizeMul: 1,
            hasFruit: true,
        };
        this.drawTreeFromPreset(preset, condition);
    }

    private drawTreeFromPreset(preset: PhasePreset, condition: TreeCondition) {
        const trunkLength = this.height * preset.trunkHeight;

        this.ctx.save();
        this.ctx.filter = `saturate(${condition.saturation})`;
        this.ctx.scale(preset.viewScale, preset.viewScale);
        this.ctx.translate(
            this.width / 2 / preset.viewScale,
            (this.height - preset.groundPad) / preset.viewScale,
        );

        this.remainingBranchBudget = preset.branchBudget;

        this.drawBranch({
            level: 0,
            length: trunkLength,
            thickness: preset.trunkThickness,
            angle: 0,
            preset,
            condition,
            deadwood: false,
        });

        this.ctx.restore();
    }

    private drawBranch(args: {
        level: number;
        length: number;
        thickness: number;
        angle: number;
        preset: PhasePreset;
        condition: TreeCondition;
        deadwood: boolean;
    }) {
        const { level, length, thickness, angle, preset, condition, deadwood } = args;
        if (this.remainingBranchBudget <= 0) return;
        this.remainingBranchBudget -= 1;

        this.ctx.save();

        const motionMul = this.demoMotion ? 1.65 : 1;
        const sway = Math.sin(this.time + level) * 0.02 * (level + 1) * motionMul;
        this.ctx.rotate(angle + sway);

        // Deadwood branches render as pale grey; otherwise base trunk color.
        const segmentColor = deadwood ? "#8a8178" : condition.trunkColor;
        this.ctx.lineWidth = thickness;
        this.ctx.lineCap = "round";
        this.ctx.strokeStyle = segmentColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, -length);
        this.ctx.stroke();

        // Bark damage lesion (only on main trunk/large branches).
        if (
            !deadwood &&
            level <= 1 &&
            thickness > 4 &&
            condition.barkDamageChance > 0 &&
            this.random() < condition.barkDamageChance
        ) {
            this.ctx.fillStyle = "rgba(40, 28, 22, 0.55)";
            const ly = -length * (0.25 + this.random() * 0.5);
            const lw = Math.max(2, thickness * 0.45);
            this.ctx.beginPath();
            this.ctx.ellipse(lw * 0.1, ly, lw * 0.6, lw, 0.3, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.translate(0, -length);

        if (level < preset.maxDepth) {
            const fan = preset.branchFan;
            for (let i = 0; i < fan; i++) {
                if (this.remainingBranchBudget <= 0) break;

                // Spread child branches evenly across the cone, with a small jitter.
                const slot = fan === 1 ? 0 : (i / (fan - 1)) * 2 - 1;
                const newAngle = slot * (preset.spreadRad * 0.5) + (this.random() - 0.5) * 0.15;
                const jitter = 1 - preset.lengthJitter + this.random() * preset.lengthJitter * 2;
                const newLength = length * preset.lengthDecay * jitter;
                const newThickness = Math.max(1, thickness * preset.thicknessDecay);

                // Deadwood: a child branch becomes a bare stub with no leaves.
                const childDeadwood =
                    !deadwood && level >= 1 && this.random() < condition.deadwoodChance;

                this.drawBranch({
                    level: level + 1,
                    length: newLength,
                    thickness: newThickness,
                    angle: newAngle,
                    preset,
                    condition,
                    deadwood: childDeadwood,
                });
            }
        } else {
            this.drawLeafCluster(preset, condition, deadwood);
        }

        this.ctx.restore();
    }

    private drawLeafCluster(preset: PhasePreset, condition: TreeCondition, deadwood: boolean) {
        if (deadwood) return;
        if (condition.leafColor === "transparent") {
            // Very sick: leave a tiny bare twig, optionally a rotten speck.
            if (this.random() < 0.4) {
                this.ctx.fillStyle = "#4e342e";
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 2 + this.random() * 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
            return;
        }

        if (this.random() >= condition.leafDensity) return;

        this.ctx.save();
        this.ctx.rotate(condition.leafDroop * (0.4 + this.random() * 0.6));

        const baseRadius = condition.leafClusterRadius * preset.leafTipSizeMul;
        const count = Math.max(1, Math.round(condition.leafClusterSize * preset.leafTipSizeMul));

        this.ctx.fillStyle = condition.leafColor;
        this.ctx.globalAlpha = 0.82;

        for (let i = 0; i < count; i++) {
            const ox = (this.random() - 0.5) * baseRadius * 1.6;
            const oy = (this.random() - 0.5) * baseRadius * 1.2;
            const r = baseRadius * (0.6 + this.random() * 0.7);
            this.ctx.beginPath();
            if (this.displayHealth > 60) {
                this.ctx.arc(ox, oy, r, 0, Math.PI * 2);
            } else {
                this.ctx.ellipse(ox, oy, r * 0.55, r, 0, 0, Math.PI * 2);
            }
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;

        // Fruit only on mature trees and only when healthy enough.
        if (preset.hasFruit && condition.fruitChance > 0 && this.random() < condition.fruitChance) {
            this.ctx.fillStyle = "#ffb74d";
            this.ctx.beginPath();
            this.ctx.arc(baseRadius * 0.5, -baseRadius * 0.4, 3.5 + this.random() * 2.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    private setTreeSeed() {
        const phaseFactor = this.phaseToIndex(this.phase) + 1;
        const w = Math.max(1, Math.floor(this.width));
        const h = Math.max(1, Math.floor(this.height));
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

    private random() {
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
}
