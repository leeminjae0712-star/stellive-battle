/**
 * Fighter Entity Class
 * Specialized for Hanako Nana (Gunner with Sarang-i) & Tenko Shibuki (Kaengkaengi & Horns).
 */

class Fighter {
  constructor(config, x, y, team = null) {
    this.id = config.id;
    this.name = config.name;
    this.romanName = config.romanName || config.id;
    this.group = config.group || 'gen3';
    this.groupName = config.groupName || 'StelLive';
    this.role = config.role || 'Fighter';
    this.title = config.title || '';
    this.color = config.color || '#a855f7';
    this.glowColor = config.glowColor || this.color;
    this.emoji = config.emoji || '⭐';

    // Position & Physics (Relaxed reels bouncing speed)
    this.x = x;
    this.y = y;
    this.baseRadius = 26;
    this.radius = this.baseRadius;
    this.mass = 1.0;

    this.baseSpeed = config.speed || 2.2;
    const initialAngle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(initialAngle) * this.baseSpeed;
    this.vy = Math.sin(initialAngle) * this.baseSpeed;

    // Combat Stats
    this.maxHp = config.hp || 1000;
    this.hp = this.maxHp;
    this.atk = config.atk || 50;
    this.def = config.def || 16;
    this.team = team;
    this.isDead = false;

    // Skill Cooldowns
    this.skillType = config.skillType;
    this.skill1Name = config.skill1Name || '스킬 1';
    this.skill1MaxCd = config.skill1Cooldown || 3.0;
    this.skill1Timer = Math.random() * 1.5; // Stagger start

    this.ultName = config.ultName || '궁극기';
    this.ultDesc = config.ultDesc || '';
    this.ultMaxCd = config.ultCooldown || 14.0;
    this.ultTimer = 0; // Starts from 0, charges up to ultMaxCd

    // Nana's Gun Aim & Machine Gun Rapid Fire ("뚜루루룰루")
    this.aimAngle = initialAngle;
    this.muzzleFlashTimer = 0;
    this.isMachineGunning = false;
    this.machineGunTimer = 0;
    this.machineGunNextShot = 0;
    this.machineGunInterval = 0.08; // Fast machine gun cadence (18 shots over ~1.44s)
    this.machineGunBulletsLeft = 0;

    // Shibuki's Fox Transformation
    this.isFoxTransformed = false;
    this.foxTransformTimer = 0;
    this.foxMaxDuration = 5.5;
    this.scratchCooldown = 0;
    this.pendingHorns = [];

    // Status Timers
    this.invulnerableTimer = 0;
    this.isFrozen = false;
    this.freezeTimer = 0;

    // Asset Images
    this.avatarImg = null;
    if (config.avatarUrl) {
      this.avatarImg = new Image();
      this.avatarImg.src = config.avatarUrl;
    }

    this.fullArtImg = null;
    if (config.fullArtUrl) {
      this.fullArtImg = new Image();
      this.fullArtImg.src = config.fullArtUrl;
    }

    this.gunImg = null;
    if (config.gunImg) {
      this.gunImg = new Image();
      this.gunImg.src = config.gunImg;
    }

    this.foxImg = null;
    if (config.foxImg) {
      this.foxImg = new Image();
      this.foxImg.src = config.foxImg;
    }

    this.hornImg = null;
    if (config.hornImg) {
      this.hornImg = new Image();
      this.hornImg.src = config.hornImg;
    }
  }

