/**
 * Particle & Visual Effects Engine - Ultra Clean & Crisp Arcade Edition
 * Safe, robust, error-free particle rendering with zero screen clutter.
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

  shake(amount = 5) {
    this.screenShake = Math.min(this.screenShake + amount, 14);
  }

  spawnSparks(x, y, color = '#ffffff', count = 6, speed = 3) {
    if (this.particles.length > 80) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        radius: Math.random() * 2 + 1.5,
        color,
        alpha: 1,
        life: 1,
        decay: Math.random() * 0.06 + 0.05
      });
    }
  }

  spawnTrail(x, y, color = '#ff69b4', radius = 5) {
    if (this.particles.length > 80) return;
    this.particles.push({
      type: 'spark',
      x,
      y,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      radius: radius * 0.5,
      color,
      alpha: 0.6,
      life: 1,
      decay: 0.1
    });
  }

  spawnSlash(x, y, angle, color = '#10b981', length = 60) {
    if (this.slashes.length > 6) this.slashes.shift();
    this.slashes.push({
      x,
      y,
      angle,
      length,
      color,
      alpha: 1,
      decay: 0.12
    });
  }

  spawnScratch(x, y, color = '#c084fc') {
    if (this.slashes.length > 6) this.slashes.shift();
    const angle = (Math.random() - 0.5) * 0.5;
    for (let offset of [-10, 0, 10]) {
      this.slashes.push({
        x: x + Math.cos(angle + Math.PI / 2) * offset,
        y: y + Math.sin(angle + Math.PI / 2) * offset,
        angle: angle + 0.2,
        length: 40,
        color,
        alpha: 1,
        decay: 0.12
      });
    }
  }

  spawnShockwave(x, y, color = '#ffffff', maxRadius = 40, lineWidth = 2) {
    // Safe placeholder to avoid any caller errors
    this.spawnSparks(x, y, color, 4, 2);
  }

  spawnDamageNumber(x, y, amount, type = 'normal') {
    if (this.damageTexts.length > 10) {
      this.damageTexts.shift();
    }

    let text = `${amount}`;
    let scale = 1.15;
    let color = '#ffffff';

    if (type === 'crit') {
      scale = 1.35;
      color = '#fbbf24';
      text = `💥 ${amount}`;
    } else if (type === 'ult') {
      scale = 1.5;
      color = '#ffd700';
      text = `★ ${amount}`;
    }

    this.damageTexts.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y - 10,
      vy: -1.6,
      text,
      color,
      scale,
      alpha: 1,
      life: 1,
      decay: 0.04
    });
  }

  spawnDamageText(x, y, text, type = 'skill', color = '#38bdf8') {
    if (this.damageTexts.length > 8) {
      this.damageTexts.shift();
    }

    this.damageTexts.push({
      x,
      y: y - 16,
      vy: -1.2,
      text,
      color,
      scale: 1.15,
      alpha: 1,
      life: 1,
      decay: 0.045
    });
  }

  update(dt, speedMultiplier = 1) {
    const eff = speedMultiplier;

    // Screen Shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 30 * dt * eff);
    }

    // Slashes
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const sl = this.slashes[i];
      sl.alpha -= sl.decay * eff;
      if (sl.alpha <= 0) this.slashes.splice(i, 1);
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * eff;
      p.y += p.vy * eff;
      p.alpha -= p.decay * eff;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    // Damage Texts
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const dtObj = this.damageTexts[i];
      dtObj.y += dtObj.vy * eff;
      dtObj.alpha -= dtObj.decay * eff;
      if (dtObj.alpha <= 0) this.damageTexts.splice(i, 1);
    }
  }

  render(ctx) {
    ctx.save();

    // 1. Sharp Slashes
    for (const sl of this.slashes) {
      ctx.save();
      ctx.translate(sl.x, sl.y);
      ctx.rotate(sl.angle);
      ctx.globalAlpha = sl.alpha;

      ctx.strokeStyle = sl.color;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-sl.length / 2, 0);
      ctx.lineTo(sl.length / 2, 0);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-sl.length / 2 + 6, 0);
      ctx.lineTo(sl.length / 2 - 6, 0);
      ctx.stroke();

      ctx.restore();
    }

    // 2. Particles (Clean small sparks)
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
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
      ctx.globalAlpha = dtObj.alpha;

      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(dtObj.text, 0, 0);

      ctx.fillStyle = dtObj.color;
      ctx.fillText(dtObj.text, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }
}