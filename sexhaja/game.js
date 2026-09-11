// ============================================================
// 효종의 포터 드라이브 - [빌리지 고가의 질주] Edition
// Full KartRider-style Village Overpass Track & Drift System
// ============================================================

(() => {
    'use strict';

    // --- Audio Engine (Web Audio API Synthesizer) ---
    class SoundFX {
        constructor() {
            this.ctx = null;
            this.muted = false;
            this.engineOsc = null;
            this.engineGain = null;
            this.driftSource = null;
            this.driftGain = null;
            this.isDrifting = false;
        }

        init() {
            if (this.ctx) return;
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            this.ctx = new AudioCtx();

            try {
                // Engine Sound
                this.engineOsc = this.ctx.createOscillator();
                this.engineGain = this.ctx.createGain();
                this.engineOsc.type = 'sawtooth';
                this.engineOsc.frequency.setValueAtTime(42, this.ctx.currentTime);

                this.engineFilter = this.ctx.createBiquadFilter();
                this.engineFilter.type = 'lowpass';
                this.engineFilter.frequency.setValueAtTime(160, this.ctx.currentTime);

                this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

                this.engineOsc.connect(this.engineFilter);
                this.engineFilter.connect(this.engineGain);
                this.engineGain.connect(this.ctx.destination);
                this.engineOsc.start();

                // Drift Screech Sound (Looping Filtered White Noise)
                const bufferSize = this.ctx.sampleRate * 2;
                const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const output = noiseBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = Math.random() * 2 - 1;
                }

                this.driftSource = this.ctx.createBufferSource();
                this.driftSource.buffer = noiseBuffer;
                this.driftSource.loop = true;

                this.driftFilter = this.ctx.createBiquadFilter();
                this.driftFilter.type = 'bandpass';
                this.driftFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
                this.driftFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

                this.driftGain = this.ctx.createGain();
                this.driftGain.gain.setValueAtTime(0, this.ctx.currentTime);

                this.driftSource.connect(this.driftFilter);
                this.driftFilter.connect(this.driftGain);
                this.driftGain.connect(this.ctx.destination);
                this.driftSource.start();
            } catch (e) {
                console.warn('Audio init error:', e);
            }
        }

        setEngineSpeed(ratio, isBoost) {
            if (!this.ctx || this.muted || !this.engineOsc) return;
            try {
                const baseFreq = isBoost ? 90 + ratio * 80 : 38 + ratio * 65;
                const gain = ratio > 0.05 ? 0.07 + ratio * 0.06 : 0.02;
                this.engineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.05);
                this.engineGain.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.05);
            } catch (e) {}
        }

        startDrift() {
            if (!this.ctx || this.muted || !this.driftGain || this.isDrifting) return;
            this.isDrifting = true;
            try {
                this.driftGain.gain.setTargetAtTime(0.18, this.ctx.currentTime, 0.04);
            } catch (e) {}
        }

        stopDrift() {
            if (!this.ctx || !this.driftGain || !this.isDrifting) return;
            this.isDrifting = false;
            try {
                this.driftGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.06);
            } catch (e) {}
        }

        playInstantBoost() {
            if (!this.ctx || this.muted) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(350, now);
                osc.frequency.exponentialRampToValueAtTime(850, now + 0.18);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.22);
            } catch (e) {}
        }

        playBooster() {
            if (!this.ctx || this.muted) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(550, now + 0.4);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.05, now + 1.2);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 1.2);
            } catch (e) {}
        }

        playJump() {
            if (!this.ctx || this.muted) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(280, now);
                osc.frequency.exponentialRampToValueAtTime(700, now + 0.25);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            } catch (e) {}
        }

        playCollect() {
            if (!this.ctx || this.muted) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, now); // D5
                osc.frequency.setValueAtTime(880, now + 0.08); // A5
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            } catch (e) {}
        }

        playCrash() {
            if (!this.ctx || this.muted) return;
            try {
                const now = this.ctx.currentTime;
                const bufferSize = this.ctx.sampleRate * 0.35;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(600, now);
                filter.frequency.linearRampToValueAtTime(70, now + 0.3);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);
                noise.start(now);
                noise.stop(now + 0.3);
            } catch (e) {}
        }

        playLapFanfare() {
            if (!this.ctx || this.muted) return;
            try {
                const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
                notes.forEach((freq, idx) => {
                    const now = this.ctx.currentTime + idx * 0.1;
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now);
                    gain.gain.setValueAtTime(0.22, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.28);
                });
            } catch (e) {}
        }

        stopEngine() {
            if (!this.ctx || !this.engineGain) return;
            this.stopDrift();
            try {
                this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
            } catch (e) {}
        }

        toggleMute() {
            this.muted = !this.muted;
            if (this.muted) this.stopEngine();
            return !this.muted;
        }
    }

    const sound = new SoundFX();

    // --- Canvas & DOM ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    const hud = document.getElementById('hud');
    const gameoverScreen = document.getElementById('gameover-screen');
    const restartBtn = document.getElementById('restart-btn');
    const finishBadge = document.getElementById('finish-badge');
    const finishTitle = document.getElementById('finish-title');
    const finishDesc = document.getElementById('finish-desc');
    const finalTimeEl = document.getElementById('final-time');
    const finalScoreEl = document.getElementById('final-score');
    const highScoreEl = document.getElementById('high-score');
    const scoreEl = document.getElementById('score');
    const comboEl = document.getElementById('combo');
    const comboContainer = document.getElementById('combo-container');
    const speedEl = document.getElementById('speed');
    const speedBar = document.getElementById('speed-bar');
    const distanceEl = document.getElementById('distance');
    const livesEl = document.getElementById('lives');
    const lapDisplay = document.getElementById('lap-display');
    const boosterGaugeFill = document.getElementById('booster-gauge-fill');
    const boosterCountText = document.getElementById('booster-count-text');
    const boosterSlot1 = document.getElementById('booster-slot-1');
    const boosterSlot2 = document.getElementById('booster-slot-2');
    const notification = document.getElementById('notification');
    const soundBtn = document.getElementById('sound-btn');
    const touchControls = document.getElementById('touch-controls');

    let width = 0;
    let height = 0;
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (isTouch) {
        touchControls.classList.remove('hidden');
    }

    // --- Pseudo-3D Constants & Road Parameters ---
    const ROAD_WIDTH = 2000;
    const SEGMENT_LENGTH = 200;
    const RUMBLE_LENGTH = 3;
    const FOV = 82;
    const CAMERA_HEIGHT = 1000;
    const CAMERA_DEPTH = 1 / Math.tan((FOV / 2) * Math.PI / 180);
    const DRAW_DISTANCE = 220;

    // Rebalanced Speed & Physics (Comfortable & Controllable!)
    const MAX_CRUISE_SPEED = 0.62;   // Normal max speed (~130 km/h)
    const MAX_BOOST_SPEED = 1.0;     // Booster max speed (~210 km/h)
    const DISPLAY_KMH_FACTOR = 210;
    const BASE_ACCEL = 0.0038;       // Smooth, non-abrupt acceleration
    const DECEL = 0.0022;
    const BRAKE = 0.012;
    const OFFROAD_DECEL = 0.035;
    const LATERAL_STEER_SPEED = 0.032;
    const CENTRIFUGAL_FORCE = 0.24;

    const TOTAL_LAPS = 2;

    // Track Colors
    const COLORS = {
        skyGradDay: ['#0f2b48', '#1e5f8a', '#60a5fa'],
        skyGradOverpass: ['#0c1b33', '#1e3a5f', '#38bdf8'],
        roadVillage: '#333b48',
        roadOverpass: '#252e3d',
        grassVillageLight: '#15803d',
        grassVillageDark: '#166534',
        rumbleVillageRed: '#dc2626',
        rumbleVillageWhite: '#ffffff',
        laneLine: 'rgba(255, 255, 255, 0.45)',
    };

    // --- Game State ---
    let state = {
        running: false,
        position: 0,
        speed: 0,
        playerX: 0,
        playerY: 0,
        jumpVy: 0,
        isJumping: false,

        // Laps & Time
        currentLap: 1,
        lapStartTime: 0,
        totalRaceTime: 0,
        lapCrossed: false,

        // Score & Lives
        score: 0,
        collectedBoxes: 0,
        combo: 1,
        comboTimer: 0,
        lives: 3,
        distance: 0,
        highScore: parseInt(localStorage.getItem('porterVillageHighScore') || '0', 10),

        // Drift & Boost System
        isDrifting: false,
        driftDir: 0,             // -1: left, 1: right
        driftDuration: 0,
        driftAngle: 0,           // Visual body roll / slide angle
        boosterGauge: 0,         // 0 to 100
        boostersCount: 0,        // 0 to 2
        boostingTimer: 0,        // frames remaining for N2O booster
        instantBoostTimer: 0,    // frames for mini-boost after drift

        screenShake: 0,
        invincible: 0,
        particles: [],
        skidMarks: [],
        segments: [],
        trackLength: 0,
    };

    // --- Controls Input ---
    const keys = {
        left: false,
        right: false,
        up: false,
        down: false,
        drift: false,
        boost: false,
    };

    function handleKey(code, isDown) {
        if (code === 'ArrowLeft' || code === 'KeyA') keys.left = isDown;
        if (code === 'ArrowRight' || code === 'KeyD') keys.right = isDown;
        if (code === 'ArrowUp' || code === 'KeyW') keys.up = isDown;
        if (code === 'ArrowDown' || code === 'KeyS') keys.down = isDown;
        if (code === 'ShiftLeft' || code === 'ShiftRight') keys.drift = isDown;
        if (code === 'ControlLeft' || code === 'ControlRight' || code === 'Space') {
            keys.boost = isDown;
            if (isDown && state.running) {
                activateBooster();
            }
        }
    }

    window.addEventListener('keydown', e => {
        handleKey(e.code, true);
        if (e.code === 'Enter') {
            if (!startScreen.classList.contains('hidden') || !gameoverScreen.classList.contains('hidden')) {
                startGame();
            }
        }
    });

    window.addEventListener('keyup', e => {
        handleKey(e.code, false);
    });

    // Touch Buttons
    function bindTouchBtn(id, keyProp, callback) {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('touchstart', e => {
            keys[keyProp] = true;
            if (callback) callback();
            e.preventDefault();
        }, { passive: false });
        btn.addEventListener('touchend', e => {
            keys[keyProp] = false;
            e.preventDefault();
        }, { passive: false });
        btn.addEventListener('mousedown', e => {
            keys[keyProp] = true;
            if (callback) callback();
        });
        btn.addEventListener('mouseup', e => { keys[keyProp] = false; });
        btn.addEventListener('mouseleave', e => { keys[keyProp] = false; });
    }

    bindTouchBtn('touch-left', 'left');
    bindTouchBtn('touch-right', 'right');
    bindTouchBtn('touch-gas', 'up');
    bindTouchBtn('touch-brake', 'down');
    bindTouchBtn('touch-drift', 'drift');
    bindTouchBtn('touch-booster', 'boost', () => { activateBooster(); });

    soundBtn.addEventListener('click', () => {
        sound.init();
        const active = sound.toggleMute();
        soundBtn.textContent = active ? '🔊' : '🔇';
    });

    function activateBooster() {
        if (state.boostersCount > 0 && state.boostingTimer <= 0) {
            state.boostersCount--;
            state.boostingTimer = 160; // ~2.7 seconds
            state.speed = MAX_BOOST_SPEED;
            sound.playBooster();
            showNotification('🚀 부스터 ON!');
            updateBoosterUI();
        }
    }

    // --- Build "빌리지 고가의 질주" Track ---
    function buildVillageOverpassTrack() {
        state.segments = [];

        function addSegment(curve, y, isOverpass) {
            const n = state.segments.length;
            const isAlt = Math.floor(n / RUMBLE_LENGTH) % 2 === 0;

            state.segments.push({
                index: n,
                p1: { world: { z: n * SEGMENT_LENGTH, y: y }, camera: {}, screen: {} },
                p2: { world: { z: (n + 1) * SEGMENT_LENGTH, y: y }, camera: {}, screen: {} },
                curve: curve,
                isOverpass: isOverpass,
                sprites: [],
                color: {
                    road: isOverpass ? (isAlt ? '#2d3748' : '#222936') : (isAlt ? COLORS.roadVillage : '#2a323d'),
                    grass: isOverpass ? (isAlt ? '#1e293b' : '#0f172a') : (isAlt ? COLORS.grassVillageLight : COLORS.grassVillageDark),
                    rumble: isAlt ? COLORS.rumbleVillageWhite : (isOverpass ? '#f59e0b' : COLORS.rumbleVillageRed),
                    lane: isAlt ? COLORS.laneLine : null,
                }
            });
        }

        function addRoad(enter, hold, leave, curve, y, isOverpass) {
            const startY = state.segments.length > 0 ? state.segments[state.segments.length - 1].p1.world.y : 0;
            const endY = startY + y * SEGMENT_LENGTH;
            const total = enter + hold + leave;

            for (let i = 0; i < enter; i++) {
                const t = i / enter;
                const easeCurve = curve * (t * t * (3 - 2 * t));
                const segY = startY + (endY - startY) * (i / total);
                addSegment(easeCurve, segY, isOverpass);
            }
            for (let i = 0; i < hold; i++) {
                const segY = startY + (endY - startY) * ((enter + i) / total);
                addSegment(curve, segY, isOverpass);
            }
            for (let i = 0; i < leave; i++) {
                const t = 1 - (i / leave);
                const easeCurve = curve * (t * t * (3 - 2 * t));
                const segY = startY + (endY - startY) * ((enter + hold + i) / total);
                addSegment(easeCurve, segY, isOverpass);
            }
        }

        // ==========================================
        // TRACK ARCHITECTURE: 빌리지 고가의 질주 (1800 Segments)
        // ==========================================
        // 1. Village Plaza & Start Straight (0 ~ 140)
        addRoad(30, 80, 30, 0, 0, false);

        // 2. Clock Tower Right Curve (140 ~ 280)
        addRoad(30, 80, 30, 2.8, 0, false);

        // 3. Overpass Ramp Ascent (280 ~ 460) -> Elevation climbs to +55
        addRoad(40, 100, 40, 2.2, 55, true);

        // 4. Elevated Highway Long Straight (460 ~ 780) -> Bridge High Pass
        addRoad(40, 80, 40, 0, 0, true);
        addRoad(30, 60, 30, 1.2, 0, true); // gentle bend
        addRoad(30, 50, 30, 0, 0, true);

        // 5. Iconic Overpass Hairpins (780 ~ 1060) -> Drift Paradise!
        addRoad(30, 60, 30, 5.8, 0, true);  // Sharp 90-degree Right
        addRoad(20, 20, 20, 0, 0, true);    // Transition straight
        addRoad(40, 70, 40, -6.5, 0, true); // Massive 180-degree U-turn Left

        // 6. Overpass Section 2 & Downhill Drop (1060 ~ 1280) -> Descent back to 0
        addRoad(30, 50, 30, 0, 0, true);
        addRoad(30, 80, 30, -1.8, -55, false); // Steep exciting drop!

        // 7. Village Downtown S-Curves (1280 ~ 1560)
        addRoad(30, 60, 30, -4.2, 0, false); // Left alley
        addRoad(20, 20, 20, 0, 0, false);
        addRoad(30, 60, 30, 4.2, 0, false);  // Right alley

        // 8. Village Final Straight to Checkered Finish Line (1560 ~ 1800)
        addRoad(40, 160, 40, 0, 0, false);

        state.trackLength = state.segments.length * SEGMENT_LENGTH;

        // Populate Authentic Track Features & Sprites
        for (let i = 0; i < state.segments.length; i++) {
            const seg = state.segments[i];

            // 1. Finish Line Overhead Checkered Arch (Segment 0 and Segment 1780)
            if (i === 5 || i === 1780) {
                seg.sprites.push({
                    type: 'finish_arch',
                    offset: 0,
                    worldW: 2400,
                    worldH: 600,
                });
            }

            // 2. Clock Tower at First Right Turn
            if (i === 170) {
                seg.sprites.push({
                    type: 'clock_tower',
                    offset: 1.8,
                    worldW: 360,
                    worldH: 700,
                });
            }

            // 3. Jump Ramp (점프대) on High Overpass Straight!
            if (i === 580) {
                seg.sprites.push({
                    type: 'jump_ramp',
                    offset: 0,
                    worldW: 1400,
                    worldH: 160,
                });
            }

            // 4. Overpass Guardrails & Neon Hazard Direction Arrows on Hairpins
            if (seg.isOverpass) {
                if (i % 6 === 0) {
                    seg.sprites.push({ type: 'guardrail', offset: -1.25, worldW: 60, worldH: 140 });
                    seg.sprites.push({ type: 'guardrail', offset: 1.25, worldW: 60, worldH: 140 });
                }
                if (i % 14 === 0) {
                    seg.sprites.push({ type: 'highway_pole', offset: -1.35, worldW: 80, worldH: 380 });
                    seg.sprites.push({ type: 'highway_pole', offset: 1.35, worldW: 80, worldH: 380 });
                }
                // Hairpin outer curve neon warning arrows
                if (i >= 800 && i <= 860 && i % 10 === 0) {
                    seg.sprites.push({ type: 'arrow_sign_right', offset: 1.3, worldW: 200, worldH: 220 });
                }
                if (i >= 900 && i <= 990 && i % 10 === 0) {
                    seg.sprites.push({ type: 'arrow_sign_left', offset: -1.3, worldW: 200, worldH: 220 });
                }
            } else {
                // Village ground: houses, trees, streetlamps
                if (i % 8 === 0) {
                    const houseType = (i % 16 === 0) ? 'village_house_red' : 'village_house_blue';
                    seg.sprites.push({ type: houseType, offset: -1.8, worldW: 380, worldH: 420 });
                    seg.sprites.push({ type: 'tree', offset: 1.6, worldW: 240, worldH: 360 });
                }
                if (i % 12 === 0) {
                    seg.sprites.push({ type: 'village_pole', offset: 1.3, worldW: 70, worldH: 360 });
                }
            }

            // 5. Delivery Boxes (📦) to Collect
            if (i > 30 && i < 1750 && i % 14 === 0 && Math.random() < 0.7) {
                const lanes = [-0.55, 0, 0.55];
                const lane = lanes[Math.floor(Math.random() * lanes.length)];
                seg.sprites.push({
                    type: 'box',
                    offset: lane,
                    worldW: 150,
                    worldH: 150,
                    collected: false,
                    phase: Math.random() * Math.PI * 2,
                });
            }

            // 6. Obstacles (Traffic cones, cars, barriers)
            if (i > 50 && i < 1740 && i % 22 === 0 && i !== 580 && Math.random() < 0.55) {
                const lanes = [-0.55, 0, 0.55];
                const lane = lanes[Math.floor(Math.random() * lanes.length)];
                const r = Math.random();
                const obsType = r < 0.4 ? 'cone' : (r < 0.7 ? 'car' : 'barrier');
                seg.sprites.push({
                    type: obsType,
                    offset: lane,
                    worldW: obsType === 'cone' ? 90 : (obsType === 'barrier' ? 240 : 250),
                    worldH: obsType === 'cone' ? 120 : (obsType === 'barrier' ? 120 : 170),
                    hit: false,
                });
            }
        }
    }

    function findSegment(z) {
        return state.segments[Math.floor(z / SEGMENT_LENGTH) % state.segments.length];
    }

    function project(p, cameraX, cameraY, cameraZ, cameraDepth) {
        p.camera.x = (p.world.x || 0) - cameraX;
        p.camera.y = (p.world.y || 0) - cameraY;
        p.camera.z = (p.world.z || 0) - cameraZ;

        if (p.camera.z <= 0) {
            p.screen.scale = 0;
            return;
        }

        p.screen.scale = cameraDepth / p.camera.z;
        p.screen.x = Math.round((width / 2) + (p.screen.scale * p.camera.x * width / 2));
        p.screen.y = Math.round((height / 2) - (p.screen.scale * p.camera.y * height / 2));
        p.screen.w = Math.round(p.screen.scale * ROAD_WIDTH * width / 2);
    }

    // --- Drawing Modules ---
    function drawSkyAndMountains(isOverpass) {
        const horizonY = height * 0.48;

        // Gradient Sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        if (isOverpass) {
            skyGrad.addColorStop(0, '#0c1b33');
            skyGrad.addColorStop(0.5, '#1e3a5f');
            skyGrad.addColorStop(1, '#38bdf8');
        } else {
            skyGrad.addColorStop(0, '#0f2b48');
            skyGrad.addColorStop(0.5, '#1e5f8a');
            skyGrad.addColorStop(1, '#60a5fa');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY);

        // Distant City Skyline & Mountains Parallax
        const scrollX = (state.position * 0.0003) % width;

        // 1. Distant Mountain Peaks
        ctx.fillStyle = '#172554';
        ctx.beginPath();
        ctx.moveTo(0, horizonY + 10);
        for (let x = 0; x <= width; x += 20) {
            const nx = (x + scrollX * 40) * 0.0025;
            const h = Math.sin(nx) * 60 + Math.cos(nx * 2.2) * 35 + 50;
            ctx.lineTo(x, horizonY - h);
        }
        ctx.lineTo(width, horizonY + 10);
        ctx.closePath();
        ctx.fill();

        // 2. Village / City Skyline Silhouettes
        ctx.fillStyle = isOverpass ? '#0f172a' : '#1e3a8a';
        for (let bx = 0; bx < width + 100; bx += 55) {
            const seed = Math.sin((bx + scrollX * 80) * 0.02) * 0.5 + 0.5;
            const bH = 25 + seed * 50;
            const bW = 35 + seed * 15;
            ctx.fillRect(bx, horizonY - bH, bW, bH + 10);
            // Window lights
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(bx + 6, horizonY - bH + 8, 4, 4);
            ctx.fillRect(bx + 18, horizonY - bH + 16, 4, 4);
            ctx.fillStyle = isOverpass ? '#0f172a' : '#1e3a8a';
        }

        // Base Grass / Ground Background
        ctx.fillStyle = isOverpass ? '#0a0f1d' : COLORS.grassVillageDark;
        ctx.fillRect(0, horizonY, width, height - horizonY);
    }

    function drawPolygon(x1, y1, x2, y2, x3, y3, x4, y4, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.fill();
    }

    function drawSegment(p1, p2, color, isOverpass) {
        const r1 = p1.screen.w * 1.15;
        const r2 = p2.screen.w * 1.15;
        const yOverlap = 1.2;

        // Ground / Grass / Overpass Abyss
        ctx.fillStyle = color.grass;
        ctx.fillRect(0, p2.screen.y - yOverlap, width, (p1.screen.y - p2.screen.y) + yOverlap * 2);

        // Rumble strips
        drawPolygon(
            p1.screen.x - r1, p1.screen.y + yOverlap,
            p1.screen.x + r1, p1.screen.y + yOverlap,
            p2.screen.x + r2, p2.screen.y - yOverlap,
            p2.screen.x - r2, p2.screen.y - yOverlap,
            color.rumble
        );

        // Asphalt Road
        drawPolygon(
            p1.screen.x - p1.screen.w, p1.screen.y + yOverlap,
            p1.screen.x + p1.screen.w, p1.screen.y + yOverlap,
            p2.screen.x + p2.screen.w, p2.screen.y - yOverlap,
            p2.screen.x - p2.screen.w, p2.screen.y - yOverlap,
            color.road
        );

        // Lane markings
        if (color.lane) {
            const l1 = p1.screen.w * 0.35;
            const l2 = p2.screen.w * 0.35;
            const lw1 = Math.max(2, p1.screen.w * 0.02);
            const lw2 = Math.max(2, p2.screen.w * 0.02);

            drawPolygon(
                p1.screen.x - l1 - lw1, p1.screen.y + yOverlap,
                p1.screen.x - l1 + lw1, p1.screen.y + yOverlap,
                p2.screen.x - l2 + lw2, p2.screen.y - yOverlap,
                p2.screen.x - l2 - lw2, p2.screen.y - yOverlap,
                color.lane
            );
            drawPolygon(
                p1.screen.x + l1 - lw1, p1.screen.y + yOverlap,
                p1.screen.x + l1 + lw1, p1.screen.y + yOverlap,
                p2.screen.x + l2 + lw2, p2.screen.y - yOverlap,
                p2.screen.x + l2 - lw2, p2.screen.y - yOverlap,
                color.lane
            );
        }
    }

    // --- Sprites Drawing Functions ---
    function drawSprite(sprite, p) {
        if (!p || p.screen.scale <= 0) return;

        const roadFullWidth = p.screen.w * 2;
        const rawW = (sprite.worldW / ROAD_WIDTH) * roadFullWidth;
        const maxW = width * 0.85; // Finish arch needs to span across
        const w = Math.min(rawW, maxW);
        const h = w * (sprite.worldH / sprite.worldW);

        const x = p.screen.x + (sprite.offset * p.screen.w);
        const y = p.screen.y;

        ctx.save();
        ctx.translate(x, y);

        switch (sprite.type) {
            case 'finish_arch':
                drawFinishArchSprite(w, h);
                break;
            case 'clock_tower':
                drawClockTowerSprite(w, h);
                break;
            case 'jump_ramp':
                drawJumpRampSprite(w, h);
                break;
            case 'village_house_red':
                drawVillageHouseSprite(w, h, '#dc2626');
                break;
            case 'village_house_blue':
                drawVillageHouseSprite(w, h, '#2563eb');
                break;
            case 'guardrail':
                drawGuardrailSprite(w, h);
                break;
            case 'arrow_sign_right':
                drawArrowSignSprite(w, h, 1);
                break;
            case 'arrow_sign_left':
                drawArrowSignSprite(w, h, -1);
                break;
            case 'highway_pole':
                drawHighwayPoleSprite(w, h);
                break;
            case 'village_pole':
                drawVillagePoleSprite(w, h);
                break;
            case 'tree':
                drawVillageTreeSprite(w, h);
                break;
            case 'box':
                drawDeliveryBoxSprite(w, h, sprite.phase);
                break;
            case 'cone':
                drawTrafficConeSprite(w, h);
                break;
            case 'car':
                drawCarObstacleSprite(w, h);
                break;
            case 'barrier':
                drawBarrierSprite(w, h);
                break;
        }

        ctx.restore();
    }

    // Checkered Finish Gate
    function drawFinishArchSprite(w, h) {
        ctx.translate(0, -h);

        // Pillars
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-w * 0.48, 0, w * 0.08, h);
        ctx.fillRect(w * 0.40, 0, w * 0.08, h);

        // Top Arch Banner
        ctx.fillStyle = '#0284c7';
        roundRectPath(-w * 0.5, 0, w, h * 0.38, 8);
        ctx.fill();

        // Checkered stripe
        const checkW = w * 0.04;
        const checkH = h * 0.1;
        for (let i = -w * 0.48; i < w * 0.48; i += checkW) {
            ctx.fillStyle = (Math.floor(i / checkW) % 2 === 0) ? '#ffffff' : '#0f172a';
            ctx.fillRect(i, h * 0.02, checkW, checkH);
        }

        // Korean KartRider Text
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 8;
        ctx.font = `bold ${Math.max(10, w * 0.045)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏁 VILLAGE HIGHWAY START / FINISH 🏁', 0, h * 0.22);
        ctx.shadowBlur = 0;
    }

    // Iconic Clock Tower
    function drawClockTowerSprite(w, h) {
        ctx.translate(0, -h);

        // Brick tower body
        ctx.fillStyle = '#991b1b';
        roundRectPath(-w * 0.4, h * 0.25, w * 0.8, h * 0.75, 6);
        ctx.fill();

        // Clock face room
        ctx.fillStyle = '#fef08a';
        roundRectPath(-w * 0.45, h * 0.12, w * 0.9, h * 0.18, 4);
        ctx.fill();

        // Big Clock Face
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, h * 0.21, w * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Clock hands
        ctx.beginPath();
        ctx.moveTo(0, h * 0.21);
        ctx.lineTo(w * 0.1, h * 0.18);
        ctx.moveTo(0, h * 0.21);
        ctx.lineTo(0, h * 0.11);
        ctx.stroke();

        // Spire Roof
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w * 0.5, h * 0.12);
        ctx.lineTo(-w * 0.5, h * 0.12);
        ctx.closePath();
        ctx.fill();
    }

    // High Overpass Jump Ramp (점프대)
    function drawJumpRampSprite(w, h) {
        ctx.translate(0, -h);

        // Ramp metal plate
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(1, '#d97706');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;

        roundRectPath(-w * 0.45, 0, w * 0.9, h, 6);
        ctx.fill();
        ctx.stroke();

        // Neon Forward Chevron Arrows
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 12;
        for (let ax = -w * 0.3; ax <= w * 0.3; ax += w * 0.15) {
            ctx.beginPath();
            ctx.moveTo(ax, h * 0.75);
            ctx.lineTo(ax + w * 0.05, h * 0.35);
            ctx.lineTo(ax, h * 0.15);
            ctx.lineTo(ax - w * 0.02, h * 0.15);
            ctx.lineTo(ax + w * 0.03, h * 0.35);
            ctx.lineTo(ax - w * 0.02, h * 0.75);
            ctx.closePath();
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    // Village European House
    function drawVillageHouseSprite(w, h, roofColor) {
        ctx.translate(0, -h);

        // Walls
        ctx.fillStyle = '#fde68a';
        roundRectPath(-w * 0.45, h * 0.35, w * 0.9, h * 0.65, 4);
        ctx.fill();

        // Gable Roof
        ctx.fillStyle = roofColor;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w * 0.5, h * 0.35);
        ctx.lineTo(-w * 0.5, h * 0.35);
        ctx.closePath();
        ctx.fill();

        // Windows
        ctx.fillStyle = '#38bdf8';
        roundRectPath(-w * 0.3, h * 0.45, w * 0.22, h * 0.2, 3);
        ctx.fill();
        roundRectPath(w * 0.08, h * 0.45, w * 0.22, h * 0.2, 3);
        ctx.fill();

        // Door
        ctx.fillStyle = '#78350f';
        roundRectPath(-w * 0.12, h * 0.72, w * 0.24, h * 0.28, 2);
        ctx.fill();
    }

    // Guardrail on Overpass
    function drawGuardrailSprite(w, h) {
        ctx.translate(0, -h);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-w * 0.4, h * 0.3, w * 0.8, h * 0.25);
        ctx.fillRect(-w * 0.3, h * 0.55, w * 0.6, h * 0.45);
        // Yellow reflector
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-w * 0.2, h * 0.35, w * 0.4, h * 0.15);
    }

    // Hazard Curve Arrows (Neon Yellow/Black)
    function drawArrowSignSprite(w, h, dir) {
        ctx.translate(0, -h);

        // Sign board
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        roundRectPath(-w * 0.45, 0, w * 0.9, h * 0.65, 4);
        ctx.fill();
        ctx.stroke();

        // Post
        ctx.fillStyle = '#475569';
        ctx.fillRect(-w * 0.08, h * 0.65, w * 0.16, h * 0.35);

        // Arrow head
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        if (dir > 0) {
            ctx.moveTo(-w * 0.2, h * 0.15);
            ctx.lineTo(w * 0.2, h * 0.32);
            ctx.lineTo(-w * 0.2, h * 0.5);
        } else {
            ctx.moveTo(w * 0.2, h * 0.15);
            ctx.lineTo(-w * 0.2, h * 0.32);
            ctx.lineTo(w * 0.2, h * 0.5);
        }
        ctx.closePath();
        ctx.fill();
    }

    function drawHighwayPoleSprite(w, h) {
        ctx.translate(0, -h);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-w * 0.1, 0, w * 0.2, h);
        // Lamp head
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, h * 0.06, w * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    function drawVillagePoleSprite(w, h) {
        ctx.translate(0, -h);
        ctx.fillStyle = '#334155';
        ctx.fillRect(-w * 0.08, 0, w * 0.16, h);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, h * 0.08, w * 0.28, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawVillageTreeSprite(w, h) {
        ctx.translate(0, -h);
        // Trunk
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-w * 0.1, h * 0.65, w * 0.2, h * 0.35);

        // Fluffy canopy
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(0, h * 0.4, w * 0.42, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(-w * 0.12, h * 0.35, w * 0.32, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawDeliveryBoxSprite(w, h, phase) {
        const bob = Math.sin(Date.now() * 0.008 + phase) * (h * 0.1);
        ctx.translate(0, -h + bob);

        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12;

        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = Math.max(1, w * 0.03);
        roundRectPath(-w / 2, 0, w, h, w * 0.1);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fde047';
        ctx.fillRect(-w * 0.12, 0, w * 0.24, h);
        ctx.fillRect(-w / 2, h * 0.42, w, h * 0.16);

        ctx.fillStyle = '#78350f';
        ctx.font = `bold ${Math.max(8, w * 0.28)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📦', 0, h * 0.25);
    }

    function drawTrafficConeSprite(w, h) {
        ctx.translate(0, -h);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w * 0.4, h * 0.88);
        ctx.lineTo(-w * 0.4, h * 0.88);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-w * 0.15, h * 0.35);
        ctx.lineTo(w * 0.15, h * 0.35);
        ctx.lineTo(w * 0.22, h * 0.52);
        ctx.lineTo(-w * 0.22, h * 0.52);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ea580c';
        roundRectPath(-w * 0.5, h * 0.86, w, h * 0.14, w * 0.05);
        ctx.fill();
    }

    function drawCarObstacleSprite(w, h) {
        ctx.translate(0, -h);
        ctx.fillStyle = '#dc2626';
        roundRectPath(-w * 0.46, h * 0.35, w * 0.92, h * 0.55, w * 0.1);
        ctx.fill();
        ctx.fillStyle = '#b91c1c';
        roundRectPath(-w * 0.36, h * 0.05, w * 0.72, h * 0.45, w * 0.1);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        roundRectPath(-w * 0.3, h * 0.12, w * 0.6, h * 0.28, w * 0.06);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-w * 0.42, h * 0.55, w * 0.18, h * 0.16);
        ctx.fillRect(w * 0.24, h * 0.55, w * 0.18, h * 0.16);
    }

    function drawBarrierSprite(w, h) {
        ctx.translate(0, -h);
        ctx.fillStyle = '#fbbf24';
        roundRectPath(-w / 2, h * 0.2, w, h * 0.5, w * 0.05);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        for (let sx = -w * 0.4; sx < w * 0.4; sx += w * 0.2) {
            ctx.beginPath();
            ctx.moveTo(sx, h * 0.2);
            ctx.lineTo(sx + w * 0.1, h * 0.2);
            ctx.lineTo(sx + w * 0.02, h * 0.7);
            ctx.lineTo(sx - w * 0.08, h * 0.7);
            ctx.closePath();
            ctx.fill();
        }
        ctx.fillStyle = '#334155';
        ctx.fillRect(-w * 0.4, h * 0.65, w * 0.1, h * 0.35);
        ctx.fillRect(w * 0.3, h * 0.65, w * 0.1, h * 0.35);
    }

    function roundRectPath(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // --- Porter Truck with Hyojong & Booster Effects ---
    function drawPlayerTruck(x, y, steerTilt, bounce, isDrifting, isBoosting, jumpHeight) {
        const truckW = Math.min(width * 0.25, 205);
        const truckH = truckW * 1.25;

        ctx.save();
        ctx.translate(x, y + bounce - jumpHeight);

        // Body roll from drift and steering
        ctx.rotate(steerTilt);

        // Shadow on road (scale down if jumping)
        const shadowScale = Math.max(0.4, 1 - jumpHeight / 250);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, (truckH * 0.45) + jumpHeight, truckW * 0.52 * shadowScale, truckH * 0.11 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nitro Booster Exhaust Flames! 🔥
        if (isBoosting || state.instantBoostTimer > 0) {
            drawBoosterFlames(truckW, truckH, isBoosting);
        }

        // 1-Ton Cargo Bed (Back)
        ctx.fillStyle = '#1e3a8a';
        ctx.strokeStyle = '#172554';
        ctx.lineWidth = 2;
        roundRectPath(-truckW * 0.44, -truckH * 0.5, truckW * 0.88, truckH * 0.52, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1e40af';
        ctx.fillRect(-truckW * 0.41, -truckH * 0.47, truckW * 0.82, truckH * 0.46);

        // Loaded Delivery Boxes
        const stackCount = Math.min(6, 2 + Math.floor(state.collectedBoxes / 2));
        drawLoadedCargoBoxes(truckW, truckH, stackCount, bounce, isDrifting);

        // Porter Blue Cabin
        const cabGrad = ctx.createLinearGradient(0, -truckH * 0.1, 0, truckH * 0.4);
        cabGrad.addColorStop(0, '#2563eb');
        cabGrad.addColorStop(0.7, '#1d4ed8');
        cabGrad.addColorStop(1, '#1e3a8a');
        ctx.fillStyle = cabGrad;
        roundRectPath(-truckW * 0.42, 0, truckW * 0.84, truckH * 0.4, 8);
        ctx.fill();
        ctx.stroke();

        // Cabin Back Window
        const winGrad = ctx.createLinearGradient(0, truckH * 0.04, 0, truckH * 0.2);
        winGrad.addColorStop(0, 'rgba(186, 230, 253, 0.95)');
        winGrad.addColorStop(1, 'rgba(56, 189, 248, 0.75)');
        ctx.fillStyle = winGrad;
        roundRectPath(-truckW * 0.32, truckH * 0.04, truckW * 0.64, truckH * 0.18, 6);
        ctx.fill();

        // HYOJONG Driver inside the cabin
        drawHyojongDriver(0, truckH * 0.13, truckW, steerTilt, isDrifting, isBoosting);

        // Taillights
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = isBoosting ? 18 : 8;
        roundRectPath(-truckW * 0.4, truckH * 0.32, truckW * 0.14, truckH * 0.07, 3);
        ctx.fill();
        roundRectPath(truckW * 0.26, truckH * 0.32, truckW * 0.14, truckH * 0.07, 3);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Bumper
        ctx.fillStyle = '#e2e8f0';
        roundRectPath(-truckW * 0.43, truckH * 0.38, truckW * 0.86, truckH * 0.07, 4);
        ctx.fill();

        // License Plate: 82효 1004 (빨리효 천사)
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        roundRectPath(-truckW * 0.18, truckH * 0.37, truckW * 0.36, truckH * 0.08, 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${Math.max(8, truckW * 0.06)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('82효 1004', 0, truckH * 0.41);

        // Tires
        ctx.fillStyle = '#0f172a';
        roundRectPath(-truckW * 0.47, truckH * 0.28, truckW * 0.1, truckH * 0.18, 4);
        ctx.fill();
        roundRectPath(truckW * 0.37, truckH * 0.28, truckW * 0.1, truckH * 0.18, 4);
        ctx.fill();

        ctx.restore();
    }

    function drawBoosterFlames(tw, th, isFullBoost) {
        const flameLen = isFullBoost ? (th * 0.55 + Math.random() * (th * 0.2)) : (th * 0.3);
        const flameW = tw * 0.12;

        const exhaustPipes = [-tw * 0.32, tw * 0.32];
        exhaustPipes.forEach(px => {
            ctx.save();
            ctx.translate(px, th * 0.42);

            // Outer Orange/Red Flame
            ctx.fillStyle = isFullBoost ? '#ef4444' : '#38bdf8';
            ctx.shadowColor = isFullBoost ? '#f97316' : '#0284c7';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(-flameW / 2, 0);
            ctx.lineTo(flameW / 2, 0);
            ctx.lineTo(0, flameLen);
            ctx.closePath();
            ctx.fill();

            // Inner Cyan / Yellow Core
            ctx.fillStyle = isFullBoost ? '#fbbf24' : '#ffffff';
            ctx.beginPath();
            ctx.moveTo(-flameW * 0.25, 0);
            ctx.lineTo(flameW * 0.25, 0);
            ctx.lineTo(0, flameLen * 0.6);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        });
    }

    function drawLoadedCargoBoxes(tw, th, count, bounce, isDrifting) {
        ctx.save();
        const boxW = tw * 0.26;
        const boxH = th * 0.15;
        const driftJitter = isDrifting ? Math.sin(Date.now() * 0.02) * 3 : 0;

        const positions = [
            { x: -tw * 0.26, y: -th * 0.2 },
            { x: tw * 0.02, y: -th * 0.2 },
            { x: -tw * 0.14, y: -th * 0.34 },
            { x: -tw * 0.26, y: -th * 0.46 },
            { x: tw * 0.04, y: -th * 0.46 },
            { x: -tw * 0.12, y: -th * 0.6 },
        ];

        for (let i = 0; i < count && i < positions.length; i++) {
            const p = positions[i];
            const jitter = (i % 2 === 0 ? bounce : -bounce) * 0.5;

            ctx.fillStyle = i % 2 === 0 ? '#b45309' : '#92400e';
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1.5;
            roundRectPath(p.x + driftJitter, p.y + jitter, boxW, boxH, 3);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(p.x + driftJitter + boxW * 0.4, p.y + jitter, boxW * 0.2, boxH);
        }
        ctx.restore();
    }

    function drawHyojongDriver(x, y, tw, steerTilt, isDrifting, isBoosting) {
        ctx.save();
        ctx.translate(x + steerTilt * 12, y);

        // Face
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(0, 0, tw * 0.075, 0, Math.PI * 2);
        ctx.fill();

        // Blue Porter Delivery Cap
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath();
        ctx.arc(0, -tw * 0.02, tw * 0.08, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-tw * 0.08, -tw * 0.02, tw * 0.16, tw * 0.025);

        // Cap Gold Badge
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, -tw * 0.05, tw * 0.02, 0, Math.PI * 2);
        ctx.fill();

        // Eyes & Expressions
        ctx.fillStyle = '#0f172a';
        if (state.invincible > 0) {
            // Hit!
            ctx.font = `bold ${Math.max(8, tw * 0.06)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('x x', 0, tw * 0.015);
        } else if (isBoosting) {
            // Thrilled Star Eyes!
            ctx.fillStyle = '#38bdf8';
            ctx.font = `bold ${Math.max(8, tw * 0.06)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('★ ★', 0, tw * 0.015);
        } else if (isDrifting) {
            // Intense Drift Eyes!
            ctx.beginPath();
            ctx.arc(-tw * 0.03, 0, tw * 0.015, 0, Math.PI * 2);
            ctx.arc(tw * 0.03, 0, tw * 0.015, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Cheerful Normal Eyes
            ctx.beginPath();
            ctx.arc(-tw * 0.03, 0, tw * 0.012, 0, Math.PI * 2);
            ctx.arc(tw * 0.03, 0, tw * 0.012, 0, Math.PI * 2);
            ctx.fill();
        }

        // Rosy Cheeks
        ctx.fillStyle = 'rgba(248, 113, 113, 0.6)';
        ctx.beginPath();
        ctx.arc(-tw * 0.045, tw * 0.02, tw * 0.015, 0, Math.PI * 2);
        ctx.arc(tw * 0.045, tw * 0.02, tw * 0.015, 0, Math.PI * 2);
        ctx.fill();

        // Big Smile
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, tw * 0.02, tw * 0.025, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        ctx.restore();
    }

    // --- Particles & Skid Marks ---
    function addParticle(x, y, color, size, vx, vy, isSpark = false) {
        state.particles.push({
            x, y, color, size, vx, vy, isSpark,
            life: 1,
            decay: isSpark ? 0.04 : 0.025,
        });
    }

    function updateAndDrawParticles() {
        for (let i = state.particles.length - 1; i >= 0; i--) {
            const p = state.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            if (p.life <= 0) {
                state.particles.splice(i, 1);
                continue;
            }

            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function drawSkidMarks() {
        if (state.skidMarks.length === 0) return;
        ctx.fillStyle = 'rgba(20, 20, 25, 0.22)';
        for (let i = state.skidMarks.length - 1; i >= 0; i--) {
            const sm = state.skidMarks[i];
            sm.alpha -= 0.015;
            if (sm.alpha <= 0) {
                state.skidMarks.splice(i, 1);
                continue;
            }
            ctx.globalAlpha = sm.alpha;
            ctx.fillRect(sm.x - 14, sm.y, 8, 18);
            ctx.fillRect(sm.x + 10, sm.y, 8, 18);
        }
        ctx.globalAlpha = 1;
    }

    function drawSpeedLines() {
        const threshold = state.boostingTimer > 0 ? 0.4 : 0.58;
        if (state.speed < threshold) return;

        const count = Math.floor((state.speed - threshold) * 45) + (state.boostingTimer > 0 ? 25 : 0);
        ctx.strokeStyle = state.boostingTimer > 0 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2;

        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const len = 40 + state.speed * 90;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (x - width / 2) * 0.25, y + len);
            ctx.stroke();
        }
    }

    let notifTimeout = null;
    function showNotification(text) {
        notification.textContent = text;
        notification.classList.remove('hidden');
        notification.style.animation = 'none';
        notification.offsetHeight;
        notification.style.animation = 'notifPop 0.8s ease-out forwards';
        clearTimeout(notifTimeout);
        notifTimeout = setTimeout(() => notification.classList.add('hidden'), 800);
    }

    function updateBoosterUI() {
        boosterCountText.textContent = `부스터 ${state.boostersCount}개`;
        boosterGaugeFill.style.width = `${Math.min(100, Math.round(state.boosterGauge))}%`;

        if (state.boostersCount >= 1) boosterSlot1.classList.add('active');
        else boosterSlot1.classList.remove('active');

        if (state.boostersCount >= 2) boosterSlot2.classList.add('active');
        else boosterSlot2.classList.remove('active');
    }

    function updateLivesDisplay() {
        livesEl.textContent = '❤️'.repeat(Math.max(0, state.lives)) +
                              '🖤'.repeat(Math.max(0, 3 - state.lives));
    }

    // --- Collision & Collectibles Detection ---
    function checkCollisions(playerSeg) {
        const checkRange = 3;

        for (let n = 0; n < checkRange; n++) {
            const seg = state.segments[(playerSeg.index + n) % state.segments.length];

            // Jump Ramp interaction!
            if (seg.index === 580 && !state.isJumping) {
                state.isJumping = true;
                state.jumpVy = 26; // launch upward
                sound.playJump();
                showNotification('🚀 점프대 발사!!');
                // Launch particles
                for (let k = 0; k < 20; k++) {
                    addParticle(width / 2, height * 0.8, '#f59e0b', 5, (Math.random() - 0.5) * 8, Math.random() * 4 + 2);
                }
            }

            for (const sprite of seg.sprites) {
                // Collect Delivery Boxes
                if (sprite.type === 'box' && !sprite.collected) {
                    if (Math.abs(state.playerX - sprite.offset) < 0.35) {
                        sprite.collected = true;
                        state.collectedBoxes++;

                        const points = 100 * state.combo;
                        state.score += points;
                        state.combo++;
                        state.comboTimer = 180;

                        // Give booster gauge bonus!
                        state.boosterGauge += 20;
                        if (state.boosterGauge >= 100) {
                            state.boosterGauge = 0;
                            if (state.boostersCount < 2) state.boostersCount++;
                            showNotification('🔥 부스터 획득!');
                        }
                        updateBoosterUI();

                        sound.playCollect();
                        showNotification(`📦 +${points}점!`);

                        for (let k = 0; k < 16; k++) {
                            addParticle(
                                width / 2 + state.playerX * (width * 0.35),
                                height * 0.78,
                                ['#fbbf24', '#f59e0b', '#38bdf8', '#ffffff'][k % 4],
                                4 + Math.random() * 4,
                                (Math.random() - 0.5) * 8,
                                (Math.random() - 0.7) * 7
                            );
                        }
                    }
                }

                // Obstacle Hit
                if (['cone', 'car', 'barrier'].includes(sprite.type) && !sprite.hit && !state.isJumping) {
                    const hitWidth = sprite.type === 'cone' ? 0.22 : 0.36;
                    if (Math.abs(state.playerX - sprite.offset) < hitWidth) {
                        if (state.invincible <= 0) {
                            sprite.hit = true;
                            state.lives--;
                            state.screenShake = 18;
                            state.invincible = 120;
                            state.combo = 1;
                            state.speed *= 0.35; // gentle deceleration
                            sound.stopDrift();
                            state.isDrifting = false;

                            sound.playCrash();
                            showNotification('💥 쿵! 안전운전!');
                            updateLivesDisplay();

                            for (let k = 0; k < 24; k++) {
                                addParticle(
                                    width / 2 + state.playerX * (width * 0.35),
                                    height * 0.8,
                                    ['#ef4444', '#f97316', '#64748b', '#ffffff'][k % 4],
                                    5 + Math.random() * 5,
                                    (Math.random() - 0.5) * 10,
                                    (Math.random() - 0.6) * 8
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    // --- Main Render Function ---
    function render() {
        ctx.clearRect(0, 0, width, height);

        if (state.screenShake > 0) {
            ctx.save();
            const sx = (Math.random() - 0.5) * state.screenShake;
            const sy = (Math.random() - 0.5) * state.screenShake;
            ctx.translate(sx, sy);
            state.screenShake *= 0.88;
            if (state.screenShake < 0.5) state.screenShake = 0;
        }

        const baseSegment = findSegment(state.position);
        const basePercent = (state.position % SEGMENT_LENGTH) / SEGMENT_LENGTH;
        const playerSegment = findSegment(state.position + SEGMENT_LENGTH * 2);

        // Sky and parallax
        drawSkyAndMountains(baseSegment.isOverpass);

        // 3D Road Projection
        let dx = -(baseSegment.curve * basePercent);
        let x = 0;

        const cameraX = state.playerX * ROAD_WIDTH;
        const cameraY = CAMERA_HEIGHT + baseSegment.p1.world.y;
        const cameraZ = state.position;

        const segmentsToDraw = [];
        for (let n = 0; n < DRAW_DISTANCE; n++) {
            const seg = state.segments[(baseSegment.index + n) % state.segments.length];
            const looped = seg.index < baseSegment.index;

            seg.p1.world.z = (looped ? state.trackLength : 0) + (seg.index * SEGMENT_LENGTH);
            seg.p2.world.z = (looped ? state.trackLength : 0) + ((seg.index + 1) * SEGMENT_LENGTH);

            seg.p1.world.x = x;
            seg.p2.world.x = x + dx;
            x += dx;
            dx += seg.curve;

            project(seg.p1, cameraX, cameraY, cameraZ, CAMERA_DEPTH);
            project(seg.p2, cameraX, cameraY, cameraZ, CAMERA_DEPTH);

            if (seg.p1.camera.z <= 0 || seg.p2.screen.y >= seg.p1.screen.y) {
                continue;
            }

            segmentsToDraw.push(seg);
        }

        // Back-to-front rendering
        for (let i = segmentsToDraw.length - 1; i >= 0; i--) {
            const seg = segmentsToDraw[i];
            drawSegment(seg.p1, seg.p2, seg.color, seg.isOverpass);

            for (const sprite of seg.sprites) {
                if (sprite.collected) continue;
                drawSprite(sprite, seg.p1);
            }
        }

        // Skid marks on road
        drawSkidMarks();

        // Speed lines
        drawSpeedLines();

        // Player Porter Truck
        const playerScreenX = width / 2;
        const playerScreenY = height * 0.84;
        const bounce = (Math.sin(state.position * 0.05) * 2) * state.speed;

        // Visual tilt combining steering and drift angle
        let totalTilt = state.driftAngle * 0.8;
        if (!state.isDrifting) {
            if (keys.left) totalTilt = -0.15;
            if (keys.right) totalTilt = 0.15;
        }

        if (state.invincible > 0 && Math.floor(state.invincible / 4) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        drawPlayerTruck(
            playerScreenX, playerScreenY,
            totalTilt, bounce,
            state.isDrifting,
            state.boostingTimer > 0,
            state.playerY
        );
        ctx.globalAlpha = 1;

        // Exhaust smoke or drift tire smoke
        if (state.isDrifting) {
            const driftDirX = state.driftDir * 28;
            addParticle(playerScreenX + driftDirX, playerScreenY + 30, 'rgba(255, 255, 255, 0.55)', 6 + Math.random() * 5, (Math.random() - 0.5) * 6, -1 - Math.random() * 3);
            addParticle(playerScreenX + driftDirX, playerScreenY + 32, '#fbbf24', 3, (Math.random() - 0.5) * 8, -Math.random() * 4, true);
        } else if (state.speed > 0.1 && Math.random() < 0.5) {
            addParticle(playerScreenX - 45, playerScreenY + 35, 'rgba(148, 163, 184, 0.4)', 3 + Math.random() * 4, -1.5 - Math.random() * 2, 1);
        }

        updateAndDrawParticles();

        if (state.screenShake > 0) {
            ctx.restore();
        }
    }

    // --- Main Game Update Loop ---
    function update(dt) {
        if (!state.running) return;

        state.totalRaceTime += dt;

        // Booster countdown
        if (state.boostingTimer > 0) {
            state.boostingTimer--;
            state.speed = MAX_BOOST_SPEED;
        }

        // Instant boost countdown
        if (state.instantBoostTimer > 0) {
            state.instantBoostTimer--;
        }

        // Sound engine RPM
        sound.setEngineSpeed(state.speed, state.boostingTimer > 0);

        // Jump physics arc
        if (state.isJumping) {
            state.playerY += state.jumpVy;
            state.jumpVy -= 1.3; // gravity
            if (state.playerY <= 0) {
                state.playerY = 0;
                state.isJumping = false;
                state.jumpVy = 0;
            }
        }

        // Acceleration / Deceleration
        const targetMaxSpeed = state.boostingTimer > 0 ? MAX_BOOST_SPEED : MAX_CRUISE_SPEED;
        if (keys.up) {
            if (state.speed < targetMaxSpeed) {
                state.speed += BASE_ACCEL;
            }
        } else if (keys.down) {
            state.speed -= BRAKE;
        } else {
            state.speed -= DECEL;
        }

        if (state.boostingTimer <= 0 && state.instantBoostTimer <= 0 && state.speed > MAX_CRUISE_SPEED) {
            state.speed -= DECEL * 2.5; // smoothly settle down after booster ends
        }

        state.speed = Math.max(0, Math.min(MAX_BOOST_SPEED, state.speed));

        // --- DRIFT MECHANIC ---
        const canDrift = keys.drift && state.speed > 0.22 && (keys.left || keys.right);
        if (canDrift) {
            if (!state.isDrifting) {
                state.isDrifting = true;
                state.driftDir = keys.left ? -1 : 1;
                state.driftDuration = 0;
                sound.startDrift();
            }
            state.driftDuration++;

            // Increase drift angle smoothly
            const targetAngle = state.driftDir * 0.38;
            state.driftAngle += (targetAngle - state.driftAngle) * 0.15;

            // Drifting gives sharper, thrilling lateral turn!
            state.playerX += state.driftDir * LATERAL_STEER_SPEED * 1.5;

            // Fill Booster Gauge while drifting!
            state.boosterGauge += 0.55 * (state.speed / MAX_CRUISE_SPEED);
            if (state.boosterGauge >= 100) {
                state.boosterGauge = 0;
                if (state.boostersCount < 2) {
                    state.boostersCount++;
                    showNotification('🔥 부스터 충전 완료!');
                }
            }
            updateBoosterUI();

            // Record skid marks
            if (state.driftDuration % 2 === 0) {
                state.skidMarks.push({
                    x: width / 2 + state.playerX * 80,
                    y: height * 0.88,
                    alpha: 0.65,
                });
            }
        } else {
            // Ending drift
            if (state.isDrifting) {
                sound.stopDrift();

                // Trigger Instant Booster (순간 부스터 / 순부!)
                if (state.driftDuration >= 18) {
                    state.instantBoostTimer = 32; // ~0.55s
                    state.speed = Math.min(MAX_BOOST_SPEED, state.speed + 0.16);
                    sound.playInstantBoost();
                    showNotification('⚡ 순간 부스터!!');
                }

                state.isDrifting = false;
                state.driftDuration = 0;
            }

            // Return drift angle to zero
            state.driftAngle += (0 - state.driftAngle) * 0.18;

            // Normal steering
            if (keys.left) {
                state.playerX -= LATERAL_STEER_SPEED * (0.35 + state.speed * 0.65);
            }
            if (keys.right) {
                state.playerX += LATERAL_STEER_SPEED * (0.35 + state.speed * 0.65);
            }
        }

        // Centrifugal curve drift force
        const playerSeg = findSegment(state.position);
        if (playerSeg && state.speed > 0.05) {
            state.playerX -= (playerSeg.curve * CENTRIFUGAL_FORCE * state.speed * 0.018);
        }

        state.playerX = Math.max(-1.1, Math.min(1.1, state.playerX));

        // Off-road slowdown
        if (Math.abs(state.playerX) > 0.78) {
            state.speed -= OFFROAD_DECEL * state.speed;
        }

        // Road forward progression (Tuned to comfortable speed!)
        const prevPos = state.position;
        state.position += state.speed * SEGMENT_LENGTH * 0.48;

        // Check Lap Crossing (Passing Segment 0 / Track Length)
        if (prevPos < state.trackLength && state.position >= state.trackLength) {
            state.position -= state.trackLength;
            handleLapCrossing();
        }

        state.distance = Math.floor(state.position * 0.05 + (state.currentLap - 1) * (state.trackLength * 0.05));

        // Combo timeout
        if (state.comboTimer > 0) {
            state.comboTimer--;
            if (state.comboTimer <= 0) state.combo = 1;
        }

        if (state.invincible > 0) state.invincible--;

        checkCollisions(playerSeg);

        // Update HUD
        scoreEl.textContent = state.score.toLocaleString();
        comboEl.textContent = `x${state.combo}`;
        if (state.combo > 1) comboContainer.classList.remove('hidden');
        else comboContainer.classList.add('hidden');

        const currentKmh = Math.floor(state.speed * DISPLAY_KMH_FACTOR);
        speedEl.textContent = currentKmh;
        speedBar.style.width = `${Math.min(100, Math.round((currentKmh / (MAX_BOOST_SPEED * DISPLAY_KMH_FACTOR)) * 100))}%`;
        distanceEl.textContent = state.distance.toLocaleString();

        if (state.lives <= 0) {
            gameOver(false);
        }
    }

    function handleLapCrossing() {
        if (state.currentLap < TOTAL_LAPS) {
            state.currentLap++;
            sound.playLapFanfare();
            showNotification(`🏁 FINAL LAP! (2/2)`);
            lapDisplay.textContent = `FINAL LAP`;
            lapDisplay.style.color = '#ef4444';
        } else {
            // Race Finish!
            gameOver(true);
        }
    }

    function formatTime(ms) {
        const totalSec = Math.floor(ms / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const centis = Math.floor((ms % 1000) / 10);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
    }

    // --- Game Loop ---
    let lastTime = 0;
    function gameLoop(timestamp) {
        const dt = Math.min(50, timestamp - lastTime);
        lastTime = timestamp;

        update(dt);
        render();

        if (state.running) {
            requestAnimationFrame(gameLoop);
        }
    }

    function startGame() {
        sound.init();

        state = {
            running: true,
            position: 0,
            speed: 0.12,
            playerX: 0,
            playerY: 0,
            jumpVy: 0,
            isJumping: false,

            currentLap: 1,
            lapStartTime: performance.now(),
            totalRaceTime: 0,
            lapCrossed: false,

            score: 0,
            collectedBoxes: 0,
            combo: 1,
            comboTimer: 0,
            lives: 3,
            distance: 0,
            highScore: state.highScore,

            isDrifting: false,
            driftDir: 0,
            driftDuration: 0,
            driftAngle: 0,
            boosterGauge: 0,
            boostersCount: 0,
            boostingTimer: 0,
            instantBoostTimer: 0,

            screenShake: 0,
            invincible: 0,
            particles: [],
            skidMarks: [],
            segments: [],
            trackLength: 0,
        };

        buildVillageOverpassTrack();
        updateLivesDisplay();
        updateBoosterUI();

        lapDisplay.textContent = `LAP 1/2`;
        lapDisplay.style.color = '#fbbf24';

        startScreen.classList.add('hidden');
        gameoverScreen.classList.add('hidden');
        hud.classList.remove('hidden');

        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    function gameOver(isVictory) {
        state.running = false;
        sound.stopEngine();

        if (isVictory) {
            sound.playLapFanfare();
            finishBadge.textContent = '🏆 레이스 완주!';
            finishTitle.textContent = '🏆 GOAL IN!';
            finishTitle.style.color = '#fbbf24';
            finishDesc.textContent = '효종 기사님이 빌리지 고가의 질주를 완벽하게 정복했습니다!';
        } else {
            sound.playCrash();
            finishBadge.textContent = '배달 종료';
            finishTitle.textContent = '💥 사고 발생!';
            finishTitle.style.color = '#ef4444';
            finishDesc.textContent = '트럭이 파손되어 정비소로 입고되었습니다.';
        }

        if (state.score > state.highScore) {
            state.highScore = state.score;
            localStorage.setItem('porterVillageHighScore', state.highScore.toString());
        }

        finalTimeEl.textContent = formatTime(state.totalRaceTime);
        finalScoreEl.textContent = state.score.toLocaleString();
        highScoreEl.textContent = state.highScore.toLocaleString();

        setTimeout(() => {
            gameoverScreen.classList.remove('hidden');
        }, 400);
    }

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);

    // Idle attract mode loop
    function idleLoop() {
        if (state.running) return;
        state.position += 12;
        if (state.position >= state.trackLength && state.trackLength > 0) {
            state.position = 0;
        }
        render();
        requestAnimationFrame(idleLoop);
    }

    buildVillageOverpassTrack();
    requestAnimationFrame(idleLoop);
})();