  update(dt, arena, allFighters, skillManager, soundEngine, particleSystem, speedMultiplier = 1, skillPauseEnabled = true) {
    if (this.isDead) return;

    const effDt = dt * speedMultiplier;

    // 1. Aim towards nearest enemy
    const nearestEnemy = this.findNearestEnemy(allFighters);
    if (nearestEnemy) {
      this.aimAngle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
    } else {
      this.aimAngle = Math.atan2(this.vy, this.vx);
    }

    if (this.muzzleFlashTimer > 0) this.muzzleFlashTimer -= effDt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= effDt;

    if (this.isFrozen) {
      this.freezeTimer -= effDt;
      if (this.freezeTimer <= 0) this.isFrozen = false;
      else return;
    }

    // 2. Nana Machine Gun Stream Execution ("뚜루루룰루")
    if (this.isMachineGunning) {
      this.machineGunTimer -= effDt;
      this.machineGunNextShot -= effDt;

      if (this.machineGunNextShot <= 0 && this.machineGunBulletsLeft > 0) {
        this.machineGunNextShot = this.machineGunInterval;
        this.machineGunBulletsLeft--;
        this.muzzleFlashTimer = 0.06;

        if (nearestEnemy && skillManager) {
          // Fire 1 machine gun bullet from the gun tip with small spray
          const spread = (Math.random() - 0.5) * 0.22;
          const shotAngle = this.aimAngle + spread;
          const gunTipX = this.x + Math.cos(this.aimAngle) * 32;
          const gunTipY = this.y + Math.sin(this.aimAngle) * 32;

          skillManager.spawnRapidBullet(this, gunTipX, gunTipY, shotAngle, particleSystem);
        }

        if (particleSystem) {
          particleSystem.shake(1.5);
        }
      }

      if (this.machineGunTimer <= 0 || this.machineGunBulletsLeft <= 0) {
        this.isMachineGunning = false;
      }
    }

    // 3. Shibuki Fox Transformation State
    if (this.isFoxTransformed) {
      this.foxTransformTimer -= effDt;
      this.scratchCooldown = Math.max(0, this.scratchCooldown - effDt);
      this.radius = this.baseRadius * 1.35;

      if (particleSystem && Math.random() < 0.3) {
        particleSystem.spawnSparks(this.x + (Math.random() - 0.5) * 20, this.y + (Math.random() - 0.5) * 20, '#c084fc', 2);
      }

      if (this.foxTransformTimer <= 0) {
        this.isFoxTransformed = false;
        this.radius = this.baseRadius;
        if (particleSystem) {
          particleSystem.spawnShockwave(this.x, this.y, '#c084fc', 60, 4);
          particleSystem.spawnDamageText(this.x, this.y, '변신 해제!', 'buff', '#e2e8f0');
        }
      }
    } else {
      this.radius = this.baseRadius;
    }

    // 4. Shibuki Delayed Horns Queue ("똑, 똑")
    if (this.pendingHorns.length > 0) {
      for (let i = this.pendingHorns.length - 1; i >= 0; i--) {
        const item = this.pendingHorns[i];
        item.delay -= effDt;
        if (item.delay <= 0) {
          if (nearestEnemy && skillManager) {
            skillManager.spawnShibukiHorn(this, nearestEnemy, this.hornImg, particleSystem, 2);
          }
          this.pendingHorns.splice(i, 1);
        }
      }
    }

    // 5. Skill Cooldowns & Auto-Casting
    this.skill1Timer += effDt;
    this.ultTimer += effDt;

    // Normal Skill Auto-Cast
    if (this.skill1Timer >= this.skill1MaxCd) {
      if (nearestEnemy) {
        this.triggerSkill1(nearestEnemy, skillManager, soundEngine, particleSystem);
        this.skill1Timer = 0;
      }
    }

    // Ultimate Auto-Cast
    if (this.ultTimer >= this.ultMaxCd) {
      if (nearestEnemy) {
        this.triggerUltimate(allFighters, skillManager, soundEngine, particleSystem, arena, skillPauseEnabled);
        this.ultTimer = 0;
      }
    }

    // 6. Physics Movement (Relaxed & smooth)
    const targetSpeed = this.isFoxTransformed ? this.baseSpeed * 1.5 : this.baseSpeed;
    const currentSpeed = Math.hypot(this.vx, this.vy);

    if (currentSpeed < 0.05) {
      const a = Math.random() * Math.PI * 2;
      this.vx = Math.cos(a) * targetSpeed;
      this.vy = Math.sin(a) * targetSpeed;
    } else {
      const f = (targetSpeed / currentSpeed) * 0.1;
      this.vx += (this.vx / currentSpeed) * targetSpeed * f - this.vx * f;
      this.vy += (this.vy / currentSpeed) * targetSpeed * f - this.vy * f;
    }

    this.x += this.vx * speedMultiplier;
    this.y += this.vy * speedMultiplier;

    // 7. 4-Corner Arena Wall Bounce
    if (arena) {
      if (this.x - this.radius <= arena.left) {
        this.x = arena.left + this.radius;
        this.vx = Math.abs(this.vx);
        if (particleSystem) particleSystem.spawnSparks(this.x, this.y, this.color, 3, 2);
      } else if (this.x + this.radius >= arena.right) {
        this.x = arena.right - this.radius;
        this.vx = -Math.abs(this.vx);
        if (particleSystem) particleSystem.spawnSparks(this.x, this.y, this.color, 3, 2);
      }

      if (this.y - this.radius <= arena.top) {
        this.y = arena.top + this.radius;
        this.vy = Math.abs(this.vy);
        if (particleSystem) particleSystem.spawnSparks(this.x, this.y, this.color, 3, 2);
      } else if (this.y + this.radius >= arena.bottom) {
        this.y = arena.bottom - this.radius;
        this.vy = -Math.abs(this.vy);
        if (particleSystem) particleSystem.spawnSparks(this.x, this.y, this.color, 3, 2);
      }
    }
  }

