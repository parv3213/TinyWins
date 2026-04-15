export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  angle: number;
  speed: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.size = 1;
    this.color = '#fff';
    this.life = 0;
    this.maxLife = 100;
    this.angle = 0;
    this.speed = 0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life++;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    const a = 1 - (this.life / this.maxLife);
    ctx.globalAlpha = a < 0 ? 0 : a;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export class Butterfly extends Particle {
  wingAngle: number = 0;

  constructor(x: number, y: number) {
    super(x, y);
    this.maxLife = 300 + Math.random() * 200;
    this.size = 2 + Math.random() * 2;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = 0.5 + Math.random() * 1;
    
    // Pastel colors
    const colors = ['#FFF9C4', '#E1BEE7', '#FFCCBC', '#C8E6C9', '#BBDEFB'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    // Gentle erratic path
    this.angle += (Math.random() - 0.5) * 0.5;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed - 0.2; // Slight upward bias
    
    this.wingAngle += 0.3; // Flapping

    super.update();
  }

  draw(ctx: CanvasRenderingContext2D) {
    const a = 1 - (this.life / this.maxLife);
    if (a <= 0) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.globalAlpha = a;
    
    // Draw wings
    ctx.fillStyle = this.color;
    const flap = Math.sin(this.wingAngle) * this.size;
    
    ctx.beginPath();
    ctx.ellipse(0, -flap, this.size, this.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(0, flap, this.size, this.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

export class Insect extends Particle {
  constructor(x: number, y: number) {
    super(x, y);
    this.maxLife = 200 + Math.random() * 100;
    this.size = 1 + Math.random() * 1.5;
    this.color = '#3e2723'; // Dark brown
    this.angle = Math.random() * Math.PI * 2;
    this.speed = 1.5 + Math.random() * 2;
  }

  update() {
    // Aggressive erratic buzzing
    this.angle += (Math.random() - 0.5) * 1.5;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    super.update();
  }
}

export class Sparkle extends Particle {
  constructor(x: number, y: number) {
    super(x, y);
    this.maxLife = 50 + Math.random() * 50;
    this.size = 1 + Math.random() * 3;
    this.color = '#FBC02D'; // Gold
    this.vy = -0.5 - Math.random() * 1;
  }
  
  draw(ctx: CanvasRenderingContext2D) {
    const a = Math.sin((this.life / this.maxLife) * Math.PI); // Fade in and out
    if (a <= 0) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = a;
    ctx.fillStyle = this.color;
    
    // Star shape
    ctx.beginPath();
    ctx.moveTo(0, -this.size);
    ctx.quadraticCurveTo(this.size*0.2, -this.size*0.2, this.size, 0);
    ctx.quadraticCurveTo(this.size*0.2, this.size*0.2, 0, this.size);
    ctx.quadraticCurveTo(-this.size*0.2, this.size*0.2, -this.size, 0);
    ctx.quadraticCurveTo(-this.size*0.2, -this.size*0.2, 0, -this.size);
    ctx.fill();
    
    ctx.restore();
  }
}
