const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const grid = 25;
let snake = [{ x: 5 * grid, y: 5 * grid }];
let direction = { x: 1, y: 0 };
let food = spawnFood();
let score = 0;
let gameOver = false;
let paused = false;
let started = false;
let lastTime = 0;
let baseSpeed = 150;
let speed = baseSpeed;
let eatCount = 0;

const scoreDisplay = document.getElementById('score');
const deathSound = new Audio("{{ url_for('static', filename='games/snake/death.wav') }}");

// overlay element
const overlay = document.createElement('div');
overlay.id = "gameOverOverlay";
overlay.textContent = "PRESS 'S' OR TAP TO START";
document.body.appendChild(overlay);

// restart button
const restartBtn = document.getElementById('restartBtn');
if (restartBtn) {
  restartBtn.addEventListener('click', () => {
    if (!started || gameOver) {
      resetGame();
    } else {
      // allow restart anytime
      resetGame();
    }
  });
}

// === Spawn Food ===
function spawnFood() {
  const cols = Math.floor(canvas.width / grid);
  const rows = Math.floor(canvas.height / grid);
  return {
    x: Math.floor(Math.random() * cols) * grid,
    y: Math.floor(Math.random() * rows) * grid
  };
}

// === Draw glowing snake ===
function drawSnake() {
  ctx.lineWidth = grid - 3;
  ctx.lineCap = 'round';
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#00ffff';
  ctx.strokeStyle = '#00ffff';

  ctx.beginPath();
  ctx.moveTo(snake[0].x + grid / 2, snake[0].y + grid / 2);
  for (let i = 1; i < snake.length; i++) {
    ctx.lineTo(snake[i].x + grid / 2, snake[i].y + grid / 2);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  drawSnakeHead();
}

// === Draw snake head with eyes + tongue ===
function drawSnakeHead() {
  const head = snake[0];
  const centerX = head.x + grid / 2;
  const centerY = head.y + grid / 2;
  const radius = grid / 2.2;

  ctx.beginPath();
  ctx.fillStyle = '#00ffff';
  ctx.shadowBlur = 25;
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Eyes
  const eyeOffset = 5;
  const eyeSize = 3;
  let eyeX1 = centerX + (direction.x === 0 ? -eyeOffset : 0);
  let eyeX2 = centerX + (direction.x === 0 ? eyeOffset : 0);
  let eyeY1 = centerY + (direction.y === 0 ? -eyeOffset : 0);
  let eyeY2 = centerY + (direction.y === 0 ? eyeOffset : 0);

  if (direction.x === 1) { eyeX1 += 6; eyeX2 += 6; eyeY1 -= 4; eyeY2 += 4; }
  else if (direction.x === -1) { eyeX1 -= 6; eyeX2 -= 6; eyeY1 -= 4; eyeY2 += 4; }
  else if (direction.y === 1) { eyeY1 += 6; eyeY2 += 6; eyeX1 -= 4; eyeX2 += 4; }
  else if (direction.y === -1) { eyeY1 -= 6; eyeY2 -= 6; eyeX1 -= 4; eyeX2 += 4; }

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
  ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#00ffff';
  ctx.beginPath();
  ctx.arc(eyeX1, eyeY1, 1.5, 0, Math.PI * 2);
  ctx.arc(eyeX2, eyeY2, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Tongue flicker
  if (Math.random() > 0.5) {
    ctx.strokeStyle = '#ff4d4d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (direction.x === 1) {
      ctx.moveTo(centerX + radius, centerY);
      ctx.lineTo(centerX + radius + 10, centerY + Math.sin(Date.now() / 100) * 3);
    } else if (direction.x === -1) {
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX - radius - 10, centerY + Math.sin(Date.now() / 100) * 3);
    } else if (direction.y === 1) {
      ctx.moveTo(centerX, centerY + radius);
      ctx.lineTo(centerX + Math.sin(Date.now() / 100) * 3, centerY + radius + 10);
    } else {
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX + Math.sin(Date.now() / 100) * 3, centerY - radius - 10);
    }
    ctx.stroke();
  }
}

