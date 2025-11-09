// Multicolor Falling Particle Background (Mobile Optimized)
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');

let particles = [];
const numParticles = 70;
let lastTime = 0;

// ✅ Resize canvas properly for all devices
function resize() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  ctx.scale(ratio, ratio);
}
window.addEventListener('resize', resize);
resize();

const colors = ['#00e5ff', '#7a5cff', '#ff4dff', '#008cff'];

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width / (window.devicePixelRatio || 1);
    this.y = Math.random() * -canvas.height / (window.devicePixelRatio || 1);
    this.size = Math.random() * 2 + 1;
    this.speed = Math.random() * 1.2 + 0.3;
    this.alpha = Math.random() * 0.5 + 0.3;
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.y += this.speed;
    if (this.y > canvas.height / (window.devicePixelRatio || 1)) this.reset();
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ✅ Initialize particles
for (let i = 0; i < numParticles; i++) {
  particles.push(new Particle());
}

// ✅ Optimized animation loop
function animate(timestamp) {
  const deltaTime = timestamp - lastTime;
  if (deltaTime < 16) { // ~60fps limiter
    requestAnimationFrame(animate);
    return;
  }
  lastTime = timestamp;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
