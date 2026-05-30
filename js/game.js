class SkyboundGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.storage = new GameStorage();
    this.audio = new AudioEngine(this.storage.getSettings());
    this.ui = new GameUI(this.storage, this.audio);
    this.particles = new ParticleSystem();
    this.player = new Player(180, 260);
    this.state = "menu";
    this.score = 0;
    this.streak = 0;
    this.lastTime = 0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.powerTimer = 0;
    this.shake = 0;
    this.hitFreeze = 0;
    this.slowMotion = 0;
    this.scoreTexts = [];
    this.pipes = [];
    this.powerUps = [];
    this.clouds = [];
    this.hills = [];
    this.mountainLayers = [];
    this.trees = [];
    this.sparkles = [];
    this.groundOffset = 0;
    this.nextPipeSequence = 1;
    this.biomeIndex = 0;
    this.biomeBlend = 0;
    this.milestoneFlash = 0;
    this.milestoneBanner = null;
    this.effectsEnabled = true;
    this.difficulty = "normal";
    this.recordedGameOver = false;
    this.achievements = [
      { id: "firstFlight", title: "First Flight", test: () => this.storage.getStats().totalGames >= 1 },
      { id: "score10", title: "Score 10", test: () => this.score >= 10 },
      { id: "score50", title: "Score 50", test: () => this.score >= 50 },
      { id: "score100", title: "Score 100", test: () => this.score >= 100 },
      { id: "legendBird", title: "Legend Bird", test: () => this.storage.getStats().highScore >= 100 }
    ];
    // Difficulty presets keep balancing data isolated from gameplay logic.
    this.configs = {
      easy: { gravity: 980, maxFall: 560, speed: 170, spawn: 1.7, gap: 190, pipeWidth: 74, verticalBias: 0 },
      normal: { gravity: 1060, maxFall: 620, speed: 205, spawn: 1.45, gap: 165, pipeWidth: 78, verticalBias: 10 },
      hard: { gravity: 1130, maxFall: 690, speed: 245, spawn: 1.26, gap: 142, pipeWidth: 82, verticalBias: 20 },
      insane: { gravity: 1220, maxFall: 760, speed: 292, spawn: 1.06, gap: 124, pipeWidth: 86, verticalBias: 32 }
    };
    this.biomes = [
      {
        name: "Azure Valley",
        skyTop: "#60caff",
        skyMid: "#92e6ff",
        skyBottom: "#f5df9f",
        sun: "rgba(255, 255, 255, 0.3)",
        cloud: "rgba(255,255,255,0.76)",
        mountain: "rgba(65,111,146,0.35)",
        forestA: "#237b5a",
        forestB: "#1b684e",
        groundA: "#6ed46d",
        groundB: "#3eaa57",
        groundC: "#976a3a",
        accent: "#ffd166"
      },
      {
        name: "Coral Sunrise",
        skyTop: "#ff9f7a",
        skyMid: "#ffd1a6",
        skyBottom: "#8de7ff",
        sun: "rgba(255, 238, 190, 0.46)",
        cloud: "rgba(255,244,225,0.78)",
        mountain: "rgba(180,92,112,0.3)",
        forestA: "#2f7f70",
        forestB: "#25685d",
        groundA: "#7bd389",
        groundB: "#38a169",
        groundC: "#b56a44",
        accent: "#ffcf70"
      },
      {
        name: "Crystal Coast",
        skyTop: "#38bdf8",
        skyMid: "#67e8f9",
        skyBottom: "#d9f99d",
        sun: "rgba(224, 255, 255, 0.4)",
        cloud: "rgba(236,254,255,0.72)",
        mountain: "rgba(14,116,144,0.28)",
        forestA: "#0f766e",
        forestB: "#115e59",
        groundA: "#5eead4",
        groundB: "#14b8a6",
        groundC: "#0f766e",
        accent: "#67e8f9"
      },
      {
        name: "Ember Dusk",
        skyTop: "#7c2d12",
        skyMid: "#f97316",
        skyBottom: "#fde68a",
        sun: "rgba(255, 237, 213, 0.5)",
        cloud: "rgba(255,237,213,0.6)",
        mountain: "rgba(88,28,25,0.38)",
        forestA: "#365314",
        forestB: "#1f3b16",
        groundA: "#a3e635",
        groundB: "#65a30d",
        groundC: "#854d0e",
        accent: "#fb923c"
      },
      {
        name: "Aurora Night",
        skyTop: "#0f172a",
        skyMid: "#164e63",
        skyBottom: "#312e81",
        sun: "rgba(165, 243, 252, 0.18)",
        cloud: "rgba(203,213,225,0.36)",
        mountain: "rgba(165,180,252,0.22)",
        forestA: "#155e75",
        forestB: "#0f3d4c",
        groundA: "#2dd4bf",
        groundB: "#0f766e",
        groundC: "#172554",
        accent: "#a78bfa"
      }
    ];
    this.bindEvents();
    this.resize();
    this.applySettings(this.storage.getSettings());
    this.applySkin(this.storage.getSkin());
    requestAnimationFrame((time) => this.loop(time));
  }

  bindEvents() {
    // DOM and keyboard inputs are funneled into a small set of game commands.
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("keydown", (event) => this.handleKey(event));
    this.canvas.addEventListener("pointerdown", () => this.handlePrimaryAction());
    this.ui.on("start", () => this.startGame());
    this.ui.on("customize", () => this.openCustomize());
    this.ui.on("settings", () => this.ui.show("settings"));
    this.ui.on("credits", () => this.ui.show("credits"));
    this.ui.on("back-menu", () => this.goMenu());
    this.ui.on("restart", () => this.startGame());
    this.ui.on("resume", () => this.resumeGame());
    this.ui.on("save-settings", () => {
      const settings = this.ui.readSettings();
      this.storage.updateSettings(settings);
      this.applySettings(this.storage.getSettings());
      this.ui.toast("Settings Applied", "Your flight profile is ready.");
      this.goMenu();
    });
    this.ui.on("toggle-mute", () => {
      const muted = this.audio.toggleMute();
      this.storage.updateSettings({ muted });
      this.ui.setMuted(muted);
    });
    this.ui.on("skin-preview", () => this.applySkin(this.ui.readSkin(), false));
    this.ui.on("save-skin", () => {
      const skin = this.ui.readSkin();
      this.storage.updateSkin(skin);
      this.applySkin(skin);
      this.ui.toast("Skin Applied", "Your flyer is ready.");
      this.goMenu();
    });
    this.ui.on("random-skin", () => {
      this.ui.randomizeSkin();
      this.applySkin(this.ui.readSkin(), false);
      this.audio.point();
    });
    this.ui.on("reset-skin", () => {
      const skin = {
        shape: "classic",
        body: "#ffd166",
        wing: "#ffbf69",
        accent: "#ff7b54",
        glow: "#ffd166"
      };
      this.ui.setSkin(skin);
      this.applySkin(skin, false);
    });
  }

  resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * ratio);
    this.canvas.height = Math.floor(this.height * ratio);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.groundHeight = Math.max(88, this.height * 0.14);
    this.player.startX = Math.min(190, this.width * 0.28);
    if (this.state === "menu") this.player.reset();
    this.createScenery();
  }

  createScenery() {
    this.clouds = Array.from({ length: 9 }, (_, index) => ({
      x: (index / 9) * this.width + Math.random() * 90,
      y: 50 + Math.random() * this.height * 0.36,
      scale: 0.7 + Math.random() * 1.25,
      speed: 12 + Math.random() * 18
    }));
    this.hills = Array.from({ length: 7 }, (_, index) => ({
      x: index * (this.width / 5),
      w: this.width * (0.32 + Math.random() * 0.18),
      h: this.height * (0.16 + Math.random() * 0.12)
    }));
    this.mountainLayers = [
      this.createMountainLayer(0.17, 0.2, 0.12, 0.08, 0.18),
      this.createMountainLayer(0.26, 0.26, 0.18, 0.14, 0.28),
      this.createMountainLayer(0.36, 0.33, 0.24, 0.22, 0.42)
    ];
    this.trees = Array.from({ length: 32 }, (_, index) => ({
      x: index * 72 + Math.random() * 38,
      h: 42 + Math.random() * 80,
      shade: Math.random()
    }));
    this.sparkles = Array.from({ length: 42 }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height * 0.62,
      r: 0.7 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2
    }));
  }

  createMountainLayer(depth, spacingRatio, heightRatio, ridgeRatio, speedFactor) {
    const spacing = Math.max(180, this.width * spacingRatio);
    const points = [];
    const count = Math.ceil(this.width / spacing) + 5;
    for (let index = -2; index < count; index += 1) {
      const wave = Math.sin(index * 1.73 + depth * 10);
      const fine = Math.sin(index * 3.11 + depth * 5) * 0.35;
      points.push({
        x: index * spacing,
        peak: this.height * (heightRatio + (wave + fine) * 0.035),
        ridge: this.height * (ridgeRatio + Math.cos(index * 1.4) * 0.025)
      });
    }
    return {
      offset: 0,
      spacing,
      speedFactor,
      heightRatio,
      ridgeRatio,
      points
    };
  }

  applySettings(settings) {
    this.effectsEnabled = settings.effects;
    this.difficulty = settings.difficulty;
    this.audio.setVolume(settings.volume);
    this.audio.setMuted(settings.muted);
    this.ui.setMuted(settings.muted);
  }

  applySkin(skin, persist = true) {
    this.player.setSkin(skin);
    if (persist) this.storage.updateSkin(skin);
  }

  openCustomize() {
    this.ui.setSkin(this.storage.getSkin());
    this.applySkin(this.ui.readSkin(), false);
    this.ui.show("customize");
  }

  get config() {
    return this.configs[this.difficulty] || this.configs.normal;
  }

  handleKey(event) {
    if (["Space", "KeyP", "KeyR", "Escape"].includes(event.code)) event.preventDefault();
    if (event.code === "Space") this.handlePrimaryAction();
    if (event.code === "KeyP") this.togglePause();
    if (event.code === "KeyR") this.startGame();
    if (event.code === "Escape") this.goMenu();
  }

  handlePrimaryAction() {
    if (this.state === "menu") {
      this.startGame();
      return;
    }
    if (this.state !== "playing") return;
    this.player.flap();
    this.audio.jump();
    if (this.effectsEnabled) {
      this.particles.trail(this.player.x - 22, this.player.y + 8);
      this.particles.feathers(this.player.x - 10, this.player.y + 8);
    }
  }

  startGame() {
    this.audio.resume();
    this.audio.startMusic();
    this.state = "playing";
    this.score = 0;
    this.streak = 0;
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.powerTimer = 2.4;
    this.nextPipeSequence = 1;
    this.biomeIndex = 0;
    this.biomeBlend = 0;
    this.milestoneFlash = 0;
    this.milestoneBanner = null;
    this.slowMotion = 0;
    this.shake = 0;
    this.hitFreeze = 0;
    this.recordedGameOver = false;
    this.pipes = [];
    this.powerUps = [];
    this.scoreTexts = [];
    this.particles.clear();
    this.player.reset();
    this.player.x = Math.min(190, this.width * 0.28);
    this.player.y = this.height * 0.42;
    this.ui.updateScore(0);
    this.ui.updatePower("Ready");
    this.ui.show(null);
  }

  goMenu() {
    this.state = "menu";
    this.applySkin(this.storage.getSkin(), false);
    this.audio.stopMusic();
    this.ui.refreshStats();
    this.ui.show("menu");
  }

  togglePause() {
    if (this.state === "playing") {
      this.state = "paused";
      this.ui.show("pause");
    } else if (this.state === "paused") {
      this.resumeGame();
    }
  }

  resumeGame() {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.ui.show(null);
    this.lastTime = performance.now();
  }

  loop(time) {
    // requestAnimationFrame gives smooth pacing; delta time keeps physics stable across devices.
    const rawDt = Math.min(0.033, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;
    const timeScale = this.slowMotion > 0 ? 0.55 : 1;
    const dt = this.hitFreeze > 0 ? 0 : rawDt * timeScale;
    this.update(rawDt, dt);
    this.draw(rawDt);
    requestAnimationFrame((nextTime) => this.loop(nextTime));
  }

  update(rawDt, dt) {
    this.elapsed += rawDt;
    this.shake = Math.max(0, this.shake - rawDt * 24);
    this.hitFreeze = Math.max(0, this.hitFreeze - rawDt);
    this.slowMotion = Math.max(0, this.slowMotion - rawDt);
    this.milestoneFlash = Math.max(0, this.milestoneFlash - rawDt * 0.72);
    this.biomeBlend = Math.max(0, this.biomeBlend - rawDt * 0.45);
    if (this.milestoneBanner) {
      this.milestoneBanner.life -= rawDt;
      if (this.milestoneBanner.life <= 0) this.milestoneBanner = null;
    }
    this.updateScenery(rawDt);
    this.particles.update(rawDt, this.width, this.height, this.effectsEnabled);
    this.scoreTexts.forEach((text) => {
      text.life -= rawDt;
      text.y -= rawDt * 52;
      text.alpha = Math.max(0, text.life / 0.8);
    });
    this.scoreTexts = this.scoreTexts.filter((text) => text.life > 0);

    // The menu still animates the character and scenery so the first screen feels alive.
    if (this.state === "menu") {
      this.player.y = this.height * 0.42 + Math.sin(this.elapsed * 2.3) * 12;
      this.player.wingTime += rawDt * 9;
      return;
    }

    if (this.state !== "playing") return;

    this.player.update(dt, this.config);
    if (this.effectsEnabled && this.player.vy < -80 && Math.random() < 0.7) {
      this.particles.trail(this.player.x - 24, this.player.y + 8);
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.config.spawn;
      this.pipes.push(new PipePair(this.width + 80, this.height, this.groundHeight, this.config, this.nextPipeSequence));
      this.nextPipeSequence += 1;
    }

    this.powerTimer -= dt;
    if (this.powerTimer <= 0) {
      this.powerTimer = 7 + Math.random() * 5;
      if (Math.random() < 0.75) this.spawnPowerUp();
    }

    const speedMultiplier = this.slowMotion > 0 ? 0.72 : 1;
    this.pipes.forEach((pipe) => pipe.update(dt, speedMultiplier));
    this.powerUps.forEach((powerUp) => powerUp.update(dt, speedMultiplier));
    this.pipes = this.pipes.filter((pipe) => !pipe.offscreen);
    this.powerUps = this.powerUps.filter((powerUp) => !powerUp.offscreen && !powerUp.collected);

    this.checkScores();
    this.checkPowerUps();
    this.checkCollisions();
    this.updatePowerLabel();
    this.checkAchievements();
  }

  updateScenery(dt) {
    const parallaxSpeed = this.state === "playing" ? this.config.speed : 55;
    this.clouds.forEach((cloud) => {
      cloud.x -= cloud.speed * dt;
      if (cloud.x < -180) {
        cloud.x = this.width + Math.random() * 160;
        cloud.y = 50 + Math.random() * this.height * 0.36;
      }
    });
    this.mountainLayers.forEach((layer) => {
      layer.offset = (layer.offset + parallaxSpeed * layer.speedFactor * dt) % layer.spacing;
    });
    this.trees.forEach((tree) => {
      tree.x -= parallaxSpeed * 0.26 * dt;
      if (tree.x < -80) {
        tree.x = this.width + Math.random() * 80;
        tree.h = 42 + Math.random() * 80;
      }
    });
    this.groundOffset = (this.groundOffset + parallaxSpeed * dt) % 72;
  }

  spawnPowerUp() {
    const types = ["shield", "slow", "double", "ghost"];
    const type = types[Math.floor(Math.random() * types.length)];
    const y = 120 + Math.random() * (this.height - this.groundHeight - 260);
    this.powerUps.push(new PowerUp(this.width + 60, y, type));
  }

  checkScores() {
    this.pipes.forEach((pipe) => {
      if (!pipe.scored && pipe.x + pipe.width < this.player.x) {
        pipe.scored = true;
        const amount = this.player.doubleScore > 0 ? 2 : 1;
        this.score += amount;
        this.streak += amount;
        this.ui.updateScore(this.score);
        this.audio.point();
        this.scoreTexts.push({ x: this.player.x + 34, y: this.player.y - 26, text: `+${amount}`, life: 0.8, alpha: 1 });
        if (this.effectsEnabled) this.particles.score(this.player.x + 38, this.player.y - 26);
        if (pipe.milestone) this.triggerMilestone(pipe.sequence);
      }
    });
  }

  triggerMilestone(sequence) {
    const stage = Math.floor(sequence / 10);
    this.biomeIndex = stage % this.biomes.length;
    this.biomeBlend = 1;
    this.milestoneFlash = 1;
    this.shake = Math.max(this.shake, 10);
    this.milestoneBanner = {
      text: `GATE ${sequence}`,
      subtext: this.biomes[this.biomeIndex].name,
      life: 2.4
    };
    this.ui.toast(`Gate ${sequence}`, this.biomes[this.biomeIndex].name, true);
    if (this.effectsEnabled) {
      this.particles.burst(this.width * 0.5, this.height * 0.32, 70, {
        speed: 300,
        size: 4.4,
        life: 1.25,
        color: this.biomes[this.biomeIndex].accent,
        gravity: 40,
        glow: 24
      });
    }
  }

  checkPowerUps() {
    this.powerUps.forEach((powerUp) => {
      if (powerUp.collidesWith(this.player)) {
        powerUp.collected = true;
        this.activatePower(powerUp.type);
      }
    });
  }

  activatePower(type) {
    const names = {
      shield: "Shield",
      slow: "Slow Motion",
      double: "Double Score",
      ghost: "Ghost Mode"
    };
    if (type === "shield") this.player.applyPower("shield", 7);
    if (type === "ghost") this.player.applyPower("ghost", 5.5);
    if (type === "double") this.player.applyPower("double", 8);
    if (type === "slow") this.slowMotion = 5.8;
    this.ui.toast(names[type], "Activated", true);
    this.audio.point();
    if (this.effectsEnabled) this.particles.score(this.player.x, this.player.y);
  }

  updatePowerLabel() {
    if (this.player.shield > 0) this.ui.updatePower(`Shield ${this.player.shield.toFixed(1)}s`);
    else if (this.player.ghost > 0) this.ui.updatePower(`Ghost ${this.player.ghost.toFixed(1)}s`);
    else if (this.player.doubleScore > 0) this.ui.updatePower(`Double ${this.player.doubleScore.toFixed(1)}s`);
    else if (this.slowMotion > 0) this.ui.updatePower(`Slow ${this.slowMotion.toFixed(1)}s`);
    else this.ui.updatePower("Ready");
  }

  checkCollisions() {
    // Collision uses the player's sampled mask points against exact procedural pipe rectangles.
    const hitGround = this.player.y + this.player.radius > this.height - this.groundHeight;
    const hitCeiling = this.player.y - this.player.radius < -20;
    const hitPipe = this.pipes.some((pipe) => pipe.collidesWith(this.player, this.height));
    if (!hitGround && !hitCeiling && !hitPipe) return;

    if (this.player.shield > 0 && hitPipe) {
      this.player.shield = 0;
      this.player.invulnerable = 0.9;
      this.shake = 8;
      this.audio.collision();
      if (this.effectsEnabled) this.particles.explosion(this.player.x, this.player.y);
      return;
    }
    this.gameOver();
  }

  gameOver() {
    if (this.state !== "playing" || this.recordedGameOver) return;
    this.state = "gameOver";
    this.recordedGameOver = true;
    this.shake = 18;
    this.hitFreeze = 0.08;
    this.audio.collision();
    this.audio.stopMusic();
    if (this.effectsEnabled) this.particles.explosion(this.player.x, this.player.y);
    const stats = this.storage.recordGame(this.score, this.streak);
    this.checkAchievements();
    window.setTimeout(() => this.ui.showGameOver(this.score, stats.highScore), 460);
  }

  checkAchievements() {
    this.achievements.forEach((achievement) => {
      if (achievement.test() && this.storage.unlockAchievement(achievement.id)) {
        this.ui.toast("Achievement Unlocked", achievement.title);
      }
    });
  }

  draw(rawDt) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground(ctx);
    ctx.save();
    if (this.shake > 0 && this.effectsEnabled) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }
    this.pipes.forEach((pipe) => pipe.draw(ctx, this.height, this.effectsEnabled));
    this.powerUps.forEach((powerUp) => powerUp.draw(ctx));
    this.particles.draw(ctx);
    this.drawPlayerWithMotionBlur(ctx, rawDt);
    this.drawScoreTexts(ctx);
    this.drawGround(ctx);
    ctx.restore();
    this.drawOverlay(ctx);
  }

  drawBackground(ctx) {
    // Five parallax layers: animated sky, clouds, mountains, forest, and ground.
    const biome = this.getActiveBiome();
    const sky = ctx.createLinearGradient(0, 0, 0, this.height);
    sky.addColorStop(0, biome.skyTop);
    sky.addColorStop(0.5, biome.skyMid);
    sky.addColorStop(1, biome.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.width, this.height);

    this.drawBiomeAtmosphere(ctx, biome);

    ctx.fillStyle = biome.sun;
    ctx.beginPath();
    ctx.arc(this.width * 0.78, this.height * 0.16, 64 + Math.sin(this.elapsed * 0.35) * 8, 0, Math.PI * 2);
    ctx.fill();

    this.clouds.forEach((cloud) => this.drawCloud(ctx, cloud, biome));
    this.drawMountains(ctx, biome);
    this.drawForest(ctx, biome);
  }

  getActiveBiome() {
    return this.biomes[this.biomeIndex % this.biomes.length];
  }

  drawBiomeAtmosphere(ctx, biome) {
    if (biome.name === "Aurora Night") {
      this.drawStars(ctx);
      const aurora = ctx.createLinearGradient(0, this.height * 0.1, this.width, this.height * 0.5);
      aurora.addColorStop(0, "rgba(45,212,191,0)");
      aurora.addColorStop(0.35, "rgba(45,212,191,0.28)");
      aurora.addColorStop(0.62, "rgba(167,139,250,0.22)");
      aurora.addColorStop(1, "rgba(45,212,191,0)");
      ctx.fillStyle = aurora;
      ctx.beginPath();
      ctx.moveTo(0, this.height * 0.23);
      for (let x = 0; x <= this.width; x += 80) {
        ctx.lineTo(x, this.height * (0.2 + Math.sin(this.elapsed * 0.8 + x * 0.01) * 0.05));
      }
      ctx.lineTo(this.width, this.height * 0.48);
      ctx.lineTo(0, this.height * 0.4);
      ctx.closePath();
      ctx.fill();
    }

    if (this.milestoneFlash > 0 && this.effectsEnabled) {
      ctx.save();
      ctx.globalAlpha = this.milestoneFlash * 0.28;
      ctx.fillStyle = biome.accent;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }
  }

  drawStars(ctx) {
    this.sparkles.forEach((star) => {
      const alpha = 0.35 + Math.sin(this.elapsed * 2 + star.phase) * 0.28;
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0.08, alpha)})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawCloud(ctx, cloud, biome) {
    ctx.save();
    ctx.translate(cloud.x, cloud.y);
    ctx.scale(cloud.scale, cloud.scale);
    ctx.fillStyle = biome.cloud;
    ctx.beginPath();
    ctx.arc(0, 16, 24, 0, Math.PI * 2);
    ctx.arc(28, 8, 31, 0, Math.PI * 2);
    ctx.arc(62, 18, 24, 0, Math.PI * 2);
    ctx.roundRect(-24, 16, 110, 28, 16);
    ctx.fill();
    ctx.restore();
  }

  drawMountains(ctx, biome) {
    const base = this.height - this.groundHeight - 62;
    this.mountainLayers.forEach((layer, layerIndex) => {
      this.drawMountainLayer(ctx, biome, layer, layerIndex, base);
    });
  }

  drawMountainLayer(ctx, biome, layer, layerIndex, base) {
    const alpha = [0.22, 0.34, 0.52][layerIndex];
    const lift = [58, 34, 0][layerIndex];
    const layerBase = base + lift;
    ctx.save();

    const gradient = ctx.createLinearGradient(0, layerBase - this.height * 0.34, 0, layerBase + 80);
    gradient.addColorStop(0, this.hexToRgba(biome.accent, alpha * 0.35));
    gradient.addColorStop(0.46, biome.mountain);
    gradient.addColorStop(1, `rgba(16, 42, 64, ${0.12 + alpha * 0.35})`);
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(-layer.spacing, layerBase + 100);
    layer.points.forEach((point, index) => {
      const x = point.x - layer.offset;
      const next = layer.points[index + 1];
      const peakY = layerBase - point.peak;
      const ridgeY = layerBase - point.ridge;
      if (index === 0) {
        ctx.lineTo(x, ridgeY);
        return;
      }
      const previousX = layer.points[index - 1].x - layer.offset;
      const midX = (previousX + x) * 0.5;
      ctx.quadraticCurveTo(midX, peakY, x, ridgeY);
      if (next) {
        const valleyX = x + (next.x - point.x) * 0.5;
        const valleyY = layerBase - Math.min(point.ridge, next.ridge) * 0.78;
        ctx.quadraticCurveTo(x + layer.spacing * 0.18, ridgeY + 20, valleyX, valleyY);
      }
    });
    ctx.lineTo(this.width + layer.spacing, layerBase + 100);
    ctx.closePath();
    ctx.fill();

    if (layerIndex > 0) {
      this.drawMountainHighlights(ctx, layer, layerBase, alpha);
    }
    ctx.restore();
  }

  drawMountainHighlights(ctx, layer, layerBase, alpha) {
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${0.12 + alpha * 0.22})`;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    layer.points.forEach((point, index) => {
      if (index % 2 === 0) return;
      const x = point.x - layer.offset;
      const peakY = layerBase - point.peak;
      const ridgeY = layerBase - point.ridge;
      ctx.beginPath();
      ctx.moveTo(x - layer.spacing * 0.12, peakY + 20);
      ctx.quadraticCurveTo(x - layer.spacing * 0.03, peakY + 46, x + layer.spacing * 0.08, ridgeY + 18);
      ctx.stroke();

      ctx.fillStyle = `rgba(255,255,255,${0.1 + alpha * 0.18})`;
      ctx.beginPath();
      ctx.moveTo(x - layer.spacing * 0.14, peakY + 16);
      ctx.lineTo(x, peakY - 2);
      ctx.lineTo(x + layer.spacing * 0.11, peakY + 24);
      ctx.quadraticCurveTo(x, peakY + 15, x - layer.spacing * 0.14, peakY + 16);
      ctx.fill();
    });
    ctx.restore();
  }

  hexToRgba(hex, alpha) {
    const clean = hex.replace("#", "");
    const value = parseInt(clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean, 16);
    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;
    return `rgba(${red},${green},${blue},${alpha})`;
  }

  drawForest(ctx, biome) {
    const groundTop = this.height - this.groundHeight;
    this.trees.forEach((tree) => {
      const green = tree.shade > 0.5 ? biome.forestA : biome.forestB;
      ctx.fillStyle = green;
      ctx.beginPath();
      ctx.moveTo(tree.x, groundTop);
      ctx.lineTo(tree.x + 22, groundTop - tree.h);
      ctx.lineTo(tree.x + 44, groundTop);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#7a4f32";
      ctx.fillRect(tree.x + 19, groundTop - 18, 6, 18);
    });
  }

  drawGround(ctx) {
    const top = this.height - this.groundHeight;
    const biome = this.getActiveBiome();
    const gradient = ctx.createLinearGradient(0, top, 0, this.height);
    gradient.addColorStop(0, biome.groundA);
    gradient.addColorStop(0.18, biome.groundB);
    gradient.addColorStop(1, biome.groundC);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, top, this.width, this.groundHeight);

    ctx.fillStyle = "rgba(255,255,255,0.22)";
    for (let x = -72 - this.groundOffset; x < this.width + 72; x += 72) {
      ctx.beginPath();
      ctx.ellipse(x + 36, top + 16, 30, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPlayerWithMotionBlur(ctx, rawDt) {
    if (this.effectsEnabled && this.state === "playing") {
      const speed = Math.abs(this.player.vy);
      const blurCount = Math.min(4, Math.floor(speed / 170));
      for (let i = blurCount; i > 0; i -= 1) {
        ctx.save();
        ctx.globalAlpha = 0.08 * i;
        ctx.translate(0, (this.player.prevY - this.player.y) * i * 0.36);
        this.player.draw(ctx, false);
        ctx.restore();
      }
    }
    this.player.draw(ctx, this.effectsEnabled);
  }

  drawScoreTexts(ctx) {
    this.scoreTexts.forEach((text) => {
      ctx.save();
      ctx.globalAlpha = text.alpha;
      ctx.fillStyle = "#fff3a0";
      ctx.shadowColor = "#ffd166";
      ctx.shadowBlur = 18;
      ctx.font = "900 30px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(text.text, text.x, text.y);
      ctx.restore();
    });
    this.drawMilestoneBanner(ctx);
  }

  drawMilestoneBanner(ctx) {
    if (!this.milestoneBanner) return;
    const alpha = Math.min(1, this.milestoneBanner.life / 0.55, (2.4 - this.milestoneBanner.life) / 0.25);
    const biome = this.getActiveBiome();
    const mobileScale = this.width < 680 ? 0.66 : 1;
    const titleSize = Math.max(24, 44 * mobileScale);
    const subtitleSize = Math.max(12, 18 * mobileScale);
    const y = this.height * (this.width < 680 ? 0.18 : 0.22);
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = biome.accent;
    ctx.shadowBlur = this.width < 680 ? 16 : 26;
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 ${titleSize}px system-ui`;
    ctx.fillText(this.milestoneBanner.text, this.width / 2, y);
    ctx.font = `800 ${subtitleSize}px system-ui`;
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.fillText(this.milestoneBanner.subtext, this.width / 2, y + 42 * mobileScale);
    ctx.restore();
  }

  drawOverlay(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, "rgba(255,255,255,0.08)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0)");
    gradient.addColorStop(1, "rgba(10,25,44,0.18)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.skyboundGame = new SkyboundGame();
});
