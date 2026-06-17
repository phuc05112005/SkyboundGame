class VerticalObstacle {
  constructor(y, canvasWidth, config, sequence = 1, opts = {}) {
    this.y = y;
    this.canvasWidth = canvasWidth;
    this.height = 40;
    this.sequence = sequence;
    this.scored = false;

    this.opts = opts;

    // Difficulty comes from the level curriculum (if provided) or falls back to sequence.
    const difficulty = Number.isFinite(opts.difficulty)
      ? Math.max(0, Math.min(1, opts.difficulty))
      : Math.min(1, sequence / 40);

    // 5 core obstacle types (aligned with draw logic):
    const allowed = ["centered-pair", "rotating-ring", "sliding-gap", "expanding-gap", "swinging-hammer"];
    const requested = opts.type;
    this.type = allowed.includes(requested) ? requested : allowed[Math.floor(Math.random() * allowed.length)];

    this.t = 0;
    this.angle = Math.random() * Math.PI * 2;

    // Shared sizing rules
    const baseGap = 250 - difficulty * 70; // smaller with difficulty
    const gapJitter = 14;
    this.gap = Math.max(160, baseGap + (Math.random() - 0.5) * gapJitter);

    // Visual thickness
    this.barHeight = 26;
    this.ringRadius = Math.round(128 + (1 - difficulty) * 14);
    this.ringThickness = Math.round(22 + difficulty * 10);

    // Drift parameters
    this.driftAmplitude = Math.max(22, this.canvasWidth * 0.12) * (0.25 + difficulty * 0.75);
    this.driftSpeed = (0.7 + difficulty * 1.6);

    // Rotation params (kept subtle for playability)
    this.rotationSpeed = (0.22 + difficulty * 0.58) * (Math.random() > 0.5 ? 1 : -1);

    // Difficulty-aware motion (used in update)
    this.speed = config.speed * (0.18 + difficulty * 0.20);
  }

  update(dt, worldSpeed) {
    this.y += worldSpeed * dt;
    this.angle += dt * this.rotationSpeed;

    if (this.type === "sliding-gap") {
      this.offsetX = Math.sin(this.angle) * (this.canvasWidth * 0.35);
    } else if (this.type === "centered-pair") {
      this.gapOffset = Math.sin(this.angle * 1.5) * 30;
    } else if (this.type === "expanding-gap") {
      this.expandOffset = (Math.sin(this.angle * 2) + 1) * 40;
    } else if (this.type === "swinging-hammer") {
      this.hammerAngle = Math.sin(this.angle) * 1.2;
    }
  }

  draw(ctx, effectsEnabled, biome) {
    const color = biome ? biome.accent : "#fff";
    const secondary = biome ? biome.mountain : "#000";
    
    ctx.save();
    ctx.translate(this.canvasWidth / 2, this.y);

    if (effectsEnabled) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
    }

    switch(this.type) {
      case "centered-pair": this.drawCenteredPair(ctx, color, secondary); break;
      case "rotating-ring": this.drawRotatingRing(ctx, color, secondary); break;
      case "sliding-gap": this.drawSlidingGap(ctx, color, secondary); break;
      case "expanding-gap": this.drawExpandingGap(ctx, color, secondary); break;
      case "swinging-hammer": this.drawSwingingHammer(ctx, color, secondary); break;
    }

    ctx.restore();
  }

  drawCenteredPair(ctx, color, secondary) {
    const halfGap = (this.gap + (this.gapOffset || 0)) / 2;
    const barWidth = this.canvasWidth;
    const barHeight = 25;

    const grad = ctx.createLinearGradient(0, 0, 0, barHeight);
    grad.addColorStop(0, color);
    grad.addColorStop(1, secondary);
    ctx.fillStyle = grad;

    this.roundRect(ctx, -halfGap - barWidth, 0, barWidth, barHeight, 8);
    ctx.fill();
    this.roundRect(ctx, halfGap, 0, barWidth, barHeight, 8);
    ctx.fill();
  }

  drawRotatingRing(ctx, color, secondary) {
    const radius = 135;
    const thickness = 28;
    const gapAngle = 1.3 - Math.min(0.4, this.sequence * 0.01);

    ctx.rotate(this.angle);

    // Outer glow for the ring
      ctx.save();
    ctx.globalAlpha = 0.3;
      ctx.strokeStyle = color;
    ctx.lineWidth = thickness + 8;
      ctx.beginPath();
    ctx.arc(0, 0, radius, gapAngle / 2, Math.PI * 2 - gapAngle / 2);
      ctx.stroke();
      ctx.restore();

    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = "round";

    // Draw main arc
    ctx.beginPath();
    ctx.arc(0, 0, radius, gapAngle / 2, Math.PI * 2 - gapAngle / 2);
    ctx.stroke();

    // Shiny top highlight
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, radius + thickness/2 - 4, gapAngle / 2 + 0.2, Math.PI * 2 - gapAngle / 2 - 0.2);
    ctx.stroke();
  }

  drawSlidingGap(ctx, color, secondary) {
    const ox = this.offsetX || 0;
    const halfGap = this.gap / 2;
    const barWidth = this.canvasWidth;
    const barHeight = 25;

    const grad = ctx.createLinearGradient(ox, 0, ox, barHeight);
    grad.addColorStop(0, color);
    grad.addColorStop(1, secondary);
    ctx.fillStyle = grad;

    this.roundRect(ctx, ox - halfGap - barWidth, 0, barWidth, barHeight, 8);
    ctx.fill();
    this.roundRect(ctx, ox + halfGap, 0, barWidth, barHeight, 8);
    ctx.fill();
  }

  drawExpandingGap(ctx, color, secondary) {
    const halfGap = (this.gap - 40 + (this.expandOffset || 0)) / 2;
    const barWidth = this.canvasWidth;
    const barHeight = 25;

    ctx.fillStyle = color;
    this.roundRect(ctx, -halfGap - barWidth, 0, barWidth, barHeight, 8);
    ctx.fill();
    this.roundRect(ctx, halfGap, 0, barWidth, barHeight, 8);
    ctx.fill();
  }

  drawSwingingHammer(ctx, color, secondary) {
    const length = 220;
    const headSize = 50;
    
    ctx.rotate(this.hammerAngle);
    
    // Chain/Handle - Purely visual
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, length);
    ctx.stroke();
    
    // Head - The only colliding part
    const grad = ctx.createLinearGradient(-headSize/2, length, headSize/2, length + headSize);
    grad.addColorStop(0, color);
    grad.addColorStop(1, secondary);
    ctx.fillStyle = grad;
    this.roundRect(ctx, -headSize/2, length, headSize, headSize, 12);
    ctx.fill();
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

  collidesWith(player) {
    if (player.ghost > 0) return false;
    const points = player.getMaskPoints();
    const cx = this.canvasWidth / 2;
    const cy = this.y;

    if (this.type === "rotating-ring") {
      const radius = 135;
      const thickness = 28;
      const gapAngle = 1.3 - Math.min(0.4, this.sequence * 0.01);

      return points.some(p => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < radius - thickness / 2 || dist > radius + thickness / 2) return false;

        let angle = Math.atan2(dy, dx) - this.angle;
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;

        return Math.abs(angle) > gapAngle / 2;
      });
    }

    if (this.type === "centered-pair") {
      const halfGap = (this.gap + (this.gapOffset || 0)) / 2;
      const barHeight = 25;
      return points.some(p => {
        const relX = p.x - cx;
        const relY = p.y - cy;
        if (relY < 0 || relY > barHeight) return false;
        return Math.abs(relX) > halfGap;
      });
    }

    if (this.type === "sliding-gap") {
      const ox = this.offsetX || 0;
      const halfGap = this.gap / 2;
      const barHeight = 25;
      return points.some(p => {
        const relX = p.x - cx;
        const relY = p.y - cy;
        if (relY < 0 || relY > barHeight) return false;
        return (relX < ox - halfGap) || (relX > ox + halfGap);
      });
    }

    if (this.type === "expanding-gap") {
      const halfGap = (this.gap - 40 + (this.expandOffset || 0)) / 2;
      const barHeight = 25;
      return points.some(p => {
        const relX = p.x - cx;
        const relY = p.y - cy;
        if (relY < 0 || relY > barHeight) return false;
        return Math.abs(relX) > halfGap;
      });
    }

    if (this.type === "swinging-hammer") {
      const length = 220;
      const headSize = 50;
      const hamAngle = this.hammerAngle || 0;
      
      return points.some(p => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        
        // Rotate point to hammer's local space
        const cos = Math.cos(-hamAngle);
        const sin = Math.sin(-hamAngle);
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;
        
        // Check head ONLY (Handle is purely visual now)
        if (rx > -headSize/2 && rx < headSize/2 && ry > length && ry < length + headSize) return true;
        
        return false;
      });
    }

    return false;
  }

  get offscreen() {
    return this.y > 1000;
  }
}
