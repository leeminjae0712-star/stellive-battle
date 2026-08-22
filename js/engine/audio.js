/**
 * Audio Engine (Web Audio API Synthesizer)
 * Safe, robust, error-free sound synthesizers.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterVolume = 0.3;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch (e) {
      console.warn('AudioContext init skipped:', e);
    }
  }

  resume() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // Click UI Sound
  playClick() {
    try {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);
      gain.gain.setValueAtTime(0.1 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  // Hit Impact Sound
  playHit() {
    try {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
      gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  // Wall Bounce
  playBounce(speedRatio = 1) {
    try {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const baseFreq = 220 + Math.min(speedRatio * 80, 400);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.04);
      gain.gain.setValueAtTime(0.12 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {}
  }

  // Fighter Clash
  playClash() {
    try {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
      gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  // Ultimate Sound
  playUlt() {
    try {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(320, now);
      subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.5);
      subGain.gain.setValueAtTime(0.35 * this.masterVolume, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.65);
    } catch (e) {}
  }

  // Victory Fanfare
  playVictory() {
    try {
      if (this.isMuted || !this.ctx) return;
      this.resume();
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((note, idx) => {
        const time = now + idx * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, time);
        gain.gain.setValueAtTime(0.2 * this.masterVolume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.35);
      });
    } catch (e) {}
  }
}

window.soundEngine = new SoundEngine();
