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
      aurora: { notes: [247, 311, 370, 466, 415, 370, 311, 277], wave: "triangle", tempo: 480, gain: 0.07 }
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
    this.musicGain.gain.value = this.musicEnabled ? 0.18 : 0;
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

  setMood(biome = {}) {
    const moodKey = `${biome.name || ""} ${biome.type || ""} ${biome.weather || ""}`.toLowerCase();
    if (moodKey.includes("ocean")) this.mood = "ocean";
    else if (moodKey.includes("coral") || moodKey.includes("sunrise")) this.mood = "coral";
    else if (moodKey.includes("storm")) this.mood = "storm";
    else if (moodKey.includes("volcano") || moodKey.includes("volcanic")) this.mood = "volcano";
    else if (moodKey.includes("winter") || moodKey.includes("snow") || moodKey.includes("ice")) this.mood = "winter";
    else if (moodKey.includes("aurora")) this.mood = "aurora";
    else if (moodKey.includes("night")) this.mood = "night";
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
    if (this.musicStep % Math.round(mood.tempo / 120) !== 0) {
      this.musicStep += 1;
      return;
    }
    const index = Math.floor(this.musicStep / Math.round(mood.tempo / 120));
    const frequency = mood.notes[index % mood.notes.length];
    this.playTone({
      frequency,
      type: mood.wave,
      duration: Math.min(0.46, mood.tempo / 1000),
      gain: mood.gain,
      destination: this.musicGain
    });
    if (index % 4 === 0) {
      this.playTone({
        frequency: frequency / 2,
        type: "sine",
        duration: 0.52,
        gain: mood.gain * 0.45,
        destination: this.musicGain
      });
    }
    this.musicStep += 1;
  }

  stopMusic() {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.musicStep = 0;
  }
}
