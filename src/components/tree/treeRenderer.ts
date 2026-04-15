import { Particle, Butterfly, Insect, Sparkle } from './particles';

export class TreeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private health: number; 
  private particles: Particle[] = [];
  private time: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
    this.health = 50;
  }

  setHealth(health: number) {
    this.health = Math.max(0, Math.min(100, health));
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
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
    
    this.ctx.save();
    this.ctx.translate(this.width / 2, this.height);
    
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
      const branchCount = this.health < 30 ? 2 : (this.health > 80 ? Math.floor(Math.random() * 2) + 2 : 2);
      
      for (let i = 0; i < branchCount; i++) {
        const spread = 0.3 + (this.health / 100) * 0.6; // Angle spread
        const newAngle = (Math.random() - 0.5) * spread;
        const newLength = length * (0.6 + Math.random() * 0.2);
        const newThickness = thickness * 0.65;
        
        this.drawBranch(level + 1, newLength, newThickness, newAngle, maxLevel, trunkColor, leafColor);
      }
    } else {
      // Leaf/Fruit rendering at branch tips
      if (leafColor !== 'transparent' && Math.random() < (this.health / 100) + 0.2) {
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
        if (this.health >= 80 && Math.random() < 0.3) {
           this.ctx.fillStyle = '#ffb74d'; // Orange fruit
           this.ctx.beginPath();
           this.ctx.arc(leafSize/2, -leafSize/2, 4 + Math.random() * 3, 0, Math.PI * 2);
           this.ctx.fill();
        }
      }
      
      // Draw rotten fruits if dying
      if (this.health <= 20 && Math.random() < 0.4) {
          this.ctx.fillStyle = '#4e342e'; // Dark rotten
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 3 + Math.random() * 2, 0, Math.PI * 2);
          this.ctx.fill();
      }
    }
    
    this.ctx.restore();
  }
}
