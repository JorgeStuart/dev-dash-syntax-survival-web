// Sintetizador Web Audio API leve (zero downloads externos)

class SoundSynth {
  constructor() {
    this.ctx = null;
  }

  ensureCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playTone(freq, duration, type = 'triangle', volume = 0.08, slideTo) {
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  shoot() {
    this.playTone(540, 0.07, 'square', 0.035, 190);
  }

  pickupXp() {
    this.playTone(680, 0.06, 'sine', 0.045, 980);
  }

  keyHit() {
    this.playTone(820, 0.035, 'triangle', 0.04, 960);
  }

  keyError() {
    this.playTone(150, 0.12, 'sawtooth', 0.07, 110);
  }

  terminalSuccess() {
    this.playTone(523.25, 0.1, 'triangle', 0.08);
    setTimeout(() => this.playTone(659.25, 0.1, 'triangle', 0.08), 80);
    setTimeout(() => this.playTone(1046.5, 0.22, 'triangle', 0.09), 160);
  }

  mergeSiren() {
    this.playTone(320, 0.28, 'sawtooth', 0.09, 620);
    setTimeout(() => this.playTone(620, 0.28, 'sawtooth', 0.09, 320), 290);
  }

  levelUp() {
    this.playTone(440, 0.09, 'sine', 0.07);
    setTimeout(() => this.playTone(554.37, 0.09, 'sine', 0.07), 70);
    setTimeout(() => this.playTone(659.25, 0.16, 'sine', 0.08), 140);
  }
}

export const sfx = new SoundSynth();
