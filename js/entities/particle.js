/**
 * Particle & Visual Effects Engine
 * Handles hits, sparks, floating damage text, shockwaves, and screen shake
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.damageTexts = [];
    this.shockwaves = [];
    this.screenShake = 0;
  }

  reset() {
    this.particles = [];
    this.damageTexts = [];
    this.shockwaves = [];
    this.screenShake = 0;
  }

  shake(amount = 5) {
    this.screenShake = Math.min(this.screenShake + amount, 20);
  }

  spawnSparks(x, y, color = '#ffffff', count = 10, speed = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        radius: Math.random() * 3 + 2,
        color,
        alpha: 1,
        life: 1,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  spawnTrail(x, y, color = '#a855f7', radius = 6) {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: radius * 0.75,
      color,
      alpha: 0.7,
      life: 1,
      decay: 0.06
    });
  }

  spawnShockwave(x, y, color = '#c084fc', maxRadius = 80, lineWidth = 4) {
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius,
      color,
      lineWidth,
      alpha: 1,
      growthRate: maxRadius / 15
    });
  }

  spawnDamageText(x, y, text, type = 'normal', color = '#ffffff') {
    let scale = 1;
    let finalColor = color;
    let fontWeight = '700';

    if (type === 'crit') {
      scale = 1.4;
      finalColor = '#fbbf24';
      text = `💥 ${text}`;
      fontWeight = '900';
    } else if (type === 'heal') {
      finalColor = '#22c55e';
      text = `+${text}`;
    } else if (type === 'ult') {
      scale = 1.6;
      finalColor = '#ffd700';
      fontWeight = '900';
    }

    this.damageTexts.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y - 10,
      text,
      color: finalColor,
      alpha: 1,
      life: 1,
      vy: -2,
      scale,
      fontWeight
    });
  }

  update(dt, speedMultiplier = 1) {
    // 1. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * speedMultiplier;
      p.y += p.vy * speedMultiplier;
      p.life -= p.decay * speedMultiplier;
      p.alpha = Math.max(0, p.life);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 2. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.growthRate * speedMultiplier;
      sw.alpha = 1 - sw.radius / sw.maxRadius;
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Update Damage Texts
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const dtText = this.damageTexts[i];
      dtText.y += dtText.vy * speedMultiplier;
      dtText.life -= 0.025 * speedMultiplier;
      dtText.alpha = Math.max(0, dtText.life);
      if (dtText.life <= 0) {
        this.damageTexts.splice(i, 1);
      }
    }

    // 4. Update Screen Shake
    if (this.screenShake > 0) {
      this.screenShake *= 0.88;
      if (this.screenShake < 0.1) this.screenShake = 0;
    }
  }

  render(ctx) {
    ctx.save();

    // Render Shockwaves
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.globalAlpha = sw.alpha;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.lineWidth;
      ctx.shadowBlur = 15;
      ctx.shadowColor = sw.color;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Render Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.radius * p.life), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Damage Texts
    for (const d of this.damageTexts) {
      ctx.save();
      ctx.globalAlpha = d.alpha;
      ctx.font = `${d.fontWeight} ${Math.floor(16 * d.scale)}px 'Outfit', 'Noto Sans KR', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Outline
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.strokeText(d.text, d.x, d.y);

      // Text Fill & Glow
      ctx.fillStyle = d.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = d.color;
      ctx.fillText(d.text, d.x, d.y);
      ctx.restore();
    }

    ctx.restore();
  }
}
