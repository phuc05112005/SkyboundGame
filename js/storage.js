class GameStorage {
  constructor(key = "skyboundWingsSave") {
    this.key = key;
    this.defaults = {
      highScore: 0,
      totalGames: 0,
      totalPoints: 0,
      bestStreak: 0,
      settings: {
        volume: 0.7,
        muted: false,
        effects: true,
        difficulty: "normal"
      },
      skin: {
        shape: "classic",
        body: "#ffd166",
        wing: "#ffbf69",
        accent: "#ff7b54",
        glow: "#ffd166"
      },
      achievements: {}
    };
    this.data = this.load();
  }

  load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.key));
      return this.mergeDefaults(parsed || {});
    } catch (error) {
      return this.mergeDefaults({});
    }
  }

  mergeDefaults(data) {
    return {
      ...this.defaults,
      ...data,
      settings: { ...this.defaults.settings, ...(data.settings || {}) },
      skin: { ...this.defaults.skin, ...(data.skin || {}) },
      achievements: { ...this.defaults.achievements, ...(data.achievements || {}) }
    };
  }

  save() {
    localStorage.setItem(this.key, JSON.stringify(this.data));
  }

  getStats() {
    return {
      highScore: this.data.highScore,
      totalGames: this.data.totalGames,
      totalPoints: this.data.totalPoints,
      bestStreak: this.data.bestStreak
    };
  }

  getSettings() {
    return { ...this.data.settings };
  }

  updateSettings(settings) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
  }

  getSkin() {
    return { ...this.data.skin };
  }

  updateSkin(skin) {
    this.data.skin = { ...this.data.skin, ...skin };
    this.save();
  }

  recordGame(score, streak) {
    // Stats are aggregated after each completed run and persisted immediately.
    this.data.totalGames += 1;
    this.data.totalPoints += score;
    this.data.highScore = Math.max(this.data.highScore, score);
    this.data.bestStreak = Math.max(this.data.bestStreak, streak);
    this.save();
    return this.getStats();
  }

  unlockAchievement(id) {
    if (this.data.achievements[id]) return false;
    this.data.achievements[id] = true;
    this.save();
    return true;
  }

  hasAchievement(id) {
    return Boolean(this.data.achievements[id]);
  }
}