  // Skill 1 (Normal Skill)
  triggerSkill1(enemy, skillManager, soundEngine, particleSystem) {
    if (!skillManager || !enemy) return;

    if (particleSystem) {
      particleSystem.spawnDamageText(this.x, this.y - 12, this.skill1Name, 'skill', this.color);
      particleSystem.spawnShockwave(this.x, this.y, this.glowColor, 35, 2);
    }

    if (this.id === 'nana') {
      // Nana fires 1 heavy Sarang-i bullet from her gun barrel!
      this.muzzleFlashTimer = 0.15;
      const gunTipX = this.x + Math.cos(this.aimAngle) * 34;
      const gunTipY = this.y + Math.sin(this.aimAngle) * 34;
      skillManager.spawnHeavyBullet(this, gunTipX, gunTipY, this.aimAngle, particleSystem);
    } else if (this.id === 'shibuki') {
      // Shibuki fires 2 horn buns: 1st immediately, 2nd delayed ("똑, 똑")
      skillManager.spawnShibukiHorn(this, enemy, this.hornImg, particleSystem, 1);
      this.pendingHorns.push({ delay: 0.22 });
    }
  }

  // Ultimate Skill
  triggerUltimate(allFighters, skillManager, soundEngine, particleSystem, arena, skillPauseEnabled = true) {
    if (this.isDead || !skillManager) return;

    if (soundEngine) soundEngine.playUlt();
    if (particleSystem) {
      particleSystem.shake(10);
      particleSystem.spawnShockwave(this.x, this.y, this.glowColor, 90, 6);
      particleSystem.spawnDamageText(this.x, this.y - 18, `ULT: ${this.ultName}`, 'ult', '#ffd700');
    }

    // Cutin Banner Event
    window.dispatchEvent(new CustomEvent('fighter-ult-cutin', {
      detail: {
        fighter: this,
        ultName: this.ultName,
        ultDesc: this.ultDesc,
        shouldPause: skillPauseEnabled
      }
    }));

    if (this.id === 'nana') {
      // Nana: Start 18-bullet Rapid Machine Gun Barrage ("뚜루루룰루")
      this.isMachineGunning = true;
      this.machineGunTimer = 1.5;
      this.machineGunNextShot = 0;
      this.machineGunBulletsLeft = 18;
    } else if (this.id === 'shibuki') {
      // Shibuki: 5.5-second Kaengkaengi Fox Form Transformation!
      this.isFoxTransformed = true;
      this.foxTransformTimer = this.foxMaxDuration;
      this.invulnerableTimer = 1.0;
      if (particleSystem) {
        particleSystem.spawnShockwave(this.x, this.y, '#c084fc', 120, 8);
        particleSystem.spawnDamageText(this.x, this.y, '🦊 캥캥이 변신!', 'buff', '#a855f7');
      }
    }
  }

  // Kaengkaengi Fox Contact Scratch Damage
  applyFoxScratch(enemy, particleSystem) {
    if (!this.isFoxTransformed || this.scratchCooldown > 0 || !enemy || enemy.isDead) return;

    this.scratchCooldown = 0.22;
    const dmg = Math.floor(this.atk * 0.45);
    enemy.takeDamage(dmg, this, particleSystem, 'crit');

    if (particleSystem) {
      particleSystem.spawnScratch(enemy.x, enemy.y, '#c084fc');
      particleSystem.spawnDamageText(enemy.x, enemy.y, '할큄!', 'crit', '#f43f5e');
      particleSystem.shake(3);
    }
  }

