/**
 * Physics Engine - Pro Balanced 3-Hero Support
 * - Minimal body clash damage (4-6)
 * - Safe unstick separation
 * - Time Stop freeze check (frozen fighters do not push or bounce)
 */

class PhysicsEngine {
  constructor() {
    this.restitution = 1.0;
  }

  update(dt, fighters, arena, soundEngine, particleSystem, speedMultiplier = 1, skillManager = null) {
    if (!arena || fighters.length === 0) return;

    // 1. Resolve Collisions
    this.resolveFighterCollisions(fighters, soundEngine, particleSystem, skillManager);

    // 2. Resolve Wall Bounces
    this.resolveArenaCollisions(fighters, arena, soundEngine, particleSystem, skillManager);

    // 3. Normalization (Only for non-frozen fighters)
    for (const f of fighters) {
      if (f.isDead) continue;

      if (skillManager && skillManager.isTimeStopped && skillManager.timeStopOwner !== f) {
        continue; // Frozen in time
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

  resolveFighterCollisions(fighters, soundEngine, particleSystem, skillManager) {
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

          const f1Frozen = skillManager && skillManager.isTimeStopped && skillManager.timeStopOwner !== f1;
          const f2Frozen = skillManager && skillManager.isTimeStopped && skillManager.timeStopOwner !== f2;

          if (!f1Frozen) {
            f1.x -= nx * (f2Frozen ? overlap : overlap * 0.5);
            f1.y -= ny * (f2Frozen ? overlap : overlap * 0.5);
          }
          if (!f2Frozen) {
            f2.x += nx * (f1Frozen ? overlap : overlap * 0.5);
            f2.y += ny * (f1Frozen ? overlap : overlap * 0.5);
          }

          const rvx = f2.vx - f1.vx, rvy = f2.vy - f1.vy;
          const velN = rvx * nx + rvy * ny;

          if (velN < 0) {
            const imp = -(1 + this.restitution) * velN / 2;
            if (!f1Frozen) { f1.vx -= imp * nx; f1.vy -= imp * ny; }
            if (!f2Frozen) { f2.vx += imp * nx; f2.vy += imp * ny; }
          } else {
            if (!f1Frozen) { f1.vx -= nx * 2.0; f1.vy -= ny * 2.0; }
            if (!f2Frozen) { f2.vx += nx * 2.0; f2.vy += ny * 2.0; }
          }

          // Fox scratch on contact
          if (f1.isFoxTransformed && !f1Frozen) f1.applyFoxScratch(f2, particleSystem);
          if (f2.isFoxTransformed && !f2Frozen) f2.applyFoxScratch(f1, particleSystem);

          // Minimal clash damage
          const clashDmg = Math.max(4, Math.floor(Math.hypot(f1.vx - f2.vx, f1.vy - f2.vy) * 0.8));
          f1.takeDamage(clashDmg, f2, particleSystem);
          f2.takeDamage(clashDmg, f1, particleSystem);

          if (particleSystem) {
            const mx = (f1.x + f2.x) / 2, my = (f1.y + f2.y) / 2;
            particleSystem.spawnSparks(mx, my, '#ffffff', 5, 3);
            particleSystem.spawnShockwave(mx, my, '#ffd700', 22, 2);
          }
          try { if (soundEngine) soundEngine.playClash(); } catch(e) {}
        }
      }
    }
  }

  resolveArenaCollisions(fighters, arena, soundEngine, particleSystem, skillManager) {
    for (const f of fighters) {
      if (f.isDead) continue;
      if (skillManager && skillManager.isTimeStopped && skillManager.timeStopOwner !== f) {
        continue;
      }

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
      if (hitWall && particleSystem) particleSystem.spawnSparks(f.x, f.y, f.color, 3, 2);
    }
  }
}
