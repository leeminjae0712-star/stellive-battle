/**
 * Main Game Controller
 * Manages simulation loop, top Minecraft HUD, fighter selection, and UI events.
 */

class GameApp {
  constructor() {
    this.canvas = document.getElementById('battle-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvasWidth = 800;
    this.canvasHeight = 540;

    // Subsystems
    this.audio = new SoundEngine();
    this.arena = new Arena(this.canvasWidth, this.canvasHeight);
    this.physics = new PhysicsEngine();
    this.particles = new ParticleSystem();
    this.skills = new SkillManager();

    // Game State
    this.allCharacterData = STELLIVE_CHARACTERS;
    this.selectedIds = new Set(['nana', 'shibuki', 'riko', 'rin']); // Default 4 members selected
    this.fighters = [];
    this.isPlaying = false;
    this.isPaused = false;
    this.speedMultiplier = 1.0; // Default 1x speed
    this.skillPauseEnabled = true;
    this.gameMode = 'royale';
    this.lastTime = 0;
    this.pauseRemainingTimer = 0;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.renderCharacterRoster();
    this.resetFighters();
    this.updateMinecraftHud();
    this.updateLeaderboard();

    // Start Simulation Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  setupEventListeners() {
    // 1. Start / Pause / Reset Buttons
    const btnStart = document.getElementById('btn-start');
    const btnStartText = document.getElementById('btn-start-text');
    btnStart.addEventListener('click', () => {
      if (!this.isPlaying) {
        if (this.fighters.length < 2) {
          alert('배틀을 시작하려면 최소 2명 이상의 파이터를 선택해 주세요!');
          return;
        }
        this.isPlaying = true;
        this.isPaused = false;
        btnStartText.textContent = '일시 정지';
        btnStart.classList.remove('btn-success');
        btnStart.classList.add('btn-warning');
        this.audio.playClick();
      } else {
        this.isPaused = !this.isPaused;
        btnStartText.textContent = this.isPaused ? '계속 하기' : '일시 정지';
        this.audio.playClick();
      }
    });

    const btnReset = document.getElementById('btn-reset');
    btnReset.addEventListener('click', () => {
      this.resetFighters();
      this.isPlaying = false;
      this.isPaused = false;
      btnStartText.textContent = '배틀 시작';
      btnStart.classList.remove('btn-warning');
      btnStart.classList.add('btn-success');
      this.audio.playClick();
    });

    // 2. Speed Preset Buttons (Default 1x)
    const speedButtons = document.querySelectorAll('.speed-btn');
    speedButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        speedButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.speedMultiplier = parseFloat(btn.getAttribute('data-speed')) || 1.0;
        this.audio.playClick();
      });
    });

    // 3. Skill Pause Toggle
    const toggleSkillPause = document.getElementById('toggle-skill-pause');
    if (toggleSkillPause) {
      toggleSkillPause.addEventListener('change', (e) => {
        this.skillPauseEnabled = e.target.checked;
        this.audio.playClick();
      });
    }

    // 4. Quick Roster Selection Action Buttons
    const btnSelectAll = document.getElementById('btn-select-all');
    btnSelectAll.addEventListener('click', () => {
      this.selectedIds = new Set(this.allCharacterData.map(c => c.id));
      this.renderCharacterRoster();
      this.resetFighters();
      this.audio.playClick();
    });

    const btnNanaShibuki = document.getElementById('btn-nana-shibuki');
    btnNanaShibuki.addEventListener('click', () => {
      this.selectedIds = new Set(['nana', 'shibuki']);
      this.renderCharacterRoster();
      this.resetFighters();
      this.audio.playClick();
    });

    const btnClearAll = document.getElementById('btn-clear-all');
    btnClearAll.addEventListener('click', () => {
      this.selectedIds.clear();
      this.renderCharacterRoster();
      this.resetFighters();
      this.audio.playClick();
    });

    // 5. Game Mode Selector
    const selectMode = document.getElementById('select-mode');
    selectMode.addEventListener('change', (e) => {
      this.gameMode = e.target.value;
      this.resetFighters();
    });

    // 6. Sound Toggle
    const btnSound = document.getElementById('btn-sound');
    btnSound.addEventListener('click', () => {
      const isMuted = this.audio.toggleMute();
      btnSound.innerHTML = isMuted ? '<i data-lucide="volume-x"></i>' : '<i data-lucide="volume-2"></i>';
      if (window.lucide) lucide.createIcons();
    });

    // 7. Fullscreen Toggle
    const btnFullscreen = document.getElementById('btn-fullscreen');
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // 8. Rematch Button
    const btnRematch = document.getElementById('btn-rematch');
    btnRematch.addEventListener('click', () => {
      document.getElementById('winner-overlay').classList.add('hidden');
      this.resetFighters();
      this.isPlaying = true;
      this.isPaused = false;
      document.getElementById('btn-start-text').textContent = '일시 정지';
      document.getElementById('btn-start').classList.remove('btn-success');
      document.getElementById('btn-start').classList.add('btn-warning');
    });

    // 9. Cutin Event Listener
    window.addEventListener('fighter-ult-cutin', (e) => {
      this.showUltCutin(e.detail.fighter, e.detail.ultName, e.detail.ultDesc, e.detail.shouldPause);
    });
  }

  renderCharacterRoster() {
    const grid = document.getElementById('character-grid');
    grid.innerHTML = '';

    const countBadge = document.getElementById('selected-count-badge');
    if (countBadge) {
      countBadge.textContent = `선택: ${this.selectedIds.size}명`;
    }

    this.allCharacterData.forEach(char => {
      const isSelected = this.selectedIds.has(char.id);
      const card = document.createElement('div');
      card.className = `roster-card ${isSelected ? 'selected' : ''}`;
      card.style.setProperty('--char-color', char.color);

      // Card Avatar HTML
      let avatarHtml = '';
      if (char.avatarUrl) {
        avatarHtml = `<img class="roster-avatar-img" src="${char.avatarUrl}" alt="${char.name}">`;
      } else {
        avatarHtml = `<div class="roster-avatar-emoji">${char.emoji}</div>`;
      }

      card.innerHTML = `
        <div class="roster-avatar-box" style="border-color: ${char.color};">
          ${avatarHtml}
        </div>
        <div class="roster-info">
          <div class="roster-title-row">
            <span class="roster-name">${char.name}</span>
            <span class="roster-group-tag">${char.groupName}</span>
          </div>
          <span class="roster-role">${char.role}</span>
          <span class="roster-skill-tag">스킬: ${char.skill1Name}</span>
        </div>
        <div class="roster-check-box">
          <i data-lucide="${isSelected ? 'check-circle' : 'circle'}"></i>
        </div>
      `;

      card.addEventListener('click', () => {
        if (this.selectedIds.has(char.id)) {
          this.selectedIds.delete(char.id);
        } else {
          this.selectedIds.add(char.id);
        }
        this.renderCharacterRoster();
        this.resetFighters();
        this.audio.playClick();
      });

      grid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  }

  resetFighters() {
    this.fighters = [];
    this.particles.reset();
    this.skills.reset();
    document.getElementById('winner-overlay').classList.add('hidden');
    document.getElementById('ult-cutin-overlay').classList.add('hidden');

    const selectedList = this.allCharacterData.filter(c => this.selectedIds.has(c.id));
    if (selectedList.length === 0) {
      this.updateMinecraftHud();
      this.updateLeaderboard();
      return;
    }

    // Spawn fighters positioned in a neat circle within the 4-corner arena
    const count = selectedList.length;
    const spawnRadius = Math.min(this.arena.halfW, this.arena.halfH) * 0.65;

    selectedList.forEach((char, index) => {
      const angle = (index * Math.PI * 2) / count - Math.PI / 2;
      const x = this.arena.cx + Math.cos(angle) * spawnRadius;
      const y = this.arena.cy + Math.sin(angle) * spawnRadius;

      let team = null;
      if (this.gameMode === 'team') {
        team = char.group === 'gen3' ? 'Team 3기 (Cliché)' : 'Team 연합 (1·2기)';
      }

      const fighter = new Fighter(char, x, y, team);
      this.fighters.push(fighter);
    });

    this.updateMinecraftHud();
    this.updateLeaderboard();
  }

  // Top Minecraft-Style Health HUD (마인크래프트 하트 체력바)
  updateMinecraftHud() {
    const container = document.getElementById('mc-hearts-grid');
    if (!container) return;

    if (this.fighters.length === 0) {
      container.innerHTML = `<div class="mc-empty-msg">좌측에서 파이터를 선택해 주세요!</div>`;
      return;
    }

    container.innerHTML = '';

    this.fighters.forEach(f => {
      const item = document.createElement('div');
      item.className = `mc-hud-item ${f.isDead ? 'dead' : ''}`;
      item.style.setProperty('--char-color', f.color);

      // Mini Avatar
      let avatarHtml = '';
      if (f.avatarImg && f.avatarImg.src) {
        avatarHtml = `<img class="mc-avatar-img" src="${f.avatarImg.src}">`;
      } else {
        avatarHtml = `<span class="mc-avatar-emoji">${f.emoji}</span>`;
      }

      // Calculate Minecraft Hearts (Total 10 hearts)
      const heartCount = 10;
      const hpPercent = Math.max(0, f.hp / f.maxHp);
      const activeHearts = Math.ceil(hpPercent * heartCount);

      let heartsString = '';
      for (let i = 0; i < heartCount; i++) {
        if (i < activeHearts) {
          heartsString += `<span class="mc-heart full">❤️</span>`;
        } else {
          heartsString += `<span class="mc-heart empty">🖤</span>`;
        }
      }

      item.innerHTML = `
        <div class="mc-item-header">
          <div class="mc-avatar-wrap" style="border-color: ${f.color};">
            ${avatarHtml}
          </div>
          <span class="mc-name">${f.name}</span>
          <span class="mc-hp-num">${f.isDead ? '💀 K.O.' : `${f.hp} / ${f.maxHp}`}</span>
        </div>
        <div class="mc-hearts-row">
          ${heartsString}
        </div>
      `;

      container.appendChild(item);
    });
  }

  showUltCutin(fighter, skillName, skillDesc, shouldPause = true) {
    const overlay = document.getElementById('ult-cutin-overlay');
    const imgEl = document.getElementById('cutin-img');
    const nameEl = document.getElementById('cutin-fighter-name');
    const skillEl = document.getElementById('cutin-skill-name');
    const descEl = document.getElementById('cutin-skill-desc');

    nameEl.textContent = fighter.name;
    skillEl.textContent = skillName;
    descEl.textContent = skillDesc;

    if (fighter.fullArtImg && fighter.fullArtImg.src) {
      imgEl.src = fighter.fullArtImg.src;
      imgEl.style.display = 'block';
    } else if (fighter.avatarImg && fighter.avatarImg.src) {
      imgEl.src = fighter.avatarImg.src;
      imgEl.style.display = 'block';
    } else {
      imgEl.style.display = 'none';
    }

    overlay.classList.remove('hidden');

    if (shouldPause) {
      this.pauseRemainingTimer = 0.75; // Freeze action for 0.75s
    }

    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 1100);
  }

  updateLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;
    list.innerHTML = '';

    const sorted = [...this.fighters].sort((a, b) => {
      if (a.isDead !== b.isDead) return a.isDead ? 1 : -1;
      return b.hp - a.hp;
    });

    sorted.forEach((f, idx) => {
      const item = document.createElement('div');
      item.className = `leader-item ${f.isDead ? 'dead' : ''}`;
      item.style.setProperty('--char-color', f.color);

      const hpPercent = Math.max(0, (f.hp / f.maxHp) * 100);

      item.innerHTML = `
        <span class="leader-rank">#${idx + 1}</span>
        <span class="leader-emoji">${f.emoji}</span>
        <span class="leader-name">${f.name}</span>
        <div class="leader-hp-bar">
          <div class="leader-hp-fill" style="width: ${hpPercent}%; background: ${f.color};"></div>
        </div>
        <span class="leader-hp-val">${f.isDead ? 'K.O.' : `${f.hp} HP`}</span>
      `;
      list.appendChild(item);
    });
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
      const team3Alive = alive.filter(f => f.team === 'Team 3기 (Cliché)');
      const teamOtherAlive = alive.filter(f => f.team === 'Team 연합 (1·2기)');
      if (team3Alive.length === 0 && teamOtherAlive.length > 0) {
        this.declareWinner(teamOtherAlive[0], 'Team 연합 (1·2기) 승리!');
      } else if (teamOtherAlive.length === 0 && team3Alive.length > 0) {
        this.declareWinner(team3Alive[0], 'Team 3기 (Cliché) 승리!');
      }
    }
  }

  declareWinner(winner, customTitle = null) {
    this.isPlaying = false;
    this.audio.playVictory();

    const overlay = document.getElementById('winner-overlay');
    const nameEl = document.getElementById('winner-name');
    nameEl.textContent = customTitle || `${winner.name} 최후의 승리!`;
    overlay.classList.remove('hidden');
  }

  loop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    const dt = Math.min(0.06, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    // Handle Skill Freeze Pause
    if (this.pauseRemainingTimer > 0) {
      this.pauseRemainingTimer -= dt;
    } else if (this.isPlaying && !this.isPaused) {
      const effSpeed = this.speedMultiplier;

      // 1. Update Fighters (Movement, Cooldowns, Skills)
      for (const f of this.fighters) {
        f.update(dt, this.arena, this.fighters, this.skills, this.audio, this.particles, effSpeed, this.skillPauseEnabled);
      }

      // 2. Physics Resolution (Substeps, Wall bounce, Elastic clashes, Kaengkaengi scratches)
      this.physics.update(dt, this.fighters, this.arena, this.audio, this.particles, effSpeed);

      // 3. Update Skills & Lasers & Projectiles
      this.skills.update(dt, this.arena, this.fighters, this.particles, this.audio, effSpeed);

      // 4. Update Minecraft HUD & Leaderboard
      this.updateMinecraftHud();
      if (Math.random() < 0.1) {
        this.updateLeaderboard();
      }

      // 5. Check Win Condition
      this.checkGameEnd();
    }

    // Update Particles
    this.particles.update(dt, this.speedMultiplier);

    // Render Canvas
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  render() {
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Screen Shake
    if (this.particles.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.particles.screenShake;
      const sy = (Math.random() - 0.5) * this.particles.screenShake;
      this.ctx.translate(sx, sy);
    }

    // 1. Draw Fixed 4-Corner Arena
    this.arena.render(this.ctx);

    // 2. Draw Active Skill Lasers & Projectiles
    this.skills.render(this.ctx);

    // 3. Draw Fighters
    for (const f of this.fighters) {
      f.render(this.ctx);
    }

    // 4. Draw Particles & Damage Numbers
    this.particles.render(this.ctx);

    this.ctx.restore();
  }
}

// Start Game on load
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GameApp();
});
