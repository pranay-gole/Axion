(() => {
  const c = document.getElementById("screen");
  const x = c.getContext("2d");
  const W = c.width, H = c.height;

  const ui = {
    score: document.getElementById("score"),
    wave: document.getElementById("wave"),
    lives: document.getElementById("lives"),
    hp: document.getElementById("hp"),
    wep: document.getElementById("wep"),
    overlay: document.getElementById("overlay"),
    pauseUI: document.getElementById("pauseUI"),
    overUI: document.getElementById("overUI"),
    final: document.getElementById("final"),
  };

  const rand = (a, b) => Math.random() * (b - a) + a;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const now = () => performance.now();
  const AABB = (a, b) =>
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;

  let running = false, paused = false, over = false;
  let score = 0, wave = 1, last = now();

  const player = {
    x: W / 2 - 18,
    y: H - 70,
    w: 36,
    h: 26,
    vx: 0,
    speed: 340,
    accel: 900,
    decel: 700,
    hp: 100,
    maxHp: 100,
    cool: 0,
    fireDelay: 180,
    lives: 3,
    power: 0,
  };

  const bullets = [], foes = [], foeBullets = [], puffs = [], drops = [];
  const stars = Array.from({ length: 200 }, () => ({
    x: rand(0, W),
    y: rand(0, H),
    z: rand(0.4, 2.2),
  }));

  const foeTypes = [
    { hp: 12, speed: 60, color: "#00f0ff", fire: false, score: 20 },
    { hp: 20, speed: 55, color: "#7cffcb", fire: true, delay: 1500, score: 35 },
    { hp: 25, speed: 50, color: "#ff9d4d", zig: 120, score: 40 },
  ];

  const keys = { left: false, right: false, fire: false };

  // === Keyboard Controls ===
  addEventListener("keydown", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
    if (e.code === "Space") {
      e.preventDefault();
      keys.fire = true;
      if (!running && !over) start();
    }
    if (e.code === "KeyP") togglePause();
    if (e.code === "KeyR") restart();
  });

  addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
    if (e.code === "Space") {
      e.preventDefault();
      keys.fire = false;
    }
  });

  // === Touch / Mobile Controls ===
  const bind = (id, on, off) => {
    const el = document.getElementById(id);
    if (!el) return;
    ["pointerdown", "touchstart"].forEach((t) =>
      el.addEventListener(t, (e) => {
        e.preventDefault();
        on();
      })
    );
    ["pointerup", "touchend", "mouseleave"].forEach((t) =>
      el.addEventListener(t, (e) => {
        e.preventDefault();
        off();
      })
    );
  };

  bind("leftBtn", () => (keys.left = true), () => (keys.left = false));
  bind("rightBtn", () => (keys.right = true), () => (keys.right = false));

  // 🔥 IMPORTANT: mobile FIRE se game start bhi hoga
  bind(
    "fireBtn",
    () => {
      keys.fire = true;
      if (!running && !over) start();
    },
    () => (keys.fire = false)
  );

  // === Core Functions ===
  function start() {
    running = true;
    paused = false;
    over = false;
    ui.overlay.style.display = "none";
  }

  function togglePause() {
    if (!running || over) return;
    paused = !paused;
    ui.pauseUI.style.display = paused ? "block" : "none";
  }

  function restart() {
    score = 0;
    wave = 1;
    over = false;
    paused = false;
    running = true;
    Object.assign(player, {
      x: W / 2 - 18,
      y: H - 70,
      vx: 0,
      hp: 100,
      lives: 3,
      power: 0,
      fireDelay: 180,
    });
    bullets.length = foes.length = foeBullets.length = puffs.length = drops.length = 0;
    ui.score.textContent = score;
    ui.wave.textContent = wave;
    ui.lives.textContent = player.lives;
    ui.overUI.style.display = "none";
    ui.overlay.style.display = "none";
  }

  function spark(x0, y0, col, n = 10) {
    for (let i = 0; i < n; i++)
      puffs.push({
        x: x0,
        y: y0,
        vx: rand(-80, 80),
        vy: rand(-120, 40),
        life: rand(200, 520),
        col,
      });
  }

  // === Drawing ===
  function drawBG(dt) {
    x.clearRect(0, 0, W, H);
    for (const s of stars) {
      s.y += s.z * 35 * dt;
      if (s.y > H) {
        s.y = 0;
        s.x = rand(0, W);
      }
      x.globalAlpha = clamp(s.z / 2.5, 0.25, 0.9);
      x.fillStyle = "#aef";
      x.fillRect(s.x, s.y, 1.5 * s.z, 1.5 * s.z);
    }
    x.globalAlpha = 1;
  }

  function drawShip(s) {
    x.save();
    x.translate(s.x + s.w / 2, s.y + s.h / 2);
    x.shadowColor = "rgba(0,240,255,.8)";
    x.shadowBlur = 12;
    x.lineWidth = 2;
    x.strokeStyle = "#00f0ff";
    x.beginPath();
    x.moveTo(0, -12);
    x.lineTo(12, 10);
    x.lineTo(-12, 10);
    x.closePath();
    x.stroke();
    x.restore();
  }

  function drawFoe(f) {
    x.save();
    x.shadowColor = f.color;
    x.shadowBlur = 10;
    x.lineWidth = 2;
    x.strokeStyle = f.color;
    x.strokeRect(f.x, f.y, f.w, f.h);
    x.restore();
  }

  function drawBullet(b, col) {
    x.save();
    x.shadowColor = col;
    x.shadowBlur = 8;
    x.fillStyle = col;
    x.fillRect(b.x, b.y, b.w, b.h);
    x.restore();
  }

  function drawDrops() {
    for (const d of drops) {
      x.save();
      x.fillStyle = d.type === "heal" ? "#7cffcb" : "#ffd24d";
      x.shadowColor = x.fillStyle;
      x.shadowBlur = 8;
      x.fillRect(d.x, d.y, d.w, d.h);
      x.restore();
    }
  }

  // === Logic ===
  function shoot() {
    const base = { w: 4, h: 12, vy: 460, dmg: 10 };
    const cx = player.x + player.w / 2;
    const y = player.y - 10;
    const p = player.power;
    const pattern = [[0], [-10, 10], [-12, 0, 12], [-16, -6, 6, 16]][p] || [0];
    for (const offset of pattern) bullets.push({ ...base, x: cx + offset, y });
    spark(cx, y, "#aef", 4);
  }

  function hurt(n) {
    player.hp -= n;
    if (player.hp < 0) player.hp = 0;
  }

  function spawnWave() {
    const n = 5 + Math.min(10, wave * 2);
    const spacing = W / (n + 1);
    for (let i = 0; i < n; i++) {
      const t = foeTypes[(i + wave) % foeTypes.length];
      foes.push({
        x: spacing * (i + 1) - 18,
        y: -rand(40, 260),
        w: 28,
        h: 18,
        speed: t.speed + wave * 2,
        hp: t.hp + wave * 3,
        color: t.color,
        score: t.score,
        fire: t.fire,
        delay: t.delay || 1200,
        next: now() + rand(800, 1800),
      });
    }
    wave++;
    ui.wave.textContent = wave;
  }

  let nextWaveAt = 0;

  function update(dt) {
    if (keys.left) player.vx -= player.accel * dt;
    else if (keys.right) player.vx += player.accel * dt;
    else {
      if (player.vx > 0) player.vx = Math.max(0, player.vx - player.decel * dt);
      if (player.vx < 0) player.vx = Math.min(0, player.vx + player.decel * dt);
    }

    player.vx = clamp(player.vx, -player.speed, player.speed);
    player.x += player.vx * dt;
    player.x = clamp(player.x, 8, W - player.w - 8);

    player.cool -= dt * 1000;
    if (keys.fire && player.cool <= 0) {
      shoot();
      player.cool = player.fireDelay;
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y -= b.vy * dt;
      if (b.y < -20) bullets.splice(i, 1);
    }

    if (now() > nextWaveAt && foes.length < 1) {
      spawnWave();
      nextWaveAt = now() + 14000;
    }

    for (let i = foes.length - 1; i >= 0; i--) {
      const f = foes[i];
      f.y += f.speed * dt;
      if (f.fire && now() > f.next) {
        f.next = now() + f.delay;
        foeBullets.push({ x: f.x + f.w / 2 - 2, y: f.y + f.h, w: 4, h: 10, vy: 220 });
      }
      if (f.y > H + 40) foes.splice(i, 1);
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (AABB(f, b)) {
          bullets.splice(j, 1);
          f.hp -= b.dmg;
          spark(b.x, b.y, "#aef", 3);
          if (f.hp <= 0) {
            score += f.score;
            ui.score.textContent = score;
            spark(f.x + f.w / 2, f.y + f.h / 2, f.color, 16);
            if (Math.random() < 0.18)
              drops.push({
                x: f.x + f.w / 2 - 6,
                y: f.y + f.h / 2 - 6,
                w: 12,
                h: 12,
                type: Math.random() < 0.5 ? "heal" : "power",
              });
            foes.splice(i, 1);
            break;
          }
        }
      }
    }

    foeBullets.forEach((b, i) => {
      b.y += b.vy * dt;
      if (b.y > H + 20) foeBullets.splice(i, 1);
      else if (AABB(b, player)) {
        foeBullets.splice(i, 1);
        hurt(20);
        spark(player.x + 18, player.y, "#ff5577", 10);
      }
    });

    drops.forEach((d, i) => {
      d.y += 80 * dt;
      if (d.y > H + 20) drops.splice(i, 1);
      else if (AABB(d, player)) {
        if (d.type === "heal") player.hp = clamp(player.hp + 30, 0, player.maxHp);
        else {
          player.power = Math.min(player.power + 1, 3);
          player.fireDelay = Math.max(80, player.fireDelay - 20);
          ui.wep.textContent = ["Blaster", "Spread", "Tri", "Quad"][player.power];
        }
        drops.splice(i, 1);
      }
    });

    if (player.hp <= 0) {
      player.lives--;
      ui.lives.textContent = player.lives;
      player.hp = player.maxHp;
      player.vx = 0;
      player.x = W / 2 - 18;
      player.power = 0;
      player.fireDelay = 180;
      ui.wep.textContent = "Blaster";
      spark(player.x + 18, player.y + 13, "#ff5577", 20);
      if (player.lives < 0) gameOver();
    }

    puffs.forEach((p, i) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      p.life -= dt * 1000;
      if (p.life <= 0) puffs.splice(i, 1);
    });

    ui.hp.style.width = (player.hp / player.maxHp * 100).toFixed(1) + "%";
  }

  function gameOver() {
    over = true;
    running = false;
    ui.overUI.style.display = "block";
    ui.final.textContent = score;
  }

  function render(dt) {
    drawBG(dt);
    drawShip(player);
    bullets.forEach((b) => drawBullet(b, "#aef"));
    foes.forEach(drawFoe);
    foeBullets.forEach((b) => drawBullet(b, "#ff8aa8"));
    drawDrops();
    puffs.forEach((p) => {
      x.save();
      x.globalAlpha = clamp(p.life / 520, 0.1, 1);
      x.fillStyle = p.col || "#aef";
      x.fillRect(p.x, p.y, 2, 2);
      x.restore();
    });
  }

  function loop() {
    const t = now();
    const dt = Math.min(0.025, (t - last) / 1000);
    last = t;
    if (running && !paused && !over) {
      update(dt);
      render(dt);
    } else {
      // even when not running, keep bg anim smooth if you want:
      drawBG(dt);
    }
    requestAnimationFrame(loop);
  }

  loop();
})();
