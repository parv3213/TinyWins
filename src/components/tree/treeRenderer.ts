import { Particle, Butterfly, Insect, Sparkle } from './particles';

export class TreeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private health: number; 
  private particles: Particle[] = [];
  private time: number = 0;
  private treeSeed: number = 1;
  private rngState: number = 1;
  private dpr: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
    this.health = 50;
    this.setTreeSeed();
  }

  setHealth(health: number) {
    this.health = Math.max(0, Math.min(100, health));
    this.setTreeSeed();
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
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
    
    // Spawn particles based on health
    if (Math.random() < 0.05) {
      if (this.health > 70) {
        // Flourishing - butterflies and sparkles
        if (Math.random() > 0.5) {
            this.particles.push(new Butterfly(this.width * 0.2 + Math.random() * this.width * 0.6, this.height * 0.2 + Math.random() * this.height * 0.5));
        } else if (Math.random() > 0.8) {
             this.particles.push(new Sparkle(this.width * 0.2 + Math.random() * this.width * 0.6, this.height * 0.1 + Math.random() * this.height * 0.6));
        }
      } else if (this.health < 30) {
        // Struggling/Dying - insects
        this.particles.push(new Insect(this.width * 0.3 + Math.random() * this.width * 0.4, this.height * 0.4 + Math.random() * this.height * 0.4));
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].life >= this.particles[i].maxLife || 
          this.particles[i].y < 0 || this.particles[i].y > this.height ||
          this.particles[i].x < 0 || this.particles[i].x > this.width) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.rngState = this.treeSeed;
    
    // Calculate global tree parameters based on health
    const maxBranches = Math.floor(6 + (this.health / 100) * 8); // 6 to 14 recursive depth
    const trunkThickness = 15 + (this.health / 100) * 20;
    const trunkHeight = this.height * 0.25 + (this.health / 100) * this.height * 0.1;
    
    // Colors
    let trunkColor = '#5c4033'; // Base brown
    if (this.health < 30) trunkColor = '#5d504a'; // Greyish brown
    else if (this.health > 70) trunkColor = '#654321'; // Rich brown
    
    let leafColor = '#4a7c59'; // Success green
    if (this.health < 20) leafColor = 'transparent'; // No leaves
    else if (this.health < 40) leafColor = '#9E9D24'; // Yellowish green
    else if (this.health < 60) leafColor = '#7CB342'; // Lighter green
    
    // Default "zoomed out" view with a bit of ground padding.
    // Healthier trees get bigger (more depth, thicker trunk, bigger leaves),
    // so we zoom out a bit more as health increases to avoid clipping.
    const viewScale = Math.min(0.9, Math.max(0.72, 0.9 - (this.health / 100) * 0.18));
    const groundPad = 26;

    this.ctx.save();
    this.ctx.scale(viewScale, viewScale);
    // Translate after scaling without scaling the translation distance.
    this.ctx.translate((this.width / 2) / viewScale, (this.height - groundPad) / viewScale);
    
    // Draw the tree recursively
    this.drawBranch(0, trunkHeight, trunkThickness, 0, maxBranches, trunkColor, leafColor);
    
    this.ctx.restore();

    // Draw particles
    this.particles.forEach(p => p.draw(this.ctx));
  }

  private drawBranch(level: number, length: number, thickness: number, angle: number, maxLevel: number, trunkColor: string, leafColor: string) {
    this.ctx.save();
    
    // Add wind sway effect
    // Lower branches sway less, higher branches sway more
    const sway = Math.sin(this.time + level) * 0.02 * (level + 1);
    this.ctx.rotate(angle + sway);
    
    // Draw branch
    this.ctx.lineWidth = thickness;
    this.ctx.lineCap = 'round';
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
      const branchCount = this.health < 30 ? 2 : (this.health > 80 ? Math.floor(this.random() * 2) + 2 : 2);
      
      for (let i = 0; i < branchCount; i++) {
        const spread = 0.3 + (this.health / 100) * 0.6; // Angle spread
        const newAngle = (this.random() - 0.5) * spread;
        const newLength = length * (0.6 + this.random() * 0.2);
        const newThickness = thickness * 0.65;
        
        this.drawBranch(level + 1, newLength, newThickness, newAngle, maxLevel, trunkColor, leafColor);
      }
    } else {
      // Leaf/Fruit rendering at branch tips
      if (leafColor !== 'transparent' && this.random() < (this.health / 100) + 0.2) {
        this.ctx.fillStyle = leafColor;
        this.ctx.globalAlpha = 0.8;
        
        // Draw leaf
        const leafSize = 10 + (this.health / 100) * 15;
        this.ctx.beginPath();
        if (this.health > 60) {
            // Fluffy round leaves for healthy trees
            this.ctx.arc(0, 0, leafSize, 0, Math.PI * 2);
        } else {
             // Sparse elliptical leaves
            this.ctx.ellipse(0, 0, leafSize/2, leafSize, 0, 0, Math.PI * 2);
        }
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        
        // Draw fruits/flowers if very healthy
        if (this.health >= 80 && this.random() < 0.3) {
           this.ctx.fillStyle = '#ffb74d'; // Orange fruit
           this.ctx.beginPath();
           this.ctx.arc(leafSize/2, -leafSize/2, 4 + this.random() * 3, 0, Math.PI * 2);
           this.ctx.fill();
        }
      }
      
      // Draw rotten fruits if dying
      if (this.health <= 20 && this.random() < 0.4) {
          this.ctx.fillStyle = '#4e342e'; // Dark rotten
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 3 + this.random() * 2, 0, Math.PI * 2);
          this.ctx.fill();
      }
    }
    
    this.ctx.restore();
  }

  private setTreeSeed() {
    const healthBucket = Math.round(this.health / 5); // stable-ish changes
    const w = Math.max(1, Math.floor(this.width));
    const h = Math.max(1, Math.floor(this.height));
    // cheap hash -> 32-bit seed
    let seed = 2166136261;
    seed ^= healthBucket + 0x9e3779b9;
    seed = Math.imul(seed, 16777619);
    seed ^= w;
    seed = Math.imul(seed, 16777619);
    seed ^= h;
    seed = Math.imul(seed, 16777619);
    this.treeSeed = seed >>> 0;
    this.rngState = this.treeSeed;
  }

  private random() {
    // mulberry32
    let t = (this.rngState += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const out = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    this.rngState = this.rngState >>> 0;
    return out;
  }
}
