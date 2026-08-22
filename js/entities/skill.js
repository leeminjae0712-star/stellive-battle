/**
 * Skill Manager - Ultra Deluxe Combat Engine
 * - Nana: Heart Comet Heavy Shot & Machine Gun Laser Barrage
 * - Shibuki: Foxfire Spectral Horns & Thunder Claws
 * - Riko: COLOSSAL Holy Sword Drop (Map-Wide Shockwave & Full Map Attack) & Chrono Lock Time Stop
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

  // ═══ 1. Nana: Heavy Heart Comet [사랑이 사격] ═══
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
      radius: 18,
      drawSize: 48,
      damage: 160,
      color: '#ff69b4',
      glowColor: '#f43f5e',
      life: 2.8,
      trailTimer: 0,
      angle: angle,
      spin: 0
    });

    if (particleSystem) {
      particleSystem.spawnShockwave(startX, startY, '#ff69b4', 50, 4);
      particleSystem.spawnStars(startX, startY, '#ff69b4', 6);
      particleSystem.spawnSparks(startX, startY, '#ffd700', 8, 4);
    }
  }

  // ═══ 2. Nana Ult: Rapid Machine Gun Barrage [사랑이 난사] ═══
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
      radius: 8,
      drawSize: 22,
      damage: 28,
      color: '#ff69b4',
      glowColor: '#ffd700',
      life: 2.0,
      trailTimer: 0,
      angle: angle,
      spin: 0
    });

    if (particleSystem && Math.random() < 0.3) {
      particleSystem.spawnSparks(startX, startY, '#ff69b4', 2, 2);
    }
  }

  // ═══ 3. Shibuki: Foxfire Horn Poke [뿔 발사] ═══
  spawnShibukiHorn(fighter, target, hornImg, particleSystem, hornIndex = 1) {
    const angle = Math.atan2(target.y - fighter.y, target.x - fighter.x) + (Math.random() - 0.5) * 0.1;
    const speed = 10.5;
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
      radius: 15,
      drawSize: 42,
      damage: 30,
      color: '#c084fc',
      glowColor: '#a855f7',
      life: 2.5,
      trailTimer: 0,
      angle: angle,
      spin: 0,
      spinSpeed: 0.35
    });

    if (particleSystem) {
      particleSystem.spawnSparks(fighter.x + spawnOffsetX, fighter.y, '#c084fc', 4, 3);
    }
  }

  // ═══ 4. Riko: COLOSSAL Holy Sword Drop [성검 투하 - Center Drop & Full Screen Map Attack] ═══
  spawnRikoSwordDrop(fighter, arenaCenterX, arenaCenterY, swordImg, particleSystem, soundEngine) {
    const targetX = arenaCenterX;
    const targetY = arenaCenterY;

    this.swordDrops.push({
      owner: fighter,
      img: swordImg,
      state: 'falling',
      x: targetX,
      y: targetY - 600, // Starts way high up from the heavens
      targetX: targetX,
      targetY: targetY,
      vy: 45, // Epic lightning speed descent
      rotation: 0,
      impactDmg: 35,
      duration: 3.2,
      pulseTimer: 0.7,
      pulseInterval: 0.8,
      pulseDmg: 12,
      color: '#10b981',
      glowColor: '#34d399'
    });

    if (particleSystem) {
      particleSystem.spawnLightPillar(targetX, targetY, '#10b981', 120, 1.2);
      particleSystem.spawnDamageText(targetX, targetY - 160, '⚔️ 성검 투하 (전체 공격)!', 'skill', '#34d399');
    }
  }

  // ═══ 5. Riko: Chrono Lock [시간 정지] ═══
  triggerTimeStop(fighter, duration = 2.8, soundEngine, particleSystem) {
    this.isTimeStopped = true;
    this.timeStopTimer = duration;
    this.timeStopOwner = fighter;

    try { if (soundEngine) soundEngine.playTimeStop(); } catch(e) {}
    if (particleSystem) {
      particleSystem.flash('#10b981', 0.5);
      particleSystem.shake(14);
      particleSystem.spawnShockwave(fighter.x, fighter.y, '#10b981', 180, 5);
      particleSystem.spawnDamageText(fighter.x, fighter.y - 40, '⏳ THE WORLD (시간 정지)!', 'ult', '#34d399');
    }
  }

  update(dt, arena, allFighters, particleSystem, soundEngine, speedMultiplier = 1) {
    const effSpeed = speedMultiplier;
    const arenaSize = arena ? arena.size : 800;

    // ── Update Time Stop State ──
    if (this.isTimeStopped) {
      this.timeStopTimer -= dt * effSpeed;

      if (this.timeStopOwner && particleSystem && Math.random() < 0.4) {
        particleSystem.spawnTrail(this.timeStopOwner.x, this.timeStopOwner.y, '#10b981', 14);
      }

      if (this.timeStopTimer <= 0) {
        this.isTimeStopped = false;
        this.timeStopOwner = null;
        try { if (soundEngine) soundEngine.playTimeResume(); } catch(e) {}
        if (particleSystem) {
          particleSystem.flash('#ffffff', 0.4);
          particleSystem.shake(10);
          particleSystem.spawnShockwave(arena.cx, arena.cy, '#34d399', arenaSize * 0.9, 6);
          particleSystem.spawnDamageText(arena.cx, arena.cy, '✨ 시간 재개!', 'buff', '#10b981');
        }
      }
    }

    // ── Update Holy Sword Drops (COLOSSAL Grand Sword & Global Map AOE) ──
    for (let i = this.swordDrops.length - 1; i >= 0; i--) {
      const sw = this.swordDrops[i];

      if (this.isTimeStopped && sw.owner !== this.timeStopOwner) {
        continue;
      }

      if (sw.state === 'falling') {
        sw.y += sw.vy * effSpeed;

        if (particleSystem) {
          particleSystem.spawnTrail(sw.x, sw.y, '#34d399', 20);
          particleSystem.spawnStars(sw.x, sw.y, '#ffd700', 2);
        }

        if (sw.y >= sw.targetY) {
          sw.y = sw.targetY;
          sw.state = 'planted';

          // Impact Cataclysm!
          try { if (soundEngine) soundEngine.playSwordDrop(); } catch(e) {}
          if (particleSystem) {
            particleSystem.flash('#10b981', 0.6); // Screen flash!
            particleSystem.shake(18); // Big shake!
            particleSystem.spawnLightPillar(sw.x, sw.y, '#34d399', 160, 1.0);
            particleSystem.spawnShockwave(sw.x, sw.y, '#34d399', arenaSize * 0.95, 6);
            particleSystem.spawnSparks(sw.x, sw.y, '#34d399', 30, 8);
            particleSystem.spawnStars(sw.x, sw.y, '#ffd700', 12);
          }

          // Full Screen Map Attack: Slashing damage to all enemies anywhere on map!
          for (const enemy of allFighters) {
            if (enemy === sw.owner || enemy.isDead) continue;
            enemy.takeDamage(sw.impactDmg, sw.owner, particleSystem, 'crit');

            if (particleSystem) {
              particleSystem.spawnSlash(enemy.x, enemy.y, Math.PI / 4, '#10b981', 80);
              particleSystem.spawnSlash(enemy.x, enemy.y, -Math.PI / 4, '#34d399', 80);
            }
          }
        }
      } else if (sw.state === 'planted') {
        sw.duration -= dt * effSpeed;
        sw.pulseTimer -= dt * effSpeed;

        if (particleSystem && Math.random() < 0.25) {
          particleSystem.spawnStars(sw.x + (Math.random() - 0.5) * 60, sw.y - Math.random() * 200, '#34d399', 2);
        }

        // Periodic Full-Map Holy Sword Resonance Pulse
        if (sw.pulseTimer <= 0) {
          sw.pulseTimer = sw.pulseInterval;

          if (particleSystem) {
            particleSystem.shake(4);
            particleSystem.spawnShockwave(sw.x, sw.y, '#10b981', arenaSize * 0.85, 4);
            particleSystem.spawnSparks(sw.x, sw.y, '#34d399', 12, 4);
          }

          // Hits ALL enemies anywhere across the map with holy wave!
          for (const enemy of allFighters) {
            if (enemy === sw.owner || enemy.isDead) continue;
            enemy.takeDamage(sw.pulseDmg, sw.owner, particleSystem, 'normal');

            if (particleSystem) {
              particleSystem.spawnSlash(enemy.x, enemy.y, Math.random() * Math.PI, '#10b981', 60);
            }
          }
        }

        if (sw.duration <= 0) {
          if (particleSystem) {
            particleSystem.spawnSparks(sw.x, sw.y, '#10b981', 20, 5);
            particleSystem.spawnStars(sw.x, sw.y, '#ffd700', 10);
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
      if (p.trailTimer >= 0.04 && particleSystem) {
        p.trailTimer = 0;
        if (p.type === 'heavy_bullet') {
          particleSystem.spawnTrail(p.x, p.y, '#ff69b4', 12);
          if (Math.random() < 0.4) particleSystem.spawnStars(p.x, p.y, '#ffd700', 1);
        } else if (p.type === 'horn') {
          particleSystem.spawnTrail(p.x, p.y, '#c084fc', 8);
        } else {
          particleSystem.spawnTrail(p.x, p.y, '#ff69b4', 5);
        }
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
              particleSystem.flash('#ff69b4', 0.25);
              particleSystem.shake(7);
              particleSystem.spawnShockwave(p.x, p.y, '#ff69b4', 60, 4);
              particleSystem.spawnStars(p.x, p.y, '#ffd700', 8);
              particleSystem.spawnSparks(p.x, p.y, '#ff69b4', 12, 4);
            } else if (p.type === 'horn') {
              particleSystem.spawnSlash(p.x, p.y, p.angle, '#c084fc', 50);
              particleSystem.spawnSparks(p.x, p.y, '#c084fc', 6, 3);
            } else {
              particleSystem.spawnSparks(p.x, p.y, '#ff69b4', 3, 2);
            }
          }
          break;
        }
      }

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

    // ── 1. Render COLOSSAL Planted / Falling Holy Swords ──
    for (const sw of this.swordDrops) {
      ctx.save();

      if (sw.state === 'planted') {
        const timeNow = Date.now();

        // Glowing Emerald & Golden Halo around the base of the sword
        const haloPulse = 0.5 + 0.3 * Math.sin(timeNow * 0.006);
        ctx.save();
        ctx.translate(sw.x, sw.y);

        // Radiant Light Glow
        const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 90);
        grad.addColorStop(0, `rgba(52, 211, 153, ${haloPulse * 0.8})`);
        grad.addColorStop(0.5, `rgba(16, 185, 129, ${haloPulse * 0.4})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 90, 0, Math.PI * 2);
        ctx.fill();

        // Rotating Holy Runic Circle
        ctx.rotate(timeNow * 0.001);
        ctx.strokeStyle = `rgba(52, 211, 153, ${haloPulse * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 48, 0, Math.PI * 2);
        ctx.stroke();

        // 8-pointed star rune
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 40, Math.sin(a) * 40);
          ctx.lineTo(Math.cos(a) * 56, Math.sin(a) * 56);
          ctx.stroke();
        }
        ctx.restore();

        // Draw COLOSSAL Vertical Planted Grand Sword (Width 110px, Height 360px)
        ctx.save();
        ctx.translate(sw.x, sw.y);

        // Sword Glow Aura
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 25;

        if (sw.img && sw.img.complete && sw.img.naturalWidth > 0) {
          const swW = 100;
          const swH = 340;
          // Tip firmly planted in the ground, sword standing tall
          ctx.drawImage(sw.img, -swW / 2, -swH + 40, swW, swH);
        } else {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(-10, -280, 20, 280);
        }
        ctx.restore();

      } else if (sw.state === 'falling') {
        // Dramatic descent
        ctx.save();
        ctx.translate(sw.x, sw.y);
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 30;

        if (sw.img && sw.img.complete && sw.img.naturalWidth > 0) {
          const swW = 110;
          const swH = 380;
          ctx.drawImage(sw.img, -swW / 2, -swH / 2, swW, swH);
        } else {
          ctx.fillStyle = '#34d399';
          ctx.fillRect(-12, -180, 24, 360);
        }
        ctx.restore();
      }

      ctx.restore();
    }

    // ── 2. Render Projectiles ──
    for (const p of this.projectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);

      if (p.type === 'horn') {
        // Rotating Fox Horn with Spectral Purple Glow
        ctx.rotate(p.spin);
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 15;

        if (p.img && p.img.complete && p.img.naturalWidth > 0) {
          const s = p.drawSize || 42;
          ctx.drawImage(p.img, -s / 2, -s / 2, s, s);
        } else {
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (p.type === 'heavy_bullet') {
        // Heart Comet with Radiant Pink & Gold Flare
        ctx.rotate(p.angle);
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 20;

        // Outer Aura
        ctx.fillStyle = 'rgba(255, 105, 180, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, p.drawSize * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Main Heart Projectile
        ctx.fillStyle = '#ff69b4';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.drawSize * 0.52, p.drawSize * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();

        // Golden Heart Emoji / Insignia
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💖', 0, 0);

      } else {
        // Rapid Laser Bullet
        ctx.rotate(p.angle);
        ctx.shadowColor = '#ff69b4';
        ctx.shadowBlur = 12;

        ctx.fillStyle = '#ff69b4';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.drawSize * 0.6, p.drawSize * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(2, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // ── 3. Time Stop Chrono Dimensional Screen Distortion ──
    if (this.isTimeStopped) {
      ctx.save();
      const pulse = 0.2 + 0.1 * Math.sin(Date.now() * 0.008);

      // Dark Emerald Chrono Overlay
      ctx.fillStyle = `rgba(6, 78, 59, ${pulse + 0.1})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const cx = ctx.canvas.width / 2;
      const cy = ctx.canvas.height / 2;
      const r = Math.min(cx, cy) * 0.7;
      const rot = (Date.now() * 0.0008) % (Math.PI * 2);

      // Giant Chrono Dial
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);

      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      // Roman numerals / Dial lines
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r - 18), Math.sin(a) * (r - 18));
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.stroke();
      }
      ctx.restore();

      ctx.restore();
    }

    ctx.restore();
  }
}
