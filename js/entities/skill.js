/**
 * Skill & Projectile Manager
 * Specialized for Nana's [Sarang-i Bullets & Machine Gun Stream] & Shibuki's [Horn Buns & Claws].
 */

class SkillManager {
  constructor() {
    this.projectiles = [];
    this.lasers = [];
    this.aoeZones = [];
  }

  reset() {
    this.projectiles = [];
    this.lasers = [];
    this.aoeZones = [];
  }

  // 1. Nana: Single Heavy Sarang-i Bullet
  spawnHeavyBullet(owner, startX, startY, angle, particleSystem) {
    const speed = 10.0;
    this.projectiles.push({
      owner,
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 9,
      damage: owner.atk * 1.35,
      color: '#ff69b4',
      type: 'heavy_bullet',
      life: 3.0,
      isUlt: false
    });

    if (particleSystem) {
      particleSystem.spawnSparks(startX, startY, '#ff69b4', 6, 3);
    }
  }

  // 2. Nana: Rapid Machine Gun Bullet ("뚜루루룰루")
  spawnRapidBullet(owner, startX, startY, angle, particleSystem) {
    const speed = 11.5;
    this.projectiles.push({
      owner,
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 6,
      damage: owner.atk * 0.42, // Balanced rapid tick (18 shots total)
      color: '#ff69b4',
      type: 'rapid_bullet',
      life: 2.5,
      isUlt: true
    });

    if (particleSystem) {
      particleSystem.spawnTrail(startX, startY, '#ff69b4', 5);
    }
  }

  // 3. Shibuki: Horn Buns Projectile ("똑, 똑" sequential poke)
  spawnShibukiHorn(owner, target, hornImg, particleSystem, hornIndex = 1) {
    const angle = Math.atan2(target.y - owner.y, target.x - owner.x);
    const speed = 8.5;

    this.projectiles.push({
      owner,
      x: owner.x,
      y: owner.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      currentAngle: 0,
      rotSpeed: hornIndex === 1 ? 0.25 : -0.25,
      radius: 12,
      damage: owner.atk * 0.55,
      color: '#a855f7',
      type: 'shibuki_horn',
      img: hornImg,
      life: 3.0,
      isUlt: false
    });

    if (particleSystem) {
      particleSystem.spawnSparks(owner.x, owner.y, '#a855f7', 4, 2);
    }
  }

  update(dt, arena, fighters, particleSystem, soundEngine, speedMultiplier = 1) {
    const effDt = dt * speedMultiplier;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      p.x += p.vx * speedMultiplier;
      p.y += p.vy * speedMultiplier;
      if (p.rotSpeed) p.currentAngle += p.rotSpeed * speedMultiplier;
      p.life -= effDt;

      // Particle Trail
      if (particleSystem && Math.random() < 0.7) {
        particleSystem.spawnTrail(p.x, p.y, p.color, p.radius * 0.7);
      }

      // Check boundary hit against 4-corner arena
      if (arena && !arena.isInside(p.x, p.y, p.radius)) {
        if (particleSystem) particleSystem.spawnSparks(p.x, p.y, p.color, 3, 2);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with enemy fighters
      let hit = false;
      for (const fighter of fighters) {
        if (fighter === p.owner || fighter.isDead || (fighter.team && fighter.team === p.owner.team)) continue;

        const dist = Math.hypot(fighter.x - p.x, fighter.y - p.y);
        if (dist <= fighter.radius + p.radius) {
          fighter.takeDamage(p.damage, p.owner, particleSystem, p.isUlt ? 'ult' : 'normal');

          if (particleSystem) {
            particleSystem.spawnSparks(p.x, p.y, p.color, p.isUlt ? 6 : 10, 4);
            particleSystem.spawnShockwave(p.x, p.y, p.color, p.isUlt ? 25 : 40, 2);
          }
          if (soundEngine) soundEngine.playClash(p.isUlt ? 0.9 : 1.3);

          hit = true;
          break;
        }
      }

      if (hit || p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();

    for (const p of this.projectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);

      if (p.type === 'shibuki_horn' && p.img && p.img.complete && p.img.naturalWidth > 0) {
        ctx.rotate(p.currentAngle);
        const w = 24;
        const h = 24;
        ctx.drawImage(p.img, -w / 2, -h / 2, w, h);
      } else if (p.type === 'rapid_bullet') {
        // Glowing tracer pellet
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff69b4';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff69b4';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Heavy Bullet
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff69b4';
        ctx.fillStyle = '#ff69b4';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }
}
