/**
 * Main Game Controller - StelLive 3-Hero Battle Edition
 * Supports Nana, Shibuki, and Riko across 1v1 and 3-Way FFA.
 */

class GameApp {
  constructor() {
    this.canvas = document.getElementById('battle-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvasWidth = 800;
    this.canvasHeight = 800;

    // Subsystems
    this.audio = new SoundEngine();
    this.arena = new Arena(this.canvasWidth, this.canvasHeight);
    this.physics = new PhysicsEngine();
    this.particles = new ParticleSystem();
    this.skills = new SkillManager();

    // Game State
    this.allCharacterData = STELLIVE_CHARACTERS;
    this.currentMode = 'all-3-way';
    this.fighters = [];
    this.isPlaying = false;
    this.isPaused = false;
    this.speedMultiplier = 1.0;
    this.lastTime = 0;

    window.gameApp = this;
    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.setupEventListeners();
    this.resetFighters();

    // Start 60 FPS Game Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const size = Math.floor(Math.min(rect.width, rect.height || rect.width));
    if (size <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvasWidth = size;
    this.canvasHeight = size;

    this.canvas.width = Math.floor(size * dpr);
    this.canvas.height = Math.floor(size * dpr);
    this.dpr = dpr;

    if (this.arena) {
      this.arena.resize(this.canvasWidth, this.canvasHeight);
    }
  }

  setupEventListeners() {
    // Mode Buttons
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentMode = btn.getAttribute('data-mode') || 'all-3-way';
        this.resetFighters();
        this.audio.playClick();
      });
    });

    // Start / Pause Button
    const btnStart = document.getElementById('btn-start');
    const btnStartText = document.getElementById('btn-start-text');
    btnStart.addEventListener('click', () => {
      this.audio.init();
      if (!this.isPlaying) {
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

    // Reset Button
    const btnReset = document.getElementById('btn-reset');
    btnReset.addEventListener('click', () => {
      this.audio.init();
      this.resetFighters();
      this.isPlaying = false;
      this.isPaused = false;
      btnStartText.textContent = '배틀 시작';
      btnStart.classList.remove('btn-warning');
      btnStart.classList.add('btn-success');
      this.audio.playClick();
    });

    // Speed Preset Buttons
    const speedButtons = document.querySelectorAll('.speed-btn');
    speedButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        speedButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.speedMultiplier = parseFloat(btn.getAttribute('data-speed')) || 1.0;
        this.audio.playClick();
      });
    });

    // Sound Toggle
    const btnSound = document.getElementById('btn-sound');
    btnSound.addEventListener('click', () => {
      const isMuted = this.audio.toggleMute();
      btnSound.innerHTML = isMuted ? '<i data-lucide="volume-x"></i>' : '<i data-lucide="volume-2"></i>';
      if (window.lucide) lucide.createIcons();
    });

    // Fullscreen Toggle
    const btnFullscreen = document.getElementById('btn-fullscreen');
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Rematch Button
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

    // Cutin Event Listener
    window.addEventListener('fighter-ult-cutin', (e) => {
      this.showUltCutin(e.detail.fighter, e.detail.ultName, e.detail.ultDesc);
    });
  }

  buildVsHudHtml() {
    const hudContainer = document.getElementById('vs-hud');
    if (!hudContainer) return;

    const is1v1 = this.fighters.length === 2;
    hudContainer.className = is1v1 ? 'vs-hud-container mode-1v1' : 'vs-hud-container mode-ffa';

    let html = '';

    this.fighters.forEach((f, idx) => {
      const cardClass = `${f.id}-card`;
      const hpFillClass = f.id === 'shibuki' ? 'shibuki-hp' : f.id === 'riko' ? 'riko-hp' : '';
      const s1FillClass = f.id === 'shibuki' ? 'shibuki-s1' : f.id === 'riko' ? 'riko-s1' : '';

      html += `
        <div class="vs-fighter-card ${cardClass}" id="vs-card-${f.id}">
          <div class="vs-profile-row">
            <div class="vs-avatar-box">
              <img src="${f.avatarImg ? f.avatarImg.src : ''}" alt="${f.name}">
            </div>
            <div class="vs-name-box">
              <span class="vs-fighter-name">${f.name}</span>
              <span class="vs-fighter-role">${f.role}</span>
            </div>
          </div>

          <!-- HP Section -->
          <div class="hud-hp-wrap">
            <div class="hud-hp-label-row">
              <div class="hud-hearts" id="hud-hearts-${f.id}">❤️❤️❤️❤️❤️</div>
              <span class="hud-hp-val" id="hud-hp-${f.id}">${f.hp} / ${f.maxHp} HP</span>
            </div>
            <div class="hud-hp-bar-bg">
              <div class="hud-hp-bar-fill ${hpFillClass}" id="hud-hp-bar-${f.id}" style="width: 100%;"></div>
            </div>
          </div>

          <!-- Cooldowns Section -->
          <div class="hud-cd-wrap">
            <div class="cd-row">
              <div class="cd-label-row">
                <span class="cd-name">${f.emoji} ${f.skill1Name}</span>
                <span class="cd-status ready" id="hud-s1-status-${f.id}">⚡ READY</span>
              </div>
              <div class="cd-bar-bg">
                <div class="cd-bar-fill ${s1FillClass}" id="hud-s1-bar-${f.id}" style="width: 100%;"></div>
              </div>
            </div>

            <div class="cd-row">
              <div class="cd-label-row">
                <span class="cd-name">⚡ ${f.ultName}</span>
                <span class="cd-status" id="hud-ult-status-${f.id}">0%</span>
              </div>
              <div class="cd-bar-bg">
                <div class="cd-bar-fill ult-fill" id="hud-ult-bar-${f.id}" style="width: 0%;"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      if (is1v1 && idx === 0) {
        html += `
          <div class="vs-divider">
            <div class="vs-badge">VS</div>
          </div>
        `;
      }
    });

    hudContainer.innerHTML = html;
  }

  resetFighters() {
    this.fighters = [];
    this.particles.reset();
    this.skills.reset();
    document.getElementById('winner-overlay').classList.add('hidden');
    document.getElementById('ult-cutin-overlay').classList.add('hidden');

    const nanaData = this.allCharacterData.find(c => c.id === 'nana') || this.allCharacterData[0];
    const shibukiData = this.allCharacterData.find(c => c.id === 'shibuki') || this.allCharacterData[1];
    const rikoData = this.allCharacterData.find(c => c.id === 'riko') || this.allCharacterData[2];

    const spawnDist = this.arena.halfSize * 0.52;

    if (this.currentMode === 'nana-vs-shibuki') {
      const nana = new Fighter(nanaData, this.arena.cx - spawnDist, this.arena.cy);
      const shibuki = new Fighter(shibukiData, this.arena.cx + spawnDist, this.arena.cy);
      this.fighters.push(nana, shibuki);

    } else if (this.currentMode === 'nana-vs-riko') {
      const nana = new Fighter(nanaData, this.arena.cx - spawnDist, this.arena.cy);
      const riko = new Fighter(rikoData, this.arena.cx + spawnDist, this.arena.cy);
      this.fighters.push(nana, riko);

    } else if (this.currentMode === 'shibuki-vs-riko') {
      const shibuki = new Fighter(shibukiData, this.arena.cx - spawnDist, this.arena.cy);
      const riko = new Fighter(rikoData, this.arena.cx + spawnDist, this.arena.cy);
      this.fighters.push(shibuki, riko);

    } else {
      // 3-Way FFA (Triangle Spawn)
      const nana = new Fighter(nanaData, this.arena.cx - spawnDist * 0.9, this.arena.cy - spawnDist * 0.6);
      const shibuki = new Fighter(shibukiData, this.arena.cx + spawnDist * 0.9, this.arena.cy - spawnDist * 0.6);
      const riko = new Fighter(rikoData, this.arena.cx, this.arena.cy + spawnDist * 0.85);
      this.fighters.push(nana, shibuki, riko);
    }

    this.buildVsHudHtml();
    this.updateVsHud();
  }

  updateVsHud() {
    for (const f of this.fighters) {
      const hpPercent = Math.max(0, (f.hp / f.maxHp) * 100);
      const hpEl = document.getElementById(`hud-hp-${f.id}`);
      const hpBar = document.getElementById(`hud-hp-bar-${f.id}`);
      const heartsEl = document.getElementById(`hud-hearts-${f.id}`);
      const cardEl = document.getElementById(`vs-card-${f.id}`);

      if (hpEl) hpEl.textContent = f.isDead ? '💀 K.O.' : `${f.hp} / ${f.maxHp} HP`;
      if (hpBar) hpBar.style.width = `${hpPercent}%`;
      if (cardEl) cardEl.classList.toggle('dead', f.isDead);

      if (heartsEl) {
        const fullCount = Math.ceil(hpPercent / 20);
        let hStr = '';
        for (let i = 0; i < 5; i++) {
          hStr += i < fullCount ? '❤️' : '🖤';
        }
        heartsEl.innerHTML = hStr;
      }

      const s1Percent = Math.min(100, Math.floor((f.skill1Timer / f.skill1MaxCd) * 100));
      const s1Bar = document.getElementById(`hud-s1-bar-${f.id}`);
      const s1Status = document.getElementById(`hud-s1-status-${f.id}`);
      if (s1Bar) s1Bar.style.width = `${s1Percent}%`;
      if (s1Status) {
        if (s1Percent >= 100) {
          s1Status.textContent = '⚡ READY!';
          s1Status.className = 'cd-status ready';
        } else {
          const rem = Math.max(0, f.skill1MaxCd - f.skill1Timer);
          s1Status.textContent = `${rem.toFixed(1)}s`;
          s1Status.className = 'cd-status';
        }
      }

      const ultPercent = Math.min(100, Math.floor((f.ultTimer / f.ultMaxCd) * 100));
      const ultBar = document.getElementById(`hud-ult-bar-${f.id}`);
      const ultStatus = document.getElementById(`hud-ult-status-${f.id}`);
      if (ultBar) ultBar.style.width = `${ultPercent}%`;
      if (ultStatus) {
        if (ultPercent >= 100) {
          ultStatus.textContent = '★ READY!';
          ultStatus.className = 'cd-status ready-gold';
        } else {
          ultStatus.textContent = `${ultPercent}%`;
          ultStatus.className = 'cd-status';
        }
      }
    }
  }

  showUltCutin(fighter, skillName, skillDesc) {
    const overlay = document.getElementById('ult-cutin-overlay');
    const imgEl = document.getElementById('cutin-img');
    const nameEl = document.getElementById('cutin-fighter-name');
    const skillEl = document.getElementById('cutin-skill-name');
    const descEl = document.getElementById('cutin-skill-desc');

    nameEl.textContent = fighter.name;
    skillEl.textContent = skillName;
    descEl.textContent = skillDesc;

    if (fighter.avatarImg && fighter.avatarImg.src) {
      imgEl.src = fighter.avatarImg.src;
      imgEl.style.display = 'block';
    } else {
      imgEl.style.display = 'none';
    }

    overlay.classList.remove('hidden');

    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 1100);
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

  declareWinner(winner) {
    this.isPlaying = false;
    this.audio.playVictory();

    const overlay = document.getElementById('winner-overlay');
    const imgEl = document.getElementById('winner-img');
    const nameEl = document.getElementById('winner-name');

    if (winner.avatarImg && winner.avatarImg.src) {
      imgEl.src = winner.avatarImg.src;
    }

    nameEl.textContent = `${winner.name} 승리!`;
    overlay.classList.remove('hidden');
  }

  loop(currentTime) {
    try {
      if (!this.lastTime) this.lastTime = currentTime;
      const dt = Math.min(0.04, (currentTime - this.lastTime) / 1000);
      this.lastTime = currentTime;

      const effSpeed = this.speedMultiplier;

      if (this.isPlaying && !this.isPaused) {
        // 1. Update Fighters
        for (const f of this.fighters) {
          f.update(dt, this.arena, this.fighters, this.skills, this.audio, this.particles, effSpeed);
        }

        // 2. Physics with Time Stop support
        this.physics.update(dt, this.fighters, this.arena, this.audio, this.particles, effSpeed, this.skills);

        // 3. Update Skills & Bullets & Swords
        this.skills.update(dt, this.arena, this.fighters, this.particles, this.audio, effSpeed);

        // 4. Check Win Condition
        this.checkGameEnd();
      }

      // 5. CRITICAL BUG FIX: ALWAYS UPDATE PARTICLES SO NUMBERS & TEXTS DECAY AND DISAPPEAR!
      if (this.particles) {
        this.particles.update(dt, effSpeed);
      }

      // Render
      this.render();
      this.updateVsHud();

    } catch (e) {
      console.error('Safe Game Loop caught exception:', e);
    } finally {
      requestAnimationFrame((t) => this.loop(t));
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr || 1, this.dpr || 1);

    // Clear
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // 1. Arena Background & Pure White Border
    if (this.arena) {
      this.arena.render(ctx);
    }

    // 2. Skills & Projectiles & Planted Holy Swords
    if (this.skills) {
      this.skills.render(ctx);
    }

    // 3. Fighters
    for (const f of this.fighters) {
      f.render(ctx);
    }

    // 4. Particles & Floating Damage Numbers
    if (this.particles) {
      this.particles.render(ctx);
    }

    ctx.restore();
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GameApp();
});