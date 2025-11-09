const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- Game state ---
let cols, rows, cellSize;
let maze = [];
let stack = [];
let player, goal;
let timeLeft = 30;
let timerInterval;
let level = 1;
let powerUps = [];
let paused = false;
let overlay = document.getElementById("overlay");
let overlayText = document.getElementById("overlay-text");
let gameWon = false;

// === Rounded rectangle helper ===
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x + r, y);
  this.arcTo(x + w, y, x + w, y + h, r);
  this.arcTo(x + w, y + h, x, y + h, r);
  this.arcTo(x, y + h, x, y, r);
  this.arcTo(x, y, x + w, y, r);
  this.closePath();
  return this;
};

// === Cell class ===
class Cell {
  constructor(i, j) {
    this.i = i;
    this.j = j;
    this.walls = [true, true, true, true];
    this.visited = false;
  }

  checkNeighbors() {
    let neighbors = [];
    let top = maze[index(this.i, this.j - 1)];
    let right = maze[index(this.i + 1, this.j)];
    let bottom = maze[index(this.i, this.j + 1)];
    let left = maze[index(this.i - 1, this.j)];

    if (top && !top.visited) neighbors.push(top);
    if (right && !right.visited) neighbors.push(right);
    if (bottom && !bottom.visited) neighbors.push(bottom);
    if (left && !left.visited) neighbors.push(left);

    if (neighbors.length > 0) {
      let r = Math.floor(Math.random() * neighbors.length);
      return neighbors[r];
    }
    return undefined;
  }
}

function index(i, j) {
  if (i < 0 || j < 0 || i >= cols || j >= rows) return -1;
  return i + j * cols;
}

// === Maze Generation ===
function generateMaze() {
  maze = [];
  stack = [];
  cols = Math.floor(10 + level * 2);
  rows = Math.floor(8 + level * 2);
  cellSize = Math.min(canvas.width / (cols + 2), canvas.height / (rows + 2));

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      maze.push(new Cell(i, j));
    }
  }

  let current = maze[0];
  current.visited = true;

  while (true) {
    let next = current.checkNeighbors();
    if (next) {
      next.visited = true;
      stack.push(current);
      removeWalls(current, next);
      current = next;
    } else if (stack.length > 0) {
      current = stack.pop();
    } else break;
  }

  player = { i: 0, j: 0 };
  goal = { i: cols - 1, j: rows - 1 };
  spawnPowerUps();
}

function removeWalls(a, b) {
  let x = a.i - b.i;
  if (x === 1) {
    a.walls[3] = false;
    b.walls[1] = false;
  } else if (x === -1) {
    a.walls[1] = false;
    b.walls[3] = false;
  }

  let y = a.j - b.j;
  if (y === 1) {
    a.walls[0] = false;
    b.walls[2] = false;
  } else if (y === -1) {
    a.walls[2] = false;
    b.walls[0] = false;
  }
}

