/**
 * Physics Engine
 * Handles substepping, continuous collision resolution, elastic impulses, and arena bounce
 */

class PhysicsEngine {
  constructor() {
    this.bounciness = 1.05;
    this.subSteps = 4;
  }

  setBounciness(val) {
    this.bounciness = parseFloat(val);
  }

  update(dt, fighters, arena, soundEngine, particleSystem, speedMultiplier = 1) {
    const stepDt = dt / this.subSteps;

    for (let step = 0; step < this.subSteps; step++) {
      // 1. Move fighters
      for (const fighter of fighters) {
        if (!fighter.isDead) {
          fighter.update(stepDt, speedMultiplier);
        }
      }

      // 2. Resolve Fighter-to-Arena Boundary Collisions
      this.resolveArenaCollisions(fighters, arena, soundEngine, particleSystem);

      // 3. Resolve Fighter-to-Obstacle Collisions (Pinball bumpers & Spinners)
      this.resolveObstacleCollisions(fighters, arena, soundEngine, particleSystem);

      // 4. Resolve Fighter-to-Fighter Collisions
      this.resolveFighterCollisions(fighters, soundEngine, particleSystem);
    }
  }

  resolveArenaCollisions(fighters, arena, soundEngine, particleSystem) {
    for (const f of fighters) {
      if (f.isDead) continue;

      if (arena.type === 'box') {
        const halfW = (arena.width * 0.86) / 2;
        const halfH = (arena.height * 0.86) / 2;
        const minX = arena.cx - halfW + f.radius;
        const maxX = arena.cx + halfW - f.radius;
        const minY = arena.cy - halfH + f.radius;
        const maxY = arena.cy + halfH - f.radius;

        let bounced = false;
        if (f.x < minX) {
          f.x = minX;
          f.vx = -f.vx;
          bounced = true;
        } else if (f.x > maxX) {
          f.x = maxX;
          f.vx = -f.vx;
          bounced = true;
        }

        if (f.y < minY) {
          f.y = minY;
          f.vy = -f.vy;
          bounced = true;
        } else if (f.y > maxY) {
          f.y = maxY;
          f.vy = -f.vy;
          bounced = true;
        }

        if (bounced) {
          f.onWallBounce(soundEngine, particleSystem, this.bounciness);
        }
      } else {
        // Circle / Hexagon Boundary Check
        const dx = f.x - arena.cx;
        const dy = f.y - arena.cy;
        const dist = Math.hypot(dx, dy);
        const maxDist = arena.currentRadius - f.radius;

        if (dist > maxDist && dist > 0) {
          // Normal vector pointing inwards
          const nx = dx / dist;
          const ny = dy / dist;

          // Push back inside
          f.x = arena.cx + nx * maxDist;
          f.y = arena.cy + ny * maxDist;

          // Reflect velocity along normal
          const dot = f.vx * nx + f.vy * ny;
          if (dot > 0) {
            f.vx -= 2 * dot * nx;
            f.vy -= 2 * dot * ny;
            f.onWallBounce(soundEngine, particleSystem, this.bounciness);
          }
        }
      }
    }
  }

  resolveObstacleCollisions(fighters, arena, soundEngine, particleSystem) {
    for (const f of fighters) {
      if (f.isDead) continue;

      // 1. Pinball Bumpers
      for (const b of arena.bumpers) {
        const dx = f.x - b.x;
        const dy = f.y - b.y;
        const dist = Math.hypot(dx, dy);
        const minDist = f.radius + b.r;

        if (dist < minDist && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;

          f.x = b.x + nx * minDist;
          f.y = b.y + ny * minDist;

          // High impulse bounce
          const dot = f.vx * nx + f.vy * ny;
          f.vx = (f.vx - 2 * dot * nx) * b.power;
          f.vy = (f.vy - 2 * dot * ny) * b.power;

          f.addSP(15);
          if (soundEngine) soundEngine.playClash(1.5);
          if (particleSystem) {
            particleSystem.spawnShockwave(b.x, b.y, b.color, 45);
            particleSystem.spawnSparks(f.x, f.y, b.color, 12, 6);
            particleSystem.shake(4);
          }
        }
      }

      // 2. Rotating Spinner Bars
      for (const s of arena.spinners) {
        // Transform fighter to spinner local coordinates
        const cos = Math.cos(-s.angle);
        const sin = Math.sin(-s.angle);
        const relX = f.x - s.x;
        const relY = f.y - s.y;
        const localX = cos * relX - sin * relY;
        const localY = sin * relX + cos * relY;

        const halfL = s.length / 2;
        const halfW = s.width / 2;

        const closestX = Math.max(-halfL, Math.min(halfL, localX));
        const closestY = Math.max(-halfW, Math.min(halfW, localY));

        const distLocal = Math.hypot(localX - closestX, localY - closestY);

        if (distLocal < f.radius) {
          // Collision with spinner!
          const normalAngle = s.angle + Math.PI / 2;
          const nx = Math.cos(normalAngle);
          const ny = Math.sin(normalAngle);

          // Impart spinner velocity
          const tangentialSpeed = s.speed * Math.hypot(relX, relY) * 20;
          f.vx += -sin * tangentialSpeed * 1.5;
          f.vy += cos * tangentialSpeed * 1.5;

          f.takeDamage(20, null, particleSystem, 'crit');
          if (soundEngine) soundEngine.playClash(1.8);
          if (particleSystem) {
            particleSystem.spawnSparks(f.x, f.y, '#f59e0b', 10, 5);
            particleSystem.shake(5);
          }
        }
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
          // Normal & Tangent vectors
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

          // Do not resolve if moving away
          if (velAlongNormal > 0) continue;

          // 3. Elastic impulse calculation
          const restitution = 1.02;
          const impulseMag = -(1 + restitution) * velAlongNormal / (1 / f1.mass + 1 / f2.mass);

          const impulseX = impulseMag * nx;
          const impulseY = impulseMag * ny;

          f1.vx -= (impulseX / f1.mass);
          f1.vy -= (impulseY / f1.mass);
          f2.vx += (impulseX / f2.mass);
          f2.vy += (impulseY / f2.mass);

          // 4. Calculate Collision Damage
          const relativeSpeed = Math.hypot(rvx, rvy);
          const baseDamage = Math.max(10, Math.floor(relativeSpeed * 6));

          // Apply damage (if not in same team)
          if (!f1.team || f1.team !== f2.team) {
            f1.takeDamage(baseDamage * (f2.atk / 40), f2, particleSystem, relativeSpeed > 10 ? 'crit' : 'normal');
            f2.takeDamage(baseDamage * (f1.atk / 40), f1, particleSystem, relativeSpeed > 10 ? 'crit' : 'normal');
          }

          // Sparks & Sound
          if (particleSystem) {
            const midX = (f1.x + f2.x) / 2;
            const midY = (f1.y + f2.y) / 2;
            particleSystem.spawnSparks(midX, midY, f1.color, 8, 4);
            particleSystem.spawnShockwave(midX, midY, '#ffffff', 25, 2);
            if (relativeSpeed > 10) particleSystem.shake(3);
          }

          if (soundEngine) {
            soundEngine.playClash(relativeSpeed / 8);
          }
        }
      }
    }
  }
}
