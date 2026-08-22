/**
 * Particle & Visual Effects Engine
 * Clean, readable floating damage numbers with anti-clutter culling.
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.damageTexts = [];
    this.shockwaves = [];
    this.scratches = [];
    this.screenShake = 0;
  }

  reset() {
    this.particles = [];
    this.damageTexts = [];
    this.shockwaves = [];
    this.scratches = [];
    this.screenShake = 0;
  }

  shake(amount = 5) {
    this.screenShake = Math.min(this.screenShake + amount, 16);
  }

  spawnSparks(x, y, color = '#ffffff', count = 6, speed = 3) {
    // Limit max particles
    if (this.particles.length > 80) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        radius: Math.random() * 2.5 + 2,
        color,
        alpha: 1,
        life: 1,
        decay: Math.random() * 0.04 + 0.03
      });
    }
  }

  spawnTrail(x, y, color = '#ff69b4', radius = 6) {
    if (this.particles.length > 80) return;
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: radius * 0.6,
      color,
      alpha: 0.7,
      life: 1,
      decay: 0.08
    });
  }

  spawnShockwave(x, y, color = '#ff69b4', maxRadius = 70, lineWidth = 3) {
    if (this.shockwaves.length > 10) this.shockwaves.shift();
    this.shockwaves.push({
      x,
      y,
      radius: 4,
      maxRadius,
      color,
      lineWidth,
      alpha: 1,
      growthRate: maxRadius / 12
    });
  }

  spawnScratch(x, y, color = '#c084fc') {
    if (this.scratches.length > 6) this.scratches.shift();
    const angle = (Math.random() - 0.5) * 0.5;
    this.scratches.push({
      x,
      y,
      angle,
      alpha: 1,
      life: 1,
      decay: 0.09,
      color
    });
  }

  spawnDamageNumber(x, y, amount, type = 'normal') {
    // Anti-clutter: limit max floating texts
    if (this.damageTexts.length > 12) {
      this.damageTexts.shift();
    }

    let text = `${amount}`;
    let scale = 1.2;
    let color = '#ffffff';
    let fontWeight = '900';

    if (type === 'crit') {
      scale = 1.4;
      color = '#fbbf24';
      text = `💥 ${amount}`;
    } else if (type === 'heal') {
      scale = 1.2;
      color = '#22c55e';
      text = `+${amount}`;
    } else if (type === 'ult') {
      scale = 1.6;
      color = '#ffd700';
      text = `⚡ ${amount}`;
    }

    this.damageTexts.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y - 10 + (Math.random() - 0.5) * 10,
      vy: -1.8,
      text,
      color,
      scale,
      fontWeight,
      alpha: 1,
      life: 1,
      decay: 0.035
    });
  }

  spawnDamageText(x, y, text, type = 'skill', color = '#38bdf8') {
    // Only allow max 6 skill/buff badge texts to prevent screen spam
    if (this.damageTexts.length > 10) {
      this.damageTexts.shift();
    }

    this.damageTexts.push({
      x,
      y: y - 16,
      vy: -1.2,
      text,
      color,
      scale: 1.15,
      fontWeight: '900',
      alpha: 1,
      life: 1,
      decay: 0.04
    });
  }

  update(dt, speedMultiplier = 1) {
    const eff = speedMultiplier;

    // Shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 30 * dt * eff);
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * eff;
      p.y += p.vy * eff;
      p.alpha -= p.decay * eff;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    // Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.growthRate * eff;
      sw.alpha = Math.max(0, 1 - (sw.radius / sw.maxRadius));
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Scratches
    for (let i = this.scratches.length - 1; i >= 0; i--) {
      const sc = this.scratches[i];
      sc.alpha -= sc.decay * eff;
      if (sc.alpha <= 0) this.scratches.splice(i, 1);
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

    // 1. Shockwaves
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.lineWidth = sw.lineWidth;
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Scratches
    for (const sc of this.scratches) {
      ctx.save();
      ctx.translate(sc.x, sc.y);
      ctx.rotate(sc.angle);
      ctx.strokeStyle = sc.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = sc.alpha;

      for (let offset of [-10, 0, 10]) {
        ctx.beginPath();
        ctx.moveTo(-16, offset - 6);
        ctx.lineTo(16, offset + 6);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.restore();
    }

    // 4. Floating Damage Texts
    ctx.font = "900 16px 'Black Han Sans', 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const dtObj of this.damageTexts) {
      ctx.save();
      ctx.translate(dtObj.x, dtObj.y);
      ctx.scale(dtObj.scale, dtObj.scale);
      ctx.globalAlpha = dtObj.alpha;

      // Dark Outline for readability
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.strokeText(dtObj.text, 0, 0);

      ctx.fillStyle = dtObj.color;
      ctx.fillText(dtObj.text, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }
}
