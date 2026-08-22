/**
 * Skill & Projectile Entities System
 * Manages active projectiles, lasers, hazard fields, and AOE zones
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

  // 1. Spawn Projectile
  spawnProjectile(owner, target, options = {}) {
    const angle = options.angle !== undefined ? options.angle : Math.atan2(target.y - owner.y, target.x - owner.x);
    const speed = options.speed || 8;
    
    this.projectiles.push({
      owner,
      x: owner.x,
      y: owner.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: options.radius || 10,
      damage: options.damage || owner.atk * 0.8,
      color: options.color || owner.color,
      homing: !!options.homing,
      target: target,
      life: options.life || 3.0,
      type: options.type || 'normal',
      isUlt: !!options.isUlt
    });
  }

  // 2. Spawn Laser Beam
  spawnLaser(owner, target, options = {}) {
    const angle = options.angle !== undefined ? options.angle : Math.atan2(target.y - owner.y, target.x - owner.x);
    const length = options.length || 600;
    
    this.lasers.push({
      owner,
      x1: owner.x,
      y1: owner.y,
      x2: owner.x + Math.cos(angle) * length,
      y2: owner.y + Math.sin(angle) * length,
      width: options.width || 8,
      color: options.color || owner.color,
      damage: options.damage || owner.atk * 1.5,
      life: 0.35,
      maxLife: 0.35,
      hasHit: new Set(),
      isUlt: !!options.isUlt
    });
  }

  // 3. Spawn AOE Field (e.g. Nana's Mushroom Spores, Yuni's Blizzard, Mashiro's Churu)
  spawnAoe(owner, x, y, options = {}) {
    this.aoeZones.push({
      owner,
      x,
      y,
      radius: options.radius || 70,
      maxRadius: options.maxRadius || options.radius || 70,
      color: options.color || owner.color,
      damagePerTick: options.damagePerTick || 12,
      duration: options.duration || 3.5,
      life: options.duration || 3.5,
      slow: options.slow || 0,
      tickTimer: 0,
      name: options.name || 'AOE Zone',
      isUlt: !!options.isUlt
    });
  }

  update(dt, arena, fighters, particleSystem, soundEngine, speedMultiplier = 1) {
    // 1. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      
      // Homing logic
      if (p.homing && p.target && !p.target.isDead) {
        const targetAngle = Math.atan2(p.target.y - p.y, p.target.x - p.x);
        const currentAngle = Math.atan2(p.vy, p.vx);
        const speed = Math.hypot(p.vx, p.vy);
        const diff = Math.atan2(Math.sin(targetAngle - currentAngle), Math.cos(targetAngle - currentAngle));
        const newAngle = currentAngle + diff * 0.08 * speedMultiplier;
        p.vx = Math.cos(newAngle) * speed;
        p.vy = Math.sin(newAngle) * speed;
      }

      p.x += p.vx * speedMultiplier;
      p.y += p.vy * speedMultiplier;
      p.life -= dt * speedMultiplier;

      // Particle Trail
      if (particleSystem && Math.random() < 0.6) {
        particleSystem.spawnTrail(p.x, p.y, p.color, p.radius * 0.6);
      }

      // Check boundary hit
      if (!arena.isInside(p.x, p.y, p.radius)) {
        if (particleSystem) particleSystem.spawnSparks(p.x, p.y, p.color, 6);
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
            particleSystem.spawnSparks(p.x, p.y, p.color, 12, 5);
            particleSystem.spawnShockwave(p.x, p.y, p.color, 40);
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
      l.life -= dt * speedMultiplier;

      // Line vs Circle collision
      for (const fighter of fighters) {
        if (fighter === l.owner || fighter.isDead || l.hasHit.has(fighter.id)) continue;
        if (fighter.team && fighter.team === l.owner.team) continue;

        const dist = this.distToSegment(fighter.x, fighter.y, l.x1, l.y1, l.x2, l.y2);
        if (dist <= fighter.radius + l.width / 2) {
          fighter.takeDamage(l.damage, l.owner, particleSystem, l.isUlt ? 'ult' : 'crit');
          l.hasHit.add(fighter.id);
          if (particleSystem) {
            particleSystem.spawnSparks(fighter.x, fighter.y, l.color, 15, 6);
            particleSystem.spawnShockwave(fighter.x, fighter.y, l.color, 50);
            particleSystem.shake(6);
          }
          if (soundEngine) soundEngine.playClash(1.5);
        }
      }

      if (l.life <= 0) {
        this.lasers.splice(i, 1);
      }
    }

    // 3. Update AOE Zones
    for (let i = this.aoeZones.length - 1; i >= 0; i--) {
      const aoe = this.aoeZones[i];
      aoe.life -= dt * speedMultiplier;
      aoe.tickTimer += dt * speedMultiplier;

      // Tick damage
      if (aoe.tickTimer >= 0.4) {
        aoe.tickTimer = 0;
        for (const fighter of fighters) {
          if (fighter === aoe.owner || fighter.isDead) continue;
          if (fighter.team && fighter.team === aoe.owner.team) continue;

          const dist = Math.hypot(fighter.x - aoe.x, fighter.y - aoe.y);
          if (dist <= aoe.radius + fighter.radius) {
            fighter.takeDamage(aoe.damagePerTick, aoe.owner, particleSystem, 'normal');
            if (aoe.slow > 0) {
              fighter.applySlow(aoe.slow, 0.5);
            }
            if (particleSystem) {
              particleSystem.spawnSparks(fighter.x, fighter.y, aoe.color, 4);
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
      const alpha = Math.min(0.35, aoe.life / aoe.duration);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = aoe.color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = aoe.color;
      ctx.beginPath();
      ctx.arc(aoe.x, aoe.y, aoe.radius, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing rim
      ctx.globalAlpha = alpha * 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
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
      ctx.shadowBlur = 25;
      ctx.shadowColor = l.color;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();

      // White inner core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = l.width * 0.4;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Render Projectiles
    for (const p of this.projectiles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Glowing core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}
