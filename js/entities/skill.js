/**
 * Skill Manager & Projectile Engine
 * Renders large, high-visibility projectiles for Nana's Sarang-i & Shibuki's Horns.
 */

class SkillManager {
  constructor() {
    this.projectiles = [];
    this.aoeEffects = [];
  }

  reset() {
    this.projectiles = [];
    this.aoeEffects = [];
  }

  // 1. Nana Normal Skill: Large glowing [사랑이] bullet
  spawnHeavyBullet(fighter, startX, startY, angle, particleSystem) {
    const speed = 10.5;
    this.projectiles.push({
      id: 'sarangi_heavy',
      type: 'heavy_bullet',
      owner: fighter,
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 14,
      drawSize: 34,
      damage: 110,
      color: '#ff69b4',
      glowColor: '#f43f5e',
      life: 2.5,
      trailTimer: 0,
      angle: angle,
      spin: 0
    });

    if (particleSystem) {
      particleSystem.spawnShockwave(startX, startY, '#ff69b4', 45, 3);
      particleSystem.spawnSparks(startX, startY, '#ffd700', 8, 4);
    }
  }

  // 2. Nana Ultimate: Rapid stream bullet
  spawnRapidBullet(fighter, startX, startY, angle, particleSystem) {
    const speed = 12.0;
    this.projectiles.push({
      id: 'sarangi_rapid',
      type: 'rapid_bullet',
      owner: fighter,
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 8,
      drawSize: 18,
      damage: 28,
      color: '#ff69b4',
      glowColor: '#ffd700',
      life: 2.0,
      trailTimer: 0,
      angle: angle,
      spin: 0
    });

    if (particleSystem && Math.random() < 0.3) {
      particleSystem.spawnSparks(startX, startY, '#ff69b4', 3, 2);
    }
  }

  // 3. Shibuki Normal Skill: Large spinning Horn projectile
  spawnShibukiHorn(fighter, target, hornImg, particleSystem, hornIndex = 1) {
    const angle = Math.atan2(target.y - fighter.y, target.x - fighter.x) + (Math.random() - 0.5) * 0.15;
    const speed = 9.5;
    const spawnOffsetX = (hornIndex === 1 ? -1 : 1) * (fighter.radius * 0.5);

    this.projectiles.push({
      id: 'shibuki_horn',
      type: 'horn',
      owner: fighter,
      img: hornImg,
      x: fighter.x + spawnOffsetX,
      y: fighter.y - fighter.radius * 0.4,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 16,
      drawSize: 38,
      damage: 55,
      color: '#c084fc',
      glowColor: '#a855f7',
      life: 3.0,
      trailTimer: 0,
      angle: angle,
      spin: 0,
      spinSpeed: 0.25
    });

    if (particleSystem) {
      particleSystem.spawnShockwave(fighter.x + spawnOffsetX, fighter.y, '#c084fc', 35, 2);
      particleSystem.spawnSparks(fighter.x + spawnOffsetX, fighter.y, '#c084fc', 6, 3);
    }
  }

  update(dt, arena, allFighters, particleSystem, soundEngine, speedMultiplier = 1) {
    const effSpeed = speedMultiplier;

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * effSpeed;
      p.y += p.vy * effSpeed;
      p.life -= dt * effSpeed;
      p.spin += (p.spinSpeed || 0.1) * effSpeed;

      // Spawn Glowing Trails
      p.trailTimer += dt * effSpeed;
      if (p.trailTimer >= 0.04 && particleSystem) {
        p.trailTimer = 0;
        particleSystem.spawnTrail(p.x, p.y, p.color, p.radius * 1.2);
      }

      // Check Collision with Enemies
      let hit = false;
      for (const enemy of allFighters) {
        if (enemy === p.owner || enemy.isDead) continue;

        const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        if (dist <= enemy.radius + p.radius) {
          hit = true;
          const isCrit = p.type === 'heavy_bullet' || Math.random() < 0.25;
          enemy.takeDamage(p.damage, p.owner, particleSystem, isCrit ? 'crit' : 'normal');

          if (soundEngine) soundEngine.playHit();
          if (particleSystem) {
            particleSystem.spawnShockwave(p.x, p.y, p.glowColor, 50, 4);
            particleSystem.spawnSparks(p.x, p.y, p.color, 10, 4);
          }
          break;
        }
      }

      // Check Arena Wall Bounce / Destroy
      if (arena && !arena.isInside(p.x, p.y, p.radius)) {
        if (p.type === 'horn' || p.type === 'heavy_bullet') {
          // Ricochet once or despawn with sparks
          if (particleSystem) {
            particleSystem.spawnSparks(p.x, p.y, p.color, 6, 3);
          }
        }
        hit = true;
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

      // 1. Shibuki Large Spinning Horn Sprite
      if (p.type === 'horn') {
        ctx.rotate(p.spin);
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#c084fc';

        if (p.img && p.img.complete && p.img.naturalWidth > 0) {
          const s = p.drawSize || 38;
          ctx.drawImage(p.img, -s / 2, -s / 2, s, s);
        } else {
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }

      // 2. Nana Heavy Bullet (Large glowing Pink Heart/Orb with golden core)
      } else if (p.type === 'heavy_bullet') {
        ctx.rotate(p.angle);
        ctx.shadowBlur = 24;
        ctx.shadowColor = '#ff69b4';

        // Outer Pink Energy Aura
        ctx.fillStyle = '#ff69b4';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.drawSize * 0.6, p.drawSize * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner Golden Core
        ctx.fillStyle = '#fff0f5';
        ctx.beginPath();
        ctx.ellipse(2, 0, p.drawSize * 0.35, p.drawSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Heart Icon center
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💖', 0, 0);

      // 3. Nana Rapid Bullet (Bright Pink Tracer)
      } else {
        ctx.rotate(p.angle);
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ff69b4';

        ctx.fillStyle = '#ff69b4';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.drawSize * 0.6, p.drawSize * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(2, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }
}
