// Clean Tic Tac Toe Game Logic (auto-restart + colored X/O)
const cells = document.querySelectorAll("[data-cell]");
const status = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");

let currentPlayer = "X";
let boardState = Array(9).fill(null);
let gameActive = true;
let autoRestartTimeout = null;

const winPatterns = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function handleClick(e) {
  const cell = e.target;
  const index = [...cells].indexOf(cell);

  if (!gameActive || boardState[index]) return;

  boardState[index] = currentPlayer;
  cell.textContent = currentPlayer;
  cell.classList.add("taken");

  // Apply color per player
  cell.style.color = currentPlayer === "X" ? "#00e5ff" : "#ff4dc4";

  if (checkWin()) {
    status.textContent = `🎉 Player ${currentPlayer} wins!`;
    gameActive = false;
    highlightWin();
    autoRestart();
  } else if (boardState.every(cell => cell)) {
    status.textContent = "🤝 It's a draw!";
    gameActive = false;
    autoRestart();
  } else {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    status.textContent = `Player ${currentPlayer}'s turn`;
  }
}

function checkWin() {
  return winPatterns.some(pattern => {
    const [a, b, c] = pattern;
    return (
      boardState[a] &&
      boardState[a] === boardState[b] &&
      boardState[a] === boardState[c]
    );
  });
}

function highlightWin() {
  winPatterns.forEach(pattern => {
    const [a, b, c] = pattern;
    if (
      boardState[a] &&
      boardState[a] === boardState[b] &&
      boardState[a] === boardState[c]
    ) {
      [a, b, c].forEach(i => {
        cells[i].style.backgroundColor = "#00e5ff";
        cells[i].style.color = "#000";
        cells[i].style.transition = "0.4s ease";
      });
    }
  });
}

function restartGame() {
  clearTimeout(autoRestartTimeout);
  boardState.fill(null);
  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove("taken");
    cell.style.backgroundColor = "rgba(25, 25, 25, 0.9)";
    cell.style.color = "#00e5ff";
  });
  currentPlayer = "X";
  gameActive = true;
  status.textContent = "Player X's turn";
}

function autoRestart() {
  autoRestartTimeout = setTimeout(() => {
    restartGame();
  }, 2500); // 2.5s delay before restarting
}

// Event listeners (mouse + touch support)
cells.forEach(cell => {
  cell.addEventListener("click", handleClick);
  cell.addEventListener("touchstart", handleClick, { passive: true });
});

restartBtn.addEventListener("click", restartGame);
restartBtn.addEventListener("touchstart", restartGame, { passive: true });

// 🔧 Small mobile adjustment: resize board on rotation
window.addEventListener("resize", () => {
  document.body.style.height = window.innerHeight + "px";
});
