/**
 * Skill Manager - Clean & Impactful Arcade Combat Engine
 * - Nana: Heavy Sniper Shot & Rapid Machine Gun
 * - Shibuki: Quick Horn Poke (2 horns) & Fox Berserk
 * - Riko: Jarvan E style Holy Sword Drop at Map Center (Clean Sword, Global AOE) & Time Stop
 */

class SkillManager {
  constructor() {
    this.projectiles = [];
    this.swordDrops = [];
    this.isTimeStopped = false;
    this.timeStopTimer = 0;
    this.timeStopOwner = null;
  }

  reset() {
    this.projectiles = [];
    this.swordDrops = [];
    this.isTimeStopped = false;
    this.timeStopTimer = 0;
    this.timeStopOwner = null;
  }

  // ═══ 1. Nana: Heavy Sniper Shot [사랑이 사격] ═══
  spawnHeavyBullet(fighter, startX, startY, angle, particleSystem) {
    const speed = 12.0;
    this.projectiles.push({
      id: 'sarangi_heavy',
      type: 'heavy_bullet',
      owner: fighter,
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 16,
      drawSize: 42,
      damage: 160,
      color: '#ff69b4',
      glowColor: '#f43f5e',
      life: 2.5,
      trailTimer: 0,
      angle: angle,
      spin: 0
    });

    if (particleSystem) {
      particleSystem.spawnSparks(startX, startY, '#ff69b4', 6, 3);
    }
  }

  // ═══ 2. Nana Ult: Rapid Machine Gun [사랑이 난사] ═══
  spawnRapidBullet(fighter, startX, startY, angle, particleSystem) {
    const speed = 13.5;
    this.projectiles.push({
      id: 'sarangi_rapid',
      type: 'rapid_bullet',
      owner: fighter,
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 7,
      drawSize: 18,
      damage: 28,
      color: '#ff69b4',
      glowColor: '#ffd700',
      life: 2.0,
      trailTimer: 0,
      angle: angle,
      spin: 0
    });

    if (particleSystem && Math.random() < 0.2) {
      particleSystem.spawnSparks(startX, startY, '#ff69b4', 2, 2);
    }
  }

