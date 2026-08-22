/**
 * Main Controller & Game Loop
 * Domain: hanakonana.cloud
 */

class GameApp {
  constructor() {
    this.canvas = document.getElementById('battleCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Core systems
    this.audio = window.soundEngine;
    this.arena = new Arena('circle');
    this.physics = new PhysicsEngine();
    this.particles = new ParticleSystem();
    this.skills = new SkillManager();

    // State
    this.allCharacters = [...STELLIVE_CHARACTERS];
    this.selectedCharIds = new Set(['nana', 'kanna', 'yuni', 'hina', 'lize', 'mashiro']);
    this.fighters = [];
    this.isPlaying = false;
    this.isPaused = false;
    this.speedMultiplier = 1.0;
    this.lastTime = 0;
    this.gameMode = 'royale'; // royale, duel, team, endless

    // Settings
    this.enableCutin = true;
    this.enableSlowMo = true;
    this.enableMouseGrab = true;

    // Mouse Interaction
    this.draggedFighter = null;
    this.dragOffset = { x: 0, y: 0 };
    this.mouseHistory = [];

    // Slow-mo effect timer
    this.slowMoFactor = 1.0;
    this.slowMoTimer = 0;

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.bindUI();
    this.renderRoster('all');
    this.updateActiveCount();
    this.initFighters();
    this.updateLeaderboard();

    // Start loop
    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;
    this.arena.resize(this.canvasWidth, this.canvasHeight);
  }

  bindUI() {
    // 1. Sound Button
    const btnSound = document.getElementById('btn-sound');
    btnSound.addEventListener('click', () => {
      const isMuted = this.audio.toggleMute();
      btnSound.innerHTML = isMuted ? '<i data-lucide="volume-x"></i>' : '<i data-lucide="volume-2"></i>';
      if (window.lucide) lucide.createIcons();
    });

    // 2. Fullscreen
    document.getElementById('btn-fullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // 3. Match Controls
    const btnStart = document.getElementById('btn-start');
    const btnStartText = document.getElementById('btn-start-text');
    btnStart.addEventListener('click', () => {
      this.audio.init();
      if (!this.isPlaying) {
        this.startMatch();
      } else {
        this.isPaused = !this.isPaused;
        btnStartText.textContent = this.isPaused ? '이어하기' : '일시정지';
      }
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      this.resetMatch();
    });

    document.getElementById('btn-restart-match').addEventListener('click', () => {
      document.getElementById('winner-overlay').classList.add('hidden');
      this.startMatch();
    });

    // 4. Speed Buttons
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.speedMultiplier = parseFloat(btn.dataset.speed);
      });
    });

    // 5. Selectors (Mode & Arena)
    const selectMode = document.getElementById('select-mode');
    selectMode.addEventListener('change', (e) => {
      this.gameMode = e.target.value;
      this.resetMatch();
    });

    const selectArena = document.getElementById('select-arena');
    selectArena.addEventListener('change', (e) => {
      this.arena.setType(e.target.value);
    });

    // 6. Roster Tabs
    document.querySelectorAll('.tab-btn').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderRoster(tab.dataset.tab);
      });
    });

    // 7. Roster Action Buttons
    document.getElementById('btn-select-all').addEventListener('click', () => {
      this.allCharacters.forEach(c => this.selectedCharIds.add(c.id));
      this.renderRoster(document.querySelector('.tab-btn.active').dataset.tab);
      this.updateActiveCount();
      this.resetMatch();
    });

    document.getElementById('btn-clear-all').addEventListener('click', () => {
      this.selectedCharIds.clear();
      this.renderRoster(document.querySelector('.tab-btn.active').dataset.tab);
      this.updateActiveCount();
      this.resetMatch();
    });

    document.getElementById('btn-random-pick').addEventListener('click', () => {
      this.selectedCharIds.clear();
      const shuffled = [...this.allCharacters].sort(() => 0.5 - Math.random());
      shuffled.slice(0, 4).forEach(c => this.selectedCharIds.add(c.id));
      this.renderRoster(document.querySelector('.tab-btn.active').dataset.tab);
      this.updateActiveCount();
      this.resetMatch();
    });

    // 8. Tweak Sliders
    const sliderBounce = document.getElementById('slider-bounciness');
    sliderBounce.addEventListener('input', (e) => {
      this.physics.setBounciness(e.target.value);
    });

    // 9. Toggles
    document.getElementById('toggle-cutin').addEventListener('change', (e) => {
      this.enableCutin = e.target.checked;
    });
    document.getElementById('toggle-slowmo').addEventListener('change', (e) => {
      this.enableSlowMo = e.target.checked;
    });
    document.getElementById('toggle-mouse-grab').addEventListener('change', (e) => {
      this.enableMouseGrab = e.target.checked;
    });

    // 10. Custom Fighter Modal
    const modal = document.getElementById('modal-creator');
    document.getElementById('btn-open-creator').addEventListener('click', () => {
      modal.classList.remove('hidden');
    });
    document.getElementById('btn-close-modal').addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    // Custom Color picker
    const customColorInput = document.getElementById('custom-color');
    customColorInput.addEventListener('input', (e) => {
      document.getElementById('color-hex-val').textContent = e.target.value;
    });

    // Save Custom Fighter
    document.getElementById('btn-save-custom').addEventListener('click', () => {
      this.saveCustomFighter();
    });

    // 11. Mouse Drag & Fling Handling
    this.bindMouseDrag();
  }

  saveCustomFighter() {
    const name = document.getElementById('custom-name').value.trim() || '커스텀 파이터';
    const color = document.getElementById('custom-color').value;
    const skillType = document.getElementById('custom-skill').value;
    const emoji = document.getElementById('custom-emoji').value.trim() || '⭐';
    const fileInput = document.getElementById('custom-image-file');

    const newChar = {
      id: 'custom_' + Date.now(),
      name,
      group: 'gen3',
      role: '팬 메이드 파이터',
      title: '커스텀 제작 파이터',
      color,
      glowColor: color,
      emoji,
      hp: 1100,
      atk: 52,
      def: 20,
      speed: 5.5,
      skillType,
      skillName: `${name}의 시그니처 공격`,
      ultName: `${name}의 필살 궁극기!`,
      ultDesc: '거대한 에너지 폭발을 일으킵니다.',
      avatarUrl: null
    };

    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        newChar.avatarUrl = e.target.result;
        this.addCreatedCharacter(newChar);
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      this.addCreatedCharacter(newChar);
    }
  }

  addCreatedCharacter(newChar) {
    this.allCharacters.unshift(newChar);
    this.selectedCharIds.add(newChar.id);
    document.getElementById('modal-creator').classList.add('hidden');
    this.renderRoster('all');
    this.updateActiveCount();
    this.resetMatch();
  }

  renderRoster(filterGroup = 'all') {
    const grid = document.getElementById('roster-grid');
    grid.innerHTML = '';

    const filtered = filterGroup === 'all' 
      ? this.allCharacters 
      : this.allCharacters.filter(c => c.group === filterGroup);

    filtered.forEach(char => {
      const card = document.createElement('div');
      card.className = `fighter-card ${this.selectedCharIds.has(char.id) ? 'active' : ''}`;
      card.style.setProperty('--char-color', char.color);

      card.innerHTML = `
        <div class="avatar-badge">
          ${char.avatarUrl ? `<img src="${char.avatarUrl}">` : char.emoji}
        </div>
        <div class="char-info">
          <span class="char-name">${char.name}</span>
          <span class="char-role">${char.role}</span>
        </div>
        <div class="status-check"><i data-lucide="check-circle-2"></i></div>
      `;

      card.addEventListener('click', () => {
        if (this.selectedCharIds.has(char.id)) {
          this.selectedCharIds.delete(char.id);
        } else {
          this.selectedCharIds.add(char.id);
        }
        card.classList.toggle('active', this.selectedCharIds.has(char.id));
        this.updateActiveCount();
        this.resetMatch();
      });

      grid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  }

  updateActiveCount() {
    const countEl = document.getElementById('active-count');
    countEl.textContent = `${this.selectedCharIds.size}/${this.allCharacters.length} 참전 중`;
  }

  initFighters() {
    this.fighters = [];
    const selected = this.allCharacters.filter(c => this.selectedCharIds.has(c.id));
    if (selected.length === 0) return;

    const count = selected.length;
    const radius = this.arena.baseRadius * 0.65;

    selected.forEach((config, idx) => {
      const angle = (idx * Math.PI * 2) / count;
      const x = this.arena.cx + Math.cos(angle) * radius;
      const y = this.arena.cy + Math.sin(angle) * radius;

      // Initial velocity launched towards center or tangent
      const launchAngle = angle + Math.PI + (Math.random() - 0.5) * 0.8;
      const speed = config.speed || 5.0;
      const vx = Math.cos(launchAngle) * speed;
      const vy = Math.sin(launchAngle) * speed;

      const fighter = new Fighter(config, x, y, vx, vy);
      
      // Team assignment if team mode
      if (this.gameMode === 'team') {
        fighter.team = idx % 2 === 0 ? 'Team A (블루)' : 'Team B (레드)';
        if (fighter.team === 'Team A (블루)') {
          fighter.color = '#38bdf8';
        } else {
          fighter.color = '#f43f5e';
        }
      }

      this.fighters.push(fighter);
    });
  }

  startMatch() {
    this.isPlaying = true;
    this.isPaused = false;
    document.getElementById('btn-start-text').textContent = '일시정지';
    document.getElementById('winner-overlay').classList.add('hidden');
    document.getElementById('hud-killfeed').innerHTML = '';

    if (this.fighters.length === 0 || this.fighters.every(f => f.isDead)) {
      this.initFighters();
    }

    if (this.gameMode === 'royale') {
      this.arena.startStorm();
      document.getElementById('storm-warning').classList.remove('hidden');
      setTimeout(() => {
        document.getElementById('storm-warning').classList.add('hidden');
      }, 3000);
    }
  }

  resetMatch() {
    this.isPlaying = false;
    this.isPaused = false;
    document.getElementById('btn-start-text').textContent = '배틀 시작';
    document.getElementById('winner-overlay').classList.add('hidden');
    document.getElementById('storm-warning').classList.add('hidden');
    document.getElementById('hud-killfeed').innerHTML = '';
    
    this.arena.resetStorm();
    this.particles.reset();
    this.skills.reset();
    this.initFighters();
    this.updateLeaderboard();
  }

  bindMouseDrag() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.enableMouseGrab) return;
      const pos = getPos(e);

      for (const f of this.fighters) {
        if (f.isDead) continue;
        const dist = Math.hypot(f.x - pos.x, f.y - pos.y);
        if (dist <= f.radius * 1.5) {
          this.draggedFighter = f;
          this.dragOffset = { x: f.x - pos.x, y: f.y - pos.y };
          this.mouseHistory = [{ x: pos.x, y: pos.y, time: performance.now() }];
          break;
        }
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.draggedFighter) return;
      const pos = getPos(e);
      this.draggedFighter.x = pos.x + this.dragOffset.x;
      this.draggedFighter.y = pos.y + this.dragOffset.y;
      this.mouseHistory.push({ x: pos.x, y: pos.y, time: performance.now() });
      if (this.mouseHistory.length > 5) this.mouseHistory.shift();
    });

    window.addEventListener('mouseup', () => {
      if (!this.draggedFighter) return;

      if (this.mouseHistory.length >= 2) {
        const first = this.mouseHistory[0];
        const last = this.mouseHistory[this.mouseHistory.length - 1];
        const dt = Math.max(16, last.time - first.time) / 1000;
        this.draggedFighter.vx = ((last.x - first.x) / dt) * 0.02;
        this.draggedFighter.vy = ((last.y - first.y) / dt) * 0.02;
      }

      this.draggedFighter = null;
      this.mouseHistory = [];
    });
  }

  showUltCutin(fighter) {
    if (!this.enableCutin) return;

    const overlay = document.getElementById('ult-cutin');
    const cutinChar = document.getElementById('cutin-character');
    const avatarEl = document.getElementById('cutin-avatar');
    const nameEl = document.getElementById('cutin-name');
    const skillEl = document.getElementById('cutin-skill');

    overlay.style.setProperty('--ult-color', fighter.glowColor);
    nameEl.textContent = fighter.name;
    skillEl.textContent = fighter.ultName;
    avatarEl.innerHTML = fighter.avatarUrl ? `<img src="${fighter.avatarUrl}">` : fighter.emoji;

    overlay.classList.remove('hidden');

    // Trigger slow-mo
    if (this.enableSlowMo) {
      this.slowMoFactor = 0.25;
      this.slowMoTimer = 0.6;
    }

    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 900);
  }

  addKillFeed(killer, victim) {
    const feed = document.getElementById('hud-killfeed');
    const item = document.createElement('div');
    item.className = 'killfeed-item';
    if (killer) {
      item.style.setProperty('--killer-color', killer.glowColor);
      item.innerHTML = `
        <span class="killer">${killer.name}</span>
        <span class="icon">⚔️</span>
        <span class="victim">${victim.name}</span>
      `;
    } else {
      item.innerHTML = `
        <span class="victim">${victim.name}</span>
        <span class="icon">💀</span>
        <span class="victim">탈락</span>
      `;
    }

    feed.appendChild(item);
    setTimeout(() => {
      item.remove();
    }, 4500);

    this.audio.playKill();
  }

  checkGameEnd() {
    if (!this.isPlaying) return;

    const alive = this.fighters.filter(f => !f.isDead);

    if (this.gameMode === 'royale' || this.gameMode === 'duel') {
      if (alive.length === 1 && this.fighters.length > 1) {
        this.declareWinner(alive[0]);
      } else if (alive.length === 0 && this.fighters.length > 0) {
        this.isPlaying = false;
      }
    } else if (this.gameMode === 'team') {
      const teamAAlive = alive.filter(f => f.team === 'Team A (블루)');
      const teamBAlive = alive.filter(f => f.team === 'Team B (레드)');
      if (teamAAlive.length === 0 && teamBAlive.length > 0) {
        this.declareWinner(teamBAlive[0], 'Team B (레드) 승리!');
      } else if (teamBAlive.length === 0 && teamAAlive.length > 0) {
        this.declareWinner(teamAAlive[0], 'Team A (블루) 승리!');
      }
    }
  }

  declareWinner(winner, titleText = null) {
    this.isPlaying = false;
    this.audio.playVictory();

    const overlay = document.getElementById('winner-overlay');
    const nameEl = document.getElementById('winner-name');
    const avatarEl = document.getElementById('winner-avatar');
    const killsEl = document.getElementById('winner-kills');
    const damageEl = document.getElementById('winner-damage');
    const bouncesEl = document.getElementById('winner-bounces');

    nameEl.textContent = titleText || `${winner.name} 우승!`;
    avatarEl.innerHTML = winner.avatarUrl ? `<img src="${winner.avatarUrl}">` : winner.emoji;
    killsEl.textContent = winner.kills;
    damageEl.textContent = winner.damageDealt;
    bouncesEl.textContent = winner.bounces;

    overlay.classList.remove('hidden');
  }

  updateLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';

    const sorted = [...this.fighters].sort((a, b) => {
      if (a.isDead !== b.isDead) return a.isDead ? 1 : -1;
      return b.kills - a.kills || b.hp - a.hp;
    });

    sorted.forEach((f, idx) => {
      const item = document.createElement('div');
      item.className = `leader-item ${f.isDead ? 'dead' : ''}`;
      item.style.setProperty('--char-color', f.color);

      const hpPercent = Math.max(0, (f.hp / f.maxHp) * 100);

      item.innerHTML = `
        <span class="leader-rank">#${idx + 1}</span>
        <div class="leader-avatar">${f.emoji}</div>
        <span class="leader-name">${f.name}</span>
        <div class="leader-hp-bar">
          <div class="leader-hp-fill" style="width: ${hpPercent}%"></div>
        </div>
        <span class="leader-kills">⚔️ ${f.kills}</span>
      `;
      list.appendChild(item);
    });
  }

  loop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    // Handle Slow-Mo
    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= dt;
      if (this.slowMoTimer <= 0) this.slowMoFactor = 1.0;
    }

    const effectiveSpeed = this.speedMultiplier * this.slowMoFactor;

    if (this.isPlaying && !this.isPaused) {
      // 1. Physics update
      this.physics.update(dt, this.fighters, this.arena, this.audio, this.particles, effectiveSpeed);

      // 2. Skill cast triggers & Ultimates
      for (const f of this.fighters) {
        if (f.isDead) continue;

        // Check Ult
        if (f.canCastUlt()) {
          this.showUltCutin(f);
          f.triggerUlt(this.fighters, this.skills, this.audio, this.particles, this.arena);
        } else {
          // Regular Skill
          f.tryCastSkill(this.fighters, this.skills, this.audio, this.particles);
        }

        // Check if dead by recent damage
        if (f.isDead && !f.hasLoggedDeath) {
          f.hasLoggedDeath = true;
          this.addKillFeed(null, f);
          this.particles.spawnShockwave(f.x, f.y, '#ef4444', 80, 5);
          this.particles.spawnSparks(f.x, f.y, '#ef4444', 20, 7);
          this.particles.shake(8);
        }
      }

      // 3. Update Skills & Projectiles
      this.skills.update(dt, this.arena, this.fighters, this.particles, this.audio, effectiveSpeed);

      // 4. Update Arena Hazards
      this.arena.update(dt, this.fighters, this.particles, effectiveSpeed);

      // 5. Update Leaderboard periodically
      if (Math.random() < 0.15) {
        this.updateLeaderboard();
      }

      // 6. Check Win Condition
      this.checkGameEnd();
    }

    // Update Particles
    this.particles.update(dt, effectiveSpeed);

    // Render Everything
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  render() {
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Apply Screen Shake
    if (this.particles.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.particles.screenShake;
      const shakeY = (Math.random() - 0.5) * this.particles.screenShake;
      this.ctx.translate(shakeX, shakeY);
    }

    // 1. Draw Arena
    this.arena.render(this.ctx);

    // 2. Draw Active Skill Zones & Lasers
    this.skills.render(this.ctx);

    // 3. Draw Fighters
    for (const f of this.fighters) {
      f.render(this.ctx);
    }

    // 4. Draw Particles & Damage Text
    this.particles.render(this.ctx);

    this.ctx.restore();
  }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GameApp();
});
