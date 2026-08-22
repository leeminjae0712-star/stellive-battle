/**
 * Physics Engine
 * Rock-Solid Continuous Bouncing Engine (Zero Sticking, Zero Pinning, 100% Unstuck Guarantee).
 */

class PhysicsEngine {
  constructor() {
    this.restitution = 1.0;
  }

  update(dt, fighters, arena, soundEngine, particleSystem, speedMultiplier = 1) {
    if (!arena || fighters.length === 0) return;

    // 1. Resolve Fighter vs Fighter Clashes (Guaranteed zero sticking)
    this.resolveFighterCollisions(fighters, soundEngine, particleSystem);

    // 2. Resolve Arena Wall Collisions & Clamping
    this.resolveArenaCollisions(fighters, arena, soundEngine, particleSystem);

    // 3. Guarantee Non-Zero Constant Speed for all fighters
    for (const f of fighters) {
      if (f.isDead) continue;
      const targetSpeed = f.isFoxTransformed ? f.baseSpeed * 1.65 : f.baseSpeed;
      const curSpeed = Math.hypot(f.vx, f.vy);

      if (curSpeed < 0.5 || isNaN(curSpeed)) {
        const a = Math.random() * Math.PI * 2;
        f.vx = Math.cos(a) * targetSpeed;
        f.vy = Math.sin(a) * targetSpeed;
      } else {
        f.vx = (f.vx / curSpeed) * targetSpeed;
        f.vy = (f.vy / curSpeed) * targetSpeed;
      }
    }
  }

  resolveFighterCollisions(fighters, soundEngine, particleSystem) {
    const count = fighters.length;

    for (let i = 0; i < count; i++) {
      const f1 = fighters[i];
      if (f1.isDead) continue;

      for (let j = i + 1; j < count; j++) {
        const f2 = fighters[j];
        if (f2.isDead) continue;

        let dx = f2.x - f1.x;
        let dy = f2.y - f1.y;
        let dist = Math.hypot(dx, dy);
        const minDist = f1.radius + f2.radius;

        if (dist < minDist) {
          // If perfectly overlapping, create arbitrary normal
          if (dist === 0) {
            dx = 1;
            dy = 0;
            dist = 1;
          }

          const nx = dx / dist;
          const ny = dy / dist;

          // 1. Separate completely with extra 2px buffer to guarantee no sticky lock
          const overlap = minDist - dist + 2.0;
          f1.x -= nx * (overlap * 0.5);
          f1.y -= ny * (overlap * 0.5);
          f2.x += nx * (overlap * 0.5);
          f2.y += ny * (overlap * 0.5);

          // 2. Relative Velocity along Normal
          const rvx = f2.vx - f1.vx;
          const rvy = f2.vy - f1.vy;
          const velAlongNormal = rvx * nx + rvy * ny;

          // 3. Elastic impulse reflection
          if (velAlongNormal < 0) {
            const impulseMag = -(1 + this.restitution) * velAlongNormal / 2;
            f1.vx -= impulseMag * nx;
            f1.vy -= impulseMag * ny;
            f2.vx += impulseMag * nx;
            f2.vy += impulseMag * ny;
          } else {
            // If already separating but overlapping, push apart with burst impulse
            f1.vx -= nx * 2.0;
            f1.vy -= ny * 2.0;
            f2.vx += nx * 2.0;
            f2.vy += ny * 2.0;
          }

          // 4. Kaengkaengi Scratch & Clash Damage
          if (f1.isFoxTransformed) f1.applyFoxScratch(f2, particleSystem);
          if (f2.isFoxTransformed) f2.applyFoxScratch(f1, particleSystem);

          const relSpeed = Math.hypot(f1.vx - f2.vx, f1.vy - f2.vy);
          const dmg = Math.max(8, Math.floor(relSpeed * 4.5));
          f1.takeDamage(dmg, f2, particleSystem);
          f2.takeDamage(dmg, f1, particleSystem);

          if (particleSystem) {
            const mx = (f1.x + f2.x) / 2;
            const my = (f1.y + f2.y) / 2;
            particleSystem.spawnSparks(mx, my, '#ffffff', 8, 3);
            particleSystem.spawnShockwave(mx, my, '#ffd700', 30, 2);
          }

          if (soundEngine) {
            soundEngine.playClash();
          }
        }
      }
    }
  }

  resolveArenaCollisions(fighters, arena, soundEngine, particleSystem) {
    for (const f of fighters) {
      if (f.isDead) continue;

      let hitWall = false;

      // Left Wall
      if (f.x - f.radius <= arena.left) {
        f.x = arena.left + f.radius;
        f.vx = Math.abs(f.vx);
        if (Math.abs(f.vx) < 1.0) f.vx = 2.0;
        hitWall = true;
      }
      // Right Wall
      else if (f.x + f.radius >= arena.right) {
        f.x = arena.right - f.radius;
        f.vx = -Math.abs(f.vx);
        if (Math.abs(f.vx) < 1.0) f.vx = -2.0;
        hitWall = true;
      }

      // Top Wall
      if (f.y - f.radius <= arena.top) {
        f.y = arena.top + f.radius;
        f.vy = Math.abs(f.vy);
        if (Math.abs(f.vy) < 1.0) f.vy = 2.0;
        hitWall = true;
      }
      // Bottom Wall
      else if (f.y + f.radius >= arena.bottom) {
        f.y = arena.bottom - f.radius;
        f.vy = -Math.abs(f.vy);
        if (Math.abs(f.vy) < 1.0) f.vy = -2.0;
        hitWall = true;
      }

      if (hitWall && particleSystem) {
        particleSystem.spawnSparks(f.x, f.y, f.color, 4, 2);
      }
    }
  }
}
