const canvas = document.getElementById("brickCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 500;

let balls = [];
let paddle = {
  x: canvas.width / 2 - 60,
  y: canvas.height - 20,
  width: 120,
  height: 12,
  speed: 8,
};

let rightPressed = false;
let leftPressed = false;
let paused = false;
let gameRunning = false;
let overlay = document.getElementById("overlay");
let overlayText = document.getElementById("overlay-text");
let score = 0;
let level = 1;
const maxLevel = 15;

const brick = {
  rowCount: 6,
  columnCount: 8,
  width: 80,
  height: 20,
  padding: 10,
  offsetTop: 50,
  offsetLeft: 35,
};

let bricks = [];

const levelColors = [
  "#00ffff", "#00bfff", "#0080ff", "#8000ff", "#ff00ff", "#ff007f", "#ff4d4d",
  "#ff6600", "#ffaa00", "#ffff00", "#99ff33", "#33ff77", "#00ffcc", "#0099ff", "#6666ff"
];

// Initialize bricks
function initBricks() {
  bricks = [];
  const color = levelColors[(level - 1) % levelColors.length];
  for (let c = 0; c < brick.columnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brick.rowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, visible: true, color: color };
    }
  }
}

// Create balls
function initBalls(count = 1) {
  balls = [];
  for (let i = 0; i < count; i++) {
    balls.push({
      x: canvas.width / 2 + (i * 15),
      y: canvas.height - 40,
      dx: 3 * (Math.random() > 0.5 ? 1 : -1),
      dy: -3,
      radius: 8,
      color: "#00ffff",
    });
  }
}

// Draw functions
function drawBricks() {
  for (let c = 0; c < brick.columnCount; c++) {
    for (let r = 0; r < brick.rowCount; r++) {
      if (bricks[c][r].visible) {
        const brickX = c * (brick.width + brick.padding) + brick.offsetLeft;
        const brickY = r * (brick.height + brick.padding) + brick.offsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.fillStyle = bricks[c][r].color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = bricks[c][r].color;
        ctx.fillRect(brickX, brickY, brick.width, brick.height);
        ctx.shadowBlur = 0;
      }
    }
  }
}

function drawPaddle() {
  ctx.fillStyle = "#00ffff";
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBalls() {
  balls.forEach(ball => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ffff";
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
  });
}

function drawScore() {
  ctx.font = "18px Orbitron";
  ctx.fillStyle = "#00ffff";
  ctx.fillText(`Score: ${score}`, 20, 25);
  ctx.fillText(`Level: ${level}`, canvas.width - 120, 25);
}

// Collision detection
function collisionDetection(ball) {
  for (let c = 0; c < brick.columnCount; c++) {
    for (let r = 0; r < brick.rowCount; r++) {
      const b = bricks[c][r];
      if (b.visible) {
        if (
          ball.x > b.x && ball.x < b.x + brick.width &&
          ball.y > b.y && ball.y < b.y + brick.height
        ) {
          ball.dy = -ball.dy;
          b.visible = false;
          score++;

          if (score % (brick.rowCount * brick.columnCount) === 0) {
            nextLevel();
          }
        }
      }
    }
  }
}

// Game logic
function draw() {
  if (!gameRunning || paused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawPaddle();
  drawBalls();
  drawScore();

  // Move paddle
  if (rightPressed && paddle.x < canvas.width - paddle.width) paddle.x += paddle.speed;
  if (leftPressed && paddle.x > 0) paddle.x -= paddle.speed;

  // Move balls
  balls.forEach(ball => {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius)
      ball.dx = -ball.dx;
    if (ball.y + ball.dy < ball.radius)
      ball.dy = -ball.dy;

    if (ball.y + ball.dy > canvas.height - ball.radius - paddle.height - 5) {
      if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
        ball.dy = -ball.dy;
        ball.dx *= 1.05;
        ball.dy *= 1.05;
      } else if (ball.y + ball.dy > canvas.height - ball.radius) {
        balls.splice(balls.indexOf(ball), 1);
        if (balls.length === 0) gameOver();
      }
    }

    collisionDetection(ball);
  });

  requestAnimationFrame(draw);
}

function startGame() {
  if (gameRunning) return;
  overlay.classList.add("hidden");
  gameRunning = true;
  paused = false;
  initBricks();
  initBalls(1);
  draw();
}

function nextLevel() {
  level++;
  if (level > maxLevel) {
    overlay.classList.remove("hidden");
    overlayText.style.color = "#00ffff";
    overlayText.textContent = "🏆 YOU WIN ALL LEVELS!";
    gameRunning = false;
    return;
  }

  paddle.width = Math.max(60, 120 - level * 3);
  initBricks();
  initBalls(level >= 5 ? Math.min(1 + Math.floor(level / 5), 3) : 1); // add balls every 5 levels
  balls.forEach(ball => {
    ball.dx *= 1.1;
    ball.dy *= 1.1;
  });
}

function gameOver() {
  overlay.classList.remove("hidden");
  overlayText.style.color = "red";
  overlayText.textContent = "💀 GAME OVER - Press R to Restart";
  gameRunning = false;
}

function restartGame() {
  score = 0;
  level = 1;
  initBricks();
  initBalls(1);
  overlayText.style.color = "#00ffff";
  overlayText.textContent = "Press S to Start";
  overlay.classList.remove("hidden");
  gameRunning = false;
}

function togglePause() {
  if (!gameRunning) return;
  paused = !paused;
  overlay.classList.toggle("hidden", !paused);
  overlayText.style.color = "#00ffff";
  overlayText.textContent = paused ? "⏸️ Game Paused - Press P to Resume" : "";
}

// Controls
document.addEventListener("keydown", (e) => {
  if (e.key === "Right" || e.key === "ArrowRight" || e.key === "d") rightPressed = true;
  if (e.key === "Left" || e.key === "ArrowLeft" || e.key === "a") leftPressed = true;
  if (e.key === "S" || e.key === "s") startGame();
  if (e.key === "R" || e.key === "r") restartGame();
  if (e.key === "P" || e.key === "p") togglePause();
});

document.addEventListener("keyup", (e) => {
  if (e.key === "Right" || e.key === "ArrowRight" || e.key === "d") rightPressed = false;
  if (e.key === "Left" || e.key === "ArrowLeft" || e.key === "a") leftPressed = false;
});

overlayText.textContent = "Press S to Start";
