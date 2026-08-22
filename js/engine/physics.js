/**
 * Physics Engine
 * Handles substepping, 4-corner arena bounce, elastic fighter-to-fighter impulse collision,
 * and Kaengkaengi scratch attacks on contact.
 */

class PhysicsEngine {
  constructor() {
    this.restitution = 1.0;
    this.subSteps = 4;
  }

  update(dt, fighters, arena, soundEngine, particleSystem, speedMultiplier = 1) {
    const stepDt = dt / this.subSteps;

    for (let step = 0; step < this.subSteps; step++) {
      // 1. Resolve Fighter-to-Arena Boundary Collisions
      this.resolveArenaCollisions(fighters, arena, soundEngine, particleSystem);

      // 2. Resolve Fighter-to-Fighter Collisions
      this.resolveFighterCollisions(fighters, soundEngine, particleSystem);
    }
  }

  resolveArenaCollisions(fighters, arena, soundEngine, particleSystem) {
    if (!arena) return;

    for (const f of fighters) {
      if (f.isDead) continue;

      if (f.x - f.radius < arena.left) {
        f.x = arena.left + f.radius;
        f.vx = Math.abs(f.vx) * this.restitution;
        if (particleSystem) particleSystem.spawnSparks(f.x, f.y, f.color, 3, 2);
      } else if (f.x + f.radius > arena.right) {
        f.x = arena.right - f.radius;
        f.vx = -Math.abs(f.vx) * this.restitution;
        if (particleSystem) particleSystem.spawnSparks(f.x, f.y, f.color, 3, 2);
      }

      if (f.y - f.radius < arena.top) {
        f.y = arena.top + f.radius;
        f.vy = Math.abs(f.vy) * this.restitution;
        if (particleSystem) particleSystem.spawnSparks(f.x, f.y, f.color, 3, 2);
      } else if (f.y + f.radius > arena.bottom) {
        f.y = arena.bottom - f.radius;
        f.vy = -Math.abs(f.vy) * this.restitution;
        if (particleSystem) particleSystem.spawnSparks(f.x, f.y, f.color, 3, 2);
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

        const dx = f2.x - f1.x;
        const dy = f2.y - f1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = f1.radius + f2.radius;

        if (dist < minDist && dist > 0) {
          // Normal unit vector
          const nx = dx / dist;
          const ny = dy / dist;

          // 1. Separate overlapping balls
          const overlap = minDist - dist;
          f1.x -= nx * (overlap * 0.5);
          f1.y -= ny * (overlap * 0.5);
          f2.x += nx * (overlap * 0.5);
          f2.y += ny * (overlap * 0.5);

          // 2. Relative Velocity
          const rvx = f2.vx - f1.vx;
          const rvy = f2.vy - f1.vy;
          const velAlongNormal = rvx * nx + rvy * ny;

          // If moving away from each other, skip impulse
          if (velAlongNormal > 0) continue;

          // 3. Elastic impulse calculation
          const impulseMag = -(1 + this.restitution) * velAlongNormal / (1 / f1.mass + 1 / f2.mass);
          const impulseX = impulseMag * nx;
          const impulseY = impulseMag * ny;

          f1.vx -= (impulseX / f1.mass);
          f1.vy -= (impulseY / f1.mass);
          f2.vx += (impulseX / f2.mass);
          f2.vy += (impulseY / f2.mass);

          // 4. Kaengkaengi Fox Claw Scratch Attack on Contact
          if (f1.isFoxTransformed) {
            f1.applyFoxScratch(f2, particleSystem);
          }
          if (f2.isFoxTransformed) {
            f2.applyFoxScratch(f1, particleSystem);
          }

          // 5. Standard Collision Clash Damage
          const relativeSpeed = Math.hypot(rvx, rvy);
          const baseDamage = Math.max(6, Math.floor(relativeSpeed * 4.5));

          if (!f1.team || f1.team !== f2.team) {
            f1.takeDamage(baseDamage * (f2.atk / 45), f2, particleSystem, relativeSpeed > 7 ? 'crit' : 'normal');
            f2.takeDamage(baseDamage * (f1.atk / 45), f1, particleSystem, relativeSpeed > 7 ? 'crit' : 'normal');
          }

          // Visual & Sound Feedback
          if (particleSystem) {
            const midX = (f1.x + f2.x) / 2;
            const midY = (f1.y + f2.y) / 2;
            particleSystem.spawnSparks(midX, midY, f1.color, 6, 3);
            particleSystem.spawnShockwave(midX, midY, '#ffffff', 20, 2);
          }

          if (soundEngine) {
            soundEngine.playClash(relativeSpeed / 6);
          }
        }
      }
    }
  }
}
