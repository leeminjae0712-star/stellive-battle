/**
 * Fighter Entity - Pro Balanced
 * Nana: Slow, heavy shots. Her gun booms and you feel it.
 * Shibuki: Fast, constant horn pokes. Death by a thousand cuts.
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

    this.x = x;
    this.y = y;
    this.baseRadius = 44;
    this.radius = this.baseRadius;
    this.mass = 1.0;

    this.baseSpeed = config.speed || 3.5;
    const initialAngle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(initialAngle) * this.baseSpeed;
    this.vy = Math.sin(initialAngle) * this.baseSpeed;

    this.maxHp = config.hp || 1400;
    this.hp = this.maxHp;
    this.atk = config.atk || 55;
    this.def = config.def || 15;
    this.team = team;
    this.isDead = false;

    this.skillType = config.skillType;
    this.skill1Name = config.skill1Name || '스킬 1';
    this.skill1MaxCd = config.skill1Cooldown || 3.0;
    this.skill1Timer = 0; // Start at 0 — must charge first!

    this.ultName = config.ultName || '궁극기';
    this.ultDesc = config.ultDesc || '';
    this.ultMaxCd = config.ultCooldown || 14.0;
    this.ultTimer = 0; // Start at 0 — must charge first!

    // Nana Machine Gun
    this.aimAngle = initialAngle;
    this.muzzleFlashTimer = 0;
    this.isMachineGunning = false;
    this.machineGunTimer = 0;
    this.machineGunNextShot = 0;
    this.machineGunInterval = 0.08;
    this.machineGunBulletsLeft = 0;

    // Shibuki Fox Transform
    this.isFoxTransformed = false;
    this.foxTransformTimer = 0;
    this.foxMaxDuration = 3.5;
    this.foxDashCooldown = 0;
    this.scratchCooldown = 0;
    this.pendingHorns = [];

    this.invulnerableTimer = 0;

    // Images
    this.avatarImg = null;
    if (config.avatarUrl) { this.avatarImg = new Image(); this.avatarImg.src = config.avatarUrl; }
    this.gunImg = null;
    if (config.gunImg) { this.gunImg = new Image(); this.gunImg.src = config.gunImg; }
    this.foxImg = null;
    if (config.foxImg) { this.foxImg = new Image(); this.foxImg.src = config.foxImg; }
    this.hornImg = null;
    if (config.hornImg) { this.hornImg = new Image(); this.hornImg.src = config.hornImg; }
  }

  update(dt, arena, allFighters, skillManager, soundEngine, particleSystem, speedMultiplier = 1) {
    if (this.isDead) return;

    const effDt = dt * speedMultiplier;
    const nearestEnemy = this.findNearestEnemy(allFighters);

    if (nearestEnemy) {
      this.aimAngle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
    } else {
      this.aimAngle = Math.atan2(this.vy, this.vx);
    }

    if (this.muzzleFlashTimer > 0) this.muzzleFlashTimer -= effDt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= effDt;

    // ── Nana Machine Gun Burst ──
    if (this.isMachineGunning) {
      this.machineGunTimer -= effDt;
      this.machineGunNextShot -= effDt;

      if (this.machineGunNextShot <= 0 && this.machineGunBulletsLeft > 0) {
        this.machineGunNextShot = this.machineGunInterval;
        this.machineGunBulletsLeft--;
        this.muzzleFlashTimer = 0.05;

        if (nearestEnemy && skillManager) {
          const spread = (Math.random() - 0.5) * 0.25;
          const shotAngle = this.aimAngle + spread;
          const tipX = this.x + Math.cos(this.aimAngle) * 50;
          const tipY = this.y + Math.sin(this.aimAngle) * 50;
          skillManager.spawnRapidBullet(this, tipX, tipY, shotAngle, particleSystem);
        }
        if (particleSystem) particleSystem.shake(2);
      }

      if (this.machineGunTimer <= 0 || this.machineGunBulletsLeft <= 0) {
        this.isMachineGunning = false;
      }
    }

    // ── Shibuki Fox Form ──
    if (this.isFoxTransformed) {
      this.foxTransformTimer -= effDt;
      this.scratchCooldown = Math.max(0, this.scratchCooldown - effDt);
      this.foxDashCooldown -= effDt;
      this.radius = this.baseRadius * 1.3;

      // Periodic dash toward enemy
      if (this.foxDashCooldown <= 0 && nearestEnemy) {
        this.foxDashCooldown = 0.9;
        const dashAngle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
        const dashSpeed = this.baseSpeed * 2.5;
        this.vx = Math.cos(dashAngle) * dashSpeed;
        this.vy = Math.sin(dashAngle) * dashSpeed;

        if (particleSystem) {
          particleSystem.spawnShockwave(this.x, this.y, '#c084fc', 55, 3);
          particleSystem.spawnDamageText(this.x, this.y - 14, '대쉬!', 'buff', '#c084fc');
        }
      }

      if (particleSystem && Math.random() < 0.25) {
        particleSystem.spawnSparks(
          this.x + (Math.random() - 0.5) * 25,
          this.y + (Math.random() - 0.5) * 25,
          '#c084fc', 2
        );
      }

      if (this.foxTransformTimer <= 0) {
        this.isFoxTransformed = false;
        this.radius = this.baseRadius;
        if (particleSystem) {
          particleSystem.spawnShockwave(this.x, this.y, '#c084fc', 65, 4);
          particleSystem.spawnDamageText(this.x, this.y, '변신 해제!', 'buff', '#e2e8f0');
        }
      }
    } else {
      this.radius = this.baseRadius;
    }

    // ── Shibuki Pending Horn Queue ──
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

    // ── Cooldown Charging & Auto-Cast ──
    this.skill1Timer += effDt;
    this.ultTimer += effDt;

    if (this.skill1Timer >= this.skill1MaxCd && nearestEnemy) {
      this.triggerSkill1(nearestEnemy, skillManager, soundEngine, particleSystem);
      this.skill1Timer = 0;
    }

    if (this.ultTimer >= this.ultMaxCd && nearestEnemy) {
      this.triggerUltimate(allFighters, skillManager, soundEngine, particleSystem, arena);
      this.ultTimer = 0;
    }

    // ── Movement ──
    this.x += this.vx * speedMultiplier;
    this.y += this.vy * speedMultiplier;
  }

  triggerSkill1(enemy, skillManager, soundEngine, particleSystem) {
    if (!skillManager || !enemy) return;

    if (particleSystem) {
      particleSystem.spawnDamageText(this.x, this.y - 28, this.skill1Name, 'skill', this.color);
      particleSystem.spawnShockwave(this.x, this.y, this.glowColor, 40, 2);
    }

    if (this.id === 'nana') {
      // Heavy single shot with big muzzle flash
      this.muzzleFlashTimer = 0.22;
      const tipX = this.x + Math.cos(this.aimAngle) * 52;
      const tipY = this.y + Math.sin(this.aimAngle) * 52;
      skillManager.spawnHeavyBullet(this, tipX, tipY, this.aimAngle, particleSystem);
      if (particleSystem) particleSystem.shake(5);

    } else if (this.id === 'shibuki') {
      // Quick double horn poke
      skillManager.spawnShibukiHorn(this, enemy, this.hornImg, particleSystem, 1);
      this.pendingHorns.push({ delay: 0.18 });
    }
  }

  triggerUltimate(allFighters, skillManager, soundEngine, particleSystem, arena) {
    if (this.isDead || !skillManager) return;
    const enemy = this.findNearestEnemy(allFighters);

    try { if (soundEngine) soundEngine.playUlt(); } catch(e) {}
    if (particleSystem) {
      particleSystem.shake(16);
      particleSystem.spawnShockwave(this.x, this.y, this.glowColor, 130, 7);
      particleSystem.spawnDamageText(this.x, this.y - 32, `★ ${this.ultName} ★`, 'ult', '#ffd700');
    }

    try {
      window.dispatchEvent(new CustomEvent('fighter-ult-cutin', {
        detail: { fighter: this, ultName: this.ultName, ultDesc: this.ultDesc }
      }));
    } catch(e) {}

    if (this.id === 'nana') {
      this.isMachineGunning = true;
      this.machineGunTimer = 1.4;
      this.machineGunNextShot = 0;
      this.machineGunBulletsLeft = 16;

    } else if (this.id === 'shibuki') {
      this.isFoxTransformed = true;
      this.foxTransformTimer = this.foxMaxDuration;
      this.invulnerableTimer = 0.6;
      this.foxDashCooldown = 0.3; // Instant first dash

      if (enemy) {
        const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
        this.vx = Math.cos(angle) * this.baseSpeed * 3.0;
        this.vy = Math.sin(angle) * this.baseSpeed * 3.0;
      }

      if (particleSystem) {
        particleSystem.spawnShockwave(this.x, this.y, '#c084fc', 150, 8);
        particleSystem.spawnDamageText(this.x, this.y, '🦊 캥캥이 돌격!', 'buff', '#a855f7');
      }
    }
  }

  // Fox scratch: 35 damage, 0.3s internal CD
  applyFoxScratch(enemy, particleSystem) {
    if (!this.isFoxTransformed || this.scratchCooldown > 0 || !enemy || enemy.isDead) return;
    this.scratchCooldown = 0.3;
    const dmg = 35;
    enemy.takeDamage(dmg, this, particleSystem, 'crit');

    if (particleSystem) {
      try { particleSystem.spawnScratch(enemy.x, enemy.y, '#c084fc'); } catch(e) {}
      particleSystem.spawnDamageText(enemy.x, enemy.y, '할큄!', 'crit', '#f43f5e');
      particleSystem.shake(4);
    }
  }

  takeDamage(amount, attacker, particleSystem, type = 'normal') {
    if (this.isDead || this.invulnerableTimer > 0) return 0;
    const finalDmg = Math.max(3, Math.floor(amount - this.def * 0.15));
    this.hp -= finalDmg;

    if (particleSystem) {
      particleSystem.spawnDamageNumber(this.x, this.y, finalDmg, type);
      particleSystem.spawnSparks(this.x, this.y, this.color, type === 'crit' ? 8 : 3);
    }

    if (this.hp <= 0) { this.hp = 0; this.die(particleSystem); }
    return finalDmg;
  }

  die(particleSystem) {
    this.isDead = true;
    if (particleSystem) {
      particleSystem.spawnShockwave(this.x, this.y, '#ef4444', 100, 10);
      particleSystem.spawnSparks(this.x, this.y, '#ffffff', 20);
      particleSystem.spawnDamageText(this.x, this.y, '💀 K.O.', 'crit', '#ef4444');
    }
  }

  findNearestEnemy(allFighters) {
    let nearest = null, minDist = Infinity;
    for (const f of allFighters) {
      if (f === this || f.isDead || (this.team && f.team === this.team)) continue;
      const d = Math.hypot(f.x - this.x, f.y - this.y);
      if (d < minDist) { minDist = d; nearest = f; }
    }
    return nearest;
  }

  render(ctx) {
    if (this.isDead) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    // ── Fox Form ──
    if (this.isFoxTransformed) {
      if (this.foxImg && this.foxImg.complete && this.foxImg.naturalWidth > 0) {
        const foxW = this.radius * 2.8;
        const foxH = foxW * (this.foxImg.naturalHeight / this.foxImg.naturalWidth);
        ctx.drawImage(this.foxImg, -foxW / 2, -foxH / 2, foxW, foxH);
      } else {
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      // ── Normal Avatar Circle ──
      ctx.fillStyle = '#171926';
      ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = this.color; ctx.stroke();

      if (this.avatarImg && this.avatarImg.complete && this.avatarImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath(); ctx.arc(0, 0, this.radius - 2.5, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(this.avatarImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
      } else {
        ctx.font = '32px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 2);
      }

      // ── Nana Gun ──
      if (this.id === 'nana' && this.gunImg && this.gunImg.complete && this.gunImg.naturalWidth > 0) {
        ctx.save();
        const gd = this.radius * 0.85;
        ctx.translate(Math.cos(this.aimAngle) * gd, Math.sin(this.aimAngle) * gd);
        ctx.rotate(this.aimAngle);
        if (Math.abs(this.aimAngle) > Math.PI / 2) ctx.scale(1, -1);
        ctx.drawImage(this.gunImg, -10, -19, 46, 38);

        if (this.muzzleFlashTimer > 0) {
          ctx.fillStyle = '#ffd700';
          ctx.beginPath(); ctx.arc(36, 0, 16, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ff69b4';
          ctx.beginPath(); ctx.arc(36, 0, 9, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
    }

    // ── Ultimate Charge Ring ──
    const ultRatio = Math.min(1.0, this.ultTimer / this.ultMaxCd);
    if (ultRatio < 1.0) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 7, -Math.PI / 2, -Math.PI / 2 + ultRatio * Math.PI * 2);
      ctx.stroke();
    } else {
      // Full charge glow pulse
      const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.008);
      ctx.lineWidth = 5;
      ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
      ctx.beginPath(); ctx.arc(0, 0, this.radius + 7, 0, Math.PI * 2); ctx.stroke();
    }

    // ── HP Bar ──
    const barW = 72, barH = 9, barY = -this.radius - 20;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);

    const hpRatio = Math.max(0, this.hp / this.maxHp);
    const hpColor = hpRatio > 0.55 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillStyle = hpColor;
    ctx.fillRect(-barW / 2, barY, barW * hpRatio, barH);

    // ── Name Tag ──
    ctx.font = "900 18px 'Black Han Sans', 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(this.name, 0, this.radius + 25);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.name, 0, this.radius + 25);

    ctx.restore();
  }
}
