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
const deathSound = new Audio("/static/games/snake/death.mp3");

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

function drawGameOver() {

  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.textAlign = "center";

  ctx.font = "bold 90px Arial";
  ctx.fillStyle = "#ff4444";

  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#00ffff";
  ctx.font = "36px Arial";

  ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 2 + 70);

  ctx.restore();
}

// === Movement + Growth ===
function moveSnake() {
  const head = {
    x: snake[0].x + direction.x * grid,
    y: snake[0].y + direction.y * grid
  };

  if (head.x < 0 || head.y < 0 || head.x >= canvas.width || head.y >= canvas.height)
    return endGame();

  for (let i = 1; i < snake.length; i++)
    if (head.x === snake[i].x && head.y === snake[i].y)
      return endGame();

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
  if (!gameOver) {
    gameOver = true;
    deathSound.currentTime = 0;
    deathSound.play();
  }
}

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
  requestAnimationFrame(update);
}

function togglePause() {

  if (!started || gameOver) return;
  paused = !paused;
}

function drawStartScreen() {

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.textAlign = "center";

  ctx.font = "30px Arial";
  ctx.fillStyle = "#00ffff";
  ctx.fillText("Press S to Start", canvas.width / 2, canvas.height / 2 + 20);

  ctx.restore();
}

// === Main Loop ===
function update(time) {

  if (!started) {
    drawStartScreen();
    return requestAnimationFrame(update);
  }

  const delta = time - lastTime;
  if (delta < speed) return requestAnimationFrame(update);

  lastTime = time;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver && !paused) {
    moveSnake();
  }

  drawFood();
  drawSnake();

  if (paused && !gameOver) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 60px Arial";
  ctx.fillStyle = "#00ffff";
  ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
  ctx.restore();
  }
  
  if (gameOver) {
    drawGameOver();
  }

  requestAnimationFrame(update);
}

requestAnimationFrame(update);
// === Keyboard Controls ONLY ===
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (key === 'arrowup') setDirection('up');
  if (key === 'arrowdown') setDirection('down');
  if (key === 'arrowleft') setDirection('left');
  if (key === 'arrowright') setDirection('right');

  if (key === 's' && !started) {
  started = true;
  requestAnimationFrame(update);
  }

  if (key === 'p') togglePause();
  if (key === 'r') resetGame();
});

function setDirection(dir) {
  if (dir === 'up' && direction.y === 0) direction = { x: 0, y: -1 };
  else if (dir === 'down' && direction.y === 0) direction = { x: 0, y: 1 };
  else if (dir === 'left' && direction.x === 0) direction = { x: -1, y: 0 };
  else if (dir === 'right' && direction.x === 0) direction = { x: 1, y: 0 };
}