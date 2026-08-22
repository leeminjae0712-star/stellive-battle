/**
 * Physics Engine - Clean, Smooth & Wall-Slam Enabled
 */

class PhysicsEngine {
  constructor() {
    this.restitution = 1.0;
  }

  update(dt, fighters, arena, soundEngine, particleSystem, speedMultiplier = 1) {
    if (!arena || fighters.length === 0) return;

    // 1. Resolve Collisions
    this.resolveFighterCollisions(fighters, soundEngine, particleSystem);

    // 2. Resolve Wall Bounces & Wall Slam Damage
    this.resolveArenaCollisions(fighters, arena, soundEngine, particleSystem);

    // 3. Normalization (Only for non-stunned fighters)
    for (const f of fighters) {
      if (f.isDead || f.stunTimer > 0) continue;

      if (f.isWallSlamming) {
        // Maintain high slam speed until hitting a wall
        continue;
      }

      const target = f.isFoxTransformed ? f.baseSpeed * 1.6 : f.baseSpeed;
      const cur = Math.hypot(f.vx, f.vy);
      if (cur < 0.5 || isNaN(cur)) {
        const a = Math.random() * Math.PI * 2;
        f.vx = Math.cos(a) * target;
        f.vy = Math.sin(a) * target;
      } else {
        f.vx = (f.vx / cur) * target;
        f.vy = (f.vy / cur) * target;
      }
    }
  }

  resolveFighterCollisions(fighters, soundEngine, particleSystem) {
    for (let i = 0; i < fighters.length; i++) {
      const f1 = fighters[i];
      if (f1.isDead) continue;

      for (let j = i + 1; j < fighters.length; j++) {
        const f2 = fighters[j];
        if (f2.isDead) continue;

        let dx = f2.x - f1.x, dy = f2.y - f1.y;
        let dist = Math.hypot(dx, dy);
        const minDist = f1.radius + f2.radius;

        if (dist < minDist) {
          if (dist === 0) { dx = 1; dy = 0; dist = 1; }
          const nx = dx / dist, ny = dy / dist;
          const overlap = minDist - dist + 2.5;

          f1.x -= nx * overlap * 0.5;
          f1.y -= ny * overlap * 0.5;
          f2.x += nx * overlap * 0.5;
          f2.y += ny * overlap * 0.5;

          const rvx = f2.vx - f1.vx, rvy = f2.vy - f1.vy;
          const velN = rvx * nx + rvy * ny;

          if (velN < 0) {
            const imp = -(1 + this.restitution) * velN / 2;
            f1.vx -= imp * nx; f1.vy -= imp * ny;
            f2.vx += imp * nx; f2.vy += imp * ny;
          } else {
            f1.vx -= nx * 2.0; f1.vy -= ny * 2.0;
            f2.vx += nx * 2.0; f2.vy += ny * 2.0;
          }

          // Fox scratch on contact
          if (f1.isFoxTransformed) f1.applyFoxScratch(f2, particleSystem);
          if (f2.isFoxTransformed) f2.applyFoxScratch(f1, particleSystem);

          // Throttled Clash Damage
          if (f1.clashCooldown <= 0 && f2.clashCooldown <= 0) {
            f1.clashCooldown = 0.45;
            f2.clashCooldown = 0.45;

            const clashDmg = Math.max(4, Math.floor(Math.hypot(f1.vx - f2.vx, f1.vy - f2.vy) * 0.8));
            f1.takeDamage(clashDmg, f2, particleSystem, 'normal');
            f2.takeDamage(clashDmg, f1, particleSystem, 'normal');

            if (particleSystem) {
              const mx = (f1.x + f2.x) / 2, my = (f1.y + f2.y) / 2;
              particleSystem.spawnSparks(mx, my, '#ffffff', 4, 2);
            }
            try { if (soundEngine) soundEngine.playClash(); } catch(e) {}
          }
        }
      }
    }
  }

  resolveArenaCollisions(fighters, arena, soundEngine, particleSystem) {
    for (const f of fighters) {
      if (f.isDead) continue;

      let hitWall = false;

      if (f.x - f.radius <= arena.left) {
        f.x = arena.left + f.radius; f.vx = Math.abs(f.vx);
        if (Math.abs(f.vx) < 1) f.vx = 2; hitWall = true;
      } else if (f.x + f.radius >= arena.right) {
        f.x = arena.right - f.radius; f.vx = -Math.abs(f.vx);
        if (Math.abs(f.vx) < 1) f.vx = -2; hitWall = true;
      }
      if (f.y - f.radius <= arena.top) {
        f.y = arena.top + f.radius; f.vy = Math.abs(f.vy);
        if (Math.abs(f.vy) < 1) f.vy = 2; hitWall = true;
      } else if (f.y + f.radius >= arena.bottom) {
        f.y = arena.bottom - f.radius; f.vy = -Math.abs(f.vy);
        if (Math.abs(f.vy) < 1) f.vy = -2; hitWall = true;
      }

      if (hitWall) {
        // Check for Wall Slam!
        if (f.isWallSlamming) {
          f.isWallSlamming = false;
          const slamDmg = 100;
          f.takeDamage(slamDmg, f.wallSlamAttacker || null, particleSystem, 'crit');

          if (particleSystem) {
            particleSystem.shake(12);
            particleSystem.spawnSparks(f.x, f.y, '#ef4444', 16, 6);
            particleSystem.spawnDamageText(f.x, f.y - 20, '💥 WALL SLAM (벽쾅 100딜)!', 'crit', '#ef4444');
          }
          try { if (soundEngine) soundEngine.playClash(); } catch(e) {}
        } else {
          if (particleSystem) particleSystem.spawnSparks(f.x, f.y, f.color, 2, 2);
        }
      }
    }
  }
}