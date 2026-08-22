/**
 * Fighter Entity Class
 * Manages movement, collision response, health/energy, skills, and canvas rendering
 */

class Fighter {
  constructor(config, x, y, vx, vy) {
    this.id = config.id + '_' + Math.random().toString(36).substr(2, 6);
    this.charId = config.id;
    this.name = config.name;
    this.role = config.role;
    this.color = config.color || '#a855f7';
    this.glowColor = config.glowColor || '#9333ea';
    this.emoji = config.emoji || '⭐';
    this.avatarUrl = config.avatarUrl;
    
    // Physics
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 24;
    this.mass = 1.0;
    this.baseSpeed = config.speed || 5.0;

    // Combat Stats
    this.maxHp = config.hp || 1000;
    this.hp = this.maxHp;
    this.atk = config.atk || 50;
    this.def = config.def || 18;
    this.sp = 20; // 0 to 100
    this.maxSp = 100;
    this.isDead = false;

    // Skill Config
    this.skillType = config.skillType || 'spore';
    this.skillName = config.skillName || '기본 스킬';
    this.ultName = config.ultName || '궁극기';
    this.ultDesc = config.ultDesc || '';
    this.skillCooldown = 3.0;
    this.skillTimer = Math.random() * 2.0;

    // Stats Tracking
    this.kills = 0;
    this.damageDealt = 0;
    this.bounces = 0;
    this.team = null; // for team mode

    // Status Effects
    this.slowFactor = 1.0;
    this.slowTimer = 0;
    this.isFrozen = false;
    this.frozenTimer = 0;
    this.invulnerableTimer = 0;
    this.ultAnimationTimer = 0;

    // Avatar image loader
    this.avatarImg = null;
    this.loadAvatar();
  }

  loadAvatar() {
    if (this.avatarUrl) {
      const img = new Image();
      img.src = this.avatarUrl;
      img.onload = () => { this.avatarImg = img; };
    }
  }

  update(dt, speedMultiplier = 1) {
    if (this.isDead) return;

    // Handle status timers
    if (this.slowTimer > 0) {
      this.slowTimer -= dt * speedMultiplier;
      if (this.slowTimer <= 0) this.slowFactor = 1.0;
    }

    if (this.frozenTimer > 0) {
      this.frozenTimer -= dt * speedMultiplier;
      if (this.frozenTimer <= 0) this.isFrozen = false;
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt * speedMultiplier;
    }

    if (this.ultAnimationTimer > 0) {
      this.ultAnimationTimer -= dt * speedMultiplier;
    }

    // Movement
    if (!this.isFrozen) {
      const currentSpeed = Math.hypot(this.vx, this.vy);
      const targetSpeed = this.baseSpeed * this.slowFactor;

      // Gentle speed normalization so it stays dynamic
      if (currentSpeed > 0) {
        const factor = (targetSpeed / currentSpeed) * 0.05 + 0.95;
        this.vx *= factor;
        this.vy *= factor;
      }

      this.x += this.vx * speedMultiplier;
      this.y += this.vy * speedMultiplier;
    }

    // Passive skill timer
    this.skillTimer += dt * speedMultiplier;
  }

  onWallBounce(soundEngine, particleSystem, bounciness = 1.05) {
    this.bounces++;
    this.addSP(8); // Gain SP on wall bounce

    // Bounciness impulse
    this.vx *= bounciness;
    this.vy *= bounciness;

    // Cap max velocity
    const speed = Math.hypot(this.vx, this.vy);
    const maxSpeed = this.baseSpeed * 2.2;
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    if (particleSystem) {
      particleSystem.spawnSparks(this.x, this.y, this.glowColor, 5, 3);
    }
    if (soundEngine) {
      soundEngine.playBounce(speed / this.baseSpeed);
    }
  }

  addSP(amount) {
    if (this.isDead) return;
    this.sp = Math.min(this.maxSp, this.sp + amount);
  }

