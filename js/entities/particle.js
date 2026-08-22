/**
 * Particle & Visual Effects Engine - Ultra Deluxe Edition
 * High performance, breathtaking modern game aesthetics with ZERO ugly empty circles.
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.damageTexts = [];
    this.shockwaves = [];
    this.scratches = [];
    this.slashes = [];
    this.lightPillars = [];
    this.screenFlash = 0;
    this.flashColor = '#ffffff';
    this.screenShake = 0;
  }

  reset() {
    this.particles = [];
    this.damageTexts = [];
    this.shockwaves = [];
    this.scratches = [];
    this.slashes = [];
    this.lightPillars = [];
    this.screenFlash = 0;
    this.screenShake = 0;
  }

  shake(amount = 6) {
    this.screenShake = Math.min(this.screenShake + amount, 20);
  }

  flash(color = '#ffffff', intensity = 0.4) {
    this.flashColor = color;
    this.screenFlash = Math.max(this.screenFlash, intensity);
  }

  // Sparkling star / glowing energy particles
  spawnSparks(x, y, color = '#ffffff', count = 8, speed = 4) {
    if (this.particles.length > 100) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = (Math.random() * 0.8 + 0.4) * speed;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        radius: Math.random() * 3 + 2,
        color,
        alpha: 1,
        life: 1,
        decay: Math.random() * 0.05 + 0.04
      });
    }
  }

  // Star shaped glitter
  spawnStars(x, y, color = '#ffd700', count = 5) {
    if (this.particles.length > 100) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 3 + 1;
      this.particles.push({
        type: 'star',
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        size: Math.random() * 6 + 4,
        rot: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.2,
        color,
        alpha: 1,
        life: 1,
        decay: 0.04
      });
    }
  }

  // Smooth glowing projectile trail
  spawnTrail(x, y, color = '#ff69b4', radius = 8) {
    if (this.particles.length > 100) return;
    this.particles.push({
      type: 'glow',
      x,
      y,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: radius * 0.7,
      color,
      alpha: 0.65,
      life: 1,
      decay: 0.09
    });
  }

  // Luminous Soft Glow Shockwave (NO ugly wireframe donuts!)
  spawnShockwave(x, y, color = '#ff69b4', maxRadius = 80, lineWidth = 4) {
    if (this.shockwaves.length > 8) this.shockwaves.shift();
    this.shockwaves.push({
      x,
      y,
      radius: 6,
      maxRadius,
      color,
      lineWidth,
      alpha: 1,
      growthRate: maxRadius / 8 // Fast, punchy expansion
    });
  }

  // Fox Claw Scratch Marks
  spawnScratch(x, y, color = '#c084fc') {
    if (this.scratches.length > 6) this.scratches.shift();
    const angle = (Math.random() - 0.5) * 0.6;
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

  // Dimensional / Sword Slashes
  spawnSlash(x, y, angle, color = '#10b981', length = 90) {
    if (this.slashes.length > 8) this.slashes.shift();
    this.slashes.push({
      x,
      y,
      angle,
      length,
      color,
      alpha: 1,
      decay: 0.08
    });
  }

  // Giant Vertical Holy Pillar of Light for Riko Sword Drop
  spawnLightPillar(x, y, color = '#10b981', width = 140, duration = 1.2) {
    this.lightPillars.push({
      x,
      y,
      width,
      targetWidth: width,
      color,
      alpha: 0.9,
      duration,
      life: duration
    });
  }

  spawnDamageNumber(x, y, amount, type = 'normal') {
    if (this.damageTexts.length > 12) {
      this.damageTexts.shift();
    }

    let text = `${amount}`;
    let scale = 1.2;
    let color = '#ffffff';

    if (type === 'crit') {
      scale = 1.45;
      color = '#fbbf24';
      text = `💥 ${amount}`;
    } else if (type === 'heal') {
      scale = 1.2;
      color = '#22c55e';
      text = `+${amount}`;
    } else if (type === 'ult') {
      scale = 1.7;
      color = '#ffd700';
      text = `★ ${amount}`;
    }

    this.damageTexts.push({
      x: x + (Math.random() - 0.5) * 24,
      y: y - 10 + (Math.random() - 0.5) * 10,
      vy: -2.0,
      text,
      color,
      scale,
      alpha: 1,
      life: 1,
      decay: 0.038
    });
  }

  spawnDamageText(x, y, text, type = 'skill', color = '#38bdf8') {
    if (this.damageTexts.length > 10) {
      this.damageTexts.shift();
    }

    this.damageTexts.push({
      x,
      y: y - 20,
      vy: -1.4,
      text,
      color,
      scale: 1.2,
      alpha: 1,
      life: 1,
      decay: 0.04
    });
  }

  update(dt, speedMultiplier = 1) {
    const eff = speedMultiplier;

    // Screen Shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 35 * dt * eff);
    }

    // Screen Flash
    if (this.screenFlash > 0) {
      this.screenFlash = Math.max(0, this.screenFlash - 2.5 * dt * eff);
    }

    // Light Pillars
    for (let i = this.lightPillars.length - 1; i >= 0; i--) {
      const lp = this.lightPillars[i];
      lp.life -= dt * eff;
      lp.alpha = Math.max(0, lp.life / lp.duration);
      if (lp.life <= 0) this.lightPillars.splice(i, 1);
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
      if (p.rot !== undefined) p.rot += p.vRot * eff;
      p.alpha -= p.decay * eff;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    // Shockwaves (fast glowing pulse)
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

    // ── 1. Fullscreen Flash Effect ──
    if (this.screenFlash > 0.01) {
      ctx.save();
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = Math.min(0.8, this.screenFlash);
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }

    // ── 2. Giant Holy Pillars of Light ──
    for (const lp of this.lightPillars) {
      ctx.save();
      ctx.translate(lp.x, 0);

      // Outer Glow
      const grad = ctx.createLinearGradient(-lp.width / 2, 0, lp.width / 2, 0);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0)');
      grad.addColorStop(0.2, `rgba(52, 211, 153, ${lp.alpha * 0.4})`);
      grad.addColorStop(0.5, `rgba(255, 255, 255, ${lp.alpha * 0.85})`);
      grad.addColorStop(0.8, `rgba(52, 211, 153, ${lp.alpha * 0.4})`);
      grad.addColorStop(1, 'rgba(16, 185, 129, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(-lp.width / 2, 0, lp.width, ctx.canvas.height);
      ctx.restore();
    }

    // ── 3. Glowing Shockwaves (Rich Glowing Bloom) ──
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.globalAlpha = sw.alpha;

      // Soft glow ring
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.lineWidth = sw.lineWidth + 4;
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha * 0.4;
      ctx.stroke();

      // Sharp bright core
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.lineWidth = sw.lineWidth;
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = sw.alpha * 0.8;
      ctx.stroke();

      ctx.restore();
    }

    // ── 4. Scratches (Fox Claws) ──
    for (const sc of this.scratches) {
      ctx.save();
      ctx.translate(sc.x, sc.y);
      ctx.rotate(sc.angle);
      ctx.strokeStyle = sc.color;
      ctx.lineWidth = 4;
      ctx.globalAlpha = sc.alpha;

      for (let offset of [-12, 0, 12]) {
        ctx.beginPath();
        ctx.moveTo(-22, offset - 8);
        ctx.lineTo(22, offset + 8);
        ctx.stroke();
      }

      // Bright inner cut
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let offset of [-12, 0, 12]) {
        ctx.beginPath();
        ctx.moveTo(-18, offset - 6);
        ctx.lineTo(18, offset + 6);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ── 5. Sword Slashes (Dimensional / Melee Cuts) ──
    for (const sl of this.slashes) {
      ctx.save();
      ctx.translate(sl.x, sl.y);
      ctx.rotate(sl.angle);
      ctx.globalAlpha = sl.alpha;

      // Outer glow blade
      ctx.strokeStyle = sl.color;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-sl.length / 2, 0);
      ctx.lineTo(sl.length / 2, 0);
      ctx.stroke();

      // White hot sharp blade core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-sl.length / 2 + 5, 0);
      ctx.lineTo(sl.length / 2 - 5, 0);
      ctx.stroke();

      ctx.restore();
    }

    // ── 6. Particles (Glows, Sparks, Stars) ──
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'star') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.3, -s * 0.3);
        ctx.lineTo(s, 0);
        ctx.lineTo(s * 0.3, s * 0.3);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.3, s * 0.3);
        ctx.lineTo(-s, 0);
        ctx.lineTo(-s * 0.3, -s * 0.3);
        ctx.closePath();
        ctx.fill();

      } else if (p.type === 'glow') {
        // Soft glowing light orb
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Spark
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // ── 7. Floating Damage & Skill Badges ──
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
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
      ctx.strokeText(dtObj.text, 0, 0);

      ctx.fillStyle = dtObj.color;
      ctx.fillText(dtObj.text, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }
}