  takeDamage(amount, attacker, particleSystem, type = 'normal') {
    if (this.isDead || this.invulnerableTimer > 0) return 0;

    const finalDamage = Math.max(5, Math.floor(amount - this.def * 0.25));
    this.hp -= finalDamage;

    if (particleSystem) {
      particleSystem.spawnDamageNumber(this.x, this.y, finalDamage, type);
      particleSystem.spawnSparks(this.x, this.y, this.color, type === 'crit' ? 8 : 4);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.die(particleSystem);
    }

    return finalDamage;
  }

  die(particleSystem) {
    this.isDead = true;
    if (particleSystem) {
      particleSystem.spawnShockwave(this.x, this.y, '#ef4444', 90, 8);
      particleSystem.spawnSparks(this.x, this.y, '#ffffff', 18);
      particleSystem.spawnDamageText(this.x, this.y, 'K.O.', 'crit', '#ef4444');
    }
  }

  findNearestEnemy(allFighters) {
    let nearest = null;
    let minDist = Infinity;

    for (const f of allFighters) {
      if (f === this || f.isDead || (this.team && f.team === this.team)) continue;
      const dist = Math.hypot(f.x - this.x, f.y - this.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = f;
      }
    }
    return nearest;
  }

  render(ctx) {
    if (this.isDead) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. Fox Form Render (Shibuki Kaengkaengi)
    if (this.isFoxTransformed) {
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#c084fc';

      if (this.foxImg && this.foxImg.complete && this.foxImg.naturalWidth > 0) {
        const foxSize = this.radius * 2.4;
        ctx.drawImage(this.foxImg, -foxSize / 2, -foxSize / 2, foxSize, foxSize);
      } else {
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2);
      ctx.stroke();

    } else {
      // 2. Normal Character Avatar Rendering
      ctx.shadowBlur = 12;
      ctx.shadowColor = this.glowColor;

      // Base Body Circle
      ctx.fillStyle = '#171926';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Colored Outer Border Ring
      ctx.lineWidth = 3;
      ctx.strokeStyle = this.color;
      ctx.stroke();

      // Perfectly Centered Face Avatar
      if (this.avatarImg && this.avatarImg.complete && this.avatarImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(this.avatarImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
      } else {
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 2);
      }

      // 3. Nana's Gun '사랑이' Render (Aimed at enemy from her hand)
      if (this.id === 'nana' && this.gunImg && this.gunImg.complete && this.gunImg.naturalWidth > 0) {
        ctx.save();
        // Position gun at perimeter aiming toward aimAngle
        const gunDist = this.radius * 0.75;
        const gunX = Math.cos(this.aimAngle) * gunDist;
        const gunY = Math.sin(this.aimAngle) * gunDist;

        ctx.translate(gunX, gunY);
        ctx.rotate(this.aimAngle);

        // If aiming leftwards, flip vertically so gun doesn't appear upside down
        const isFlipped = Math.abs(this.aimAngle) > Math.PI / 2;
        if (isFlipped) {
          ctx.scale(1, -1);
        }

        const gunW = 28;
        const gunH = 22;
        ctx.drawImage(this.gunImg, -6, -gunH / 2, gunW, gunH);

        // Muzzle Flash Effect when shooting
        if (this.muzzleFlashTimer > 0) {
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(22, 0, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ff69b4';
          ctx.beginPath();
          ctx.arc(22, 0, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    // 4. Cooldown Progress Ring (Ult Ready Glow)
    const ultRatio = Math.min(1.0, this.ultTimer / this.ultMaxCd);
    if (ultRatio < 1.0) {
      const ultAngle = ultRatio * Math.PI * 2;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 4, -Math.PI / 2, -Math.PI / 2 + ultAngle);
      ctx.stroke();
    } else {
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 5. Overhead Mini Health Bar
    const hpBarWidth = 44;
    const hpBarHeight = 5;
    const hpY = -this.radius - 12;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(-hpBarWidth / 2, hpY, hpBarWidth, hpBarHeight);

    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(-hpBarWidth / 2, hpY, hpBarWidth * hpRatio, hpBarHeight);

    // 6. Name Label
    ctx.font = "800 11px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.strokeText(this.name, 0, this.radius + 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.name, 0, this.radius + 14);

    ctx.restore();
  }
}
