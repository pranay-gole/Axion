const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const overlayText = document.getElementById("overlayText");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const finalScore = document.getElementById("finalScore");
const bgMusic = document.getElementById("bgMusic");
const loseSound = document.getElementById("loseSound");

let orb = { x: 0, y: 0, radius: 15, velocity: 0 };
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
  orb.x = canvas.width * 0.2;
  orb.y = canvas.height / 2;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function startGame() {
  started = true;
  overlayText.classList.add("hidden");

  bgMusic.volume = 0.8; // adjust 0.0 to 1.0
  bgMusic.play();
}

function restartGame() {
  orb.y = canvas.height / 2;
  orb.velocity = 0;
  pipes = [];
  score = 0;
  frame = 0;
  gameOver = false;
  paused = false;
  started = true;

  scoreDisplay.textContent = "0";
  overlayText.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  bgMusic.currentTime = 0;
  bgMusic.play();
}

function pauseGame() {
  if (!gameOver && started) {
    paused = true;
    overlayText.textContent = "Press P to Resume";
    overlayText.classList.remove("hidden");
  }
}

function resumeGame() {
  paused = false;
  overlayText.classList.add("hidden");
}

function drawOrb() {
  const glow = ctx.createRadialGradient(
    orb.x, orb.y, 2,
    orb.x, orb.y, orb.radius * 3
  );
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

  // ✅ Proper pause handling
  if (paused) {
    requestAnimationFrame(update);
    return;
  }

  // ✅ Handle game over overlay safely
  if (gameOver) {
  overlayText.classList.add("hidden");
  finalScore.textContent = score;
  gameOverOverlay.classList.remove("hidden");
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0, 10, 20, 0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (started && !gameOver) {
    frame++;
    orb.velocity += gravity;
    orb.y += orb.velocity;

    if (frame % 100 === 0) createPipe();

    pipes.forEach((pipe, index) => {
      pipe.x -= 3 + Math.min(score / 5, 3);

      if (pipe.x + 50 < 0) {
        pipes.splice(index, 1);
        score++;
        scoreDisplay.textContent = score;
      }

    if (
        orb.x + orb.radius > pipe.x &&
        orb.x - orb.radius < pipe.x + 50 &&
        (orb.y - orb.radius < pipe.top || orb.y + orb.radius > pipe.bottom)
      ) {
        if (!gameOver) {
          gameOver = true;
          bgMusic.pause();
          loseSound.currentTime = 0;
          loseSound.play();
        }
      }
    });

    if (orb.y + orb.radius > canvas.height || orb.y - orb.radius < 0) {
      if (!gameOver) {
        gameOver = true;
        bgMusic.pause();
        loseSound.currentTime = 0;
        loseSound.play();
      }
    }

    drawPipes();
  }

  drawOrb();

  requestAnimationFrame(update);
}

function flap() {
  if (started && !gameOver && !paused) {
    orb.velocity = jump;
  }
}

document.addEventListener("keydown", (e) => {

  // Space = flap
  if (e.code === "Space") {
    e.preventDefault();
    flap();
  }

  // ✅ S = Start
  if (e.key === "s" || e.key === "S") {
    if (!started) {
      startGame();
    }
  }

  // ✅ R = Restart only if game over
  if ((e.key === "r" || e.key === "R") && gameOver) {
    restartGame();
  }

  // ✅ P = Pause / Resume
  if (e.key === "p" || e.key === "P") {
    if (!paused) {
      pauseGame();
    } else {
      resumeGame();
    }
  }

});

// Mouse click = flap
canvas.addEventListener("mousedown", () => {
  flap();
});

overlayText.textContent = "Press S to Start";
overlayText.classList.remove("hidden");

// Start loop
update();