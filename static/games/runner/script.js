const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let groundY = canvas.height - 140;
let gameState = "running";

/* ================= BACKGROUND ================= */

let stars = [];
let starCount = 120;
let isLightMode = false;

let moon = {
  x: canvas.width - 120,
  y: 100,
  radius: 40
};

function initStars() {
  stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * (groundY - 120),
      radius: Math.random() * 2
    });
  }
}
initStars();

/* ================= PLAYER ================= */

const player = {
  x: canvas.width * 0.35,
  y: groundY,
  velocityY: 0,
  gravity: 0.9,
  jumpForce: -18,
  grounded: true
};

/* ================= OBSTACLES ================= */

let obstacles = [];

let speed = 6;
let maxSpeed = 16;
let acceleration = 0.002;

let spawnTimer = 0;
let nextSpawn = randomRange(900, 1700);

function spawnGroup() {
  const count = Math.floor(Math.random() * 3) + 1;
  const gap = 38;

  for (let i = 0; i < count; i++) {
    const isBig = Math.random() < 0.3;

    obstacles.push({
      x: canvas.width + i * gap,
      width: isBig ? 28 : 18,
      height: isBig
        ? randomRange(65, 95)
        : randomRange(28, 40)
    });
  }

  nextSpawn = randomRange(1000, 2200);
  spawnTimer = 0;
}

/* ================= SCORE ================= */

let score = 0;
let bestScore = Number(localStorage.getItem("axionBestScore")) || 0;

document.getElementById("bestScore").innerText = bestScore;

/* ================= UPDATE ================= */

function update() {
  if (gameState !== "running") return;

  score++;

  if (speed < maxSpeed) {
    speed += acceleration;
  }

  player.velocityY += player.gravity;

  if (player.velocityY > 0) {
    player.velocityY += player.gravity * 0.4;
  }

  player.y += player.velocityY;

  if (player.y >= groundY) {
    player.y = groundY;
    player.velocityY = 0;
    player.grounded = true;
  }

  obstacles.forEach(o => o.x -= speed);
  obstacles = obstacles.filter(o => o.x > -50);

  spawnTimer += 16;
  if (spawnTimer > nextSpawn) {
    spawnGroup();
  }

  for (let o of obstacles) {
    const spikeTop = groundY + 60 - o.height;

    if (
      player.x + 6 > o.x &&
      player.x - 6 < o.x + o.width &&
      player.y + 44 > spikeTop
    ) {
      gameState = "gameover";

      if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("axionBestScore", bestScore);
      }

      document.getElementById("bestScore").innerText = bestScore;
    }
  }

  document.getElementById("score").innerText = score;
}

/* ================= DRAW BACKGROUND ================= */

function drawBackground() {

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

  if (isLightMode) {
    gradient.addColorStop(0, "#87ceeb");
    gradient.addColorStop(1, "#e0f7ff");
  } else {
    gradient.addColorStop(0, "#05070d");
    gradient.addColorStop(1, "#0a0f1f");
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!isLightMode) {
    ctx.fillStyle = "#ffffff";
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    const moonGradient = ctx.createRadialGradient(
      moon.x, moon.y, 10,
      moon.x, moon.y, moon.radius
    );

    moonGradient.addColorStop(0, "rgba(255,255,255,0.9)");
    moonGradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = moonGradient;
    ctx.beginPath();
    ctx.arc(moon.x, moon.y, moon.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ================= DRAW PLAYER ================= */

function drawPlayer() {

  const centerX = player.x;
  const torsoHeight = 28;
  const torsoWidth = 12;
  const headRadius = 6;
  const legLength = 16;

  let runCycle = 0;
  if (gameState === "running") {
    runCycle = Math.sin(Date.now() * 0.02) * 4;
  }

  const hipY = player.y + torsoHeight;

  ctx.save();
  ctx.shadowColor = "#00f0ff";
  ctx.shadowBlur = 18;

  const bodyGradient = ctx.createLinearGradient(
    centerX, player.y,
    centerX, player.y + torsoHeight
  );

  bodyGradient.addColorStop(0, "#00f0ff");
  bodyGradient.addColorStop(1, "#6a00ff");

  ctx.fillStyle = bodyGradient;

  ctx.beginPath();
  ctx.arc(centerX, player.y - headRadius - 4, headRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(centerX - torsoWidth / 2, player.y, torsoWidth, torsoHeight);
  ctx.fillRect(centerX - 4, hipY, 4, legLength + runCycle);
  ctx.fillRect(centerX, hipY, 4, legLength - runCycle);

  ctx.fillRect(centerX - torsoWidth / 2 - 3, player.y + 6, 3, 14 - runCycle);
  ctx.fillRect(centerX + torsoWidth / 2, player.y + 6, 3, 14 + runCycle);

  ctx.restore();
}

/* ================= DRAW OBSTACLES ================= */

function drawObstacles() {
  ctx.fillStyle = "#ff5555";

  obstacles.forEach(o => {
    ctx.beginPath();
    ctx.moveTo(o.x, groundY + 60);
    ctx.lineTo(o.x + o.width / 2, groundY + 60 - o.height);
    ctx.lineTo(o.x + o.width, groundY + 60);
    ctx.fill();
  });
}

function drawGround() {
  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(0, groundY + 60, canvas.width, 6);
}

/* ================= GAME OVER DRAW ================= */

function drawGameOver() {
  ctx.save();
  ctx.textAlign = "center";

  ctx.font = "bold 80px Arial";
  ctx.fillStyle = "#ffcc00";
  ctx.shadowColor = "#ff6600";
  ctx.shadowBlur = 25;
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.font = "28px Arial";
  ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 2 + 60);

  ctx.restore();
}

/* ================= MAIN DRAW ================= */

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawGround();
  drawPlayer();
  drawObstacles();

  if (gameState === "gameover") {
    drawGameOver();
  }
}

/* ================= CONTROLS ================= */

function jump() {
  if (player.grounded && gameState === "running") {
    player.velocityY = player.jumpForce;
    player.grounded = false;
  }
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
  if (e.key.toLowerCase() === "r" && gameState === "gameover") location.reload();
});

canvas.addEventListener("touchstart", jump);

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

/* ================= THEME SYSTEM ================= */

let currentTheme = localStorage.getItem("axionTheme") || "dark";
const themeBtn = document.getElementById("themeBtn");

applyTheme(currentTheme);

themeBtn.addEventListener("click", () => {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("axionTheme", currentTheme);
  applyTheme(currentTheme);
});

function applyTheme(theme) {

  if (theme === "light") {
    isLightMode = true;
    starCount = 0;
    stars = [];
    themeBtn.innerText = "☀️ Day";
  } else {
    isLightMode = false;
    starCount = 120;
    initStars();
    themeBtn.innerText = "🌙 Night";
  }
}

/* ================= LOOP ================= */

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();