/**
 * Arena & Environment Engine
 * Supports Circle, Box, Hexagon, Pinball bumpers, Rotating spinners, and Shrinking Storm
 */

class Arena {
  constructor(type = 'circle', width = 800, height = 600) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.cx = width / 2;
    this.cy = height / 2;
    this.baseRadius = Math.min(width, height) * 0.44;
    this.currentRadius = this.baseRadius;
    this.minRadius = Math.min(width, height) * 0.15;
    
    // Storm (Battle Royale shrinking circle)
    this.stormActive = false;
    this.stormTimer = 0;
    this.stormShrinkRate = 0.4;
    this.stormDamageTick = 0;

    // Obstacles
    this.bumpers = []; // Pinball bumpers
    this.spinners = []; // Rotating bars
    this.initObstacles();

    // Pulse animation
    this.pulseAngle = 0;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.cx = width / 2;
    this.cy = height / 2;
    this.baseRadius = Math.min(width, height) * 0.44;
    if (!this.stormActive) {
      this.currentRadius = this.baseRadius;
    }
    this.minRadius = Math.min(width, height) * 0.15;
    this.initObstacles();
  }

  setType(type) {
    this.type = type;
    this.initObstacles();
  }

  initObstacles() {
    this.bumpers = [];
    this.spinners = [];

    if (this.type === 'pinball') {
      const offset = this.baseRadius * 0.4;
      this.bumpers = [
        { x: this.cx, y: this.cy - offset * 0.7, r: 24, power: 1.6, color: '#f43f5e' },
        { x: this.cx - offset, y: this.cy + offset * 0.6, r: 24, power: 1.6, color: '#06b6d4' },
        { x: this.cx + offset, y: this.cy + offset * 0.6, r: 24, power: 1.6, color: '#fbbf24' }
      ];
    } else if (this.type === 'rotating') {
      this.spinners = [
        { x: this.cx, y: this.cy, length: this.baseRadius * 0.65, angle: 0, speed: 0.03, width: 14 }
      ];
    }
  }

  resetStorm() {
    this.currentRadius = this.baseRadius;
    this.stormActive = false;
    this.stormTimer = 0;
  }

  startStorm() {
    this.stormActive = true;
    this.stormTimer = 0;
  }

  update(dt, fighters = [], particleSystem = null, speedMultiplier = 1) {
    this.pulseAngle += 0.03 * speedMultiplier;

    // Update spinners
    for (const spinner of this.spinners) {
      spinner.angle += spinner.speed * speedMultiplier;
    }

    // Shrink storm in battle royale
    if (this.stormActive) {
      this.stormTimer += dt * speedMultiplier;
      if (this.currentRadius > this.minRadius) {
        this.currentRadius -= this.stormShrinkRate * speedMultiplier * 0.5;
        if (this.currentRadius < this.minRadius) this.currentRadius = this.minRadius;
      }

      // Apply storm damage to fighters outside
      this.stormDamageTick += dt * speedMultiplier;
      if (this.stormDamageTick >= 0.5) {
        this.stormDamageTick = 0;
        for (const fighter of fighters) {
          if (!fighter.isDead && !this.isInside(fighter.x, fighter.y, fighter.radius)) {
            fighter.takeDamage(15, null, particleSystem, 'storm');
            if (particleSystem) {
              particleSystem.spawnSparks(fighter.x, fighter.y, '#ef4444', 3);
            }
          }
        }
      }
    }
  }

  isInside(x, y, radius = 0) {
    if (this.type === 'box') {
      const halfW = (this.width * 0.86) / 2;
      const halfH = (this.height * 0.86) / 2;
      return (
        x - radius >= this.cx - halfW &&
        x + radius <= this.cx + halfW &&
        y - radius >= this.cy - halfH &&
        y + radius <= this.cy + halfH
      );
    } else if (this.type === 'hexagon') {
      // Approximate with radial check
      const dist = Math.hypot(x - this.cx, y - this.cy);
      return dist + radius <= this.currentRadius * 0.95;
    } else {
      // Circle / Pinball / Rotating
      const dist = Math.hypot(x - this.cx, y - this.cy);
      return dist + radius <= this.currentRadius;
    }
  }

  render(ctx) {
    ctx.save();

    // 1. Draw Arena Grid / Background Glow
    const bgGrad = ctx.createRadialGradient(this.cx, this.cy, 20, this.cx, this.cy, this.baseRadius * 1.2);
    bgGrad.addColorStop(0, 'rgba(168, 85, 247, 0.05)');
    bgGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.4)');
    bgGrad.addColorStop(1, 'rgba(5, 7, 15, 0.9)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Draw Main Arena Boundary
    ctx.lineWidth = 4;
    ctx.shadowBlur = 18;

    if (this.type === 'box') {
      const halfW = (this.width * 0.86) / 2;
      const halfH = (this.height * 0.86) / 2;
      ctx.strokeStyle = '#c084fc';
      ctx.shadowColor = '#a855f7';
      ctx.strokeRect(this.cx - halfW, this.cy - halfH, halfW * 2, halfH * 2);

      // Inner grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(this.cx, this.cy - halfH);
      ctx.lineTo(this.cx, this.cy + halfH);
      ctx.moveTo(this.cx - halfW, this.cy);
      ctx.lineTo(this.cx + halfW, this.cy);
      ctx.stroke();

    } else if (this.type === 'hexagon') {
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      this.drawPolygon(ctx, this.cx, this.cy, this.currentRadius, 6);
      ctx.stroke();

    } else {
      // Circle Default / Pinball / Spinner
      ctx.strokeStyle = this.stormActive ? '#f43f5e' : '#a855f7';
      ctx.shadowColor = this.stormActive ? '#ef4444' : '#c084fc';
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, this.currentRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Outer Danger Ring if Storm Active
      if (this.stormActive && this.currentRadius < this.baseRadius) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.setLineDash([8, 8]);
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(this.cx, this.cy, this.baseRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 3. Render Pinball Bumpers
    for (const b of this.bumpers) {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = b.color;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 3;
      ctx.fillStyle = '#1e1b4b';

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner glowing core
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Render Rotating Spinners
    for (const s of this.spinners) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);

      ctx.shadowBlur = 20;
      ctx.shadowColor = '#f59e0b';
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-s.length / 2, -s.width / 2, s.length, s.width);

      // Center Hub
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, s.width * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  drawPolygon(ctx, x, y, radius, sides) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
}