// === Draw Food ===
function drawFood() {
  ctx.fillStyle = '#ff9d4d';
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#ff9d4d';
  ctx.beginPath();
  ctx.arc(food.x + grid / 2, food.y + grid / 2, grid / 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

// === Movement + Growth ===
function moveSnake() {
  const head = { x: snake[0].x + direction.x * grid, y: snake[0].y + direction.y * grid };

  if (head.x < 0 || head.y < 0 || head.x >= canvas.width || head.y >= canvas.height) return endGame();
  for (let i = 1; i < snake.length; i++) if (head.x === snake[i].x && head.y === snake[i].y) return endGame();

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    eatCount++;
    scoreDisplay.textContent = score;
    food = spawnFood();
    if (eatCount % 3 === 0 && speed > 70) speed -= 10;
  } else {
    snake.pop();
  }
}

function endGame() {
  gameOver = true;
  deathSound.play();

  overlay.innerHTML = `
    <div style="
      background: rgba(10, 10, 15, 0.85);
      border: 2px solid #ff4d4d;
      border-radius: 12px;
      padding: 40px 80px;
      text-align: center;
      box-shadow: 0 0 20px rgba(255, 77, 77, 0.3);
    ">
      <h1 style="
        margin: 0;
        color: #ff4d4d;
        font-family: 'Orbitron', sans-serif;
        font-size: 3rem;
      ">GAME OVER 💀</h1>
      <p style="
        color: #ff9d4d;
        margin-top: 12px;
        font-size: 1.3rem;
      ">YOU LOSE</p>
      <p style="
        color: #00ffff;
        margin-top: 24px;
        font-size: 1.1rem;
      ">PRESS 'R' OR TAP RESTART</p>
    </div>
  `;

  showOverlay();
}

// === Reset ===
function resetGame() {
  snake = [{ x: 5 * grid, y: 5 * grid }];
  direction = { x: 1, y: 0 };
  score = 0;
  eatCount = 0;
  speed = baseSpeed;
  scoreDisplay.textContent = 0;
  food = spawnFood();
  gameOver = false;
  paused = false;
  started = true;
  hideOverlay();
  requestAnimationFrame(update);
}

// === Pause ===
function togglePause() {
  if (!started || gameOver) return;
  paused = !paused;
  if (paused) {
    overlay.textContent = "PAUSED\nTap or press 'P' to Resume";
    showOverlay();
  } else {
    hideOverlay();
    requestAnimationFrame(update);
  }
}

// === Overlay Helpers ===
function showOverlay() {
  overlay.classList.add('active');
  overlay.style.opacity = 1;
}

function hideOverlay() {
  overlay.style.opacity = 0;
  overlay.style.background = 'rgba(0,0,0,0)';
  setTimeout(() => {
    overlay.classList.remove('active');
    overlay.innerHTML = "";
  }, 500);
}

// === Direction helper (used by keys + buttons) ===
function setDirection(dir) {
  if (dir === 'up' && direction.y === 0) direction = { x: 0, y: -1 };
  else if (dir === 'down' && direction.y === 0) direction = { x: 0, y: 1 };
  else if (dir === 'left' && direction.x === 0) direction = { x: -1, y: 0 };
  else if (dir === 'right' && direction.x === 0) direction = { x: 1, y: 0 };
}

// === Main Loop ===
function update(time) {
  if (gameOver || paused || !started) return;
  const delta = time - lastTime;
  if (delta < speed) return requestAnimationFrame(update);
  lastTime = time;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  moveSnake();
  drawFood();
  drawSnake();
  requestAnimationFrame(update);
}

// === Keyboard Controls ===
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (key === 'arrowup') setDirection('up');
  if (key === 'arrowdown') setDirection('down');
  if (key === 'arrowleft') setDirection('left');
  if (key === 'arrowright') setDirection('right');

  if (key === 's' && !started) {
    started = true;
    hideOverlay();
    requestAnimationFrame(update);
  }

  if (key === 'p') togglePause();
  if (key === 'r') resetGame();
});

// === Canvas tap to start (mobile) ===
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (!started && !gameOver) {
    started = true;
    hideOverlay();
    requestAnimationFrame(update);
  }
}, { passive: false });

canvas.addEventListener('pointerdown', (e) => {
  if (!started && !gameOver) {
    started = true;
    hideOverlay();
    requestAnimationFrame(update);
  }
});

// === Mobile Buttons Bind ===
function bindBtn(id, dir) {
  const el = document.getElementById(id);
  if (!el) return;
  const handler = (e) => {
    e.preventDefault();
    setDirection(dir);
  };
  el.addEventListener('touchstart', handler, { passive: false });
  el.addEventListener('pointerdown', handler);
}

bindBtn('upBtn', 'up');
bindBtn('downBtn', 'down');
bindBtn('leftBtn', 'left');
bindBtn('rightBtn', 'right');