  takeDamage(amount, attacker = null, particleSystem = null, type = 'normal') {
    if (this.isDead || this.invulnerableTimer > 0) return;

    // Damage mitigation
    const finalDamage = Math.max(5, Math.floor(amount * (100 / (100 + this.def))));
    this.hp -= finalDamage;

    if (attacker && attacker !== this) {
      attacker.damageDealt += finalDamage;
      attacker.addSP(12); // Attacker gains SP
    }

    // Floating text
    if (particleSystem) {
      particleSystem.spawnDamageText(this.x, this.y, finalDamage, type, this.color);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      if (attacker && attacker !== this) {
        attacker.kills++;
      }
    }
  }

  heal(amount, particleSystem = null) {
    if (this.isDead) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    if (particleSystem) {
      particleSystem.spawnDamageText(this.x, this.y, amount, 'heal');
    }
  }

  applySlow(factor = 0.5, duration = 1.5) {
    this.slowFactor = factor;
    this.slowTimer = duration;
  }

  freeze(duration = 1.2) {
    this.isFrozen = true;
    this.frozenTimer = duration;
  }

  // Cast Regular Skill
  tryCastSkill(allFighters, skillManager, soundEngine, particleSystem) {
    if (this.isDead || this.isFrozen || this.skillTimer < this.skillCooldown) return false;

    // Find nearest enemy
    const enemy = this.findNearestEnemy(allFighters);
    if (!enemy) return false;

    this.skillTimer = 0;

    if (soundEngine) soundEngine.playSkill(this.skillType);
    if (particleSystem) {
      particleSystem.spawnShockwave(this.x, this.y, this.glowColor, 35);
    }

    switch (this.skillType) {
      case 'spore': // Nana
        skillManager.spawnAoe(this, enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40, {
          radius: 55,
          color: this.color,
          damagePerTick: Math.floor(this.atk * 0.35),
          duration: 3.0,
          slow: 0.6
        });
        break;

      case 'fire': // Kanna / Shibuki
        skillManager.spawnProjectile(this, enemy, {
          speed: 9,
          damage: this.atk * 0.9,
          color: '#fb923c',
          radius: 12,
          homing: true
        });
        break;

      case 'ice': // Yuni / Rin
        skillManager.spawnProjectile(this, enemy, {
          speed: 10,
          damage: this.atk * 0.85,
          color: '#38bdf8',
          radius: 10
        });
        enemy.applySlow(0.4, 1.0);
        break;

      case 'laser': // Hina / Kanade
        skillManager.spawnLaser(this, enemy, {
          length: 500,
          width: 7,
          damage: this.atk * 1.3,
          color: this.color
        });
        break;

      case 'vampire': // Lize
        skillManager.spawnProjectile(this, enemy, {
          speed: 8.5,
          damage: this.atk * 0.9,
          color: '#ef4444',
          radius: 11
        });
        this.heal(Math.floor(this.atk * 0.4), particleSystem);
        break;

      case 'punch': // Mashiro / Riko
        // Dash directly at enemy
        const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
        this.vx += Math.cos(angle) * 8;
        this.vy += Math.sin(angle) * 8;
        if (particleSystem) particleSystem.spawnShockwave(this.x, this.y, '#f472b6', 50);
        break;
    }

    return true;
  }

  // Cast Ultimate Skill
  canCastUlt() {
    return this.sp >= this.maxSp && !this.isDead && !this.isFrozen;
  }

