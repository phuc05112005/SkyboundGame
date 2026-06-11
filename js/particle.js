class Particle {
  constructor() {
    this.reset(0, 0);
    this.active = false;
  }

  reset(x, y, options = {}) {
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
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      return;
    }
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    if (!this.active) return;
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
    return !this.active;
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.pool = [];
    this.floatTimer = 0;
  }

  add(x, y, options = {}) {
    let p;
    if (this.pool.length > 0) {
      p = this.pool.pop();
      p.reset(x, y, options);
    } else {
      p = new Particle();
      p.reset(x, y, options);
      this.particles.push(p);
    }
  }

  burst(x, y, count, options = {}) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (options.speed ?? 160) * (0.35 + Math.random() * 0.9);
      this.add(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: (options.size ?? 5) * (0.6 + Math.random() * 0.8),
        life: options.life ?? 0.8,
        color: options.color ?? "#ffffff",
        gravity: options.gravity ?? 90,
        glow: options.glow ?? 12,
        shape: options.shape ?? "circle"
      });
    }
  }

  trail(x, y) {
    this.add(x, y, {
      vx: -90 - Math.random() * 70,
      vy: (Math.random() - 0.5) * 45,
      size: 2 + Math.random() * 3,
      life: 0.45,
      color: "rgba(255,255,255,0.88)",
      gravity: -8,
      glow: 8
    });
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
    this.particles.forEach((particle) => {
      if (particle.active) {
        particle.update(dt);
        if (!particle.active) {
          this.pool.push(particle);
        }
      }
    });
  }

  draw(ctx) {
    this.particles.forEach((particle) => {
      if (particle.active) particle.draw(ctx);
    });
  }

  clear() {
    this.particles.forEach(p => {
      if (p.active) {
        p.active = false;
        this.pool.push(p);
      }
    });
  }
}