function drawLine(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function spawnPowerUps() {
  powerUps = [];
  if (level >= 4) {
    let count = Math.min(3, Math.floor(Math.random() * 3) + 2);
    for (let i = 0; i < count; i++) {
      powerUps.push({
        i: Math.floor(Math.random() * cols),
        j: Math.floor(Math.random() * rows),
        active: true,
      });
    }
  }
}

function drawMaze() {
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const mazeWidth = cols * cellSize;
  const mazeHeight = rows * cellSize;
  const offsetX = (canvas.width - mazeWidth) / 2;
  const offsetY = (canvas.height - mazeHeight) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);

  maze.forEach(cell => {
    const x = cell.i * cellSize;
    const y = cell.j * cellSize;
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2;
    if (cell.walls[0]) drawLine(x, y, x + cellSize, y);
    if (cell.walls[1]) drawLine(x + cellSize, y, x + cellSize, y + cellSize);
    if (cell.walls[2]) drawLine(x + cellSize, y + cellSize, x, y + cellSize);
    if (cell.walls[3]) drawLine(x, y + cellSize, x, y);
  });

  // Goal
  ctx.fillStyle = "#ffaa00";
  ctx.beginPath();
  ctx.arc(goal.i * cellSize + cellSize / 2, goal.j * cellSize + cellSize / 2, cellSize / 4, 0, Math.PI * 2);
  ctx.fill();

  // Power-ups
  const glowRadius = Math.sin(Date.now() / 300) * 4 + 8;
  powerUps.forEach(p => {
    if (p.active) {
      const x = p.i * cellSize + cellSize / 2;
      const y = p.j * cellSize + cellSize / 2;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
      gradient.addColorStop(0, "rgba(0, 255, 0, 1)");
      gradient.addColorStop(1, "rgba(0, 255, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, cellSize / 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Player (RED)
  ctx.fillStyle = "#ff3b3b";
  ctx.shadowColor = "#ff3b3b";
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(player.i * cellSize + cellSize / 2, player.j * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
  drawUI();
}

function drawUI() {
  const boxWidth = 200;
  const boxHeight = 70;
  const padding = 20;
  const x = canvas.width - boxWidth - padding;
  const y = padding;

  ctx.fillStyle = "rgba(0, 255, 255, 0.1)";
  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = Math.abs(Math.sin(Date.now() / 500)) * 15 + 10;

  ctx.beginPath();
  ctx.roundRect(x, y, boxWidth, boxHeight, 10);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#00ffff";
  ctx.font = "16px 'Orbitron', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`⏳ ${timeLeft}s`, x + boxWidth / 2, y + 22);
  ctx.fillText(`Level ${level}`, x + boxWidth / 2, y + 50);
}

// === Controls ===
function movePlayer(dir) {
  if (paused || gameWon) return;

  let next = { i: player.i, j: player.j };
  let current = maze[index(player.i, player.j)];

  if (dir === "UP" && !current.walls[0]) next.j--;
  else if (dir === "RIGHT" && !current.walls[1]) next.i++;
  else if (dir === "DOWN" && !current.walls[2]) next.j++;
  else if (dir === "LEFT" && !current.walls[3]) next.i--;

  if (next.i >= 0 && next.i < cols && next.j >= 0 && next.j < rows) player = next;

  powerUps.forEach(p => {
    if (p.active && p.i === player.i && p.j === player.j) {
      timeLeft += 3;
      p.active = false;
    }
  });

  if (player.i === goal.i && player.j === goal.j) {
    clearInterval(timerInterval);
    if (level >= 10) {
      winGame();
    } else {
      overlayText.textContent = "Level Complete! Press N for Next Level";
      overlay.style.display = "flex";
    }
  }
}

function startGame() {
  overlay.style.display = "none";
  timeLeft = 30 + (level - 1) * 2;
  generateMaze();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!paused) {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        overlayText.textContent = "⛔ Time's Up! Press R to Restart";
        overlay.style.display = "flex";
      }
    }
  }, 1000);
}

function nextLevel() {
  level++;
  startGame();
}

function restartGame() {
  level = 1;
  gameWon = false;
  startGame();
}

function togglePause() {
  paused = !paused;
  overlayText.textContent = paused ? "⏸️ Game Paused! Press P to Resume" : "";
  overlay.style.display = paused ? "flex" : "none";
}

function winGame() {
  gameWon = true;
  overlay.style.display = "flex";
  overlayText.innerHTML = "🎉 YOU WIN!<br><br>Press R to Restart";
  createConfetti();
}

// === Confetti effect ===
let confetti = [];
function createConfetti() {
  confetti = [];
  for (let i = 0; i < 150; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      color: `hsl(${Math.random() * 360}, 100%, 60%)`,
      size: Math.random() * 5 + 2,
      speedY: Math.random() * 3 + 1
    });
  }
}

function drawConfetti() {
  confetti.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    p.y += p.speedY;
    if (p.y > canvas.height) p.y = 0;
  });
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp" || e.key === "w") movePlayer("UP");
  if (e.key === "ArrowDown" || e.key === "s") movePlayer("DOWN");
  if (e.key === "ArrowLeft" || e.key === "a") movePlayer("LEFT");
  if (e.key === "ArrowRight" || e.key === "d") movePlayer("RIGHT");
  if (e.key === "S" || e.key === "s") startGame();
  if (e.key === "N" || e.key === "n") nextLevel();
  if (e.key === "R" || e.key === "r") restartGame();
  if (e.key === "P" || e.key === "p") togglePause();
});

function animate() {
  drawMaze();
  if (gameWon) drawConfetti();
  requestAnimationFrame(animate);
}

generateMaze();
animate();
