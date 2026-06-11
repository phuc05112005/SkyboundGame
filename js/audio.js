class AudioEngine {
  constructor(settings) {
    this.context = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.volume = settings.volume;
    this.muted = settings.muted;
    this.musicEnabled = settings.music ?? true;
    this.sfxEnabled = settings.sfx ?? true;
    this.musicTimer = null;
    this.musicStep = 0;
    this.mood = "azure";
    this.moods = {
      azure: { notes: [196, 247, 294, 370, 330, 294, 247, 220], wave: "triangle", tempo: 460, gain: 0.09 },
      ocean: { notes: [174, 220, 261, 329, 293, 261, 220, 196], wave: "sine", tempo: 500, gain: 0.08 },
      coral: { notes: [220, 277, 349, 440, 392, 349, 277, 247], wave: "triangle", tempo: 430, gain: 0.085 },
      storm: { notes: [147, 185, 220, 277, 247, 220, 185, 165], wave: "sawtooth", tempo: 400, gain: 0.07 },
      night: { notes: [164, 196, 246, 293, 261, 246, 196, 184], wave: "triangle", tempo: 520, gain: 0.075 },
      volcano: { notes: [130, 164, 196, 246, 220, 196, 164, 146], wave: "square", tempo: 340, gain: 0.055 },
      winter: { notes: [220, 277, 330, 415, 370, 330, 277, 247], wave: "sine", tempo: 540, gain: 0.075 },
      aurora: { notes: [247, 311, 370, 466, 415, 370, 311, 277], wave: "triangle", tempo: 480, gain: 0.07 },
      desert: { notes: [147, 185, 220, 233, 220, 185, 147, 138], wave: "sawtooth", tempo: 520, gain: 0.065 },
      sakura: { notes: [261, 329, 392, 493, 440, 392, 329, 293], wave: "sine", tempo: 480, gain: 0.08 },
      cyber: { notes: [110, 130, 164, 196, 220, 196, 164, 130], wave: "square", tempo: 300, gain: 0.05 },
      magic: { notes: [247, 293, 370, 440, 493, 440, 370, 293], wave: "triangle", tempo: 440, gain: 0.085 },
      space: { notes: [196, 294, 392, 587, 493, 392, 294, 196], wave: "sine", tempo: 600, gain: 0.07 }
    };
  }

  ensureContext() {
    if (this.context) return;
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.context.createGain();
    this.musicGain = this.context.createGain();
    this.sfxGain = this.context.createGain();
    this.master.connect(this.context.destination);
    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.applyVolume();
  }

  resume() {
    this.ensureContext();
    if (this.context.state === "suspended") this.context.resume();
  }

  applyVolume() {
    if (!this.master) return;
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.musicGain.gain.value = this.musicEnabled ? 0.35 : 0; // Increased volume
    this.sfxGain.gain.value = this.sfxEnabled ? 1 : 0;
  }

  setVolume(volume) {
    this.volume = Number(volume);
    this.applyVolume();
  }

  setMuted(muted) {
    this.muted = muted;
    this.applyVolume();
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    this.applyVolume();
    if (!enabled) this.stopMusic();
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = enabled;
    this.applyVolume();
  }

  applySettings(settings) {
    this.volume = Number(settings.volume);
    this.muted = settings.muted;
    this.musicEnabled = settings.music ?? true;
    this.sfxEnabled = settings.sfx ?? true;
    this.applyVolume();
    if (!this.musicEnabled) this.stopMusic();
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  playTone({ frequency = 440, type = "sine", duration = 0.12, gain = 0.2, slide = 0, destination = this.sfxGain, delay = 0 }) {
    this.resume();
    const now = this.context.currentTime + delay;
    const osc = this.context.createOscillator();
    const amp = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + slide), now + duration);
    amp.gain.setValueAtTime(0.001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(amp);
    amp.connect(destination || this.sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  playNoise({ duration = 0.18, gain = 0.12, delay = 0 }) {
    this.resume();
    const now = this.context.currentTime + delay;
    const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = this.context.createBufferSource();
    const amp = this.context.createGain();
    source.buffer = buffer;
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(amp);
    amp.connect(this.sfxGain);
    source.start(now);
  }

  jump() {
    this.playTone({ frequency: 480, type: "triangle", duration: 0.1, gain: 0.13, slide: 260 });
    this.playTone({ frequency: 900, type: "sine", duration: 0.06, gain: 0.04, slide: 180, delay: 0.025 });
  }

  point() {
    this.playTone({ frequency: 740, type: "sine", duration: 0.09, gain: 0.14, slide: 180 });
    this.playTone({ frequency: 1110, type: "triangle", duration: 0.12, gain: 0.1, delay: 0.07 });
  }

  collision() {
    this.playTone({ frequency: 130, type: "sawtooth", duration: 0.3, gain: 0.22, slide: -80 });
    this.playNoise({ duration: 0.22, gain: 0.11 });
  }

  click() {
    this.playTone({ frequency: 430, type: "square", duration: 0.05, gain: 0.06, slide: 80 });
  }

  powerUp(type = "shield") {
    const base = { shield: 520, slow: 430, double: 660, ghost: 780 }[type] || 560;
    this.playTone({ frequency: base, type: "sine", duration: 0.09, gain: 0.1, slide: 160 });
    this.playTone({ frequency: base * 1.5, type: "triangle", duration: 0.12, gain: 0.08, slide: 220, delay: 0.08 });
    this.playTone({ frequency: base * 2, type: "sine", duration: 0.14, gain: 0.055, delay: 0.16 });
  }

  milestone() {
    [523, 659, 784, 1046].forEach((frequency, index) => {
      this.playTone({ frequency, type: index % 2 ? "triangle" : "sine", duration: 0.16, gain: 0.08, delay: index * 0.08 });
    });
    this.musicStep = 0;
    if (this.musicTimer && this.musicEnabled && !this.muted) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
      this.playMusicStep();
      this.startMusic();
    }
  }

  startRain() {
    if (!this.context || this.rainAmbient || !this.sfxEnabled || this.muted) return;
    this.resume();
    const duration = 2; // Loop buffer
    const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
    
    this.rainAmbient = this.context.createBufferSource();
    this.rainAmbient.buffer = buffer;
    this.rainAmbient.loop = true;
    const gain = this.context.createGain();
    gain.gain.value = 0.08;
    this.rainAmbient.connect(gain);
    gain.connect(this.sfxGain);
    this.rainAmbient.start();
  }

  stopRain() {
    if (this.rainAmbient) {
      this.rainAmbient.stop();
      this.rainAmbient = null;
    }
  }

  setMood(biome = {}) {
    const moodKey = `${biome.name || ""} ${biome.type || ""} ${biome.weather || ""}`.toLowerCase();
    
    // Ambient sound control
    if (moodKey.includes("storm") || moodKey.includes("rain")) {
      this.startRain();
    } else {
      this.stopRain();
    }

    if (moodKey.includes("ocean")) this.mood = "ocean";
    else if (moodKey.includes("coral") || moodKey.includes("sunrise")) this.mood = "coral";
    else if (moodKey.includes("storm")) this.mood = "storm";
    else if (moodKey.includes("volcano") || moodKey.includes("volcanic")) this.mood = "volcano";
    else if (moodKey.includes("winter") || moodKey.includes("snow") || moodKey.includes("ice")) this.mood = "winter";
    else if (moodKey.includes("aurora")) this.mood = "aurora";
    else if (moodKey.includes("night")) this.mood = "night";
    else if (moodKey.includes("desert") || moodKey.includes("sandy")) this.mood = "desert";
    else if (moodKey.includes("sakura") || moodKey.includes("blossom")) this.mood = "sakura";
    else if (moodKey.includes("cyber") || moodKey.includes("neon")) this.mood = "cyber";
    else if (moodKey.includes("magic") || moodKey.includes("enchanted")) this.mood = "magic";
    else if (moodKey.includes("space") || moodKey.includes("void")) this.mood = "space";
    else this.mood = "azure";
  }

  startMusic() {
    this.resume();
    if (!this.musicEnabled || this.musicTimer) return;
    this.musicTimer = window.setInterval(() => this.playMusicStep(), 120);
  }

  playMusicStep() {
    if (!this.context || this.muted || !this.musicEnabled) return;
    const mood = this.moods[this.mood] || this.moods.azure;
    const tempoStep = Math.round(mood.tempo / 120);
    
    if (this.musicStep % tempoStep !== 0) {
      this.musicStep += 1;
      return;
    }
    
    const index = Math.floor(this.musicStep / tempoStep);
    const frequency = mood.notes[index % mood.notes.length];
    
    // Main melody
    this.playTone({
      frequency,
      type: mood.wave,
      duration: Math.min(0.5, mood.tempo / 900),
      gain: mood.gain * 1.2,
      destination: this.musicGain
    });
    
    // Sub-harmonic / Bass layer (Stronger on beats 1 and 3)
    if (index % 4 === 0 || index % 4 === 2) {
      this.playTone({
        frequency: frequency / 2,
        type: "sine",
        duration: 0.6,
        gain: mood.gain * 0.8,
        destination: this.musicGain
      });
    }

    // High harmonic layer for sparkle (on off-beats)
    if (index % 2 === 1) {
      this.playTone({
        frequency: frequency * 2,
        type: "sine",
        duration: 0.2,
        gain: mood.gain * 0.4,
        destination: this.musicGain
      });
    }

    this.musicStep += 1;
  }

  stopMusic() {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.musicStep = 0;
    this.stopRain();
  }
}
