/**
 * Skill Manager - Pro Asymmetric Combat Engine
 * Supports:
 * - Nana: Heavy Sniper Shot (160 dmg) & Rapid Machine Gun (28x16)
 * - Shibuki: Quick Horn Poke (38x2) & Fox Berserk
 * - Riko: Jarvan E Holy Sword Drop (95 impact + 22x4 pulses) & 2.8s Time Stop
 */

class SkillManager {
  constructor() {
    this.projectiles = [];
    this.swordDrops = []; // Falling / Planted swords
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

  // ═══ 1. Nana: Heavy Single Shot [사랑이 사격] ═══
  spawnHeavyBullet(fighter, startX, startY, angle, particleSystem) {
    const speed = 11.5;
    this.projectiles.push({
      id: 'sarangi_heavy',
      type: 'heavy_bullet',
      owner: fighter,
      x: startX, y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 16,
      drawSize: 40,
      damage: 160, // Heavy punchy shot
      color: '#ff69b4',
      glowColor: '#f43f5e',
      life: 2.8,
      trailTimer: 0,
      angle: angle,
      spin: 0
    });

    if (particleSystem) {
      particleSystem.spawnShockwave(startX, startY, '#ff69b4', 60, 4);
      particleSystem.spawnSparks(startX, startY, '#ffd700', 12, 5);
    }
  }

  // ═══ 2. Nana Ult: Rapid Machine Gun [사랑이 난사] ═══
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
      damage: 28, // 28 x 16 = 448 total burst
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

  // ═══ 3. Shibuki: Horn Poke [뿔 발사] ═══
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
      damage: 38, // 38 x 2 = 76 per cycle (every 1.5s)
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

  // ═══ 4. Riko: Holy Sword Drop [성검 투하 - Jarvan E style] ═══
  spawnRikoSwordDrop(fighter, targetX, targetY, swordImg, particleSystem, soundEngine) {
    this.swordDrops.push({
      owner: fighter,
      img: swordImg,
      state: 'falling', // 'falling' -> 'planted'
      x: targetX,
      y: targetY - 320,
      targetX: targetX,
      targetY: targetY,
      vy: 28,
      rotation: -0.15,
      impactDmg: 95,
      aoeRadius: 110,
      duration: 3.0,
      pulseTimer: 0.5,
      pulseInterval: 0.6,
      pulseDmg: 22,
      particleTimer: 0,
      color: '#10b981',
      glowColor: '#34d399'
    });

    if (particleSystem) {
      // Pre-drop indicator target circle
      particleSystem.spawnShockwave(targetX, targetY, '#10b981', 80, 2);
      particleSystem.spawnDamageText(targetX, targetY - 20, '⚔️ 성검 투하!', 'skill', '#10b981');
    }
  }

  // ═══ 5. Riko: Time Stop [시간 정지] ═══
  triggerTimeStop(fighter, duration = 2.8, soundEngine, particleSystem) {
    this.isTimeStopped = true;
    this.timeStopTimer = duration;
    this.timeStopOwner = fighter;

    try { if (soundEngine) soundEngine.playTimeStop(); } catch(e) {}
    if (particleSystem) {
      particleSystem.shake(12);
      particleSystem.spawnShockwave(fighter.x, fighter.y, '#10b981', 180, 8);
      particleSystem.spawnDamageText(fighter.x, fighter.y - 36, '⏳ THE WORLD (시간 정지)!', 'ult', '#34d399');
    }
  }

  update(dt, arena, allFighters, particleSystem, soundEngine, speedMultiplier = 1) {
    const effSpeed = speedMultiplier;

    // ── Update Time Stop State ──
    if (this.isTimeStopped) {
      this.timeStopTimer -= dt * effSpeed;

      // Spawn chrono aura around time stop owner
      if (this.timeStopOwner && particleSystem && Math.random() < 0.4) {
        particleSystem.spawnTrail(this.timeStopOwner.x, this.timeStopOwner.y, '#10b981', 12);
      }

      if (this.timeStopTimer <= 0) {
        this.isTimeStopped = false;
        this.timeStopOwner = null;
        try { if (soundEngine) soundEngine.playTimeResume(); } catch(e) {}
        if (particleSystem) {
          particleSystem.shake(10);
          particleSystem.spawnShockwave(arena.cx, arena.cy, '#34d399', 240, 10);
          particleSystem.spawnDamageText(arena.cx, arena.cy, '✨ 시간 재개!', 'buff', '#10b981');
        }
      }
    }

    // ── Update Holy Sword Drops (Jarvan E style) ──
    for (let i = this.swordDrops.length - 1; i >= 0; i--) {
      const sw = this.swordDrops[i];

      // If time stopped and sword belongs to frozen fighter, pause
      if (this.isTimeStopped && sw.owner !== this.timeStopOwner) {
        continue;
      }

      if (sw.state === 'falling') {
        sw.y += sw.vy * effSpeed;

        if (particleSystem) {
          particleSystem.spawnTrail(sw.x, sw.y, sw.color, 8);
        }

        if (sw.y >= sw.targetY) {
          sw.y = sw.targetY;
          sw.state = 'planted';

          // Impact effects
          try { if (soundEngine) soundEngine.playSwordDrop(); } catch(e) {}
          if (particleSystem) {
            particleSystem.shake(9);
            particleSystem.spawnShockwave(sw.x, sw.y, sw.glowColor, 90, 6);
            particleSystem.spawnSparks(sw.x, sw.y, '#34d399', 18, 6);
          }

          // Initial Impact AOE Damage (95 dmg)
          for (const enemy of allFighters) {
            if (enemy === sw.owner || enemy.isDead) continue;
            const dist = Math.hypot(enemy.x - sw.x, enemy.y - sw.y);
            if (dist <= sw.aoeRadius + enemy.radius) {
              enemy.takeDamage(sw.impactDmg, sw.owner, particleSystem, 'crit');
            }
          }
        }
      } else if (sw.state === 'planted') {
        sw.duration -= dt * effSpeed;
        sw.pulseTimer -= dt * effSpeed;

        // Periodic AOE Ring Pulses (22 dmg per pulse)
        if (sw.pulseTimer <= 0) {
          sw.pulseTimer = sw.pulseInterval;

          if (particleSystem) {
            particleSystem.spawnShockwave(sw.x, sw.y, sw.color, sw.aoeRadius, 3);
            particleSystem.spawnSparks(sw.x, sw.y, '#10b981', 6, 2);
          }

          for (const enemy of allFighters) {
            if (enemy === sw.owner || enemy.isDead) continue;
            const dist = Math.hypot(enemy.x - sw.x, enemy.y - sw.y);
            if (dist <= sw.aoeRadius + enemy.radius) {
              enemy.takeDamage(sw.pulseDmg, sw.owner, particleSystem, 'normal');
            }
          }
        }

        if (sw.duration <= 0) {
          if (particleSystem) {
            particleSystem.spawnSparks(sw.x, sw.y, sw.color, 10, 3);
          }
          this.swordDrops.splice(i, 1);
        }
      }
    }

    // ── Update Projectiles ──
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      // If time stopped and projectile does not belong to time stop owner, freeze it mid-air!
      if (this.isTimeStopped && p.owner !== this.timeStopOwner) {
        continue;
      }

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

      // Wall reflection / absorption
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

    // ── 1. Render Planted / Falling Swords ──
    for (const sw of this.swordDrops) {
      ctx.save();

      if (sw.state === 'planted') {
        // Ground Magic Circle & Pulsing Aura Zone
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.aoeRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Sword Shadow / Ground Crack
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(sw.x, sw.y + 4, 28, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Vertical Planted Sword
        ctx.translate(sw.x, sw.y);
        ctx.rotate(sw.rotation);

        if (sw.img && sw.img.complete && sw.img.naturalWidth > 0) {
          const swW = 32;
          const swH = 110;
          ctx.drawImage(sw.img, -swW / 2, -swH + 15, swW, swH);
        } else {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(-4, -80, 8, 80);
        }

      } else if (sw.state === 'falling') {
        // Falling sword
        ctx.translate(sw.x, sw.y);
        ctx.rotate(sw.rotation);

        if (sw.img && sw.img.complete && sw.img.naturalWidth > 0) {
          const swW = 34;
          const swH = 115;
          ctx.drawImage(sw.img, -swW / 2, -swH / 2, swW, swH);
        } else {
          ctx.fillStyle = '#34d399';
          ctx.fillRect(-5, -50, 10, 100);
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

    // ── 3. Time Stop Chrono Screen Effect ──
    if (this.isTimeStopped) {
      ctx.save();
      const pulse = 0.25 + 0.15 * Math.sin(Date.now() * 0.01);
      ctx.fillStyle = `rgba(16, 185, 129, ${pulse})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // Chrono Dial Ring overlay in center
      const cx = ctx.canvas.width / 2;
      const cy = ctx.canvas.height / 2;
      const r = Math.min(cx, cy) * 0.65;
      const rot = (Date.now() * 0.001) % (Math.PI * 2);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      // Clock tick marks
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r - 12), Math.sin(a) * (r - 12));
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.stroke();
      }
      ctx.restore();

      ctx.restore();
    }

    ctx.restore();
  }
}
