/**
 * Fighter Entity Class
 * 3000+ HP Pool + Restored Big Damage Numbers + 6.5s Fast Ults.
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

    // Position & Physics (Large 44px radius)
    this.x = x;
    this.y = y;
    this.baseRadius = 44;
    this.radius = this.baseRadius;
    this.mass = 1.0;

    this.baseSpeed = config.speed || 3.5;
    const initialAngle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(initialAngle) * this.baseSpeed;
    this.vy = Math.sin(initialAngle) * this.baseSpeed;

    // Combat Stats (3000+ HP Pool)
    this.maxHp = config.hp || 3000;
    this.hp = this.maxHp;
    this.atk = config.atk || 58;
    this.def = config.def || 16;
    this.team = team;
    this.isDead = false;

    // Fast Skill & Ult Cooldowns (High Action!)
    this.skillType = config.skillType;
    this.skill1Name = config.skill1Name || '스킬 1';
    this.skill1MaxCd = config.skill1Cooldown || 2.5;
    this.skill1Timer = Math.random() * 1.0;

    this.ultName = config.ultName || '궁극기';
    this.ultDesc = config.ultDesc || '';
    this.ultMaxCd = config.ultCooldown || 6.5;
    this.ultTimer = Math.random() * 2.0;

    // Nana Machine Gun ("사랑이 난사")
    this.aimAngle = initialAngle;
    this.muzzleFlashTimer = 0;
    this.isMachineGunning = false;
    this.machineGunTimer = 0;
    this.machineGunNextShot = 0;
    this.machineGunInterval = 0.085;
    this.machineGunBulletsLeft = 0;

    // Shibuki Fox Transform & Dash ("캥캥이")
    this.isFoxTransformed = false;
    this.foxTransformTimer = 0;
    this.foxMaxDuration = 3.5;
    this.foxDashCooldown = 0;
    this.scratchCooldown = 0;
    this.pendingHorns = [];

    // Status Timers
    this.invulnerableTimer = 0;

    // Asset Images
    this.avatarImg = null;
    if (config.avatarUrl) {
      this.avatarImg = new Image();
      this.avatarImg.src = config.avatarUrl;
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

  update(dt, arena, allFighters, skillManager, soundEngine, particleSystem, speedMultiplier = 1) {
    if (this.isDead) return;

    const effDt = dt * speedMultiplier;
    const nearestEnemy = this.findNearestEnemy(allFighters);

    // Aim towards nearest enemy
    if (nearestEnemy) {
      this.aimAngle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
    } else {
      this.aimAngle = Math.atan2(this.vy, this.vx);
    }

    if (this.muzzleFlashTimer > 0) this.muzzleFlashTimer -= effDt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= effDt;

    // 1. Nana Machine Gun ("사랑이 난사")
    if (this.isMachineGunning) {
      this.machineGunTimer -= effDt;
      this.machineGunNextShot -= effDt;

      if (this.machineGunNextShot <= 0 && this.machineGunBulletsLeft > 0) {
        this.machineGunNextShot = this.machineGunInterval;
        this.machineGunBulletsLeft--;
        this.muzzleFlashTimer = 0.06;

        if (nearestEnemy && skillManager) {
          const spread = (Math.random() - 0.5) * 0.22;
          const shotAngle = this.aimAngle + spread;
          const gunTipX = this.x + Math.cos(this.aimAngle) * 50;
          const gunTipY = this.y + Math.sin(this.aimAngle) * 50;

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

    // 2. Shibuki Fox Form ("캥캥이")
    if (this.isFoxTransformed) {
      this.foxTransformTimer -= effDt;
      this.scratchCooldown = Math.max(0, this.scratchCooldown - effDt);
      this.foxDashCooldown -= effDt;
      this.radius = this.baseRadius * 1.35;

      if (this.foxDashCooldown <= 0 && nearestEnemy) {
        this.foxDashCooldown = 1.1;
        const dashAngle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
        const dashSpeed = this.baseSpeed * 2.3;
        this.vx = Math.cos(dashAngle) * dashSpeed;
        this.vy = Math.sin(dashAngle) * dashSpeed;

        if (particleSystem) {
          particleSystem.spawnShockwave(this.x, this.y, '#c084fc', 60, 4);
          particleSystem.spawnDamageText(this.x, this.y - 14, '대쉬!', 'buff', '#c084fc');
        }
      }

      if (particleSystem && Math.random() < 0.3) {
        particleSystem.spawnSparks(this.x + (Math.random() - 0.5) * 20, this.y + (Math.random() - 0.5) * 20, '#c084fc', 2);
      }

      if (this.foxTransformTimer <= 0) {
        this.isFoxTransformed = false;
        this.radius = this.baseRadius;
        if (particleSystem) {
          particleSystem.spawnShockwave(this.x, this.y, '#c084fc', 70, 4);
          particleSystem.spawnDamageText(this.x, this.y, '변신 해제!', 'buff', '#e2e8f0');
        }
      }
    } else {
      this.radius = this.baseRadius;
    }

    // 3. Shibuki Horn Queue ("뿔 발사")
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

    // 4. Skill Cooldowns & Auto-Casting
    this.skill1Timer += effDt;
    this.ultTimer += effDt;

    if (this.skill1Timer >= this.skill1MaxCd) {
      if (nearestEnemy) {
        this.triggerSkill1(nearestEnemy, skillManager, soundEngine, particleSystem);
        this.skill1Timer = 0;
      }
    }

    if (this.ultTimer >= this.ultMaxCd) {
      if (nearestEnemy) {
        this.triggerUltimate(allFighters, skillManager, soundEngine, particleSystem, arena);
        this.ultTimer = 0;
      }
    }

    // 5. Continuous Movement
    this.x += this.vx * speedMultiplier;
    this.y += this.vy * speedMultiplier;
  }

  triggerSkill1(enemy, skillManager, soundEngine, particleSystem) {
    if (!skillManager || !enemy) return;

    if (particleSystem) {
      particleSystem.spawnDamageText(this.x, this.y - 24, this.skill1Name, 'skill', this.color);
      particleSystem.spawnShockwave(this.x, this.y, this.glowColor, 45, 2);
    }

    if (this.id === 'nana') {
      this.muzzleFlashTimer = 0.18;
      const gunTipX = this.x + Math.cos(this.aimAngle) * 50;
      const gunTipY = this.y + Math.sin(this.aimAngle) * 50;
      skillManager.spawnHeavyBullet(this, gunTipX, gunTipY, this.aimAngle, particleSystem);
    } else if (this.id === 'shibuki') {
      skillManager.spawnShibukiHorn(this, enemy, this.hornImg, particleSystem, 1);
      this.pendingHorns.push({ delay: 0.22 });
    }
  }

  triggerUltimate(allFighters, skillManager, soundEngine, particleSystem, arena) {
    if (this.isDead || !skillManager) return;

    const enemy = this.findNearestEnemy(allFighters);

    if (soundEngine) soundEngine.playUlt();
    if (particleSystem) {
      particleSystem.shake(14);
      particleSystem.spawnShockwave(this.x, this.y, this.glowColor, 120, 6);
      particleSystem.spawnDamageText(this.x, this.y - 28, `ULT: ${this.ultName}`, 'ult', '#ffd700');
    }

    window.dispatchEvent(new CustomEvent('fighter-ult-cutin', {
      detail: {
        fighter: this,
        ultName: this.ultName,
        ultDesc: this.ultDesc
      }
    }));

    if (this.id === 'nana') {
      this.isMachineGunning = true;
      this.machineGunTimer = 1.4;
      this.machineGunNextShot = 0;
      this.machineGunBulletsLeft = 16;
    } else if (this.id === 'shibuki') {
      this.isFoxTransformed = true;
      this.foxTransformTimer = this.foxMaxDuration;
      this.invulnerableTimer = 0.8;
      this.foxDashCooldown = 1.0;

      if (enemy) {
        const dashAngle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
        const dashSpeed = this.baseSpeed * 2.8;
        this.vx = Math.cos(dashAngle) * dashSpeed;
        this.vy = Math.sin(dashAngle) * dashSpeed;
      }

      if (particleSystem) {
        particleSystem.spawnShockwave(this.x, this.y, '#c084fc', 140, 8);
        particleSystem.spawnDamageText(this.x, this.y, '🦊 캥캥이 폭풍 대쉬!', 'buff', '#a855f7');
      }
    }
  }

  applyFoxScratch(enemy, particleSystem) {
    if (!this.isFoxTransformed || this.scratchCooldown > 0 || !enemy || enemy.isDead) return;

    this.scratchCooldown = 0.25;
    const dmg = 48; // Punchy scratch damage
    enemy.takeDamage(dmg, this, particleSystem, 'crit');

    if (particleSystem) {
      particleSystem.spawnScratch(enemy.x, enemy.y, '#c084fc');
      particleSystem.spawnDamageText(enemy.x, enemy.y, '할큄!', 'crit', '#f43f5e');
      particleSystem.shake(4);
    }
  }

  takeDamage(amount, attacker, particleSystem, type = 'normal') {
    if (this.isDead || this.invulnerableTimer > 0) return 0;

    const finalDamage = Math.max(5, Math.floor(amount - this.def * 0.2));
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

    // 1. Fox Form Render
    if (this.isFoxTransformed) {
      if (this.foxImg && this.foxImg.complete && this.foxImg.naturalWidth > 0) {
        const foxW = this.radius * 2.8;
        const foxH = foxW * (this.foxImg.naturalHeight / this.foxImg.naturalWidth);
        ctx.drawImage(this.foxImg, -foxW / 2, -foxH / 2, foxW, foxH);
      } else {
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }

    } else {
      // 2. Normal Character Avatar Render
      ctx.fillStyle = '#171926';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Border Ring
      ctx.lineWidth = 5;
      ctx.strokeStyle = this.color;
      ctx.stroke();

      // Centered Avatar
      if (this.avatarImg && this.avatarImg.complete && this.avatarImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 2.5, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(this.avatarImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
      } else {
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 2);
      }

      // 3. Nana's Gun '사랑이' Render
      if (this.id === 'nana' && this.gunImg && this.gunImg.complete && this.gunImg.naturalWidth > 0) {
        ctx.save();
        const gunDist = this.radius * 0.85;
        const gunX = Math.cos(this.aimAngle) * gunDist;
        const gunY = Math.sin(this.aimAngle) * gunDist;

        ctx.translate(gunX, gunY);
        ctx.rotate(this.aimAngle);

        const isFlipped = Math.abs(this.aimAngle) > Math.PI / 2;
        if (isFlipped) {
          ctx.scale(1, -1);
        }

        const gunW = 46;
        const gunH = 38;
        ctx.drawImage(this.gunImg, -10, -gunH / 2, gunW, gunH);

        // Muzzle Flash
        if (this.muzzleFlashTimer > 0) {
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(36, 0, 14, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ff69b4';
          ctx.beginPath();
          ctx.arc(36, 0, 8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    // 4. Cooldown Progress Ring
    const ultRatio = Math.min(1.0, this.ultTimer / this.ultMaxCd);
    if (ultRatio < 1.0) {
      const ultAngle = ultRatio * Math.PI * 2;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6, -Math.PI / 2, -Math.PI / 2 + ultAngle);
      ctx.stroke();
    } else {
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 5. Overhead Large Health Bar
    const hpBarWidth = 68;
    const hpBarHeight = 8;
    const hpY = -this.radius - 18;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(-hpBarWidth / 2, hpY, hpBarWidth, hpBarHeight);

    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(-hpBarWidth / 2, hpY, hpBarWidth * hpRatio, hpBarHeight);

    // 6. Clean Big Bold Character Name Tag
    ctx.font = "900 18px 'Black Han Sans', 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(this.name, 0, this.radius + 24);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.name, 0, this.radius + 24);

    ctx.restore();
  }
}
