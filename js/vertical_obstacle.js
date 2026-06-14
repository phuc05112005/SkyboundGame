class VerticalObstacle {
  constructor(y, canvasWidth, config, sequence = 1) {
    this.y = y;
    this.canvasWidth = canvasWidth;
    this.height = 40;
    this.sequence = sequence;
    this.scored = false;
    
    // Choose obstacle type based on sequence (difficulty)
    const types = ["centered-pair", "rotating-ring", "sliding-gap"];
    // Make first part of the run more readable by biasing types a bit
    const earlyBias = sequence < 12 ? 0.35 : 0;
    this.type = types[Math.floor(Math.random() * types.length * (1 - earlyBias) + Math.random() * earlyBias * types.length)];

    // Customization based on type
    // Wider gap early, then tightens.
    const tighten = Math.min(62, sequence * 1.8);
    this.gap = 192 - tighten;
    this.gap = Math.max(118, this.gap);

    // Slower movement but with more “feel” variation.
    this.speed = config.speed * (0.38 + Math.random() * 0.28);

    this.angle = 0;
    this.rotationSpeed = 0.7 + Math.random() * 0.85;

    
    // Ocean -> Sky -> Space colors
    this.color = this.getThemeColor(y);
  }

  getThemeColor(y) {
    // Inverted logic: lower Y (more negative) means higher altitude
    const altitude = -y;
    if (altitude < 3000) return "#34d399"; // Ocean/Coral
    if (altitude < 7000) return "#60a5fa"; // Sky
    if (altitude < 11000) return "#a78bfa"; // High Sky
    return "#fbbf24"; // Space/Sun
  }

  update(dt, worldSpeed) {
    this.y += worldSpeed * dt;
    
    if (this.type === "sliding-gap") {
      this.angle += dt * this.rotationSpeed;
      this.offsetX = Math.sin(this.angle) * (this.canvasWidth * 0.3); // Wider sliding range
    } else if (this.type === "rotating-ring") {
      this.angle += dt * this.rotationSpeed * this.direction;
    } else if (this.type === "centered-pair") {
      this.angle += dt * 1.0; // Slower oscillation
      this.gapOffset = Math.sin(this.angle) * 40;
    }
  }

  draw(ctx, effectsEnabled) {
    ctx.save();
    ctx.translate(this.canvasWidth / 2, this.y);

    if (effectsEnabled) {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 15;
    }

    if (this.type === "centered-pair") {
      this.drawCenteredPair(ctx);
    } else if (this.type === "rotating-ring") {
      this.drawRotatingRing(ctx);
    } else if (this.type === "sliding-gap") {
      this.drawSlidingGap(ctx);
    }

    ctx.restore();
  }

  drawCenteredPair(ctx) {
    const halfGap = (this.gap + (this.gapOffset || 0)) / 2;
    const barWidth = 400; // Wider bars
    const barHeight = 25;

    const grad = ctx.createLinearGradient(0, 0, 0, barHeight);
    grad.addColorStop(0, this.color);
    grad.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = grad;

    // Left bar
    this.roundRect(ctx, -halfGap - barWidth, 0, barWidth, barHeight, 6);
    ctx.fill();
    // Right bar
    this.roundRect(ctx, halfGap, 0, barWidth, barHeight, 6);
    ctx.fill();
    
    // Highlighting
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#fff";
    ctx.fillRect(-halfGap - barWidth + 5, 5, barWidth - 10, 4);
    ctx.fillRect(halfGap + 5, 5, barWidth - 10, 4);
  }

  drawRotatingRing(ctx) {
    const radius = 130; // Larger radius (was 110)
    const thickness = 25;
    const gapAngle = 1.4; // Wider gap angle (was 1.1)

    ctx.rotate(this.angle);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = thickness;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.arc(0, 0, radius, gapAngle / 2, Math.PI * 2 - gapAngle / 2);
    ctx.stroke();

    // Decorative inner glow
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 15, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawSlidingGap(ctx) {
    const ox = this.offsetX || 0;
    const halfGap = (this.gap + 20) / 2; // Extra width for sliding gap
    const barWidth = 500; // Much wider bars
    const barHeight = 25;

    ctx.fillStyle = this.color;
    // Left
    this.roundRect(ctx, ox - halfGap - barWidth, 0, barWidth, barHeight, 6);
    ctx.fill();
    // Right
    this.roundRect(ctx, ox + halfGap, 0, barWidth, barHeight, 6);
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
      const radius = 110;
      const thickness = 25;
      const gapAngle = 1.1;
      
      return points.some(p => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < radius - thickness / 2 || dist > radius + thickness / 2) return false;
        
        // Check if point is in the gap
        let angle = Math.atan2(dy, dx) - this.angle;
        // Normalize angle to -PI to PI
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

    return false;
  }

  get offscreen() {
    return this.y > 1000;
  }
}
