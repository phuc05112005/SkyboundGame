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
    // Canvas-only character art: body, wing, beak, eye, shield, and ghost aura.
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (effectsEnabled) {
      ctx.shadowColor = this.shield > 0 ? "#62f3ff" : this.skin.glow;
      ctx.shadowBlur = this.shield > 0 ? 24 : 12;
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
    draw(ctx, skin, wingTime);

    if (shield > 0) {
      ctx.strokeStyle = "rgba(98, 243, 255, 0.72)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 33 + Math.sin(wingTime * 0.5) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (ghost > 0) {
      ctx.globalAlpha = 0.38;
      ctx.strokeStyle = "#c8f7ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(-4, 0, 31, 24, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  static bodyGradient(ctx, skin) {
    const gradient = ctx.createLinearGradient(-20, -20, 24, 24);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.32, skin.body);
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
    ctx.arc(x + size * 0.28, y, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }

  static drawClassic(ctx, skin, wingTime) {
    const wingOffset = Math.sin(wingTime) * 8;
    ctx.fillStyle = Player.bodyGradient(ctx, skin);
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.ellipse(-8, 5 + wingOffset * 0.25, 14, 6, -0.65 + wingOffset * 0.025, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(20, -3);
    ctx.lineTo(34, 3);
    ctx.lineTo(20, 10);
    ctx.closePath();
    ctx.fill();
    Player.drawEye(ctx);
  }

  static drawSwift(ctx, skin, wingTime) {
    const flap = Math.sin(wingTime) * 10;
    ctx.fillStyle = Player.bodyGradient(ctx, skin);
    ctx.beginPath();
    ctx.ellipse(3, 0, 27, 13, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(-34, -18 - flap);
    ctx.lineTo(-18, 9);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-13, 4);
    ctx.lineTo(-34, 22 + flap * 0.4);
    ctx.lineTo(-9, 13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(25, -3);
    ctx.lineTo(39, 1);
    ctx.lineTo(25, 6);
    ctx.closePath();
    ctx.fill();
    Player.drawEye(ctx, 12, -6, 5.8);
  }

  static drawOwl(ctx, skin, wingTime) {
    const flap = Math.sin(wingTime) * 4;
    ctx.fillStyle = Player.bodyGradient(ctx, skin);
    ctx.beginPath();
    ctx.ellipse(0, 1, 22, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.ellipse(-15, 4 + flap, 8, 19, -0.25, 0, Math.PI * 2);
    ctx.ellipse(15, 4 - flap, 8, 19, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(-13, -17);
    ctx.lineTo(-5, -29);
    ctx.lineTo(0, -15);
    ctx.lineTo(5, -29);
    ctx.lineTo(13, -17);
    ctx.closePath();
    ctx.fill();
    Player.drawEye(ctx, -7, -6, 6);
    Player.drawEye(ctx, 7, -6, 6);
  }

  static drawDragon(ctx, skin, wingTime) {
    const flap = Math.sin(wingTime) * 8;
    ctx.fillStyle = Player.bodyGradient(ctx, skin);
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.moveTo(-6, -4);
    ctx.lineTo(-30, -22 - flap);
    ctx.lineTo(-20, 6);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = skin.accent;
    for (let i = -14; i < 16; i += 9) {
      ctx.beginPath();
      ctx.moveTo(i, -13);
      ctx.lineTo(i + 4, -24);
      ctx.lineTo(i + 8, -12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(22, -5);
    ctx.lineTo(37, 0);
    ctx.lineTo(22, 7);
    ctx.closePath();
    ctx.fill();
    Player.drawEye(ctx, 10, -7, 5.5);
  }

  static drawFish(ctx, skin, wingTime) {
    const tail = Math.sin(wingTime) * 6;
    ctx.fillStyle = Player.bodyGradient(ctx, skin);
    ctx.beginPath();
    ctx.ellipse(2, 0, 25, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-38, -14 - tail);
    ctx.lineTo(-34, 0);
    ctx.lineTo(-38, 14 + tail);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(-3, -2);
    ctx.lineTo(-11, -18);
    ctx.lineTo(10, -8);
    ctx.closePath();
    ctx.fill();
    Player.drawEye(ctx, 13, -5, 5.5);
  }

  static drawRocket(ctx, skin, wingTime) {
    ctx.fillStyle = Player.bodyGradient(ctx, skin);
    ctx.beginPath();
    ctx.ellipse(4, 0, 28, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(43, -8);
    ctx.lineTo(43, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.moveTo(-12, 10);
    ctx.lineTo(-28, 22);
    ctx.lineTo(-17, 2);
    ctx.closePath();
    ctx.moveTo(-12, -10);
    ctx.lineTo(-28, -22);
    ctx.lineTo(-17, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `rgba(255, 220, 100, ${0.55 + Math.sin(wingTime) * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(-24, -7);
    ctx.lineTo(-48, 0);
    ctx.lineTo(-24, 7);
    ctx.closePath();
    ctx.fill();
    Player.drawEye(ctx, 10, -4, 5);
  }

  static drawButterfly(ctx, skin, wingTime) {
    const flap = Math.sin(wingTime) * 8;
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.ellipse(-14, -8 - flap, 16, 22, -0.55, 0, Math.PI * 2);
    ctx.ellipse(-13, 11 + flap * 0.4, 14, 17, 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.ellipse(12, -8 + flap, 16, 22, 0.55, 0, Math.PI * 2);
    ctx.ellipse(11, 11 - flap * 0.4, 14, 17, -0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = Player.bodyGradient(ctx, skin);
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    Player.drawEye(ctx, 4, -15, 3.8);
  }

  static drawBat(ctx, skin, wingTime) {
    const flap = Math.sin(wingTime) * 9;
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.moveTo(-1, -2);
    ctx.lineTo(-36, -18 - flap);
    ctx.lineTo(-25, 8);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-4, 11);
    ctx.closePath();
    ctx.moveTo(1, -2);
    ctx.lineTo(36, -18 + flap);
    ctx.lineTo(25, 8);
    ctx.lineTo(14, 0);
    ctx.lineTo(4, 11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = Player.bodyGradient(ctx, skin);
    ctx.beginPath();
    ctx.ellipse(0, 1, 16, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.moveTo(-9, -10);
    ctx.lineTo(-4, -22);
    ctx.lineTo(0, -10);
    ctx.lineTo(4, -22);
    ctx.lineTo(9, -10);
    ctx.closePath();
    ctx.fill();
    Player.drawEye(ctx, -5, -3, 4);
    Player.drawEye(ctx, 6, -3, 4);
  }

  static drawPhoenix(ctx, skin, wingTime) {
    const flap = Math.sin(wingTime) * 11;
    ctx.fillStyle = Player.bodyGradient(ctx, skin);
    ctx.beginPath();
    ctx.ellipse(2, 0, 23, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.moveTo(-6, -3);
    ctx.lineTo(-34, -28 - flap);
    ctx.lineTo(-22, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = skin.accent;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-18 - i * 4, 5);
      ctx.quadraticCurveTo(-38 - i * 8, 15 + i * 5, -44 - i * 9, 36 + Math.sin(wingTime + i) * 5);
      ctx.quadraticCurveTo(-24 - i * 5, 24, -10, 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(20, -5);
    ctx.lineTo(35, 2);
    ctx.lineTo(20, 9);
    ctx.closePath();
    ctx.fill();
    Player.drawEye(ctx, 9, -7, 5.8);
  }
}
