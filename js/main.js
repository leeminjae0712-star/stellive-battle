/**
 * Main Game Controller
 * Manages simulation loop, top Minecraft HUD, 1:1 pixel-perfect canvas resolution,
 * and clean winner profile victory screen.
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
    this.selectedIds = new Set(['nana', 'shibuki']);
    this.fighters = [];
    this.isPlaying = false;
    this.isPaused = false;
    this.speedMultiplier = 1.0;
    this.skillPauseEnabled = true;
    this.lastTime = 0;
    this.pauseRemainingTimer = 0;

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.setupEventListeners();
    this.renderCharacterRoster();
    this.resetFighters();
    this.updateMinecraftHud();
    this.updateLeaderboard();

    // Start Simulation Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  // 1:1 Pixel-Perfect Canvas Resolution (No Distortion or Stretching)
  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;

    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);

    this.dpr = dpr;
    if (this.arena) {
      this.arena.resize(this.canvasWidth, this.canvasHeight);
    }
  }

  setupEventListeners() {
    // 1. Start / Pause / Reset Buttons
    const btnStart = document.getElementById('btn-start');
    const btnStartText = document.getElementById('btn-start-text');
    btnStart.addEventListener('click', () => {
      if (!this.isPlaying) {
        if (this.fighters.length < 2) {
          alert('배틀을 시작하려면 최소 2명의 파이터를 선택해 주세요!');
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

    // 4. Quick Roster Selection
    const btnSelectBoth = document.getElementById('btn-select-both');
    if (btnSelectBoth) {
      btnSelectBoth.addEventListener('click', () => {
        this.selectedIds = new Set(['nana', 'shibuki']);
        this.renderCharacterRoster();
        this.resetFighters();
        this.audio.playClick();
      });
    }

    // 5. Sound Toggle
    const btnSound = document.getElementById('btn-sound');
    btnSound.addEventListener('click', () => {
      const isMuted = this.audio.toggleMute();
      btnSound.innerHTML = isMuted ? '<i data-lucide="volume-x"></i>' : '<i data-lucide="volume-2"></i>';
      if (window.lucide) lucide.createIcons();
    });

    // 6. Fullscreen Toggle
    const btnFullscreen = document.getElementById('btn-fullscreen');
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // 7. Rematch Button
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

    // 8. Cutin Event Listener
    window.addEventListener('fighter-ult-cutin', (e) => {
      this.showUltCutin(e.detail.fighter, e.detail.ultName, e.detail.ultDesc, e.detail.shouldPause);
    });
  }

  renderCharacterRoster() {
    const grid = document.getElementById('character-grid');
    if (!grid) return;
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

      card.innerHTML = `
        <div class="roster-avatar-box" style="border-color: ${char.color};">
          <img class="roster-avatar-img" src="${char.avatarUrl}" alt="${char.name}">
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

    const count = selectedList.length;
    selectedList.forEach((char, index) => {
      const offsetX = count === 2 ? (index === 0 ? -this.arena.halfW * 0.55 : this.arena.halfW * 0.55) : 0;
      const x = this.arena.cx + offsetX;
      const y = this.arena.cy;

      const fighter = new Fighter(char, x, y);
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

      let avatarHtml = '';
      if (f.avatarImg && f.avatarImg.src) {
        avatarHtml = `<img class="mc-avatar-img" src="${f.avatarImg.src}">`;
      } else {
        avatarHtml = `<span class="mc-avatar-emoji">${f.emoji}</span>`;
      }

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
      this.pauseRemainingTimer = 0.65;
    }

    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 1000);
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

    if (alive.length === 1 && this.fighters.length > 1) {
      this.declareWinner(alive[0]);
    } else if (alive.length === 0 && this.fighters.length > 0) {
      this.isPlaying = false;
    }
  }

  // Clean Victory Announcement with Winner's Profile Avatar
  declareWinner(winner) {
    this.isPlaying = false;
    this.audio.playVictory();

    const overlay = document.getElementById('winner-overlay');
    const imgEl = document.getElementById('winner-img');
    const nameEl = document.getElementById('winner-name');

    // Display winner profile picture
    if (winner.avatarImg && winner.avatarImg.src) {
      imgEl.src = winner.avatarImg.src;
    } else if (winner.fullArtImg && winner.fullArtImg.src) {
      imgEl.src = winner.fullArtImg.src;
    }

    // Clean text: e.g. "텐코 시부키 승리!" or "하나코 나나 승리!"
    nameEl.textContent = `${winner.name} 승리!`;
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

      // 1. Update Fighters
      for (const f of this.fighters) {
        f.update(dt, this.arena, this.fighters, this.skills, this.audio, this.particles, effSpeed, this.skillPauseEnabled);
      }

      // 2. Physics
      this.physics.update(dt, this.fighters, this.arena, this.audio, this.particles, effSpeed);

      // 3. Update Skills & Bullets
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
    const dpr = this.dpr || 1;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Screen Shake
    if (this.particles.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.particles.screenShake;
      const sy = (Math.random() - 0.5) * this.particles.screenShake;
      this.ctx.translate(sx, sy);
    }

    // 1. Draw 4-Corner Arena
    this.arena.render(this.ctx);

    // 2. Draw Active Skill Bullets & Horns
    this.skills.render(this.ctx);

    // 3. Draw Fighters
    for (const f of this.fighters) {
      f.render(this.ctx);
    }

    // 4. Draw Particles & Damage Numbers
    this.particles.render(this.ctx);
  }
}

// Start Game on load
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GameApp();
});
