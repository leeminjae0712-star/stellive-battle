/**
 * Main Game Controller
 * Bulletproof, error-resilient 60 FPS continuous loop.
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
    this.fighters = [];
    this.isPlaying = false;
    this.isPaused = false;
    this.speedMultiplier = 1.0;
    this.lastTime = 0;

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.setupEventListeners();
    this.resetFighters();
    this.updateVsHud();

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

  resetFighters() {
    this.fighters = [];
    this.particles.reset();
    this.skills.reset();
    document.getElementById('winner-overlay').classList.add('hidden');
    document.getElementById('ult-cutin-overlay').classList.add('hidden');

    const nanaData = this.allCharacterData.find(c => c.id === 'nana') || this.allCharacterData[0];
    const shibukiData = this.allCharacterData.find(c => c.id === 'shibuki') || this.allCharacterData[1];

    const spawnOffsetX = this.arena.halfSize * 0.5;
    const nana = new Fighter(nanaData, this.arena.cx - spawnOffsetX, this.arena.cy);
    const shibuki = new Fighter(shibukiData, this.arena.cx + spawnOffsetX, this.arena.cy);

    this.fighters.push(nana, shibuki);
    this.updateVsHud();
  }

  updateVsHud() {
    const nana = this.fighters.find(f => f.id === 'nana');
    const shibuki = this.fighters.find(f => f.id === 'shibuki');

    if (nana) {
      const hpPercent = Math.max(0, (nana.hp / nana.maxHp) * 100);
      const hpEl = document.getElementById('hud-hp-nana');
      const hpBar = document.getElementById('hud-hp-bar-nana');
      const heartsEl = document.getElementById('hud-hearts-nana');
      const cardEl = document.getElementById('vs-card-nana');

      if (hpEl) hpEl.textContent = nana.isDead ? '💀 K.O.' : `${nana.hp} / ${nana.maxHp} HP`;
      if (hpBar) hpBar.style.width = `${hpPercent}%`;
      if (cardEl) cardEl.classList.toggle('dead', nana.isDead);

      if (heartsEl) {
        const fullCount = Math.ceil(hpPercent / 20);
        let hStr = '';
        for (let i = 0; i < 5; i++) {
          hStr += i < fullCount ? '❤️' : '🖤';
        }
        heartsEl.innerHTML = hStr;
      }

      const s1Percent = Math.min(100, Math.floor((nana.skill1Timer / nana.skill1MaxCd) * 100));
      const s1Bar = document.getElementById('hud-s1-bar-nana');
      const s1Status = document.getElementById('hud-s1-status-nana');
      if (s1Bar) s1Bar.style.width = `${s1Percent}%`;
      if (s1Status) {
        if (s1Percent >= 100) {
          s1Status.textContent = '🔥 READY!';
          s1Status.className = 'cd-status ready';
        } else {
          const rem = Math.max(0, nana.skill1MaxCd - nana.skill1Timer);
          s1Status.textContent = `${rem.toFixed(1)}s`;
          s1Status.className = 'cd-status';
        }
      }

      const ultPercent = Math.min(100, Math.floor((nana.ultTimer / nana.ultMaxCd) * 100));
      const ultBar = document.getElementById('hud-ult-bar-nana');
      const ultStatus = document.getElementById('hud-ult-status-nana');
      if (ultBar) ultBar.style.width = `${ultPercent}%`;
      if (ultStatus) {
        if (ultPercent >= 100) {
          ultStatus.textContent = '🌟 READY!';
          ultStatus.className = 'cd-status ready-gold';
        } else {
          ultStatus.textContent = `${ultPercent}%`;
          ultStatus.className = 'cd-status';
        }
      }
    }

    if (shibuki) {
      const hpPercent = Math.max(0, (shibuki.hp / shibuki.maxHp) * 100);
      const hpEl = document.getElementById('hud-hp-shibuki');
      const hpBar = document.getElementById('hud-hp-bar-shibuki');
      const heartsEl = document.getElementById('hud-hearts-shibuki');
      const cardEl = document.getElementById('vs-card-shibuki');

      if (hpEl) hpEl.textContent = shibuki.isDead ? '💀 K.O.' : `${shibuki.hp} / ${shibuki.maxHp} HP`;
      if (hpBar) hpBar.style.width = `${hpPercent}%`;
      if (cardEl) cardEl.classList.toggle('dead', shibuki.isDead);

      if (heartsEl) {
        const fullCount = Math.ceil(hpPercent / 20);
        let hStr = '';
        for (let i = 0; i < 5; i++) {
          hStr += i < fullCount ? '❤️' : '🖤';
        }
        heartsEl.innerHTML = hStr;
      }

      const s1Percent = Math.min(100, Math.floor((shibuki.skill1Timer / shibuki.skill1MaxCd) * 100));
      const s1Bar = document.getElementById('hud-s1-bar-shibuki');
      const s1Status = document.getElementById('hud-s1-status-shibuki');
      if (s1Bar) s1Bar.style.width = `${s1Percent}%`;
      if (s1Status) {
        if (s1Percent >= 100) {
          s1Status.textContent = '🔥 READY!';
          s1Status.className = 'cd-status ready';
        } else {
          const rem = Math.max(0, shibuki.skill1MaxCd - shibuki.skill1Timer);
          s1Status.textContent = `${rem.toFixed(1)}s`;
          s1Status.className = 'cd-status';
        }
      }

      const ultPercent = Math.min(100, Math.floor((shibuki.ultTimer / shibuki.ultMaxCd) * 100));
      const ultBar = document.getElementById('hud-ult-bar-shibuki');
      const ultStatus = document.getElementById('hud-ult-status-shibuki');
      if (ultBar) ultBar.style.width = `${ultPercent}%`;
      if (ultStatus) {
        if (ultPercent >= 100) {
          ultStatus.textContent = '🌟 READY!';
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

      if (this.isPlaying && !this.isPaused) {
        const effSpeed = this.speedMultiplier;

        // 1. Update Fighters
        for (const f of this.fighters) {
          f.update(dt, this.arena, this.fighters, this.skills, this.audio, this.particles, effSpeed);
        }

        // 2. Physics (Continuous unsticking bounce)
        this.physics.update(dt, this.fighters, this.arena, this.audio, this.particles, effSpeed);

        // 3. Update Skills & Bullets
        this.skills.update(dt, this.arena, this.fighters, this.particles, this.audio, effSpeed);

        // 4. Check Win Condition
        this.checkGameEnd();
      }

      // Update 50:50 VS HUD
      this.updateVsHud();

      // Update Particles
      this.particles.update(dt, this.speedMultiplier);

      // Render Canvas
      this.render();
    } catch (e) {
      console.error('Simulation loop exception handled:', e);
    }

    // Always continue loop
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

    // 1. Arena
    this.arena.render(this.ctx);

    // 2. Skills & Projectiles
    this.skills.render(this.ctx);

    // 3. Fighters
    for (const f of this.fighters) {
      f.render(this.ctx);
    }

    // 4. Particles & Damage Numbers
    this.particles.render(this.ctx);
  }
}

// Start Game
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GameApp();
});
