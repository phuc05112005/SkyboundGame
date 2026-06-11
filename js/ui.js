class GameUI {
  constructor(storage, audio) {
    this.storage = storage;
    this.audio = audio;
    this.screens = {
      menu: document.getElementById("mainMenu"),
      customize: document.getElementById("customizePanel"),
      settings: document.getElementById("settingsPanel"),
      credits: document.getElementById("creditsPanel"),
      pause: document.getElementById("pausePanel"),
      gameOver: document.getElementById("gameOverPanel")
    };
    this.hud = document.getElementById("hud");
    this.scoreText = document.getElementById("scoreText");
    this.powerStatus = document.getElementById("powerStatus");
    this.toastLayer = document.getElementById("toastLayer");
    this.muteButton = document.getElementById("muteButton");
    this.volumeSlider = document.getElementById("volumeSlider");
    this.musicToggle = document.getElementById("musicToggle");
    this.sfxToggle = document.getElementById("sfxToggle");
    this.effectsToggle = document.getElementById("effectsToggle");
    this.difficultySelect = document.getElementById("difficultySelect");
    this.skinPreview = document.getElementById("skinPreview");
    this.brandLogo = document.getElementById("brandLogo");
    this.skinName = document.getElementById("skinName");
    this.skinGrid = document.getElementById("skinGrid");
    this.bodyColorPicker = document.getElementById("bodyColorPicker");
    this.wingColorPicker = document.getElementById("wingColorPicker");
    this.accentColorPicker = document.getElementById("accentColorPicker");
    this.glowColorPicker = document.getElementById("glowColorPicker");
    this.skinOptions = [
      { id: "classic", name: "Classic Finch" },
      { id: "swift", name: "Sky Swift" },
      { id: "owl", name: "Moon Owl" },
      { id: "dragon", name: "Tiny Dragon" },
      { id: "fish", name: "Cloud Koi" },
      { id: "rocket", name: "Rocket Chick" },
      { id: "butterfly", name: "Butterfly" },
      { id: "bat", name: "Night Bat" },
      { id: "phoenix", name: "Phoenix" }
    ];
    this.currentSkin = this.storage.getSkin();
    this.callbacks = {};
    this.bindDom();
    this.buildSkinGrid();
    this.syncSettings();
    this.syncSkinControls();
    this.drawBrandLogo();
    this.refreshStats();
  }

  bindDom() {
    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        this.audio.click();
        this.emit(button.dataset.action);
      });
    });
    this.muteButton.addEventListener("click", () => this.emit("toggle-mute"));
    [this.bodyColorPicker, this.wingColorPicker, this.accentColorPicker, this.glowColorPicker].forEach((input) => {
      input.addEventListener("input", () => {
        this.currentSkin = this.readSkin();
        this.drawSkinPreview(this.currentSkin);
        this.emit("skin-preview");
      });
    });
  }

  buildSkinGrid() {
    this.skinGrid.innerHTML = "";
    this.skinOptions.forEach((skin) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "skin-option";
      button.dataset.skin = skin.id;
      button.textContent = skin.name;
      button.addEventListener("click", () => {
        this.audio.click();
        this.currentSkin = { ...this.currentSkin, shape: skin.id };
        this.syncSkinControls();
        this.emit("skin-preview");
      });
      this.skinGrid.appendChild(button);
    });
  }

  on(action, callback) {
    this.callbacks[action] = callback;
  }

  emit(action) {
    if (this.callbacks[action]) this.callbacks[action]();
  }

  show(screenName) {
    // Passing null hides panels and exposes only the in-game HUD.
    Object.values(this.screens).forEach((screen) => screen.classList.remove("active"));
    if (screenName && this.screens[screenName]) this.screens[screenName].classList.add("active");
    this.hud.classList.toggle("hidden", screenName !== null);
  }

  syncSettings() {
    const settings = this.storage.getSettings();
    this.volumeSlider.value = settings.volume;
    this.musicToggle.checked = settings.music;
    this.sfxToggle.checked = settings.sfx;
    this.effectsToggle.checked = settings.effects;
    this.difficultySelect.value = settings.difficulty;
    this.setMuted(settings.muted);
  }

  readSettings() {
    return {
      volume: Number(this.volumeSlider.value),
      music: this.musicToggle.checked,
      sfx: this.sfxToggle.checked,
      effects: this.effectsToggle.checked,
      difficulty: this.difficultySelect.value
    };
  }

  syncSkinControls() {
    this.bodyColorPicker.value = this.currentSkin.body;
    this.wingColorPicker.value = this.currentSkin.wing;
    this.accentColorPicker.value = this.currentSkin.accent;
    this.glowColorPicker.value = this.currentSkin.glow;
    this.skinGrid.querySelectorAll(".skin-option").forEach((button) => {
      button.classList.toggle("active", button.dataset.skin === this.currentSkin.shape);
    });
    this.drawSkinPreview(this.currentSkin);
  }

  readSkin() {
    return {
      shape: this.currentSkin.shape,
      body: this.bodyColorPicker.value,
      wing: this.wingColorPicker.value,
      accent: this.accentColorPicker.value,
      glow: this.glowColorPicker.value
    };
  }

  setSkin(skin) {
    this.currentSkin = { ...skin };
    this.syncSkinControls();
  }

  randomizeSkin() {
    const palette = ["#ffd166", "#4dd4ac", "#67e8f9", "#c084fc", "#fb7185", "#f97316", "#a3e635", "#f8fafc"];
    const pick = () => palette[Math.floor(Math.random() * palette.length)];
    const shape = this.skinOptions[Math.floor(Math.random() * this.skinOptions.length)].id;
    this.setSkin({ shape, body: pick(), wing: pick(), accent: pick(), glow: pick() });
  }

  drawSkinPreview(skin) {
    const ctx = this.skinPreview.getContext("2d");
    const name = this.skinOptions.find((option) => option.id === skin.shape)?.name || "Custom Bird";
    this.skinName.textContent = name;
    ctx.clearRect(0, 0, this.skinPreview.width, this.skinPreview.height);
    ctx.save();
    ctx.translate(110, 82);
    ctx.scale(1.35, 1.35);
    Player.drawSkin(ctx, skin, 0.35, true, 0, 0);
    ctx.restore();
  }

  drawBrandLogo() {
    if (!this.brandLogo) return;
    const canvas = this.brandLogo;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Bo góc
    const r = 18;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(r, 0); ctx.lineTo(w - r, 0);
      ctx.quadraticCurveTo(w, 0, w, r);
      ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h);
      ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r);
      ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
    };

    // Nền: gradient xanh trời → tím xanh sâu — bầu trời lúc hoàng hôn
    path();
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#1a6eb5");
    bg.addColorStop(0.42, "#0e4a8a");
    bg.addColorStop(1, "#071e3d");
    ctx.fillStyle = bg;
    ctx.fill();

    // Lớp sáng góc trên — cảm giác bầu trời
    path();
    const sky = ctx.createRadialGradient(w * 0.28, h * 0.18, 2, w * 0.28, h * 0.18, w * 0.72);
    sky.addColorStop(0, "rgba(120,200,255,0.38)");
    sky.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sky;
    ctx.fill();

    // Vầng sáng vàng phía sau chim — hiệu ứng mặt trời
    const sunGlow = ctx.createRadialGradient(w * 0.52, h * 0.52, 4, w * 0.52, h * 0.52, w * 0.46);
    sunGlow.addColorStop(0, "rgba(255,220,80,0.55)");
    sunGlow.addColorStop(0.5, "rgba(255,160,40,0.22)");
    sunGlow.addColorStop(1, "rgba(255,120,0,0)");
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(w * 0.52, h * 0.52, w * 0.46, 0, Math.PI * 2);
    ctx.fill();

    // Viền ngoài ánh kim
    path();
    ctx.strokeStyle = "rgba(255,220,100,0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Viền trong sáng nhẹ phía trên
    path();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Con chim — scale nhỏ lại để vừa khung, dịch tâm sang phải chút (mỏ ở phải)
    ctx.save();
    ctx.translate(46, 54);
    ctx.scale(0.92, 0.92);
    Player.drawSkin(ctx, {
      shape: "classic",
      body: "#ffd166",
      wing: "#ffbf69",
      accent: "#ff7b54",
      glow: "#ffd166"
    }, 0.85, false, 0, 0);
    ctx.restore();
    // Đồng bộ favicon — lấy thẳng từ canvas, giống 100%
    const dataUrl = canvas.toDataURL("image/png");
    let favicon = document.querySelector("link[rel='icon']");
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.type = "image/png";
    favicon.href = dataUrl;
  }

  refreshStats() {
    const stats = this.storage.getStats();
    document.getElementById("menuHighScore").textContent = stats.highScore;
    document.getElementById("menuTotalGames").textContent = stats.totalGames;
    document.getElementById("menuBestStreak").textContent = stats.bestStreak;
  }

  updateScore(score) {
    this.scoreText.textContent = score;
  }

  updateCombo(combo, multiplier) {
    if (!this.comboCard) return;
    this.comboText.textContent = combo;
    this.multiplierText.textContent = `x${multiplier}`;
    
    // Thêm hiệu ứng rung nhẹ khi combo tăng
    this.comboCard.classList.remove("bump");
    void this.comboCard.offsetWidth; // Force reflow
    if (combo > 0) this.comboCard.classList.add("bump");
    
    this.comboCard.style.display = combo > 0 ? "flex" : "none";
  }

  updatePower(text) {
    this.powerStatus.textContent = text;
  }

  showGameOver(score, best) {
    document.getElementById("finalScore").textContent = score;
    document.getElementById("finalBest").textContent = best;
    this.show("gameOver");
    this.refreshStats();
  }

  setMuted(muted) {
    this.muteButton.textContent = muted ? "OFF" : "ON";
    this.muteButton.classList.toggle("is-muted", muted);
    this.muteButton.setAttribute("aria-label", muted ? "Unmute" : "Mute");
  }

  toast(title, message = "", compact = false) {
    const node = document.createElement("div");
    node.className = compact ? "toast compact-toast" : "toast";
    node.innerHTML = `<strong>${title}</strong>${message}`;
    this.toastLayer.appendChild(node);
    window.setTimeout(() => node.remove(), compact ? 2100 : 2900);
  }
}
