/**
 * Particle & Visual Effects Engine - Zero Residual Clutter Edition
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.damageTexts = [];
    this.slashes = [];
    this.screenShake = 0;
  }

  reset() {
    this.particles = [];
    this.damageTexts = [];
    this.slashes = [];
    this.screenShake = 0;
  }

  shake(amount = 4) {
    this.screenShake = Math.min(this.screenShake + amount, 14);
  }

  spawnSparks(x, y, color = '#ffffff', count = 5, speed = 3) {
    if (this.particles.length > 50) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        radius: Math.random() * 2 + 1.5,
        color,
        alpha: 1,
        decay: 0.08
      });
    }
  }

  spawnTrail(x, y, color = '#ff69b4', radius = 4) {
    if (this.particles.length > 50) return;
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: radius * 0.5,
      color,
      alpha: 0.5,
      decay: 0.12
    });
  }

  spawnSlash(x, y, angle, color = '#10b981', length = 55) {
    if (this.slashes.length > 4) this.slashes.shift();
    this.slashes.push({
      x,
      y,
      angle,
      length,
      color,
      alpha: 1,
      decay: 0.14
    });
  }

  spawnScratch(x, y, color = '#c084fc') {
    if (this.slashes.length > 4) this.slashes.shift();
    const angle = (Math.random() - 0.5) * 0.5;
    for (let offset of [-8, 0, 8]) {
      this.slashes.push({
        x: x + Math.cos(angle + Math.PI / 2) * offset,
        y: y + Math.sin(angle + Math.PI / 2) * offset,
        angle: angle + 0.2,
        length: 35,
        color,
        alpha: 1,
        decay: 0.14
      });
    }
  }

  spawnShockwave(x, y, color = '#ffffff', maxRadius = 30, lineWidth = 2) {
    this.spawnSparks(x, y, color, 3, 2);
  }

  spawnDamageNumber(x, y, amount, type = 'normal') {
    if (this.damageTexts.length > 6) {
      this.damageTexts.shift();
    }

    let text = `${amount}`;
    let scale = 1.1;
    let color = '#ffffff';

    if (type === 'crit') {
      scale = 1.35;
      color = '#fbbf24';
      text = `💥 ${amount}`;
    } else if (type === 'ult') {
      scale = 1.45;
      color = '#ffd700';
      text = `★ ${amount}`;
    }

    this.damageTexts.push({
      x: x + (Math.random() - 0.5) * 14,
      y: y - 8,
      vy: -1.8,
      text,
      color,
      scale,
      alpha: 1,
      decay: 0.05
    });
  }

  spawnDamageText(x, y, text, type = 'skill', color = '#38bdf8') {
    if (this.damageTexts.length > 5) {
      this.damageTexts.shift();
    }

    this.damageTexts.push({
      x,
      y: y - 14,
      vy: -1.4,
      text,
      color,
      scale: 1.15,
      alpha: 1,
      decay: 0.05
    });
  }

  update(dt, speedMultiplier = 1) {
    const eff = speedMultiplier;

    // Screen Shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 25 * dt * eff);
    }

    // Slashes
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const sl = this.slashes[i];
      sl.alpha -= sl.decay * eff * 60 * dt;
      if (sl.alpha <= 0.01) this.slashes.splice(i, 1);
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * eff * 60 * dt;
      p.y += p.vy * eff * 60 * dt;
      p.alpha -= p.decay * eff * 60 * dt;
      if (p.alpha <= 0.01) this.particles.splice(i, 1);
    }

    // Damage Texts
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const dtObj = this.damageTexts[i];
      dtObj.y += dtObj.vy * eff * 60 * dt;
      dtObj.alpha -= dtObj.decay * eff * 60 * dt;
      if (dtObj.alpha <= 0.01) this.damageTexts.splice(i, 1);
    }
  }

  render(ctx) {
    ctx.save();

    // 1. Sharp Slashes
    for (const sl of this.slashes) {
      ctx.save();
      ctx.translate(sl.x, sl.y);
      ctx.rotate(sl.angle);
      ctx.globalAlpha = Math.max(0, sl.alpha);

      ctx.strokeStyle = sl.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-sl.length / 2, 0);
      ctx.lineTo(sl.length / 2, 0);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-sl.length / 2 + 5, 0);
      ctx.lineTo(sl.length / 2 - 5, 0);
      ctx.stroke();

      ctx.restore();
    }

    // 2. Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Floating Damage & Skill Badges
    ctx.font = "900 15px 'Black Han Sans', 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const dtObj of this.damageTexts) {
      ctx.save();
      ctx.translate(dtObj.x, dtObj.y);
      ctx.scale(dtObj.scale, dtObj.scale);
      ctx.globalAlpha = Math.max(0, dtObj.alpha);

      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(dtObj.text, 0, 0);

      ctx.fillStyle = dtObj.color;
      ctx.fillText(dtObj.text, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }
}