  // ═══ 3. Shibuki: Horn Poke [뿔 발사] ═══
  spawnShibukiHorn(fighter, target, hornImg, particleSystem, hornIndex = 1) {
    const angle = Math.atan2(target.y - fighter.y, target.x - fighter.x) + (Math.random() - 0.5) * 0.08;
    const speed = 10.5;
    const spawnOffsetX = (hornIndex === 1 ? -1 : 1) * (fighter.radius * 0.45);

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
      damage: 30,
      color: '#c084fc',
      glowColor: '#a855f7',
      life: 2.5,
      trailTimer: 0,
      angle: angle,
      spin: 0,
      spinSpeed: 0.3
    });

    if (particleSystem) {
      particleSystem.spawnSparks(fighter.x + spawnOffsetX, fighter.y, '#c084fc', 3, 2);
    }
  }

  // ═══ 4. Riko: Jarvan E style Holy Sword Drop [성검 투하 - Center Drop & Map-wide Hit] ═══
  spawnRikoSwordDrop(fighter, arenaCenterX, arenaCenterY, swordImg, particleSystem, soundEngine) {
    const targetX = arenaCenterX;
    const targetY = arenaCenterY;

    this.swordDrops.push({
      owner: fighter,
      img: swordImg,
      state: 'falling',
      x: targetX,
      y: targetY - 450,
      targetX: targetX,
      targetY: targetY,
      vy: 38,
      rotation: 0,
      impactDmg: 35,
      duration: 3.0,
      pulseTimer: 0.7,
      pulseInterval: 0.8,
      pulseDmg: 12,
      color: '#10b981',
      glowColor: '#34d399'
    });

    if (particleSystem) {
      particleSystem.spawnDamageText(targetX, targetY - 100, '⚔️ 성검 투하 (전체 공격)!', 'skill', '#10b981');
    }
  }

  // ═══ 5. Riko: Chrono Lock [시간 정지] ═══
  triggerTimeStop(fighter, duration = 2.8, soundEngine, particleSystem) {
    this.isTimeStopped = true;
    this.timeStopTimer = duration;
    this.timeStopOwner = fighter;

    try { if (soundEngine) soundEngine.playTimeStop(); } catch(e) {}
    if (particleSystem) {
      particleSystem.shake(8);
      particleSystem.spawnDamageText(fighter.x, fighter.y - 36, '⏳ THE WORLD (시간 정지)!', 'ult', '#10b981');
    }
  }

  update(dt, arena, allFighters, particleSystem, soundEngine, speedMultiplier = 1) {
    const effSpeed = speedMultiplier;

    // ── Update Time Stop State ──
    if (this.isTimeStopped) {
      this.timeStopTimer -= dt * effSpeed;

      if (this.timeStopTimer <= 0) {
        this.isTimeStopped = false;
        this.timeStopOwner = null;
        try { if (soundEngine) soundEngine.playTimeResume(); } catch(e) {}
        if (particleSystem) {
          particleSystem.shake(6);
          particleSystem.spawnDamageText(arena.cx, arena.cy, '✨ 시간 재개!', 'buff', '#10b981');
        }
      }
    }

    // ── Update Holy Sword Drops (Jarvan E Style Clean Planted Sword) ──
    for (let i = this.swordDrops.length - 1; i >= 0; i--) {
      const sw = this.swordDrops[i];

      if (this.isTimeStopped && sw.owner !== this.timeStopOwner) {
        continue;
      }

      if (sw.state === 'falling') {
        sw.y += sw.vy * effSpeed;

        if (sw.y >= sw.targetY) {
          sw.y = sw.targetY;
          sw.state = 'planted';

          // Impact
          try { if (soundEngine) soundEngine.playSwordDrop(); } catch(e) {}
          if (particleSystem) {
            particleSystem.shake(8);
            particleSystem.spawnSparks(sw.x, sw.y, '#10b981', 16, 5);
          }

          // Full Screen Map Attack: Hits all enemies on the map!
          for (const enemy of allFighters) {
            if (enemy === sw.owner || enemy.isDead) continue;
            enemy.takeDamage(sw.impactDmg, sw.owner, particleSystem, 'crit');

            if (particleSystem) {
              particleSystem.spawnSlash(enemy.x, enemy.y, Math.PI / 4, '#10b981', 50);
            }
          }
        }
      } else if (sw.state === 'planted') {
        sw.duration -= dt * effSpeed;
        sw.pulseTimer -= dt * effSpeed;

        // Periodic Holy Sword Pulse
        if (sw.pulseTimer <= 0) {
          sw.pulseTimer = sw.pulseInterval;

          if (particleSystem) {
            particleSystem.spawnSparks(sw.x, sw.y, '#10b981', 6, 3);
          }

          // Hits ALL enemies anywhere across the map
          for (const enemy of allFighters) {
            if (enemy === sw.owner || enemy.isDead) continue;
            enemy.takeDamage(sw.pulseDmg, sw.owner, particleSystem, 'normal');

            if (particleSystem) {
              particleSystem.spawnSlash(enemy.x, enemy.y, Math.random() * Math.PI, '#10b981', 40);
            }
          }
        }

        if (sw.duration <= 0) {
          if (particleSystem) {
            particleSystem.spawnSparks(sw.x, sw.y, '#10b981', 12, 4);
          }
          this.swordDrops.splice(i, 1);
        }
      }
    }

    // ── Update Projectiles ──
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      if (this.isTimeStopped && p.owner !== this.timeStopOwner) {
        continue;
      }

      p.x += p.vx * effSpeed;
      p.y += p.vy * effSpeed;
      p.life -= dt * effSpeed;
      p.spin += (p.spinSpeed || 0.1) * effSpeed;

      p.trailTimer += dt * effSpeed;
      if (p.trailTimer >= 0.05 && particleSystem) {
        p.trailTimer = 0;
        particleSystem.spawnTrail(p.x, p.y, p.color, 4);
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
            if (p.type === 'heavy_bullet') {
              particleSystem.shake(5);
              particleSystem.spawnSparks(p.x, p.y, '#ff69b4', 10, 4);
            } else if (p.type === 'horn') {
              particleSystem.spawnSlash(p.x, p.y, p.angle, '#c084fc', 40);
              particleSystem.spawnSparks(p.x, p.y, '#c084fc', 4, 2);
            } else {
              particleSystem.spawnSparks(p.x, p.y, '#ff69b4', 3, 2);
            }
          }
          break;
        }
      }

      if (arena && !arena.isInside(p.x, p.y, p.radius)) {
        if (particleSystem) particleSystem.spawnSparks(p.x, p.y, p.color, 3, 2);
        hit = true;
      }

      if (hit || p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();

    // ── 1. Render Planted / Falling Holy Swords (Jarvan E Style Clean Sword) ──
    for (const sw of this.swordDrops) {
      ctx.save();
      ctx.translate(sw.x, sw.y);

      if (sw.state === 'planted') {
        if (sw.img && sw.img.complete && sw.img.naturalWidth > 0) {
          const swW = 44;
          const swH = 150;
          ctx.drawImage(sw.img, -swW / 2, -swH + 25, swW, swH);
        } else {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(-6, -130, 12, 130);
        }

      } else if (sw.state === 'falling') {
        if (sw.img && sw.img.complete && sw.img.naturalWidth > 0) {
          const swW = 48;
          const swH = 160;
          ctx.drawImage(sw.img, -swW / 2, -swH / 2, swW, swH);
        } else {
          ctx.fillStyle = '#34d399';
          ctx.fillRect(-6, -80, 12, 160);
        }
      }

      ctx.restore();
    }

    // ── 2. Render Projectiles ──
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
        ctx.rotate(p.angle);

        ctx.fillStyle = '#ff69b4';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.drawSize * 0.48, p.drawSize * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💖', 0, 0);

      } else {
        ctx.rotate(p.angle);
        ctx.fillStyle = '#ff69b4';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.drawSize * 0.55, p.drawSize * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(2, 0, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // ── 3. Time Stop Clean Dark Filter ──
    if (this.isTimeStopped) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const cx = ctx.canvas.width / 2;
      const cy = ctx.canvas.height / 2;
      const r = Math.min(cx, cy) * 0.55;

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }
}