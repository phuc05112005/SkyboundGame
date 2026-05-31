class PipePair {
  constructor(x, canvasHeight, groundHeight, config, sequence = 1) {
    this.x = x;
    this.width = config.pipeWidth;
    this.speed = config.speed;
    this.gap = config.gap;
    this.groundHeight = groundHeight;
    this.sequence = sequence;
    this.milestone = sequence > 0 && sequence % 10 === 0;
    this.milestoneTier = this.milestone ? sequence / 10 : 0;
    this.scored = false;
    this.passed = false;
    this.capHeight = 26;
    this.phase = Math.random() * Math.PI * 2;
    this.setGap(canvasHeight, config);
  }

  setGap(canvasHeight, config) {
    const topLimit = 100;
    const bottomLimit = canvasHeight - this.groundHeight - this.gap - 90;
    this.gapY = topLimit + Math.random() * Math.max(1, bottomLimit - topLimit);
    if (config.verticalBias) this.gapY += Math.sin(Date.now() * 0.001) * config.verticalBias;
  }

  update(dt, speedMultiplier = 1) {
    this.x -= this.speed * speedMultiplier * dt;
    this.phase += dt * 4.4;
  }

  draw(ctx, height, effectsEnabled) {
    const topHeight = this.gapY;
    const bottomY = this.gapY + this.gap;
    const bottomHeight = height - this.groundHeight - bottomY;
    if (this.milestone && effectsEnabled) this.drawMilestoneAura(ctx, height);
    this.drawPipe(ctx, this.x, 0, this.width, topHeight, true, effectsEnabled);
    this.drawPipe(ctx, this.x, bottomY, this.width, bottomHeight, false, effectsEnabled);
  }

  drawPipe(ctx, x, y, width, height, top, effectsEnabled) {
    if (height <= 0) return;
    ctx.save();
    const palette = this.getPalette();
    if (effectsEnabled) {
      ctx.shadowColor = this.milestone ? palette.glow : "rgba(0, 0, 0, 0.24)";
      ctx.shadowBlur = this.milestone ? 34 + Math.sin(this.phase) * 8 : 18;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 8;
    }
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, palette.dark);
    gradient.addColorStop(0.42, palette.light);
    gradient.addColorStop(1, palette.mid);
    ctx.fillStyle = gradient;
    this.roundRect(ctx, x, y, width, height, 10);
    ctx.fill();

    const capY = top ? y + height - this.capHeight : y;
    ctx.fillStyle = palette.cap;
    this.roundRect(ctx, x - 7, capY, width + 14, this.capHeight, 8);
    ctx.fill();

    if (this.milestone) {
      this.drawMilestoneDetails(ctx, x, y, width, height, palette, top);
    }

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + 10, y + 8, 8, Math.max(0, height - 16));
    ctx.restore();
  }

  drawMilestoneAura(ctx, height) {
    const palette = this.getPalette();
    ctx.save();
    ctx.globalAlpha = 0.16 + Math.sin(this.phase) * 0.04;
    const beam = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
    beam.addColorStop(0, "rgba(255,255,255,0)");
    beam.addColorStop(0.5, palette.beam);
    beam.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = beam;
    ctx.fillRect(this.x - 26, this.gapY + 8, this.width + 52, this.gap - 16);

    const pulse = ctx.createRadialGradient(
      this.x + this.width / 2,
      this.gapY + this.gap / 2,
      8,
      this.x + this.width / 2,
      this.gapY + this.gap / 2,
      this.gap * 0.72
    );
    pulse.addColorStop(0, palette.beam);
    pulse.addColorStop(0.42, "rgba(255,255,255,0.08)");
    pulse.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = pulse;
    ctx.fillRect(this.x - this.gap * 0.35, this.gapY - 10, this.width + this.gap * 0.7, this.gap + 20);
    ctx.restore();
  }

  drawMilestoneDetails(ctx, x, y, width, height, palette, top) {
    const stripeY = top ? y + height - this.capHeight - 10 : y + this.capHeight + 10;
    const stripeHeight = Math.min(18, Math.max(8, height * 0.16));
    const shine = ctx.createLinearGradient(x, y, x + width, y);
    shine.addColorStop(0, "rgba(255,255,255,0)");
    shine.addColorStop(0.5, "rgba(255,255,255,0.46)");
    shine.addColorStop(1, "rgba(255,255,255,0)");

    ctx.save();
    ctx.globalAlpha = 0.68 + Math.sin(this.phase) * 0.12;
    ctx.fillStyle = shine;
    this.roundRect(ctx, x + 8, stripeY, width - 16, stripeHeight, 7);
    ctx.fill();

    ctx.globalAlpha = 0.82;
    ctx.strokeStyle = palette.ring;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 8, stripeY + stripeHeight * 0.5);
    ctx.lineTo(x + width - 8, stripeY + stripeHeight * 0.5);
    ctx.stroke();

    ctx.fillStyle = palette.ring;
    for (let dotX = x + 16; dotX < x + width - 10; dotX += 16) {
      const dotY = stripeY + stripeHeight * 0.5 + Math.sin(this.phase + dotX * 0.05) * 2;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + width - 18, y + 10, 5, Math.max(0, height - 20));
    ctx.restore();
  }

  getPalette() {
    if (!this.milestone) {
      return {
        dark: "#1f9c68",
        mid: "#14784f",
        light: "#67d98b",
        cap: "#76e39a",
        glow: "rgba(0, 0, 0, 0.24)",
        ring: "rgba(255,255,255,0.55)",
        beam: "rgba(255,255,255,0.22)"
      };
    }
    const palettes = [
      { dark: "#7c3aed", mid: "#4c1d95", light: "#c084fc", cap: "#ddd6fe", glow: "rgba(192,132,252,0.72)", ring: "rgba(255,255,255,0.9)", beam: "rgba(216,180,254,0.55)" },
      { dark: "#0891b2", mid: "#155e75", light: "#67e8f9", cap: "#a5f3fc", glow: "rgba(103,232,249,0.72)", ring: "rgba(236,254,255,0.94)", beam: "rgba(103,232,249,0.5)" },
      { dark: "#d97706", mid: "#92400e", light: "#fcd34d", cap: "#fde68a", glow: "rgba(252,211,77,0.76)", ring: "rgba(255,251,235,0.95)", beam: "rgba(251,191,36,0.52)" },
      { dark: "#e11d48", mid: "#881337", light: "#fb7185", cap: "#fecdd3", glow: "rgba(251,113,133,0.74)", ring: "rgba(255,241,242,0.92)", beam: "rgba(251,113,133,0.5)" }
    ];
    return palettes[(this.milestoneTier - 1) % palettes.length];
  }

  roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  collidesWith(player, canvasHeight) {
    // Pixel-perfect style test for generated art: sample the player's mask against pipe solids.
    if (player.ghost > 0) return false;
    const points = player.getMaskPoints();
    const bottomY = this.gapY + this.gap;
    const pipeRects = [
      { x: this.x, y: 0, width: this.width, height: this.gapY },
      { x: this.x, y: bottomY, width: this.width, height: canvasHeight - this.groundHeight - bottomY }
    ];
    return points.some((point) => pipeRects.some((rect) => (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    )));
  }

  get offscreen() {
    return this.x + this.width < -20;
  }
}

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 17;
    this.vx = 130;
    this.phase = Math.random() * Math.PI * 2;
    this.collected = false;
  }

  update(dt, speedMultiplier = 1) {
    this.x -= this.vx * speedMultiplier * dt;
    this.phase += dt * 5;
  }

  draw(ctx) {
    const colors = {
      shield: "#62f3ff",
      slow: "#b4f8c8",
      double: "#ffe066",
      ghost: "#d6ccff"
    };
    ctx.save();
    ctx.translate(this.x, this.y + Math.sin(this.phase) * 5);
    ctx.shadowColor = colors[this.type];
    ctx.shadowBlur = 20;
    const orb = ctx.createRadialGradient(-6, -7, 2, 0, 0, this.radius + 4);
    orb.addColorStop(0, "#ffffff");
    orb.addColorStop(0.35, colors[this.type]);
    orb.addColorStop(1, "rgba(23,52,77,0.88)");
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 2, 0, Math.PI * 2);
    ctx.stroke();

    this.drawIcon(ctx, colors[this.type]);
    ctx.restore();
  }

  drawIcon(ctx, color) {
    ctx.save();
    ctx.fillStyle = "#10263b";
    ctx.strokeStyle = "#10263b";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (this.type === "shield") {
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(10, -5);
      ctx.quadraticCurveTo(8, 8, 0, 12);
      ctx.quadraticCurveTo(-8, 8, -10, -5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(0, 8);
      ctx.stroke();
    }

    if (this.type === "slow") {
      ctx.beginPath();
      ctx.arc(0, 1, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 1);
      ctx.lineTo(0, -6);
      ctx.moveTo(0, 1);
      ctx.lineTo(6, 5);
      ctx.stroke();
      ctx.fillStyle = "#10263b";
      ctx.fillRect(-4, -13, 8, 3);
    }

    if (this.type === "double") {
      ctx.font = "900 14px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("x2", 0, 1);
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(0, 0, 12, -0.8, 0.8);
      ctx.stroke();
    }

    if (this.type === "ghost") {
      ctx.beginPath();
      ctx.moveTo(-9, 9);
      ctx.lineTo(-9, -2);
      ctx.quadraticCurveTo(-9, -11, 0, -11);
      ctx.quadraticCurveTo(9, -11, 9, -2);
      ctx.lineTo(9, 9);
      ctx.lineTo(5, 6);
      ctx.lineTo(1, 9);
      ctx.lineTo(-3, 6);
      ctx.lineTo(-7, 9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(-3, -2, 1.8, 0, Math.PI * 2);
      ctx.arc(4, -2, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  collidesWith(player) {
    const circle = player.getHitCircle();
    const dx = this.x - circle.x;
    const dy = this.y - circle.y;
    return Math.hypot(dx, dy) < this.radius + circle.radius;
  }

  get offscreen() {
    return this.x + this.radius < -20;
  }
}
