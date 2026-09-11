// ============================================================
// 효종의 포터 드라이브 - High-Performance Pseudo-3D Engine
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
        }

        init() {
            if (this.ctx) return;
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            this.ctx = new AudioCtx();

            // Engine sound generator
            try {
                this.engineOsc = this.ctx.createOscillator();
                this.engineGain = this.ctx.createGain();
                this.engineOsc.type = 'sawtooth';
                this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

                // Low-pass filter for realistic engine rumble
                this.engineFilter = this.ctx.createBiquadFilter();
                this.engineFilter.type = 'lowpass';
                this.engineFilter.frequency.setValueAtTime(160, this.ctx.currentTime);

                this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

                this.engineOsc.connect(this.engineFilter);
                this.engineFilter.connect(this.engineGain);
                this.engineGain.connect(this.ctx.destination);
                this.engineOsc.start();
            } catch (e) {
                console.warn('Audio init error:', e);
            }
        }

        setEngineSpeed(ratio) {
            if (!this.ctx || this.muted || !this.engineOsc) return;
            try {
                const freq = 45 + ratio * 85;
                const gain = ratio > 0.05 ? 0.08 + ratio * 0.07 : 0.02;
                this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
                this.engineGain.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.05);
            } catch (e) {}
        }

        stopEngine() {
            if (!this.ctx || !this.engineGain) return;
            try {
                this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
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
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
            } catch (e) {}
        }

        playCrash() {
            if (!this.ctx || this.muted) return;
            try {
                const now = this.ctx.currentTime;
                // Noise buffer
                const bufferSize = this.ctx.sampleRate * 0.4;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, now);
                filter.frequency.linearRampToValueAtTime(80, now + 0.35);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                noise.start(now);
                noise.stop(now + 0.35);
            } catch (e) {}
        }

        toggleMute() {
            this.muted = !this.muted;
            if (this.muted) {
                this.stopEngine();
            }
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
    const scoreEl = document.getElementById('score');
    const comboEl = document.getElementById('combo');
    const comboContainer = document.getElementById('combo-container');
    const speedEl = document.getElementById('speed');
    const speedBar = document.getElementById('speed-bar');
    const distanceEl = document.getElementById('distance');
    const livesEl = document.getElementById('lives');
    const finalScoreEl = document.getElementById('final-score');
    const finalDistanceEl = document.getElementById('final-distance');
    const highScoreEl = document.getElementById('high-score');
    const notification = document.getElementById('notification');
    const soundBtn = document.getElementById('sound-btn');
    const touchControls = document.getElementById('touch-controls');

    // Canvas resize
    let width = 0;
    let height = 0;
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Check touch device
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (isTouch) {
        touchControls.classList.remove('hidden');
    }

    // --- Pseudo-3D Road Constants ---
    const ROAD_WIDTH = 2000;
    const SEGMENT_LENGTH = 200;
    const RUMBLE_LENGTH = 3;
    const LANES = 3;
    const FOV = 85;
    const CAMERA_HEIGHT = 1000;
    const CAMERA_DEPTH = 1 / Math.tan((FOV / 2) * Math.PI / 180);
    const DRAW_DISTANCE = 220; // Number of segments to render
    const MAX_SPEED = 280; // visual km/h

    // Physics
    const ACCEL = 0.007;
    const DECEL = 0.0035;
    const BRAKE = 0.015;
    const OFFROAD_DECEL = 0.04;
    const LATERAL_SPEED = 0.038;
    const CENTRIFUGAL_FORCE = 0.28;

    // Colors
    const COLORS = {
        skyGrad: ['#0b132b', '#1c2541', '#3a506b'],
        roadDark: '#2c3440',
        roadLight: '#323b49',
        grassDark: '#105c30',
        grassLight: '#15733d',
        rumbleRed: '#e11d48',
        rumbleWhite: '#f8fafc',
        laneLine: 'rgba(255, 255, 255, 0.45)',
    };

    // --- Game State ---
    let state = {
        running: false,
        position: 0,
        speed: 0, // 0 to 1
        playerX: 0, // -1 to 1 across road
        playerY: 0,
        score: 0,
        collectedBoxes: 0,
        combo: 1,
        comboTimer: 0,
        lives: 3,
        distance: 0,
        highScore: parseInt(localStorage.getItem('porterHighScore') || '0', 10),
        screenShake: 0,
        invincible: 0,
        timeOfDay: 0, // 0 to Math.PI * 2
        particles: [],
        segments: [],
        trackLength: 0,
    };

    // --- Input Handling ---
    const keys = {
        left: false,
        right: false,
        up: false,
        down: false,
    };

    function handleKey(code, isDown) {
        if (code === 'ArrowLeft' || code === 'KeyA') keys.left = isDown;
        if (code === 'ArrowRight' || code === 'KeyD') keys.right = isDown;
        if (code === 'ArrowUp' || code === 'KeyW') keys.up = isDown;
        if (code === 'ArrowDown' || code === 'KeyS') keys.down = isDown;
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

    // Touch button bindings
    function bindTouchBtn(id, keyProp) {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('touchstart', e => { keys[keyProp] = true; e.preventDefault(); }, { passive: false });
        btn.addEventListener('touchend', e => { keys[keyProp] = false; e.preventDefault(); }, { passive: false });
        btn.addEventListener('mousedown', e => { keys[keyProp] = true; });
        btn.addEventListener('mouseup', e => { keys[keyProp] = false; });
        btn.addEventListener('mouseleave', e => { keys[keyProp] = false; });
    }
    bindTouchBtn('touch-left', 'left');
    bindTouchBtn('touch-right', 'right');
    bindTouchBtn('touch-gas', 'up');
    bindTouchBtn('touch-brake', 'down');

    // Sound toggle
    soundBtn.addEventListener('click', () => {
        sound.init();
        const active = sound.toggleMute();
        soundBtn.textContent = active ? '🔊' : '🔇';
    });

    // --- Road Builder ---
    function buildRoad() {
        state.segments = [];

        function addSegment(curve, y) {
            const n = state.segments.length;
            state.segments.push({
                index: n,
                p1: { world: { z: n * SEGMENT_LENGTH, y: y }, camera: {}, screen: {} },
                p2: { world: { z: (n + 1) * SEGMENT_LENGTH, y: y }, camera: {}, screen: {} },
                curve: curve,
                sprites: [],
                color: Math.floor(n / RUMBLE_LENGTH) % 2 ? {
                    road: COLORS.roadLight,
                    grass: COLORS.grassLight,
                    rumble: COLORS.rumbleWhite,
                    lane: COLORS.laneLine,
                } : {
                    road: COLORS.roadDark,
                    grass: COLORS.grassDark,
                    rumble: COLORS.rumbleRed,
                    lane: null,
                }
            });
        }

        function addRoad(enter, hold, leave, curve, y) {
            const startY = state.segments.length > 0 ? state.segments[state.segments.length - 1].p1.world.y : 0;
            const endY = startY + y * SEGMENT_LENGTH;
            const total = enter + hold + leave;

            for (let i = 0; i < enter; i++) {
                const t = i / enter;
                const easeCurve = curve * (t * t * (3 - 2 * t));
                const segY = startY + (endY - startY) * (i / total);
                addSegment(easeCurve, segY);
            }
            for (let i = 0; i < hold; i++) {
                const segY = startY + (endY - startY) * ((enter + i) / total);
                addSegment(curve, segY);
            }
            for (let i = 0; i < leave; i++) {
                const t = 1 - (i / leave);
                const easeCurve = curve * (t * t * (3 - 2 * t));
                const segY = startY + (endY - startY) * ((enter + hold + i) / total);
                addSegment(easeCurve, segY);
            }
        }

        // Build varied realistic track
        addRoad(50, 60, 50, 0, 0);       // Straight start
        addRoad(40, 80, 40, 2.5, 10);    // Gentle right uphill
        addRoad(30, 70, 30, -3.2, -10);  // Left curve downhill
        addRoad(50, 50, 50, 0, 15);      // Uphill straight
        addRoad(40, 60, 40, 4.0, -15);   // Sharp right drop
        addRoad(30, 40, 30, -4.5, 0);    // S-curve left
        addRoad(30, 40, 30, 4.5, 0);     // S-curve right
        addRoad(50, 80, 50, 0, 0);       // High-speed straight
        addRoad(40, 60, 40, -2.5, 10);   // Long climbing left
        addRoad(50, 70, 50, 0, -10);     // Crest and descent

        state.trackLength = state.segments.length * SEGMENT_LENGTH;

        // Populate track with obstacles, collectibles, roadside scenery
        for (let i = 25; i < state.segments.length - 20; i++) {
            const seg = state.segments[i];

            // Roadside scenery (trees, poles, signs)
            if (i % 6 === 0) {
                seg.sprites.push({
                    type: 'tree',
                    offset: -1.7 - Math.random() * 0.3,
                    worldW: 240,
                    worldH: 360,
                });
                seg.sprites.push({
                    type: (i % 18 === 0) ? 'sign' : 'tree',
                    offset: 1.7 + Math.random() * 0.3,
                    worldW: 240,
                    worldH: 360,
                });
            }
            if (i % 12 === 0) {
                seg.sprites.push({
                    type: 'pole',
                    offset: -1.4,
                    worldW: 80,
                    worldH: 420,
                });
            }

            // Collectible delivery boxes
            if (i % 10 === 0 && Math.random() < 0.65) {
                const lanes = [-0.6, 0, 0.6];
                const lane = lanes[Math.floor(Math.random() * lanes.length)];
                seg.sprites.push({
                    type: 'box',
                    offset: lane,
                    worldW: 140,
                    worldH: 140,
                    collected: false,
                    phase: Math.random() * Math.PI * 2,
                });
            }

            // Obstacles (cones, sedans, trucks, barriers)
            if (i > 40 && i % 18 === 0 && Math.random() < 0.6) {
                const lanes = [-0.6, 0, 0.6];
                const lane = lanes[Math.floor(Math.random() * lanes.length)];
                const r = Math.random();
                const obsType = r < 0.35 ? 'cone' : (r < 0.65 ? 'car' : (r < 0.85 ? 'truck' : 'barrier'));
                seg.sprites.push({
                    type: obsType,
                    offset: lane,
                    worldW: obsType === 'cone' ? 100 : (obsType === 'barrier' ? 240 : 260),
                    worldH: obsType === 'cone' ? 120 : (obsType === 'barrier' ? 120 : 180),
                    hit: false,
                });
            }
        }
    }

    function findSegment(z) {
        return state.segments[Math.floor(z / SEGMENT_LENGTH) % state.segments.length];
    }

    // --- Math & Projections ---
    function project(p, cameraX, cameraY, cameraZ, cameraDepth) {
        p.camera.x = (p.world.x || 0) - cameraX;
        p.camera.y = (p.world.y || 0) - cameraY;
        p.camera.z = (p.world.z || 0) - cameraZ;

        // Behind camera check
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

    // 1. Sky & Parallax Mountains
    function drawSkyAndMountains() {
        const timeFactor = (Math.sin(state.timeOfDay) + 1) / 2; // 0 (day) ~ 1 (night)
        const horizonY = height * 0.48;

        // Gradient Sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        if (timeFactor < 0.5) {
            skyGrad.addColorStop(0, '#0f2b48');
            skyGrad.addColorStop(0.5, '#1e5f8a');
            skyGrad.addColorStop(1, '#60a5fa');
        } else {
            skyGrad.addColorStop(0, '#050811');
            skyGrad.addColorStop(0.5, '#0f172a');
            skyGrad.addColorStop(1, '#1e293b');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY);

        // Stars at night
        if (timeFactor > 0.3) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(timeFactor - 0.3) * 1.2})`;
            for (let i = 0; i < 50; i++) {
                const sx = (Math.sin(i * 997.1) * 0.5 + 0.5) * width;
                const sy = (Math.cos(i * 331.3) * 0.5 + 0.5) * (horizonY * 0.7);
                ctx.fillRect(sx, sy, 2, 2);
            }
        }

        // Mountain Parallax
        const scrollX = (state.position * 0.0003) % width;

        // Distant Mountains
        ctx.fillStyle = timeFactor < 0.5 ? '#1e3a5f' : '#0c1626';
        ctx.beginPath();
        ctx.moveTo(0, horizonY + 10);
        for (let x = 0; x <= width; x += 15) {
            const nx = (x + scrollX * 40) * 0.003;
            const h = Math.sin(nx) * 55 + Math.cos(nx * 2.1) * 30 + 50;
            ctx.lineTo(x, horizonY - h);
        }
        ctx.lineTo(width, horizonY + 10);
        ctx.closePath();
        ctx.fill();

        // Near Hills
        ctx.fillStyle = timeFactor < 0.5 ? '#154834' : '#082319';
        ctx.beginPath();
        ctx.moveTo(0, horizonY + 10);
        for (let x = 0; x <= width; x += 15) {
            const nx = (x + scrollX * 90) * 0.005;
            const h = Math.sin(nx * 1.4) * 35 + Math.cos(nx * 0.8) * 20 + 25;
            ctx.lineTo(x, horizonY - h);
        }
        ctx.lineTo(width, horizonY + 10);
        ctx.closePath();
        ctx.fill();

        // Base Grass Background (Prevents any black seam bleeding between segments)
        ctx.fillStyle = timeFactor < 0.5 ? COLORS.grassDark : '#0a2318';
        ctx.fillRect(0, horizonY, width, height - horizonY);
    }

    // 2. Road Polygon
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

    function drawSegment(p1, p2, color) {
        const r1 = p1.screen.w * 1.15;
        const r2 = p2.screen.w * 1.15;
        const yOverlap = 1.2; // slight overlap eliminates 1px rendering seams

        // Grass strip
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

        // Lane Lines
        if (color.lane) {
            const l1 = p1.screen.w * 0.35;
            const l2 = p2.screen.w * 0.35;
            const lw1 = Math.max(2, p1.screen.w * 0.02);
            const lw2 = Math.max(2, p2.screen.w * 0.02);

            // Left lane line
            drawPolygon(
                p1.screen.x - l1 - lw1, p1.screen.y + yOverlap,
                p1.screen.x - l1 + lw1, p1.screen.y + yOverlap,
                p2.screen.x - l2 + lw2, p2.screen.y - yOverlap,
                p2.screen.x - l2 - lw2, p2.screen.y - yOverlap,
                color.lane
            );
            // Right lane line
            drawPolygon(
                p1.screen.x + l1 - lw1, p1.screen.y + yOverlap,
                p1.screen.x + l1 + lw1, p1.screen.y + yOverlap,
                p2.screen.x + l2 + lw2, p2.screen.y - yOverlap,
                p2.screen.x + l2 - lw2, p2.screen.y - yOverlap,
                color.lane
            );
        }
    }

    // 3. Sprites (Boxes, Obstacles, Scenery)
    function drawSprite(sprite, p) {
        if (!p || p.screen.scale <= 0) return;

        // Accurate OutRun perspective scaling relative to road width
        const roadFullWidth = p.screen.w * 2;
        const rawW = (sprite.worldW / ROAD_WIDTH) * roadFullWidth;
        const maxW = width * 0.32;
        const w = Math.min(rawW, maxW);
        const h = w * (sprite.worldH / sprite.worldW);

        // Position on screen according to lane offset
        const x = p.screen.x + (sprite.offset * p.screen.w);
        const y = p.screen.y;

        ctx.save();
        ctx.translate(x, y);

        switch (sprite.type) {
            case 'box':
                drawDeliveryBoxSprite(w, h, sprite.phase);
                break;
            case 'cone':
                drawTrafficConeSprite(w, h);
                break;
            case 'car':
                drawCarObstacleSprite(w, h);
                break;
            case 'truck':
                drawTruckObstacleSprite(w, h);
                break;
            case 'barrier':
                drawBarrierSprite(w, h);
                break;
            case 'tree':
                drawTreeSprite(w, h);
                break;
            case 'pole':
                drawLightPoleSprite(w, h);
                break;
            case 'sign':
                drawRoadSignSprite(w, h);
                break;
        }

        ctx.restore();
    }


    function drawDeliveryBoxSprite(w, h, phase) {
        const bob = Math.sin(Date.now() * 0.008 + phase) * (h * 0.1);
        ctx.translate(0, -h + bob);

        // Glow
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12;

        // Cardboard Box body
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = Math.max(1, w * 0.03);
        roundRectPath(-w / 2, 0, w, h, w * 0.1);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Tape
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-w * 0.12, 0, w * 0.24, h);
        ctx.fillRect(-w / 2, h * 0.42, w, h * 0.16);

        // Courier Logo "CJ/로젠/효종" icon
        ctx.fillStyle = '#78350f';
        ctx.font = `bold ${Math.max(8, w * 0.25)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📦', 0, h * 0.25);
    }

    function drawTrafficConeSprite(w, h) {
        ctx.translate(0, -h);

        // Cone body
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w * 0.4, h * 0.88);
        ctx.lineTo(-w * 0.4, h * 0.88);
        ctx.closePath();
        ctx.fill();

        // White reflective stripes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-w * 0.15, h * 0.35);
        ctx.lineTo(w * 0.15, h * 0.35);
        ctx.lineTo(w * 0.22, h * 0.52);
        ctx.lineTo(-w * 0.22, h * 0.52);
        ctx.closePath();
        ctx.fill();

        // Base plate
        ctx.fillStyle = '#ea580c';
        roundRectPath(-w * 0.5, h * 0.86, w, h * 0.14, w * 0.05);
        ctx.fill();
    }

    function drawCarObstacleSprite(w, h) {
        ctx.translate(0, -h);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, h * 0.95, w * 0.5, h * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Car Red Body
        ctx.fillStyle = '#dc2626';
        roundRectPath(-w * 0.46, h * 0.35, w * 0.92, h * 0.55, w * 0.1);
        ctx.fill();

        // Roof / Cabin
        ctx.fillStyle = '#b91c1c';
        roundRectPath(-w * 0.36, h * 0.05, w * 0.72, h * 0.45, w * 0.1);
        ctx.fill();

        // Rear window
        ctx.fillStyle = '#38bdf8';
        roundRectPath(-w * 0.3, h * 0.12, w * 0.6, h * 0.28, w * 0.06);
        ctx.fill();

        // Taillights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-w * 0.42, h * 0.55, w * 0.18, h * 0.16);
        ctx.fillRect(w * 0.24, h * 0.55, w * 0.18, h * 0.16);

        // Bumper & Plate
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-w * 0.4, h * 0.8, w * 0.8, h * 0.12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-w * 0.15, h * 0.78, w * 0.3, h * 0.1);
    }

    function drawTruckObstacleSprite(w, h) {
        ctx.translate(0, -h);

        // Container Box (Big cargo)
        ctx.fillStyle = '#047857';
        ctx.strokeStyle = '#064e3b';
        ctx.lineWidth = Math.max(1, w * 0.02);
        roundRectPath(-w * 0.48, 0, w * 0.96, h * 0.65, w * 0.05);
        ctx.fill();
        ctx.stroke();

        // Container corrugation ribs
        ctx.strokeStyle = '#065f46';
        for (let i = -0.4; i <= 0.4; i += 0.12) {
            ctx.beginPath();
            ctx.moveTo(w * i, 4);
            ctx.lineTo(w * i, h * 0.62);
            ctx.stroke();
        }

        // Truck chassis / bumper
        ctx.fillStyle = '#475569';
        roundRectPath(-w * 0.45, h * 0.66, w * 0.9, h * 0.22, w * 0.04);
        ctx.fill();

        // Taillights
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-w * 0.42, h * 0.7, w * 0.15, h * 0.12);
        ctx.fillRect(w * 0.27, h * 0.7, w * 0.15, h * 0.12);

        // Heavy tires
        ctx.fillStyle = '#0f172a';
        roundRectPath(-w * 0.5, h * 0.75, w * 0.16, h * 0.22, w * 0.04);
        ctx.fill();
        roundRectPath(w * 0.34, h * 0.75, w * 0.16, h * 0.22, w * 0.04);
        ctx.fill();
    }

    function drawBarrierSprite(w, h) {
        ctx.translate(0, -h);
        // Striped construction barrier
        ctx.fillStyle = '#fbbf24';
        roundRectPath(-w / 2, h * 0.2, w, h * 0.5, w * 0.05);
        ctx.fill();

        // Diagonal hazard stripes
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

        // Legs
        ctx.fillStyle = '#334155';
        ctx.fillRect(-w * 0.4, h * 0.65, w * 0.1, h * 0.35);
        ctx.fillRect(w * 0.3, h * 0.65, w * 0.1, h * 0.35);
    }

    function drawTreeSprite(w, h) {
        ctx.translate(0, -h);
        // Trunk
        ctx.fillStyle = '#5c3317';
        ctx.fillRect(-w * 0.1, h * 0.6, w * 0.2, h * 0.4);

        // Lush green foliage
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(0, h * 0.38, w * 0.42, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(-w * 0.1, h * 0.32, w * 0.32, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawLightPoleSprite(w, h) {
        ctx.translate(0, -h);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-w * 0.15, 0, w * 0.3, h);

        // Lamp head
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, h * 0.05, w * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    function drawRoadSignSprite(w, h) {
        ctx.translate(0, -h);
        // Post
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-w * 0.08, h * 0.3, w * 0.16, h * 0.7);

        // Blue expressway signboard
        ctx.fillStyle = '#1d4ed8';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, w * 0.03);
        roundRectPath(-w * 0.45, 0, w * 0.9, h * 0.45, w * 0.06);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(7, w * 0.18)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('효종 특송', 0, h * 0.16);
        ctx.font = `${Math.max(6, w * 0.12)}px sans-serif`;
        ctx.fillText('안전운전 100km', 0, h * 0.32);
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

    // 4. Detailed Hyundai Porter Truck & Hyojong Driver
    function drawPlayerTruck(x, y, steerTilt, bounce) {
        const truckW = Math.min(width * 0.26, 210);
        const truckH = truckW * 1.25;

        ctx.save();
        ctx.translate(x, y + bounce);

        // Steering tilt
        ctx.rotate(steerTilt * 0.1);

        // Road Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, truckH * 0.45, truckW * 0.52, truckH * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        // 1-Ton Cargo Bed (Back)
        ctx.fillStyle = '#1e3a8a';
        ctx.strokeStyle = '#172554';
        ctx.lineWidth = 2;
        roundRectPath(-truckW * 0.44, -truckH * 0.5, truckW * 0.88, truckH * 0.52, 6);
        ctx.fill();
        ctx.stroke();

        // Bed inner floor
        ctx.fillStyle = '#1e40af';
        ctx.fillRect(-truckW * 0.41, -truckH * 0.47, truckW * 0.82, truckH * 0.46);

        // Cargo Boxes loaded on Porter Bed! (Grows with collected boxes!)
        const stackCount = Math.min(6, 2 + Math.floor(state.collectedBoxes / 2));
        drawLoadedCargoBoxes(truckW, truckH, stackCount, bounce);

        // Porter Blue Cabin (Front / Back view)
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

        // HYOJONG Driver inside the cabin!
        drawHyojongDriver(0, truckH * 0.13, truckW, steerTilt);

        // Porter Taillights
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        roundRectPath(-truckW * 0.4, truckH * 0.32, truckW * 0.14, truckH * 0.07, 3);
        ctx.fill();
        roundRectPath(truckW * 0.26, truckH * 0.32, truckW * 0.14, truckH * 0.07, 3);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Bumper
        ctx.fillStyle = '#e2e8f0';
        roundRectPath(-truckW * 0.43, truckH * 0.38, truckW * 0.86, truckH * 0.07, 4);
        ctx.fill();

        // Korean License Plate
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

    function drawLoadedCargoBoxes(tw, th, count, bounce) {
        ctx.save();
        const boxW = tw * 0.26;
        const boxH = th * 0.15;

        // Positions on the bed
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
            roundRectPath(p.x, p.y + jitter, boxW, boxH, 3);
            ctx.fill();
            ctx.stroke();

            // Tape line
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(p.x + boxW * 0.4, p.y + jitter, boxW * 0.2, boxH);
        }
        ctx.restore();
    }

    function drawHyojongDriver(x, y, tw, steerTilt) {
        ctx.save();
        ctx.translate(x + steerTilt * 4, y);

        // Hyojong Face
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(0, 0, tw * 0.075, 0, Math.PI * 2);
        ctx.fill();

        // Delivery Cap (Blue CJ/Porter Style Cap)
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath();
        ctx.arc(0, -tw * 0.02, tw * 0.08, Math.PI, Math.PI * 2);
        ctx.fill();
        // Cap brim
        ctx.fillRect(-tw * 0.08, -tw * 0.02, tw * 0.16, tw * 0.025);

        // Cap Gold Badge
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, -tw * 0.05, tw * 0.02, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (Expressive!)
        const isSurprised = state.invincible > 0;
        ctx.fillStyle = '#0f172a';
        if (isSurprised) {
            // > < or O O when hit!
            ctx.font = `bold ${Math.max(8, tw * 0.06)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('x x', 0, tw * 0.015);
        } else {
            // Cheerful eyes
            ctx.beginPath();
            ctx.arc(-tw * 0.03, 0, tw * 0.012, 0, Math.PI * 2);
            ctx.arc(tw * 0.03, 0, tw * 0.012, 0, Math.PI * 2);
            ctx.fill();

            // Rosy cheeks
            ctx.fillStyle = 'rgba(248, 113, 113, 0.6)';
            ctx.beginPath();
            ctx.arc(-tw * 0.045, tw * 0.02, tw * 0.015, 0, Math.PI * 2);
            ctx.arc(tw * 0.045, tw * 0.02, tw * 0.015, 0, Math.PI * 2);
            ctx.fill();

            // Happy Smile
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(0, tw * 0.02, tw * 0.025, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.stroke();
        }

        ctx.restore();
    }

    // 5. Particles & Speedlines
    function addParticle(x, y, color, size, vx, vy) {
        state.particles.push({
            x, y, color, size, vx, vy,
            life: 1,
            decay: 0.025 + Math.random() * 0.03,
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

    function drawSpeedLines() {
        if (state.speed < 0.45) return;
        const count = Math.floor((state.speed - 0.45) * 35);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.5;

        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const len = 30 + state.speed * 80;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (x - width / 2) * 0.2, y + len);
            ctx.stroke();
        }
    }

    // --- Notification Helper ---
    let notifTimeout = null;
    function showNotification(text) {
        notification.textContent = text;
        notification.classList.remove('hidden');
        notification.style.animation = 'none';
        notification.offsetHeight; // trigger reflow
        notification.style.animation = 'notifPop 0.8s ease-out forwards';
        clearTimeout(notifTimeout);
        notifTimeout = setTimeout(() => notification.classList.add('hidden'), 800);
    }

    // --- Collision & Collectibles Detection ---
    function checkCollisions(playerSeg) {
        const playerZ = state.position + SEGMENT_LENGTH * 2;
        const checkRange = 3;

        for (let n = 0; n < checkRange; n++) {
            const seg = state.segments[(playerSeg.index + n) % state.segments.length];

            for (const sprite of seg.sprites) {
                // Collect Delivery Boxes
                if (sprite.type === 'box' && !sprite.collected) {
                    if (Math.abs(state.playerX - sprite.offset) < 0.35) {
                        sprite.collected = true;
                        state.collectedBoxes++;

                        const points = 100 * state.combo;
                        state.score += points;
                        state.combo++;
                        state.comboTimer = 180; // 3 seconds

                        sound.playCollect();
                        showNotification(`📦 +${points}점!`);

                        // Confetti particles
                        const px = width / 2 + state.playerX * (width * 0.35);
                        for (let k = 0; k < 16; k++) {
                            addParticle(
                                px, height * 0.78,
                                ['#fbbf24', '#f59e0b', '#38bdf8', '#ffffff'][k % 4],
                                4 + Math.random() * 4,
                                (Math.random() - 0.5) * 8,
                                (Math.random() - 0.7) * 7
                            );
                        }
                    }
                }

                // Obstacle Hit
                if (['cone', 'car', 'truck', 'barrier'].includes(sprite.type) && !sprite.hit) {
                    const hitWidth = sprite.type === 'cone' ? 0.22 : 0.36;
                    if (Math.abs(state.playerX - sprite.offset) < hitWidth) {
                        if (state.invincible <= 0) {
                            sprite.hit = true;
                            state.lives--;
                            state.screenShake = 18;
                            state.invincible = 120; // 2 seconds flash
                            state.combo = 1;
                            state.speed *= 0.3; // decelerate on impact

                            sound.playCrash();
                            showNotification('💥 쿵! 안전운전!');
                            updateLivesDisplay();

                            // Spark & Smoke particles
                            const px = width / 2 + state.playerX * (width * 0.35);
                            for (let k = 0; k < 24; k++) {
                                addParticle(
                                    px, height * 0.8,
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

    function updateLivesDisplay() {
        livesEl.textContent = '❤️'.repeat(Math.max(0, state.lives)) +
                              '🖤'.repeat(Math.max(0, 3 - state.lives));
    }

    // --- Main Render Function ---
    function render() {
        ctx.clearRect(0, 0, width, height);

        // Screen Shake
        if (state.screenShake > 0) {
            ctx.save();
            const sx = (Math.random() - 0.5) * state.screenShake;
            const sy = (Math.random() - 0.5) * state.screenShake;
            ctx.translate(sx, sy);
            state.screenShake *= 0.88;
            if (state.screenShake < 0.5) state.screenShake = 0;
        }

        // 1. Sky and Parallax background
        drawSkyAndMountains();

        // 2. Road Projection & OutRun Curve Math
        const baseSegment = findSegment(state.position);
        const basePercent = (state.position % SEGMENT_LENGTH) / SEGMENT_LENGTH;
        const playerSegment = findSegment(state.position + SEGMENT_LENGTH * 2);

        let dx = -(baseSegment.curve * basePercent);
        let x = 0;

        const cameraX = state.playerX * ROAD_WIDTH;
        const cameraY = CAMERA_HEIGHT + baseSegment.p1.world.y;
        const cameraZ = state.position;

        // Project all segments in view
        const segmentsToDraw = [];
        for (let n = 0; n < DRAW_DISTANCE; n++) {
            const seg = state.segments[(baseSegment.index + n) % state.segments.length];
            const looped = seg.index < baseSegment.index;

            seg.p1.world.z = (looped ? state.trackLength : 0) + (seg.index * SEGMENT_LENGTH);
            seg.p2.world.z = (looped ? state.trackLength : 0) + ((seg.index + 1) * SEGMENT_LENGTH);

            // Accumulate horizontal curve
            seg.p1.world.x = x;
            seg.p2.world.x = x + dx;
            x += dx;
            dx += seg.curve;

            project(seg.p1, cameraX, cameraY, cameraZ, CAMERA_DEPTH);
            project(seg.p2, cameraX, cameraY, cameraZ, CAMERA_DEPTH);

            // Skip if behind camera or invalid projection
            if (seg.p1.camera.z <= 0 || seg.p2.screen.y >= seg.p1.screen.y) {
                continue;
            }

            segmentsToDraw.push(seg);
        }

        // 3. Render Segments & Sprites (Back-to-Front Painter's Algorithm)
        for (let i = segmentsToDraw.length - 1; i >= 0; i--) {
            const seg = segmentsToDraw[i];

            // Draw Road Segment
            drawSegment(seg.p1, seg.p2, seg.color);

            // Draw sprites located on this segment
            for (const sprite of seg.sprites) {
                if (sprite.collected) continue;
                drawSprite(sprite, seg.p1);
            }
        }

        // 4. Speed lines
        drawSpeedLines();

        // 5. Player Porter Truck
        const playerScreenX = width / 2;
        const playerScreenY = height * 0.84;
        const bounce = (Math.sin(state.position * 0.05) * 2) * state.speed;

        // Steer tilt
        let steerTilt = 0;
        if (keys.left) steerTilt = -1;
        if (keys.right) steerTilt = 1;

        // Invincibility flashing
        if (state.invincible > 0 && Math.floor(state.invincible / 4) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        drawPlayerTruck(playerScreenX, playerScreenY, steerTilt, bounce);
        ctx.globalAlpha = 1;

        // 6. Exhaust Smoke Particle from Porter Truck
        if (state.speed > 0.1 && Math.random() < 0.6) {
            addParticle(
                playerScreenX - 45,
                playerScreenY + 35,
                'rgba(148, 163, 184, 0.45)',
                3 + Math.random() * 4,
                -1.5 - Math.random() * 2,
                1 + Math.random() * 2
            );
        }

        // 7. Update and Draw Particles
        updateAndDrawParticles();

        if (state.screenShake > 0) {
            ctx.restore();
        }
    }

    // --- Main Game Update Loop ---
    function update(dt) {
        if (!state.running) return;

        // Day/Night progression
        state.timeOfDay += 0.0004;

        // Sound engine RPM
        sound.setEngineSpeed(state.speed);

        // Acceleration / Braking
        if (keys.up) {
            state.speed += ACCEL;
        } else if (keys.down) {
            state.speed -= BRAKE;
        } else {
            state.speed -= DECEL;
        }

        state.speed = Math.max(0, Math.min(1, state.speed));

        // Lateral Steering
        if (keys.left) {
            state.playerX -= LATERAL_SPEED * (0.3 + state.speed * 0.7);
        }
        if (keys.right) {
            state.playerX += LATERAL_SPEED * (0.3 + state.speed * 0.7);
        }

        // Centrifugal curve drift
        const playerSeg = findSegment(state.position);
        if (playerSeg && state.speed > 0.05) {
            state.playerX -= (playerSeg.curve * CENTRIFUGAL_FORCE * state.speed * 0.02);
        }

        // Clamp player road boundary
        state.playerX = Math.max(-1.1, Math.min(1.1, state.playerX));

        // Off-road slowdown
        if (Math.abs(state.playerX) > 0.75) {
            state.speed -= OFFROAD_DECEL * state.speed;
        }

        // Position forward progression
        state.position += state.speed * SEGMENT_LENGTH * 0.7;
        while (state.position >= state.trackLength) {
            state.position -= state.trackLength;
        }

        // Distance & Stats
        state.distance = Math.floor(state.position * 0.05);

        // Combo timeout
        if (state.comboTimer > 0) {
            state.comboTimer--;
            if (state.comboTimer <= 0) {
                state.combo = 1;
            }
        }

        // Invincibility countdown
        if (state.invincible > 0) {
            state.invincible--;
        }

        // Check Collisions
        checkCollisions(playerSeg);

        // Update HUD DOM
        scoreEl.textContent = state.score.toLocaleString();
        comboEl.textContent = `x${state.combo}`;
        if (state.combo > 1) {
            comboContainer.classList.remove('hidden');
        } else {
            comboContainer.classList.add('hidden');
        }

        const currentKmh = Math.floor(state.speed * MAX_SPEED);
        speedEl.textContent = currentKmh;
        speedBar.style.width = `${Math.min(100, Math.round((currentKmh / MAX_SPEED) * 100))}%`;
        distanceEl.textContent = state.distance.toLocaleString();

        // Game Over check
        if (state.lives <= 0) {
            gameOver();
        }
    }

    // --- Animation Frame Loop ---
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

    // --- Game Control (Start / Game Over) ---
    function startGame() {
        sound.init();

        state = {
            running: true,
            position: 0,
            speed: 0.1,
            playerX: 0,
            playerY: 0,
            score: 0,
            collectedBoxes: 0,
            combo: 1,
            comboTimer: 0,
            lives: 3,
            distance: 0,
            highScore: state.highScore,
            screenShake: 0,
            invincible: 0,
            timeOfDay: 0.2,
            particles: [],
            segments: [],
            trackLength: 0,
        };

        buildRoad();
        updateLivesDisplay();

        startScreen.classList.add('hidden');
        gameoverScreen.classList.add('hidden');
        hud.classList.remove('hidden');

        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    function gameOver() {
        state.running = false;
        sound.stopEngine();

        if (state.score > state.highScore) {
            state.highScore = state.score;
            localStorage.setItem('porterHighScore', state.highScore.toString());
        }

        finalScoreEl.textContent = state.score.toLocaleString();
        finalDistanceEl.textContent = `${state.distance.toLocaleString()}m`;
        highScoreEl.textContent = state.highScore.toLocaleString();

        setTimeout(() => {
            gameoverScreen.classList.remove('hidden');
        }, 400);
    }

    // Event Listeners
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);

    // --- Attract Mode (Idle animation behind start screen) ---
    function idleLoop() {
        if (state.running) return;

        state.timeOfDay += 0.001;
        state.position += 15;
        if (state.position >= state.trackLength && state.trackLength > 0) {
            state.position = 0;
        }

        render();
        requestAnimationFrame(idleLoop);
    }

    buildRoad();
    requestAnimationFrame(idleLoop);

})();
