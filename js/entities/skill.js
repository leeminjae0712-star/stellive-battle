/**
 * Skill Manager - Pro Balanced Asymmetric Damage
 *
 * Nana Heavy Shot  = 155 damage (BIG chunk, slow CD 3.8s)
 * Nana Rapid Bullet = 28 damage x16 (ult burst, 448 total)
 * Shibuki Horn      = 38 damage x2 (fast poke, CD 1.6s → 76 per cycle)
 * Shibuki Scratch   = 35 damage (fox melee, 0.3s internal CD)
 *
 * Effective DPS comparison:
 *   Nana skill DPS:  155/3.8 = 40.8
 *   Shibuki skill DPS: 76/1.6 = 47.5
 *   → Close parity, different feel!
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

  // ═══ Nana: Heavy Single Shot [사랑이 사격] ═══
  // 155 damage — satisfying CHUNK. You feel every hit.
  spawnHeavyBullet(fighter, startX, startY, angle, particleSystem) {
    const speed = 11.0;
    this.projectiles.push({
      id: 'sarangi_heavy',
      type: 'heavy_bullet',
      owner: fighter,
      x: startX, y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 16,
      drawSize: 38,
      damage: 155,
      color: '#ff69b4',
      glowColor: '#f43f5e',
      life: 2.8,
      trailTimer: 0,
      angle: angle,
      spin: 0
    });

    if (particleSystem) {
      particleSystem.spawnShockwave(startX, startY, '#ff69b4', 55, 4);
      particleSystem.spawnSparks(startX, startY, '#ffd700', 10, 5);
    }
  }

  // ═══ Nana Ult: Rapid Bullets [사랑이 난사] ═══
  // 28 damage per bullet x16 = 448 total burst
  spawnRapidBullet(fighter, startX, startY, angle, particleSystem) {
    const speed = 13.0;
    this.projectiles.push({
      id: 'sarangi_rapid',
      type: 'rapid_bullet',
      owner: fighter,
      x: startX, y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 7,
      drawSize: 16,
      damage: 28,
      color: '#ff69b4',
      glowColor: '#ffd700',
      life: 2.0,
      trailTimer: 0,
      angle: angle,
      spin: 0
    });

    if (particleSystem && Math.random() < 0.25) {
      particleSystem.spawnSparks(startX, startY, '#ff69b4', 2, 2);
    }
  }

  // ═══ Shibuki: Horn Poke [뿔 발사] ═══
  // 38 damage per horn x2 = 76 per cycle, but fires every 1.6s!
  spawnShibukiHorn(fighter, target, hornImg, particleSystem, hornIndex = 1) {
    const angle = Math.atan2(target.y - fighter.y, target.x - fighter.x) + (Math.random() - 0.5) * 0.12;
    const speed = 10.0;
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
      radius: 14,
      drawSize: 36,
      damage: 38,
      color: '#c084fc',
      glowColor: '#a855f7',
      life: 2.5,
      trailTimer: 0,
      angle: angle,
      spin: 0,
      spinSpeed: 0.3
    });

    if (particleSystem) {
      particleSystem.spawnShockwave(fighter.x + spawnOffsetX, fighter.y, '#c084fc', 30, 2);
      particleSystem.spawnSparks(fighter.x + spawnOffsetX, fighter.y, '#c084fc', 4, 2);
    }
  }

  update(dt, arena, allFighters, particleSystem, soundEngine, speedMultiplier = 1) {
    const effSpeed = speedMultiplier;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * effSpeed;
      p.y += p.vy * effSpeed;
      p.life -= dt * effSpeed;
      p.spin += (p.spinSpeed || 0.1) * effSpeed;

      // Trail particles
      p.trailTimer += dt * effSpeed;
      if (p.trailTimer >= 0.04 && particleSystem) {
        p.trailTimer = 0;
        particleSystem.spawnTrail(p.x, p.y, p.color, p.radius * 1.1);
      }

      let hit = false;
      for (const enemy of allFighters) {
        if (enemy === p.owner || enemy.isDead) continue;

        const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        if (dist <= enemy.radius + p.radius) {
          hit = true;
          const isCrit = p.type === 'heavy_bullet' || Math.random() < 0.2;
          enemy.takeDamage(p.damage, p.owner, particleSystem, isCrit ? 'crit' : 'normal');

          try { if (soundEngine) soundEngine.playHit(); } catch(e) {}
          if (particleSystem) {
            const impactSize = p.type === 'heavy_bullet' ? 65 : 40;
            particleSystem.spawnShockwave(p.x, p.y, p.glowColor, impactSize, 4);
            particleSystem.spawnSparks(p.x, p.y, p.color, p.type === 'heavy_bullet' ? 12 : 6, 4);
          }
          break;
        }
      }

      // Wall removal
      if (arena && !arena.isInside(p.x, p.y, p.radius)) {
        if (particleSystem) particleSystem.spawnSparks(p.x, p.y, p.color, 4, 2);
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

      if (p.type === 'horn') {
        ctx.rotate(p.spin);
        if (p.img && p.img.complete && p.img.naturalWidth > 0) {
          const s = p.drawSize || 36;
          ctx.drawImage(p.img, -s / 2, -s / 2, s, s);
        } else {
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (p.type === 'heavy_bullet') {
        // Big glowing energy orb for Nana's heavy shot
        ctx.rotate(p.angle);

        // Outer glow
        ctx.fillStyle = 'rgba(255, 105, 180, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, p.drawSize * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Main body
        ctx.fillStyle = '#ff69b4';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.drawSize * 0.55, p.drawSize * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner core shine
        ctx.fillStyle = '#fff0f5';
        ctx.beginPath();
        ctx.ellipse(2, -2, p.drawSize * 0.28, p.drawSize * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💖', 0, 0);

      } else {
        // Small rapid bullet
        ctx.rotate(p.angle);
        ctx.fillStyle = '#ff69b4';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.drawSize * 0.55, p.drawSize * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(2, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }
}
