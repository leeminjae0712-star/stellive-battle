/**
 * Skill & Projectile Manager
 * Special support for Nana's [Sarang-i Gun] & Shibuki's [Horn Buns] and all Stellive skill effects.
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

  // 1. Hanako Nana: Sarang-i Gun Projectile (Single / Barrage)
  spawnSarangiGun(owner, target, img, particleSystem, isUlt = false) {
    const angle = Math.atan2(target.y - owner.y, target.x - owner.x);
    const speed = isUlt ? 8.5 + (Math.random() - 0.5) * 2 : 9.0;
    
    this.projectiles.push({
      owner,
      x: owner.x,
      y: owner.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle: angle,
      rotSpeed: 0.12,
      currentAngle: angle,
      radius: 18,
      damage: isUlt ? owner.atk * 1.3 : owner.atk * 1.15,
      color: '#ff69b4',
      type: 'sarangi_gun',
      img: img,
      life: 3.5,
      isUlt: isUlt,
      scale: isUlt ? 0.35 : 0.42
    });

    if (particleSystem) {
      particleSystem.spawnSparks(owner.x, owner.y, '#ff69b4', 8, 4);
    }
  }

  spawnSarangiBarrage(owner, enemies, img, particleSystem, count = 8) {
    for (let i = 0; i < count; i++) {
      // Scatter in a cone toward general enemy direction or 360 spread
      let baseAngle = Math.random() * Math.PI * 2;
      if (enemies.length > 0) {
        const target = enemies[Math.floor(Math.random() * enemies.length)];
        baseAngle = Math.atan2(target.y - owner.y, target.x - owner.x) + (Math.random() - 0.5) * 1.2;
      }
      const speed = 7.5 + Math.random() * 3.5;

      this.projectiles.push({
        owner,
        x: owner.x + (Math.random() - 0.5) * 20,
        y: owner.y + (Math.random() - 0.5) * 20,
        vx: Math.cos(baseAngle) * speed,
        vy: Math.sin(baseAngle) * speed,
        angle: baseAngle,
        rotSpeed: (Math.random() - 0.5) * 0.25,
        currentAngle: baseAngle,
        radius: 16,
        damage: owner.atk * 1.25,
        color: '#ff69b4',
        type: 'sarangi_gun',
        img: img,
        life: 4.0,
        isUlt: true,
        scale: 0.38
      });
    }

    if (particleSystem) {
      particleSystem.shake(8);
      particleSystem.spawnShockwave(owner.x, owner.y, '#ff69b4', 90, 6);
    }
  }

  // 2. Tenko Shibuki: Horn Buns Projectile ("똑, 똑" sequential shot)
  spawnShibukiHorn(owner, target, hornImg, particleSystem, hornIndex = 1) {
    const angle = Math.atan2(target.y - owner.y, target.x - owner.x);
    const speed = 8.5;

    this.projectiles.push({
      owner,
      x: owner.x,
      y: owner.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle: angle,
      rotSpeed: hornIndex === 1 ? 0.2 : -0.2,
      currentAngle: 0,
      radius: 14,
      damage: owner.atk * 0.95,
      color: '#a855f7',
      type: 'shibuki_horn',
      img: hornImg,
      life: 3.0,
      isUlt: false,
      scale: 0.3
    });

    if (particleSystem) {
      particleSystem.spawnSparks(owner.x, owner.y, '#a855f7', 6, 3);
    }
  }

  // 3. Laser Beam (Hina / Fuya)
  spawnLaser(owner, target, options = {}, particleSystem = null) {
    const angle = options.angle !== undefined ? options.angle : (target ? Math.atan2(target.y - owner.y, target.x - owner.x) : 0);
    const length = options.length || 600;

    this.lasers.push({
      owner,
      x1: owner.x,
      y1: owner.y,
      x2: owner.x + Math.cos(angle) * length,
      y2: owner.y + Math.sin(angle) * length,
      width: options.width || 8,
      color: options.color || owner.color,
      damage: options.damage || owner.atk * 1.4,
      life: 0.32,
      maxLife: 0.32,
      hasHit: new Set(),
      isUlt: !!options.isUlt
    });

    if (particleSystem) {
      particleSystem.spawnShockwave(owner.x, owner.y, options.color || owner.color, 40, 2);
    }
  }

  // 4. Ice Shard (Rin / Yuni)
  spawnIceShard(owner, target, particleSystem) {
    const angle = Math.atan2(target.y - owner.y, target.x - owner.x);
    this.projectiles.push({
      owner,
      x: owner.x,
      y: owner.y,
      vx: Math.cos(angle) * 8.5,
      vy: Math.sin(angle) * 8.5,
      radius: 10,
      damage: owner.atk * 0.85,
      color: '#38bdf8',
      type: 'ice_shard',
      life: 3.0,
      isUlt: false
    });
  }

  // 5. Blood Orb (Lize)
  spawnBloodOrb(owner, target, particleSystem) {
    const angle = Math.atan2(target.y - owner.y, target.x - owner.x);
    this.projectiles.push({
      owner,
      x: owner.x,
      y: owner.y,
      vx: Math.cos(angle) * 7.5,
      vy: Math.sin(angle) * 7.5,
      radius: 11,
      damage: owner.atk * 0.9,
      color: '#ef4444',
      type: 'blood_orb',
      life: 3.0,
      isUlt: false
    });
  }

  // 6. Dragon Fire (Kanna)
  spawnDragonFire(owner, target, particleSystem) {
    const angle = Math.atan2(target.y - owner.y, target.x - owner.x);
    this.projectiles.push({
      owner,
      x: owner.x,
      y: owner.y,
      vx: Math.cos(angle) * 8.0,
      vy: Math.sin(angle) * 8.0,
      radius: 12,
      damage: owner.atk * 0.95,
      color: '#3b82f6',
      type: 'dragon_fire',
      life: 3.0,
      isUlt: false
    });
  }

  spawnDragonFireBullet(owner, angle, particleSystem) {
    this.projectiles.push({
      owner,
      x: owner.x,
      y: owner.y,
      vx: Math.cos(angle) * 8.0,
      vy: Math.sin(angle) * 8.0,
      radius: 13,
      damage: owner.atk * 1.5,
      color: '#3b82f6',
      type: 'dragon_fire',
      life: 3.5,
      isUlt: true
    });
  }

  // 7. AOE Field
  spawnAoe(owner, x, y, options = {}) {
    this.aoeZones.push({
      owner,
      x,
      y,
      radius: options.radius || 70,
      color: options.color || owner.color,
      damagePerTick: options.damagePerTick || 12,
      duration: options.duration || 3.0,
      life: options.duration || 3.0,
      tickTimer: 0,
      isUlt: !!options.isUlt
    });
  }

  spawnGravityAoe(owner, x, y, particleSystem) {
    this.aoeZones.push({
      owner,
      x,
      y,
      radius: 100,
      color: '#38bdf8',
      damagePerTick: Math.floor(owner.atk * 0.6),
      duration: 3.0,
      life: 3.0,
      tickTimer: 0,
      isUlt: true,
      pull: true
    });
  }

  update(dt, arena, fighters, particleSystem, soundEngine, speedMultiplier = 1) {
    const effDt = dt * speedMultiplier;

    // 1. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      p.x += p.vx * speedMultiplier;
      p.y += p.vy * speedMultiplier;
      if (p.rotSpeed) p.currentAngle += p.rotSpeed * speedMultiplier;
      p.life -= effDt;

      // Particle Trail
      if (particleSystem && Math.random() < 0.6) {
        particleSystem.spawnTrail(p.x, p.y, p.color, p.radius * 0.6);
      }

      // Check boundary hit against 4-corner arena
      if (arena && !arena.isInside(p.x, p.y, p.radius)) {
        if (particleSystem) particleSystem.spawnSparks(p.x, p.y, p.color, 4);
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
            particleSystem.spawnSparks(p.x, p.y, p.color, 10, 4);
            particleSystem.spawnShockwave(p.x, p.y, p.color, 35);
            particleSystem.shake(p.isUlt ? 6 : 3);
          }
          if (soundEngine) soundEngine.playClash(1.2);
          hit = true;
          break;
        }
      }

      if (hit || p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // 2. Update Lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.life -= effDt;

      for (const fighter of fighters) {
        if (fighter === l.owner || fighter.isDead || l.hasHit.has(fighter.id)) continue;
        if (fighter.team && fighter.team === l.owner.team) continue;

        const dist = this.distToSegment(fighter.x, fighter.y, l.x1, l.y1, l.x2, l.y2);
        if (dist <= fighter.radius + l.width / 2) {
          fighter.takeDamage(l.damage, l.owner, particleSystem, l.isUlt ? 'ult' : 'crit');
          l.hasHit.add(fighter.id);
          if (particleSystem) {
            particleSystem.spawnSparks(fighter.x, fighter.y, l.color, 12, 5);
            particleSystem.spawnShockwave(fighter.x, fighter.y, l.color, 45);
            particleSystem.shake(5);
          }
        }
      }

      if (l.life <= 0) {
        this.lasers.splice(i, 1);
      }
    }

    // 3. Update AOE Zones
    for (let i = this.aoeZones.length - 1; i >= 0; i--) {
      const aoe = this.aoeZones[i];
      aoe.life -= effDt;
      aoe.tickTimer += effDt;

      if (aoe.tickTimer >= 0.4) {
        aoe.tickTimer = 0;
        for (const fighter of fighters) {
          if (fighter === aoe.owner || fighter.isDead) continue;
          if (fighter.team && fighter.team === aoe.owner.team) continue;

          const dist = Math.hypot(fighter.x - aoe.x, fighter.y - aoe.y);
          if (dist <= aoe.radius + fighter.radius) {
            fighter.takeDamage(aoe.damagePerTick, aoe.owner, particleSystem, 'normal');
            if (aoe.pull) {
              const pullAngle = Math.atan2(aoe.y - fighter.y, aoe.x - fighter.x);
              fighter.vx += Math.cos(pullAngle) * 2;
              fighter.vy += Math.sin(pullAngle) * 2;
            }
          }
        }
      }

      if (aoe.life <= 0) {
        this.aoeZones.splice(i, 1);
      }
    }
  }

  distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  render(ctx) {
    ctx.save();

    // 1. Render AOE Zones
    for (const aoe of this.aoeZones) {
      const alpha = Math.min(0.3, aoe.life / aoe.duration);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = aoe.color;
      ctx.beginPath();
      ctx.arc(aoe.x, aoe.y, aoe.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = alpha * 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Render Lasers
    for (const l of this.lasers) {
      const alpha = l.life / l.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = l.color;
      ctx.lineWidth = l.width;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = l.width * 0.4;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Render Projectiles (Images for Sarang-i gun & Horn buns, shapes for others)
    for (const p of this.projectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);

      if (p.type === 'sarangi_gun' && p.img && p.img.complete && p.img.naturalWidth > 0) {
        ctx.rotate(p.currentAngle);
        const w = p.img.naturalWidth * (p.scale || 0.4);
        const h = p.img.naturalHeight * (p.scale || 0.4);
        ctx.drawImage(p.img, -w / 2, -h / 2, w, h);
      } else if (p.type === 'shibuki_horn' && p.img && p.img.complete && p.img.naturalWidth > 0) {
        ctx.rotate(p.currentAngle);
        const w = p.img.naturalWidth * (p.scale || 0.3);
        const h = p.img.naturalHeight * (p.scale || 0.3);
        ctx.drawImage(p.img, -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }
}
