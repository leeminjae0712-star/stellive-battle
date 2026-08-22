/**
 * Fighter Entity Class
 * Manages stats, physics movement, cooldown-based skills, transformations, and rendering.
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

    // Position & Physics
    this.x = x;
    this.y = y;
    this.baseRadius = 24;
    this.radius = this.baseRadius;
    this.mass = 1.0;

    // Movement (Subdued & readable base speed)
    this.baseSpeed = config.speed || 3.8;
    const initialAngle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(initialAngle) * this.baseSpeed;
    this.vy = Math.sin(initialAngle) * this.baseSpeed;

    // Combat Stats
    this.maxHp = config.hp || 1000;
    this.hp = this.maxHp;
    this.atk = config.atk || 50;
    this.def = config.def || 18;
    this.team = team;
    this.isDead = false;

    // Cooldown-based Skill System
    this.skillType = config.skillType || 'normal';
    this.skill1Name = config.skill1Name || '스킬 1';
    this.skill1Desc = config.skill1Desc || '';
    this.skill1MaxCd = config.skill1Cooldown || 6.5;
    this.skill1Timer = Math.random() * 2.0; // Stagger initial cast slightly

    this.ultName = config.ultName || '궁극기';
    this.ultDesc = config.ultDesc || '';
    this.ultMaxCd = config.ultCooldown || 16.0;
    this.ultTimer = Math.random() * 4.0;

    // Transformation States (Shibuki Kaengkaengi Fox Form)
    this.isFoxTransformed = false;
    this.foxTransformTimer = 0;
    this.foxMaxDuration = 6.0;
    this.scratchCooldown = 0;

    // Status Effects
    this.isFrozen = false;
    this.freezeTimer = 0;
    this.slowMultiplier = 1.0;
    this.slowTimer = 0;
    this.invulnerableTimer = 0;

    // Images
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

    this.projectileImg = null;
    if (config.projectileImg) {
      this.projectileImg = new Image();
      this.projectileImg.src = config.projectileImg;
    }

    // Secondary horn delayed queue for Shibuki "똑, 똑"
    this.pendingHorns = [];
  }

  update(dt, arena, allFighters, skillManager, soundEngine, particleSystem, speedMultiplier = 1, skillPauseEnabled = true) {
    if (this.isDead) return;

    const effDt = dt * speedMultiplier;

    // 1. Update Status Timers
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= effDt;

    if (this.isFrozen) {
      this.freezeTimer -= effDt;
      if (this.freezeTimer <= 0) {
        this.isFrozen = false;
      } else {
        return; // No movement or skills while frozen
      }
    }

    if (this.slowTimer > 0) {
      this.slowTimer -= effDt;
      if (this.slowTimer <= 0) this.slowMultiplier = 1.0;
    }

    // 2. Update Fox Transformation State
    if (this.isFoxTransformed) {
      this.foxTransformTimer -= effDt;
      this.scratchCooldown = Math.max(0, this.scratchCooldown - effDt);

      // Fox speed & size boost
      this.radius = this.baseRadius * 1.35;
      
      // Spawn fox trail particle
      if (particleSystem && Math.random() < 0.35) {
        particleSystem.spawnSparks(this.x + (Math.random() - 0.5) * 20, this.y + (Math.random() - 0.5) * 20, '#c084fc', 2);
      }

      if (this.foxTransformTimer <= 0) {
        // End transformation
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

    // 3. Process Pending Delayed Horn Shots ("똑, 똑")
    if (this.pendingHorns.length > 0) {
      for (let i = this.pendingHorns.length - 1; i >= 0; i--) {
        const item = this.pendingHorns[i];
        item.delay -= effDt;
        if (item.delay <= 0) {
          const target = this.findNearestEnemy(allFighters);
          if (target && skillManager) {
            skillManager.spawnShibukiHorn(this, target, this.hornImg, particleSystem, 2);
          }
          this.pendingHorns.splice(i, 1);
        }
      }
    }

    // 4. Update Skill Cooldowns
    this.skill1Timer += effDt;
    this.ultTimer += effDt;

    // Check Auto-Cast for Skill 1
    if (this.skill1Timer >= this.skill1MaxCd) {
      const enemy = this.findNearestEnemy(allFighters);
      if (enemy) {
        this.triggerSkill1(enemy, skillManager, soundEngine, particleSystem);
        this.skill1Timer = 0;
      }
    }

    // Check Auto-Cast for Ultimate Skill
    if (this.ultTimer >= this.ultMaxCd) {
      const enemy = this.findNearestEnemy(allFighters);
      if (enemy) {
        this.triggerUltimate(allFighters, skillManager, soundEngine, particleSystem, arena, skillPauseEnabled);
        this.ultTimer = 0;
      }
    }

    // 5. Update Movement Physics
    const speedLimit = (this.isFoxTransformed ? this.baseSpeed * 1.55 : this.baseSpeed) * this.slowMultiplier;
    const currentSpeed = Math.hypot(this.vx, this.vy);

    if (currentSpeed < 0.05) {
      const a = Math.random() * Math.PI * 2;
      this.vx = Math.cos(a) * speedLimit;
      this.vy = Math.sin(a) * speedLimit;
    } else {
      // Gently normalize toward target speed so physics remains stable & predictable
      const factor = (speedLimit / currentSpeed) * 0.15;
      this.vx += (this.vx / currentSpeed) * speedLimit * factor - this.vx * factor;
      this.vy += (this.vy / currentSpeed) * speedLimit * factor - this.vy * factor;
    }

    this.x += this.vx * (speedMultiplier * 0.95);
    this.y += this.vy * (speedMultiplier * 0.95);

    // 6. 4-Corner Arena Wall Bounce
    if (arena) {
      if (this.x - this.radius <= arena.left) {
        this.x = arena.left + this.radius;
        this.vx = Math.abs(this.vx);
        if (particleSystem) particleSystem.spawnSparks(this.x, this.y, this.color, 3);
      } else if (this.x + this.radius >= arena.right) {
        this.x = arena.right - this.radius;
        this.vx = -Math.abs(this.vx);
        if (particleSystem) particleSystem.spawnSparks(this.x, this.y, this.color, 3);
      }

      if (this.y - this.radius <= arena.top) {
        this.y = arena.top + this.radius;
        this.vy = Math.abs(this.vy);
        if (particleSystem) particleSystem.spawnSparks(this.x, this.y, this.color, 3);
      } else if (this.y + this.radius >= arena.bottom) {
        this.y = arena.bottom - this.radius;
        this.vy = -Math.abs(this.vy);
        if (particleSystem) particleSystem.spawnSparks(this.x, this.y, this.color, 3);
      }
    }
  }

  // Skill 1 (Normal Skill)
  triggerSkill1(enemy, skillManager, soundEngine, particleSystem) {
    if (!skillManager || !enemy) return;

    if (particleSystem) {
      particleSystem.spawnDamageText(this.x, this.y - 10, this.skill1Name, 'skill', this.color);
      particleSystem.spawnShockwave(this.x, this.y, this.glowColor, 35, 2);
    }

    switch (this.skillType) {
      case 'nana_sarangi': // Nana's Single Sarang-i Gun shot
        skillManager.spawnSarangiGun(this, enemy, this.projectileImg, particleSystem, false);
        break;

      case 'shibuki_fox': // Shibuki's 2 Horns: "똑, 똑" sequential launch
        // 1st Horn immediately
        skillManager.spawnShibukiHorn(this, enemy, this.hornImg, particleSystem, 1);
        // 2nd Horn delayed by 0.35s
        this.pendingHorns.push({ delay: 0.35 });
        break;

      case 'punch': // Riko: Tornado straight dash
        const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
        this.vx = Math.cos(angle) * 11;
        this.vy = Math.sin(angle) * 11;
        enemy.takeDamage(this.atk * 0.9, this, particleSystem, 'skill');
        if (particleSystem) particleSystem.spawnShockwave(this.x, this.y, '#fbbf24', 50);
        break;

      case 'ice': // Rin / Yuni
        skillManager.spawnIceShard(this, enemy, particleSystem);
        break;

      case 'laser': // Hina / Fuya
        skillManager.spawnLaser(this, enemy, {
          length: 550,
          width: 8,
          damage: this.atk * 1.3,
          color: this.color
        }, particleSystem);
        break;

      case 'vampire': // Lize
        skillManager.spawnBloodOrb(this, enemy, particleSystem);
        this.heal(Math.floor(this.atk * 0.35), particleSystem);
        break;

      case 'smash': // Mashiro
        skillManager.spawnHammerSmash(this, enemy, particleSystem);
        break;

      case 'gravity': // Tabi
        skillManager.spawnGravityPulse(this, enemy, particleSystem);
        break;

      case 'dragon_fire': // Kanna
        skillManager.spawnDragonFire(this, enemy, particleSystem);
        break;

      default:
        skillManager.spawnGenericBullet(this, enemy, particleSystem);
        break;
    }
  }

  // Ultimate Skill
  triggerUltimate(allFighters, skillManager, soundEngine, particleSystem, arena, skillPauseEnabled = true) {
    if (this.isDead || !skillManager) return;

    if (soundEngine) soundEngine.playUlt();
    if (particleSystem) {
      particleSystem.shake(12);
      particleSystem.spawnShockwave(this.x, this.y, this.glowColor, 100, 6);
      particleSystem.spawnDamageText(this.x, this.y - 18, `ULT: ${this.ultName}`, 'ult', '#ffd700');
    }

    // Trigger Cutin Banner event
    window.dispatchEvent(new CustomEvent('fighter-ult-cutin', {
      detail: {
        fighter: this,
        ultName: this.ultName,
        ultDesc: this.ultDesc,
        shouldPause: skillPauseEnabled
      }
    }));

    const enemies = allFighters.filter(f => f !== this && !f.isDead && (!this.team || f.team !== this.team));

    switch (this.skillType) {
      case 'nana_sarangi': // Nana's Sarang-i Barrage / Spray
        skillManager.spawnSarangiBarrage(this, enemies, this.projectileImg, particleSystem, 8);
        break;

      case 'shibuki_fox': // Shibuki's Kaengkaengi Fox Form Transformation!
        this.isFoxTransformed = true;
        this.foxTransformTimer = this.foxMaxDuration;
        this.invulnerableTimer = 1.0;
        if (particleSystem) {
          particleSystem.spawnShockwave(this.x, this.y, '#c084fc', 120, 8);
          particleSystem.spawnDamageText(this.x, this.y, '🦊 캥캥이 변신!', 'buff', '#a855f7');
        }
        break;

      case 'punch': // Riko Mega Vortex Punch
        skillManager.spawnAoe(this, arena ? arena.cx : this.x, arena ? arena.cy : this.y, {
          radius: 110,
          color: '#fbbf24',
          damagePerTick: Math.floor(this.atk * 0.75),
          duration: 3.0,
          isUlt: true
        });
        break;

      case 'ice': // Rin / Yuni Absolute Zero Dome
        for (const enemy of enemies) {
          enemy.freeze(2.2);
          enemy.takeDamage(this.atk * 1.2, this, particleSystem, 'ult');
        }
        break;

      case 'laser': // Hina / Fuya Cross Laser Barrage
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2 + Math.random() * 0.4;
          skillManager.spawnLaser(this, null, {
            angle,
            length: 800,
            width: 14,
            damage: this.atk * 2.0,
            color: this.color,
            isUlt: true
          }, particleSystem);
        }
        break;

      case 'vampire': // Lize Crimson Carnival
        for (const enemy of enemies) {
          enemy.takeDamage(this.atk * 1.4, this, particleSystem, 'ult');
        }
        this.heal(Math.floor(this.maxHp * 0.3), particleSystem);
        break;

      case 'smash': // Mashiro Giant Dessert Hammer
        skillManager.spawnAoe(this, arena ? arena.cx : this.x, arena ? arena.cy : this.y, {
          radius: 130,
          color: '#f472b6',
          damagePerTick: Math.floor(this.atk * 0.85),
          duration: 2.5,
          isUlt: true
        });
        break;

      case 'gravity': // Tabi Nebula Black Hole
        skillManager.spawnGravityAoe(this, arena ? arena.cx : this.x, arena ? arena.cy : this.y, particleSystem);
        break;

      case 'dragon_fire': // Kanna Dragon Nova
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8;
          skillManager.spawnDragonFireBullet(this, angle, particleSystem);
        }
        break;
    }
  }

  // Kaengkaengi Continuous Claw Scratch on Enemy Contact
  applyFoxScratch(enemy, particleSystem) {
    if (!this.isFoxTransformed || this.scratchCooldown > 0 || !enemy || enemy.isDead) return;

    this.scratchCooldown = 0.25; // Continuous scratch tick every 0.25s
    const dmg = Math.floor(this.atk * 0.48);
    enemy.takeDamage(dmg, this, particleSystem, 'crit');

    if (particleSystem) {
      particleSystem.spawnScratch(enemy.x, enemy.y, '#c084fc');
      particleSystem.spawnDamageText(enemy.x, enemy.y, '할큄!', 'crit', '#f43f5e');
      particleSystem.shake(4);
    }
  }

  takeDamage(amount, attacker, particleSystem, type = 'normal') {
    if (this.isDead || this.invulnerableTimer > 0) return 0;

    const finalDamage = Math.max(5, Math.floor(amount - this.def * 0.3));
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

  heal(amount, particleSystem) {
    if (this.isDead) return;
    const healed = Math.min(amount, this.maxHp - this.hp);
    this.hp += healed;
    if (particleSystem && healed > 0) {
      particleSystem.spawnDamageNumber(this.x, this.y, `+${healed}`, 'heal');
      particleSystem.spawnSparks(this.x, this.y, '#22c55e', 6);
    }
  }

  freeze(duration) {
    this.isFrozen = true;
    this.freezeTimer = duration;
  }

  die(particleSystem) {
    this.isDead = true;
    if (particleSystem) {
      particleSystem.spawnShockwave(this.x, this.y, '#ef4444', 90, 8);
      particleSystem.spawnSparks(this.x, this.y, '#ffffff', 20);
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

    // 1. Fox Transformation Rendering (Shibuki Kaengkaengi)
    if (this.isFoxTransformed) {
      // Radiant Fox Aura
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#c084fc';

      // Draw Fox Cutout image
      if (this.foxImg && this.foxImg.complete && this.foxImg.naturalWidth > 0) {
        const foxSize = this.radius * 2.4;
        ctx.drawImage(this.foxImg, -foxSize / 2, -foxSize / 2, foxSize, foxSize);
      } else {
        // Fallback circle
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🦊', 0, 2);
      }

      // Draw Fox Claws Energy Effect
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2);
      ctx.stroke();

    } else {
      // 2. Standard Human Fighter Rendering

      // Soft character aura
      ctx.shadowBlur = 12;
      ctx.shadowColor = this.glowColor;

      // Base Body Circle
      ctx.fillStyle = '#171926';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Border ring with character color
      ctx.lineWidth = 3;
      ctx.strokeStyle = this.color;
      ctx.stroke();

      // Avatar Icon (Real Cutout Photo or Emoji)
      if (this.avatarImg && this.avatarImg.complete && this.avatarImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(this.avatarImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
      } else {
        ctx.font = `${Math.floor(this.radius * 0.9)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 2);
      }
    }

    // 3. Frozen Ice Barrier Overlay
    if (this.isFrozen) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 4. Cooldown Progress Arc around border (Skill 1 & Ult)
    const ultRatio = Math.min(1.0, this.ultTimer / this.ultMaxCd);
    if (ultRatio < 1.0) {
      const ultAngle = ultRatio * Math.PI * 2;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 4, -Math.PI / 2, -Math.PI / 2 + ultAngle);
      ctx.stroke();
    } else {
      // Ready indicator glow ring
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 5. Overhead Health Bar
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
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.strokeText(this.name, 0, this.radius + 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.name, 0, this.radius + 14);

    ctx.restore();
  }
}
