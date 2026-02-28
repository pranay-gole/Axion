/* static/games/fruit_catcher/script.js
   Fruit Catcher - Fast & Bomb Challenge Edition 🚀
*/

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 🎮 Fixed game box
canvas.width = 800;
canvas.height = 500;

let basket = {
  x: canvas.width / 2 - 50,
  y: canvas.height - 80,
  w: 100,
  h: 50,
  speed: 7,
  movingLeft: false,
  movingRight: false
};

let fruits = [];
let score = 0;
let level = 1;
let fruitSpeed = 3.2;
let gameRunning = false;
let paused = false;
let overlay = document.getElementById("overlay");
let overlayText = document.getElementById("overlay-text");
let spawnInterval;

// 🍎 Fruit types
const fruitTypes = [
  { emoji: "🍎", type: "normal" },
  { emoji: "🍌", type: "normal" },
  { emoji: "🍉", type: "normal" },
  { emoji: "🍇", type: "normal" },
  { emoji: "⭐", type: "powerup" },
  { emoji: "💣", type: "bomb" },
];

// 🧺 Draw basket
function drawBasket() {
  const { x, y, w, h } = basket;
  ctx.fillStyle = "#b36b00";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.quadraticCurveTo(x + w / 2, y + h + 10, x, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y, w, 2);
}

// 🍉 Draw fruits
function drawFruits() {
  fruits.forEach((fruit) => {
    ctx.font = `${fruit.size}px Arial`;
    ctx.fillText(fruit.emoji, fruit.x, fruit.y);
  });
}

// 💻 Draw UI  (Score + Level)
// 👉 Score top-left me thoda andar, Level top-right = exit gate se door
function drawUI() {
  ctx.save();
  ctx.fillStyle = "#00ffff";
  ctx.font = "20px Orbitron";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 24, 34);

  ctx.textAlign = "right";
  ctx.fillText(`Level: ${level}`, canvas.width - 24, 34);
  ctx.restore();
}

// 🧺 Keep basket inside bounds
function clampBasket() {
  if (basket.x < 0) basket.x = 0;
  if (basket.x + basket.w > canvas.width) basket.x = canvas.width - basket.w;
}

// 🍌 Spawn fruits (more bombs + faster pace)
function spawnFruit() {
  const roll = Math.random();
  let fruit;

  // 💣 Higher bomb probability
  if (roll < 0.15 + level * 0.015) fruit = { emoji: "💣", type: "bomb" };
  else if (roll < 0.20 && level >= 2) fruit = { emoji: "⭐", type: "powerup" };
  else fruit = fruitTypes[Math.floor(Math.random() * 4)];

  fruits.push({
    x: Math.random() * (canvas.width - 40),
    y: -40,
    size: 36,
    emoji: fruit.emoji,
    type: fruit.type,
    speed: fruitSpeed + Math.random() * 1.8,
  });
}

// ⚙️ Game loop
function update() {
  if (!gameRunning || paused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (basket.movingLeft) basket.x -= basket.speed;
  if (basket.movingRight) basket.x += basket.speed;
  clampBasket();

  drawBasket();
  drawFruits();
  drawUI();

  for (let i = fruits.length - 1; i >= 0; i--) {
    const fruit = fruits[i];
    fruit.y += fruit.speed;

    const caught =
      fruit.y + fruit.size >= basket.y &&
      fruit.x + fruit.size / 2 >= basket.x &&
      fruit.x <= basket.x + basket.w;

    if (caught) {
      if (fruit.type === "bomb") {
        fruits.splice(i, 1);
        triggerBombLose();
        return;
      } else {
        score += fruit.type === "powerup" ? 5 : 1;
        fruits.splice(i, 1);
        if (score % 12 === 0) { // Faster level-up
          level++;
          fruitSpeed += 0.5;
          showLevelUp();
        }
      }
    } else if (fruit.y > canvas.height) {
      fruits.splice(i, 1);
    }
  }
}

function showLevelUp() {
  overlayText.innerHTML = `
    <div class="overlay-title" style="color:#00ffff;">
      LEVEL ${level}
    </div>
  `;

  overlay.classList.remove("hidden");

  setTimeout(() => {
    if (gameRunning && !paused) {
      overlay.classList.add("hidden");
    }
  }, 800);
}

function triggerBombLose() {
  gameRunning = false;
  clearTimeout(spawnInterval);

  overlayText.innerHTML = `
    <div class="overlay-title">GAME OVER</div>
    <div>Final Score: ${score}</div>
    <div>Level Reached: ${level}</div>
    <div class="overlay-sub">Press <b>R</b> to Restart</div>
  `;

  overlay.classList.remove("hidden");
}

// 🍊 Faster spawn loop
function spawnLoop() {
  if (!gameRunning) return;
  if (fruits.length < 4) spawnFruit();
  const delay = Math.max(500, 1000 - Math.min(score * 12, 600));
  spawnInterval = setTimeout(spawnLoop, delay);
}

// 🎮 Controls
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") basket.movingLeft = true;
  if (e.key === "ArrowRight" || e.key === "d") basket.movingRight = true;
  if (e.key === "S" || e.key === "s") startGame();
  if (e.key === "R" || e.key === "r") restartGame();
  if (e.key === "P" || e.key === "p") togglePause();
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") basket.movingLeft = false;
  if (e.key === "ArrowRight" || e.key === "d") basket.movingRight = false;
});

function togglePause() {
  if (!gameRunning) return;

  paused = !paused;

  if (paused) {
    overlayText.innerHTML = `
      <div class="overlay-title" style="color:#ffaa00;">PAUSED</div>
      Press <b>P</b> to Resume
    `;
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
}

function startGame() {
  if (gameRunning) return;

  score = 0;
  level = 1;
  fruitSpeed = 3.2;
  fruits = [];
  paused = false;
  gameRunning = true;

  overlay.classList.add("hidden");

  spawnLoop();
}

function restartGame() {
  score = 0;
  level = 1;
  fruitSpeed = 3.2;
  fruits = [];
  paused = false;
  gameRunning = false;

  overlayText.innerHTML = `
    <div class="overlay-title" style="color:#00ffff;"</div>
    Press <b>S</b> to Start
    </div>
  `;

  overlay.classList.remove("hidden");
}

// ⚡ Animate
function animate() {
  update();
  requestAnimationFrame(animate);
}

overlayText.innerHTML = `
  <div class="overlay-title" style="color:#00ffff;">
  Press <b>S</b> to Start
  </div>
`;

overlay.classList.remove("hidden");
animate();