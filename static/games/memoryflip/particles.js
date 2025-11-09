const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
const colors = ['#00ffff', '#ff4d8d', '#7cffcb', '#ffd24d', '#00bfff'];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function createParticle() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedY: Math.random() * 1 + 0.5,
  };
}

for (let i = 0; i < 100; i++) particles.push(createParticle());

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let p of particles) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    p.y += p.speedY;
    if (p.y > canvas.height) {
      p.y = 0;
      p.x = Math.random() * canvas.width;
    }
  }
  requestAnimationFrame(draw);
}
draw();
