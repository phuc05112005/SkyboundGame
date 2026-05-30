class AudioEngine {
  constructor(settings) {
    this.context = null;
    this.master = null;
    this.musicGain = null;
    this.volume = settings.volume;
    this.muted = settings.muted;
    this.musicTimer = null;
  }

  ensureContext() {
    if (this.context) return;
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.context.createGain();
    this.musicGain = this.context.createGain();
    this.master.connect(this.context.destination);
    this.musicGain.connect(this.master);
    this.applyVolume();
  }

  resume() {
    this.ensureContext();
    if (this.context.state === "suspended") this.context.resume();
  }

  applyVolume() {
    if (!this.master) return;
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.musicGain.gain.value = 0.16;
  }

  setVolume(volume) {
    this.volume = Number(volume);
    this.applyVolume();
  }

  setMuted(muted) {
    this.muted = muted;
    this.applyVolume();
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  playTone({ frequency = 440, type = "sine", duration = 0.12, gain = 0.2, slide = 0 }) {
    // Every sound effect is synthesized at runtime, so the game ships with no audio assets.
    this.resume();
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const amp = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + slide), now + duration);
    amp.gain.setValueAtTime(0.001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(amp);
    amp.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  jump() {
    this.playTone({ frequency: 520, type: "triangle", duration: 0.12, gain: 0.18, slide: 180 });
  }

  point() {
    this.playTone({ frequency: 760, type: "sine", duration: 0.1, gain: 0.17, slide: 220 });
    window.setTimeout(() => this.playTone({ frequency: 1040, type: "sine", duration: 0.08, gain: 0.12 }), 70);
  }

  collision() {
    this.playTone({ frequency: 120, type: "sawtooth", duration: 0.28, gain: 0.26, slide: -70 });
  }

  click() {
    this.playTone({ frequency: 430, type: "square", duration: 0.05, gain: 0.08, slide: 80 });
  }

  startMusic() {
    this.resume();
    if (this.musicTimer) return;
    const notes = [196, 247, 294, 370, 330, 294, 247, 220];
    let index = 0;
    this.musicTimer = window.setInterval(() => {
      if (!this.context || this.muted) return;
      const now = this.context.currentTime;
      const osc = this.context.createOscillator();
      const amp = this.context.createGain();
      osc.type = "triangle";
      osc.frequency.value = notes[index % notes.length];
      amp.gain.setValueAtTime(0.001, now);
      amp.gain.exponentialRampToValueAtTime(0.11, now + 0.04);
      amp.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc.connect(amp);
      amp.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.45);
      index += 1;
    }, 460);
  }

  stopMusic() {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}
