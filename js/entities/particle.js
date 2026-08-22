/**
 * Particle & Visual Effects Engine
 * Large, bold, high-contrast floating damage numbers & juicy hit sparks.
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
    this.screenShake = Math.min(this.screenShake + amount, 20);
  }

  spawnSparks(x, y, color = '#ffffff', count = 8, speed = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        radius: Math.random() * 3 + 2.5,
        color,
        alpha: 1,
        life: 1,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  spawnTrail(x, y, color = '#ff69b4', radius = 6) {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: radius * 0.7,
      color,
      alpha: 0.85,
      life: 1,
      decay: 0.06
    });
  }

  spawnShockwave(x, y, color = '#ff69b4', maxRadius = 70, lineWidth = 4) {
    this.shockwaves.push({
      x,
      y,
      radius: 4,
      maxRadius,
      color,
      lineWidth,
      alpha: 1,
      growthRate: maxRadius / 14
    });
  }

  spawnScratch(x, y, color = '#c084fc') {
    const angle = (Math.random() - 0.5) * 0.5;
    this.scratches.push({
      x,
      y,
      angle,
      alpha: 1,
      life: 1,
      decay: 0.07,
      color
    });
  }

  spawnDamageNumber(x, y, amount, type = 'normal') {
    let text = `${amount}`;
    let scale = 1.3;
    let color = '#ffffff';
    let fontWeight = '900';

    if (type === 'crit') {
      scale = 1.6;
      color = '#fbbf24';
      text = `💥 ${amount}`;
    } else if (type === 'heal') {
      scale = 1.3;
      color = '#22c55e';
      text = `+${amount}`;
    } else if (type === 'ult') {
      scale = 1.8;
      color = '#ffd700';
      text = `⚡ ${amount}`;
    }

    this.damageTexts.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y - 14,
      text,
      color,
      alpha: 1,
      life: 1,
      vy: -1.8,
      scale,
      fontWeight
    });
  }

  spawnDamageText(x, y, text, type = 'normal', color = '#ffffff') {
    let scale = 1.3;
    let finalColor = color;
    let fontWeight = '900';

    if (type === 'crit') {
      scale = 1.6;
      finalColor = '#f43f5e';
    } else if (type === 'buff') {
      scale = 1.5;
      finalColor = '#a855f7';
    } else if (type === 'ult') {
      scale = 1.8;
      finalColor = '#ffd700';
    }

    this.damageTexts.push({
      x: x + (Math.random() - 0.5) * 14,
      y: y - 16,
      text,
      color: finalColor,
      alpha: 1,
      life: 1,
      vy: -1.6,
      scale,
      fontWeight
    });
  }

  update(dt, speedMultiplier = 1) {
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

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.growthRate * speedMultiplier;
      sw.alpha = 1 - sw.radius / sw.maxRadius;
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    for (let i = this.scratches.length - 1; i >= 0; i--) {
      const sc = this.scratches[i];
      sc.life -= sc.decay * speedMultiplier;
      sc.alpha = Math.max(0, sc.life);
      if (sc.life <= 0) {
        this.scratches.splice(i, 1);
      }
    }

    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const dtText = this.damageTexts[i];
      dtText.y += dtText.vy * speedMultiplier;
      dtText.life -= 0.022 * speedMultiplier;
      dtText.alpha = Math.max(0, dtText.life);
      if (dtText.life <= 0) {
        this.damageTexts.splice(i, 1);
      }
    }

    if (this.screenShake > 0) {
      this.screenShake *= 0.88;
      if (this.screenShake < 0.1) this.screenShake = 0;
    }
  }

  render(ctx) {
    ctx.save();

    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.globalAlpha = sw.alpha;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.lineWidth;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const sc of this.scratches) {
      ctx.save();
      ctx.translate(sc.x, sc.y);
      ctx.rotate(sc.angle);
      ctx.globalAlpha = sc.alpha;
      ctx.strokeStyle = sc.color;
      ctx.lineWidth = 4;
      ctx.shadowBlur = 10;
      ctx.shadowColor = sc.color;

      const offsets = [-14, 0, 14];
      for (const off of offsets) {
        ctx.beginPath();
        ctx.moveTo(-18 + off, -22);
        ctx.lineTo(18 + off, 22);
        ctx.stroke();
      }
      ctx.restore();
    }

    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.radius * p.life), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Large Bold Damage Text with Thick Black Stroke Outline
    for (const d of this.damageTexts) {
      ctx.save();
      ctx.globalAlpha = d.alpha;
      ctx.font = `${d.fontWeight} ${Math.floor(18 * d.scale)}px 'Black Han Sans', 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Thick Black Outline
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(d.text, d.x, d.y);

      // Text Fill
      ctx.fillStyle = d.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = d.color;
      ctx.fillText(d.text, d.x, d.y);
      ctx.restore();
    }

    ctx.restore();
  }
}
