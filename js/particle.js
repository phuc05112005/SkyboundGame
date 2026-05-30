class Particle {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = options.vx ?? (Math.random() - 0.5) * 120;
    this.vy = options.vy ?? (Math.random() - 0.5) * 120;
    this.size = options.size ?? 4;
    this.life = options.life ?? 0.8;
    this.maxLife = this.life;
    this.color = options.color ?? "#ffffff";
    this.gravity = options.gravity ?? 0;
    this.glow = options.glow ?? 0;
    this.shape = options.shape ?? "circle";
  }

  update(dt) {
    this.life -= dt;
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    if (this.glow) {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = this.glow * alpha;
    }
    if (this.shape === "feather") {
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.atan2(this.vy, this.vx));
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * 1.8, this.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  get dead() {
    return this.life <= 0;
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatTimer = 0;
  }

  add(particle) {
    this.particles.push(particle);
  }

  burst(x, y, count, options = {}) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (options.speed ?? 160) * (0.35 + Math.random() * 0.9);
      this.add(new Particle(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: (options.size ?? 5) * (0.6 + Math.random() * 0.8),
        life: options.life ?? 0.8,
        color: options.color ?? "#ffffff",
        gravity: options.gravity ?? 90,
        glow: options.glow ?? 12,
        shape: options.shape ?? "circle"
      }));
    }
  }

  trail(x, y) {
    this.add(new Particle(x, y, {
      vx: -90 - Math.random() * 70,
      vy: (Math.random() - 0.5) * 45,
      size: 2 + Math.random() * 3,
      life: 0.45,
      color: "rgba(255,255,255,0.88)",
      gravity: -8,
      glow: 8
    }));
  }

  feathers(x, y) {
    this.burst(x, y, 4, {
      speed: 105,
      size: 3.5,
      life: 0.75,
      color: "#fff2ad",
      gravity: 120,
      glow: 8,
      shape: "feather"
    });
  }

  score(x, y) {
    this.burst(x, y, 18, {
      speed: 135,
      size: 4,
      life: 0.75,
      color: "#ffe066",
      gravity: -20,
      glow: 18
    });
  }

  explosion(x, y) {
    this.burst(x, y, 44, {
      speed: 260,
      size: 5.5,
      life: 1,
      color: "#ffdf7d",
      gravity: 240,
      glow: 20
    });
    this.burst(x, y, 18, {
      speed: 200,
      size: 4,
      life: 0.8,
      color: "#ff6b6b",
      gravity: 180,
      glow: 18
    });
  }

  update(dt, width, height, enabled) {
    // Ambient dust is spawned continuously when effects are enabled.
    if (enabled) {
      this.floatTimer += dt;
      if (this.floatTimer > 0.08) {
        this.floatTimer = 0;
        this.add(new Particle(Math.random() * width, height * (0.1 + Math.random() * 0.75), {
          vx: -8 - Math.random() * 20,
          vy: -4 - Math.random() * 10,
          size: 1 + Math.random() * 2,
          life: 3 + Math.random() * 2,
          color: "rgba(255,255,255,0.38)",
          gravity: 0,
          glow: 6
        }));
      }
    }
    this.particles.forEach((particle) => particle.update(dt));
    this.particles = this.particles.filter((particle) => !particle.dead);
  }

  draw(ctx) {
    this.particles.forEach((particle) => particle.draw(ctx));
  }

  clear() {
    this.particles = [];
  }
}
