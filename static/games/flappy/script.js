const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const message = document.getElementById("message");

let orb = { x: 150, y: 300, radius: 15, velocity: 0 };
let gravity = 0.5;
let jump = -8;
let pipes = [];
let frame = 0;
let score = 0;
let gameOver = false;
let started = false;
let paused = false;

// Resize canvas to full window
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  orb.y = canvas.height / 2;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function resetGame() {
  orb.y = canvas.height / 2;
  orb.velocity = 0;
  pipes = [];
  score = 0;
  frame = 0;
  gameOver = false;
  started = false;
  paused = false;
  scoreDisplay.textContent = "0";
  message.textContent = "Tap SPACE to start";
  message.style.display = "block";
}

function drawOrb() {
  const glow = ctx.createRadialGradient(orb.x, orb.y, 2, orb.x, orb.y, orb.radius * 3);
  glow.addColorStop(0, "#ff00ff");
  glow.addColorStop(1, "rgba(0,255,255,0)");
  ctx.beginPath();
  ctx.fillStyle = glow;
  ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
  ctx.fill();
}

function createPipe() {
  const gap = 180;
  const minHeight = 60;
  const top = Math.random() * (canvas.height - gap - minHeight * 2) + minHeight;
  pipes.push({ x: canvas.width, top, bottom: top + gap });
}

function drawPipes() {
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#00ffff";
  pipes.forEach(pipe => {
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(pipe.x, 0, 50, pipe.top);
    ctx.fillRect(pipe.x, pipe.bottom, 50, canvas.height - pipe.bottom);
  });
  ctx.shadowBlur = 0;
}

function update() {
  if (paused) {
    message.textContent = "⏸️ Paused";
    message.style.display = "block";
    requestAnimationFrame(update);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0, 10, 20, 0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (started && !gameOver) {
    frame++;
    orb.velocity += gravity;
    orb.y += orb.velocity;

    if (frame % 100 === 0) createPipe();

    pipes.forEach(pipe => {
      pipe.x -= 3 + Math.min(score / 5, 3);

      if (pipe.x + 50 < 0) {
        pipes.shift();
        score++;
        scoreDisplay.textContent = score;
      }

      if (
        orb.x + orb.radius > pipe.x &&
        orb.x - orb.radius < pipe.x + 50 &&
        (orb.y - orb.radius < pipe.top || orb.y + orb.radius > pipe.bottom)
      ) {
        gameOver = true;
      }
    });

    if (orb.y + orb.radius > canvas.height || orb.y - orb.radius < 0) {
      gameOver = true;
    }

    drawPipes();
  }

  drawOrb();

  if (gameOver) {
    message.textContent = "💀 Game Over! Press R to Restart";
    message.style.display = "block";
  }

  requestAnimationFrame(update);
}

function flap() {
  if (!started) {
    started = true;
    message.style.display = "none";
  }
  if (!gameOver && !paused) {
    orb.velocity = jump;
  }
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") flap();
  if (e.key === "r" || e.key === "R") resetGame();
  if (e.key === "p" || e.key === "P") paused = !paused;
});

resetGame();
update();
