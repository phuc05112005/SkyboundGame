class Player {
  constructor(x, y) {
    this.startX = x;
    this.startY = y;
    this.radius = 21;
    this.skin = {
      shape: "classic",
      body: "#ffd166",
      wing: "#ffbf69",
      accent: "#ff7b54",
      glow: "#ffd166"
    };
    this.reset();
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.prevX = this.x;
    this.prevY = this.y;
    this.vy = 0;
    this.rotation = 0;
    this.wingTime = 0;
    this.invulnerable = 0;
    this.shield = 0;
    this.ghost = 0;
    this.doubleScore = 0;
  }

  flap() {
    this.vy = -420;
    this.rotation = -0.45;
  }

  applyPower(type, duration) {
    if (type === "shield") this.shield = duration;
    if (type === "ghost") this.ghost = duration;
    if (type === "double") this.doubleScore = duration;
  }

  setSkin(skin) {
    this.skin = { ...this.skin, ...skin };
  }

  update(dt, physics) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.vy += physics.gravity * dt;
    this.vy = Math.min(this.vy, physics.maxFall);
    this.y += this.vy * dt;
    this.rotation += ((this.vy / physics.maxFall) * 1.05 - this.rotation) * Math.min(1, dt * 8);
    this.wingTime += dt * (this.vy < 0 ? 18 : 10);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.shield = Math.max(0, this.shield - dt);
    this.ghost = Math.max(0, this.ghost - dt);
    this.doubleScore = Math.max(0, this.doubleScore - dt);
  }

  getHitCircle() {
    return {
      x: this.x - 1,
      y: this.y + 1,
      radius: this.radius * 0.74
    };
  }

  getMaskPoints() {
    // The procedural bird is represented by dense points around its true body shape for precise collisions.
    const points = [];
    const circle = this.getHitCircle();
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
      points.push({
        x: circle.x + Math.cos(angle) * circle.radius,
        y: circle.y + Math.sin(angle) * circle.radius
      });
    }
    points.push({ x: circle.x, y: circle.y });
    return points;
  }

  draw(ctx, effectsEnabled) {
    // Canvas-only character art: body, wing, beak, eye, and shape-aware auras.
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (effectsEnabled && (this.shield > 0 || this.ghost > 0)) {
      ctx.shadowColor = this.shield > 0 ? "#62f3ff" : "#c8f7ff";
      ctx.shadowBlur = this.shield > 0 ? 24 : 18;
    }
    Player.drawSkin(ctx, this.skin, this.wingTime, effectsEnabled, this.shield, this.ghost);

    ctx.restore();
  }

  static drawSkin(ctx, skin, wingTime, effectsEnabled = true, shield = 0, ghost = 0) {
    const draw = {
      classic: Player.drawClassic,
      swift: Player.drawSwift,
      owl: Player.drawOwl,
      dragon: Player.drawDragon,
      fish: Player.drawFish,
      rocket: Player.drawRocket,
      butterfly: Player.drawButterfly,
      bat: Player.drawBat,
      phoenix: Player.drawPhoenix
    }[skin.shape] || Player.drawClassic;

    if (effectsEnabled && (shield > 0 || ghost > 0)) Player.drawAura(ctx, skin, wingTime, shield, ghost);
    draw(ctx, skin, wingTime);

    if (shield > 0) {
      const bounds = Player.getAuraBounds(skin, wingTime);
      const pulse = 1 + Math.sin(wingTime * 0.5) * 0.025;
      ctx.save();
      ctx.strokeStyle = "rgba(98, 243, 255, 0.78)";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#62f3ff";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.ellipse(bounds.x, bounds.y, bounds.rx * pulse, bounds.ry * pulse, bounds.rotation, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (ghost > 0) {
      const bounds = Player.getAuraBounds(skin, wingTime);
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.strokeStyle = "#c8f7ff";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 7]);
      ctx.lineDashOffset = -wingTime * 1.6;
      ctx.beginPath();
      ctx.ellipse(bounds.x, bounds.y, bounds.rx * 0.92, bounds.ry * 0.92, bounds.rotation, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  static getAuraBounds(skin, wingTime = 0) {
    const flap = Math.abs(Math.sin(wingTime));
    const bounds = {
      classic: { x: 1, y: 1, rx: 40, ry: 30, rotation: 0.02 },
      swift: { x: -1, y: 0, rx: 48, ry: 34 + flap * 5, rotation: -0.08 },
      owl: { x: 0, y: 0, rx: 35, ry: 42, rotation: 0 },
      dragon: { x: -1, y: 0, rx: 48, ry: 37 + flap * 4, rotation: -0.04 },
      fish: { x: -2, y: 0, rx: 47, ry: 30 + flap * 3, rotation: 0 },
      rocket: { x: -2, y: 0, rx: 56, ry: 28, rotation: 0 },
      butterfly: { x: 0, y: 0, rx: 43, ry: 48 + flap * 4, rotation: 0 },
      bat: { x: 0, y: -1, rx: 52, ry: 36 + flap * 5, rotation: 0 },
      phoenix: { x: -4, y: 3, rx: 55, ry: 45 + flap * 4, rotation: -0.08 }
    };
    return bounds[skin.shape] || bounds.classic;
  }

  static drawAura(ctx, skin, wingTime, shield, ghost) {
    const bounds = Player.getAuraBounds(skin, wingTime);
    const pulse = Math.sin(wingTime * 0.42);
    const glowColor = shield > 0 ? "#62f3ff" : ghost > 0 ? "#c8f7ff" : skin.glow;
    const alpha = shield > 0 || ghost > 0 ? 0.24 : 0.13;
    const ringScale = 1 + pulse * 0.025;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = shield > 0 || ghost > 0 ? 22 : 14;
    ctx.beginPath();
    ctx.ellipse(
      bounds.x,
      bounds.y,
      bounds.rx * ringScale,
      bounds.ry * ringScale,
      bounds.rotation,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }

  static bodyGradient(ctx, skin) {
    const gradient = ctx.createRadialGradient(-5, -5, 2, 0, 0, 26);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.3, skin.body);
    gradient.addColorStop(1, skin.accent);
    return gradient;
  }

  static drawEye(ctx, x = 8, y = -8, size = 7) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#17344d";
    ctx.beginPath();
    ctx.arc(x + size * 0.25, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x + size * 0.45, y - size * 0.15, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  static drawClassic(ctx, skin, wingTime) {
    const wingOffset = Math.sin(wingTime) * 12;
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.quadraticCurveTo(-35, -5, -35, 5);
    ctx.quadraticCurveTo(-25, 10, -20, 5);
    ctx.fill();
    ctx.fillStyle = Player.bodyGradient(ctx, skin);
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.ellipse(5, 8, 15, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(22, -2);
    ctx.quadraticCurveTo(38, -3, 36, 4);
    ctx.quadraticCurveTo(25, 8, 20, 8);
    ctx.fill();
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.ellipse(-5, 2 + wingOffset * 0.3, 16, 9, -0.5 + wingOffset * 0.03, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.ellipse(-5, 2 + wingOffset * 0.3, 12, 5, -0.5 + wingOffset * 0.03, 0, Math.PI * 2);
    ctx.fill();
    Player.drawEye(ctx, 10, -6, 6);
  }

  static drawSwift(ctx, skin, wingTime) {
    const flap = Math.sin(wingTime) * 12;
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(-40, -10);
    ctx.lineTo(-25, 2);
    ctx.lineTo(-40, 15);
    ctx.lineTo(-15, 8);
    ctx.fill();
    ctx.fillStyle = Player.bodyGradient(ctx, skin);
    ctx.beginPath();
    ctx.ellipse(3, 2, 28, 12, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(28, -2);
    ctx.lineTo(42, 2);
    ctx.lineTo(25, 8);
    ctx.fill();
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.moveTo(-2, 2);
    ctx.quadraticCurveTo(-20, -15 - flap, -38, -25 - flap);
    ctx.quadraticCurveTo(-15, 0, -12, 10);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.moveTo(-2, 2);
    ctx.quadraticCurveTo(-15, -10 - flap, -25, -15 - flap);
    ctx.lineTo(-12, 5);
    ctx.fill();
    Player.drawEye(ctx, 14, -4, 4.5);
  }

  static drawOwl(ctx, skin, wingTime) {
    const flap = Math.sin(wingTime) * 6;
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.ellipse(-16, 2 + flap, 10, 22, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = Player.bodyGradient(ctx, skin);
    ctx.beginPath();
    ctx.ellipse(0, 4, 24, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 12, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
       ctx.beginPath();
       ctx.moveTo(-5 + i * 5, 10 + (i % 2) * 4);
       ctx.quadraticCurveTo(-5 + i * 5 + 2, 15 + (i % 2) * 4, -5 + i * 5 + 4, 10 + (i % 2) * 4);
       ctx.stroke();
    }
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(-15, -14);
    ctx.lineTo(-20, -28);
    ctx.lineTo(-5, -18);
    ctx.lineTo(5, -18);
    ctx.lineTo(20, -28);
    ctx.lineTo(15, -14);
    ctx.fill();
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(-4, -2);
    ctx.lineTo(4, -2);
    ctx.lineTo(0, 6);
    ctx.fill();
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.ellipse(14, 4 - flap, 10, 20, 0.2, 0, Math.PI * 2);
    ctx.fill();
    Player.drawEye(ctx, -9, -8, 8);
    Player.drawEye(ctx, 9, -8, 8);
  }

  static drawDragon(ctx, skin, wingTime) {
    const flap = Math.sin(wingTime) * 12;
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(-15, 2);
    ctx.quadraticCurveTo(-35, 15, -45, 5);
    ctx.quadraticCurveTo(-30, 20, -20, 8);
    ctx.fill();
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.moveTo(-45, 5);
    ctx.lineTo(-52, 0);
    ctx.lineTo(-40, 8);
    ctx.fill();
    ctx.fillStyle = Player.bodyGradient(ctx, skin);
    ctx.beginPath();
    ctx.ellipse(0, 2, 28, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.ellipse(2, 10, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 2;
    for (let i = -10; i <= 10; i += 6) {
       ctx.beginPath();
       ctx.moveTo(i, 6);
       ctx.lineTo(i - 4, 14);
       ctx.stroke();
    }
    ctx.fillStyle = skin.accent;
    for (let i = -12; i < 18; i += 9) {
      ctx.beginPath();
      ctx.moveTo(i, -12);
      ctx.lineTo(i + 3, -22 + (i === -12 ? 4 : 0));
      ctx.lineTo(i + 8, -10);
      ctx.fill();
    }
    ctx.fillStyle = skin.body;
    ctx.beginPath();
    ctx.moveTo(20, -5);
    ctx.quadraticCurveTo(40, -5, 38, 4);
    ctx.lineTo(25, 8);
    ctx.fill();
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(18, -12);
    ctx.quadraticCurveTo(10, -25, 2, -22);
    ctx.quadraticCurveTo(10, -18, 15, -5);
    ctx.fill();
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.moveTo(-5, -2);
    ctx.quadraticCurveTo(-15, -25 - flap, -35, -30 - flap);
    ctx.quadraticCurveTo(-20, -10 - flap * 0.5, -30, 0);
    ctx.quadraticCurveTo(-15, 2, -10, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, -2);
    ctx.lineTo(-35, -30 - flap);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-15, -13 - flap * 0.5);
    ctx.lineTo(-30, 0);
    ctx.stroke();
    Player.drawEye(ctx, 16, -4, 4.5);
  }

  static drawFish(ctx, skin, wingTime) {
    const tail = Math.sin(wingTime) * 10;
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.quadraticCurveTo(-45, -20 - tail, -40, -5);
    ctx.lineTo(-45, 0);
    ctx.lineTo(-40, 5);
    ctx.quadraticCurveTo(-45, 20 + tail, -20, 0);
    ctx.fill();
    ctx.fillStyle = Player.bodyGradient(ctx, skin);
    ctx.beginPath();
    ctx.ellipse(4, 0, 26, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    for (let x = -5; x <= 10; x += 7) {
      for (let y = -8; y <= 8; y += 6) {
         ctx.beginPath();
         ctx.arc(x, y, 4, -Math.PI * 0.5, Math.PI * 0.5);
         ctx.stroke();
      }
    }
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(-5, -15);
    ctx.quadraticCurveTo(-15, -28, -22, -12);
    ctx.lineTo(-10, -16);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-5, 15);
    ctx.quadraticCurveTo(-15, 25, -20, 10);
    ctx.fill();
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.ellipse(-2, 4, 12, 6, -0.2 + tail * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.arc(29, -2, 4, 0, Math.PI * 2);
    ctx.arc(28, 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.arc(12, 2, 8, -Math.PI * 0.3, Math.PI * 0.3);
    ctx.stroke();
    Player.drawEye(ctx, 18, -4, 5);
  }

  static drawRocket(ctx, skin, wingTime) {
    const flameSize = 0.8 + Math.sin(wingTime * 4) * 0.3;
    ctx.fillStyle = `rgba(255, 150, 0, ${0.7 + flameSize * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(-25, -6);
    ctx.lineTo(-25 - 30 * flameSize, 0);
    ctx.lineTo(-25, 6);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 255, 100, 1)`;
    ctx.beginPath();
    ctx.moveTo(-25, -3);
    ctx.lineTo(-25 - 15 * flameSize, 0);
    ctx.lineTo(-25, 3);
    ctx.fill();
    const grad = ctx.createLinearGradient(-20, -15, 20, 15);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.4, skin.body);
    grad.addColorStop(1, "#555555");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(4, 0, 30, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(15, -13);
    ctx.lineTo(40, 0);
    ctx.lineTo(15, 13);
    ctx.fill();
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.moveTo(-15, -10);
    ctx.lineTo(-25, -28);
    ctx.lineTo(-5, -13);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-15, 10);
    ctx.lineTo(-25, 28);
    ctx.lineTo(-5, 13);
    ctx.fill();
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.ellipse(-12, 0, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a5d8ff";
    ctx.beginPath();
    ctx.arc(8, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(6, -2, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  static drawButterfly(ctx, skin, wingTime) {
    const flap = Math.sin(wingTime) * 12;
    ctx.strokeStyle = skin.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, -8);
    ctx.quadraticCurveTo(10, -20, 20, -18);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(20, -18, 2, 0, Math.PI * 2);
    ctx.fillStyle = skin.accent;
    ctx.fill();
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.ellipse(-5, -6 - flap * 0.8, 16, 26, -0.6, 0, Math.PI * 2);
    ctx.ellipse(-5, 6 + flap * 0.5, 12, 20, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.ellipse(6, -8 + flap, 18, 28, 0.5, 0, Math.PI * 2);
    ctx.ellipse(6, 12 - flap * 0.5, 14, 22, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(14, -18 + flap, 4, 0, Math.PI * 2);
    ctx.arc(-2, 22 - flap * 0.5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = Player.bodyGradient(ctx, skin);
    ctx.beginPath();
    ctx.ellipse(2, 0, 8, 24, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1;
    for (let y = -15; y <= 15; y += 5) {
       ctx.beginPath();
       ctx.moveTo(-4, y);
       ctx.lineTo(8, y + 2);
       ctx.stroke();
    }
    Player.drawEye(ctx, 4, -16, 4);
  }

  static drawBat(ctx, skin, wingTime) {
    const flap = Math.sin(wingTime) * 14;
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.moveTo(-5, -2);
    ctx.quadraticCurveTo(-20, -25 - flap, -42, -20 - flap);
    ctx.quadraticCurveTo(-30, -5, -20, 10);
    ctx.quadraticCurveTo(-15, -2, -5, 12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5, -2);
    ctx.quadraticCurveTo(20, -25 + flap * 0.5, 42, -20 + flap * 0.5);
    ctx.quadraticCurveTo(30, -5, 20, 10);
    ctx.quadraticCurveTo(15, -2, 5, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, -2);
    ctx.lineTo(-42, -20 - flap);
    ctx.moveTo(-5, -2);
    ctx.lineTo(-20, 10);
    ctx.stroke();
    ctx.fillStyle = Player.bodyGradient(ctx, skin);
    ctx.beginPath();
    ctx.ellipse(0, 4, 15, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.lineTo(-14, -26);
    ctx.lineTo(0, -12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -10);
    ctx.lineTo(14, -26);
    ctx.lineTo(0, -12);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(-3, 8);
    ctx.lineTo(-2, 12);
    ctx.lineTo(-1, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(3, 8);
    ctx.lineTo(2, 12);
    ctx.lineTo(1, 8);
    ctx.fill();
    Player.drawEye(ctx, -5, -2, 4);
    Player.drawEye(ctx, 5, -2, 4);
  }

  static drawPhoenix(ctx, skin, wingTime) {
    const flap = Math.sin(wingTime) * 15;
    ctx.shadowColor = "rgba(255, 100, 0, 0.8)";
    ctx.shadowBlur = 20;
    ctx.fillStyle = skin.accent;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const tailFlap = Math.sin(wingTime * 2 + i) * 8;
      ctx.moveTo(-15, 5);
      ctx.quadraticCurveTo(-35, 20 + i * 10, -50 - i * 15, 30 + tailFlap);
      ctx.quadraticCurveTo(-25, 25 + i * 5, -10, 12);
      ctx.fill();
    }
    ctx.fillStyle = Player.bodyGradient(ctx, skin);
    ctx.beginPath();
    ctx.ellipse(2, 2, 24, 16, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.quadraticCurveTo(-20, -35 - flap, -40, -45 - flap);
    ctx.quadraticCurveTo(-20, -10 - flap * 0.5, -25, 10);
    ctx.quadraticCurveTo(-15, 0, -5, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 100, 0.6)";
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.quadraticCurveTo(-15, -20 - flap, -25, -25 - flap);
    ctx.lineTo(-15, 2);
    ctx.fill();
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(10, -10);
    ctx.quadraticCurveTo(0, -25, -10, -22);
    ctx.quadraticCurveTo(5, -20, 15, -5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(15, -8);
    ctx.quadraticCurveTo(5, -20, -2, -18);
    ctx.quadraticCurveTo(10, -15, 18, -3);
    ctx.fill();
    ctx.fillStyle = "#ffcc00";
    ctx.beginPath();
    ctx.moveTo(22, -2);
    ctx.lineTo(38, 0);
    ctx.lineTo(22, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
    Player.drawEye(ctx, 12, -4, 5);
  }
}