  triggerUlt(allFighters, skillManager, soundEngine, particleSystem, arena) {
    if (!this.canCastUlt()) return false;

    this.sp = 0;
    this.ultAnimationTimer = 0.8;
    this.invulnerableTimer = 1.0;

    if (soundEngine) soundEngine.playUlt();
    if (particleSystem) {
      particleSystem.shake(12);
      particleSystem.spawnShockwave(this.x, this.y, this.glowColor, 120, 6);
      particleSystem.spawnDamageText(this.x, this.y, 'ULTIMATE!', 'ult', this.glowColor);
    }

    const enemies = allFighters.filter(f => f !== this && !f.isDead && (!this.team || f.team !== this.team));

    switch (this.skillType) {
      case 'spore': // Nana's Mega Mushroom Field
        // Spawn 4 mushroom spore bombs across arena
        for (let i = 0; i < 4; i++) {
          const offsetX = (Math.random() - 0.5) * arena.currentRadius * 1.2;
          const offsetY = (Math.random() - 0.5) * arena.currentRadius * 1.2;
          skillManager.spawnAoe(this, arena.cx + offsetX, arena.cy + offsetY, {
            radius: 80,
            color: '#c084fc',
            damagePerTick: Math.floor(this.atk * 0.55),
            duration: 4.5,
            slow: 0.4,
            isUlt: true
          });
        }
        break;

      case 'fire': // Kanna / Shibuki: Dragon Nova
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8;
          skillManager.spawnProjectile(this, { x: this.x + Math.cos(angle) * 100, y: this.y + Math.sin(angle) * 100 }, {
            angle,
            speed: 8.5,
            damage: this.atk * 1.6,
            color: '#f97316',
            radius: 16,
            isUlt: true
          });
        }
        break;

      case 'ice': // Yuni / Rin: Absolute Blizzard
        for (const enemy of enemies) {
          enemy.freeze(2.0);
          enemy.takeDamage(this.atk * 1.2, this, particleSystem, 'ult');
        }
        skillManager.spawnAoe(this, arena.cx, arena.cy, {
          radius: arena.currentRadius * 0.9,
          color: '#38bdf8',
          damagePerTick: Math.floor(this.atk * 0.3),
          duration: 3.0,
          isUlt: true
        });
        break;

      case 'laser': // Hina / Kanade: Mega Snipe
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2 + Math.random() * 0.5;
          skillManager.spawnLaser(this, null, {
            angle,
            length: 800,
            width: 16,
            damage: this.atk * 2.2,
            color: '#06b6d4',
            isUlt: true
          });
        }
        break;

      case 'vampire': // Lize: Crimson Slaughter
        for (const enemy of enemies) {
          enemy.takeDamage(this.atk * 1.5, this, particleSystem, 'ult');
        }
        this.heal(Math.floor(this.maxHp * 0.35), particleSystem);
        if (particleSystem) {
          particleSystem.spawnShockwave(this.x, this.y, '#ef4444', 140, 8);
        }
        break;

      case 'punch': // Mashiro / Riko: Gigantic Meteor
        skillManager.spawnAoe(this, arena.cx, arena.cy, {
          radius: 120,
          color: '#fbbf24',
          damagePerTick: Math.floor(this.atk * 0.8),
          duration: 2.5,
          isUlt: true
        });
        for (const enemy of enemies) {
          const dist = Math.hypot(enemy.x - arena.cx, enemy.y - arena.cy);
          if (dist < 120) {
            enemy.takeDamage(this.atk * 2.0, this, particleSystem, 'ult');
            enemy.freeze(1.5);
          }
        }
        break;
    }

    return true;
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

    // 1. Glowing Outer Aura
    ctx.shadowBlur = this.sp >= this.maxSp ? 25 : 12;
    ctx.shadowColor = this.sp >= this.maxSp ? '#ffd700' : this.glowColor;

    // 2. Base Body Circle
    ctx.fillStyle = '#151728';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Border ring with team / character color
    ctx.lineWidth = 3;
    ctx.strokeStyle = this.color;
    ctx.stroke();

    // 3. Avatar Icon / Emoji
    if (this.avatarImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, this.radius - 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(this.avatarImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
      ctx.restore();
    } else {
      // Draw Emoji
      ctx.font = `${Math.floor(this.radius * 0.95)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.emoji, 0, 2);
    }

    // 4. Status Indicator (Frozen ice block)
    if (this.isFrozen) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Circular SP Ring around body
    if (this.sp > 0) {
      const spAngle = (this.sp / this.maxSp) * Math.PI * 2;
      ctx.lineWidth = 3;
      ctx.strokeStyle = this.sp >= this.maxSp ? '#ffd700' : 'rgba(168, 85, 247, 0.9)';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 4, -Math.PI / 2, -Math.PI / 2 + spAngle);
      ctx.stroke();
    }

    // 6. Overhead Health Bar
    const hpBarWidth = 40;
    const hpBarHeight = 5;
    const hpY = -this.radius - 12;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(-hpBarWidth / 2, hpY, hpBarWidth, hpBarHeight);

    // Fill
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(-hpBarWidth / 2, hpY, hpBarWidth * hpRatio, hpBarHeight);

    // 7. Name Tag
    ctx.font = "800 11px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.strokeText(this.name, 0, this.radius + 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.name, 0, this.radius + 14);

    ctx.restore();
  }
}
