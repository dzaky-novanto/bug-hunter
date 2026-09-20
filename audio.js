// audio.js - Web Audio API Procedural Synthesizer for Bug Hunter Survivor
// 100% self-contained, no external MP3/WAV assets needed!

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmMuted = false;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.bgmInterval = null;
    this.bgmStep = 0;
    this.bgmPlaying = false;

    // Volume settings (0.0 - 1.0), default = "normal" levels used before this feature existed
    this.masterVolume = 0.6;
    this.sfxVolume = 0.7;
    this.bgmVolume = 0.25;
    this.DEFAULTS = { master: 0.6, sfx: 0.7, bgm: 0.25 };

    // Load sound settings from localStorage
    try {
      this.muted = localStorage.getItem('bhs_muted') === 'true';
      this.bgmMuted = localStorage.getItem('bhs_bgm_muted') === 'true';
      const savedMaster = localStorage.getItem('bhs_vol_master');
      const savedSfx = localStorage.getItem('bhs_vol_sfx');
      const savedBgm = localStorage.getItem('bhs_vol_bgm');
      if (savedMaster !== null) this.masterVolume = parseFloat(savedMaster);
      if (savedSfx !== null) this.sfxVolume = parseFloat(savedSfx);
      if (savedBgm !== null) this.bgmVolume = parseFloat(savedBgm);
    } catch(e) {}
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(this.bgmMuted ? 0 : this.bgmVolume, this.ctx.currentTime);
    this.bgmGain.connect(this.masterGain);
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ---------- Volume controls (Custom Sound Settings feature) ----------
  setMasterVolume(v) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    this.muted = this.masterVolume <= 0;
    try {
      localStorage.setItem('bhs_vol_master', this.masterVolume);
      localStorage.setItem('bhs_muted', this.muted);
    } catch(e) {}
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  setSfxVolume(v) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    try { localStorage.setItem('bhs_vol_sfx', this.sfxVolume); } catch(e) {}
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  setBgmVolume(v) {
    this.bgmVolume = Math.max(0, Math.min(1, v));
    this.bgmMuted = this.bgmVolume <= 0;
    try {
      localStorage.setItem('bhs_vol_bgm', this.bgmVolume);
      localStorage.setItem('bhs_bgm_muted', this.bgmMuted);
    } catch(e) {}
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.bgmMuted ? 0 : this.bgmVolume, this.ctx.currentTime);
    }
    if (!this.bgmMuted && !this.bgmPlaying) this.startBgm();
  }

  resetVolumes() {
    this.setMasterVolume(this.DEFAULTS.master);
    this.setSfxVolume(this.DEFAULTS.sfx);
    this.setBgmVolume(this.DEFAULTS.bgm);
  }

  toggleMute() {
    this.muted = !this.muted;
    try { localStorage.setItem('bhs_muted', this.muted); } catch(e) {}
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    return this.muted;
  }

  toggleBgm() {
    this.bgmMuted = !this.bgmMuted;
    try { localStorage.setItem('bhs_bgm_muted', this.bgmMuted); } catch(e) {}
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.bgmMuted ? 0 : this.bgmVolume, this.ctx.currentTime);
    }
    if (!this.bgmMuted && !this.bgmPlaying) {
      this.startBgm();
    }
    return this.bgmMuted;
  }

  // --- SOUND EFFECTS ---

  // Git Commit / Basic Shot
  playShoot() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Hotfix Laser Beam
  playLaser() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.2);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Enemy Hit
  playHit() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Bug Squashed / Explosion
  playExplosion() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(100, t + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // GitHub Green Tile (XP Gem) Collect
  playGem() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const pitches = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    const pitch = pitches[Math.floor(Math.random() * pitches.length)];

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, t + 0.1);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Level Up Fanfare
  playLevelUp() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.22, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + 0.25);
    });
  }

  // Weapon Merge fanfare
  playMerge() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  // Rubber Duck Squeak
  playDuckQuack() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(900, t + 0.08);
    osc.frequency.linearRampToValueAtTime(450, t + 0.2);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // StackOverflow Lightning Strike
  playLightning() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.35);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Boss Alert Siren
  playBossAlert() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    
    for (let i = 0; i < 3; i++) {
      const start = t + i * 0.28;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, start);
      osc.frequency.linearRampToValueAtTime(750, start + 0.22);

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + 0.25);
    }
  }

  // Game Over Jingle
  playGameOver() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const notes = [440, 415.3, 392, 349.2, 311.1];

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.16;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  // --- RETRO CHIPTUNE BGM GENERATOR ---
  startBgm() {
    if (this.bgmPlaying || !this.ctx) return;
    this.ensureContext();
    this.bgmPlaying = true;
    this.bgmStep = 0;

    // Cyberpunk 8-bit melody & bass loop in D minor
    const bassScale = [146.83, 146.83, 174.61, 164.81, 130.81, 130.81, 164.81, 146.83];
    const leadScale = [
      587.33, 0, 698.46, 587.33, 880.00, 783.99, 0, 698.46,
      587.33, 659.25, 698.46, 0, 523.25, 587.33, 0, 440.00
    ];

    const stepDuration = 0.15; // 100 BPM 16th notes approx

    const tick = () => {
      if (!this.bgmPlaying || !this.ctx) return;
      const t = this.ctx.currentTime;

      // Bass note every 2 steps
      if (this.bgmStep % 2 === 0) {
        const bassNote = bassScale[(this.bgmStep / 2) % bassScale.length];
        if (bassNote > 0) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(bassNote, t);

          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + stepDuration * 1.8);

          osc.connect(gain);
          gain.connect(this.bgmGain);
          osc.start(t);
          osc.stop(t + stepDuration * 1.8);
        }
      }

      // Lead note
      const leadNote = leadScale[this.bgmStep % leadScale.length];
      if (leadNote > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(leadNote, t);

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 0.9);

        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(t);
        osc.stop(t + stepDuration * 0.9);
      }

      // Hi-hat noise on off-beats
      if (this.bgmStep % 2 === 1) {
        const bufferSize = this.ctx.sampleRate * 0.03;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.03, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);

        noise.connect(gain);
        gain.connect(this.bgmGain);
        noise.start(t);
      }

      this.bgmStep = (this.bgmStep + 1) % 64;
    };

    this.bgmInterval = setInterval(tick, stepDuration * 1000);
  }

  stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

window.soundManager = new SoundManager();
