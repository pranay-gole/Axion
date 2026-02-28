const emojis = [
  '🎮','👾','🚀','🛸','🌌','🧠',
  '🕹️','💾','⚡','🔮','🤖','🌠'
];

let flippedCards = [];
let matchedPairs = 0;
let lock = false;
let currentPlayer = 1;
let scores = { 1: 0, 2: 0 };
let gameMode = "single";

function $(sel){ return document.querySelector(sel); }

function shuffle(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ================= PLAYER LABEL SWITCH ================= */

function updateModeLabels(){
  const p2Name = document.getElementById('p2Name');

  if(gameMode === "single"){
    p2Name.textContent = "AI";
  } else {
    p2Name.textContent = "Player 2";
  }
}

/* ================= TURN UI ================= */

function updateTurnUI(){
  $('#p1').classList.toggle('active', currentPlayer === 1);
  $('#p2').classList.toggle('active', currentPlayer === 2);
  $('#p1Score').textContent = scores[1];
  $('#p2Score').textContent = scores[2];
}

/* ================= CARD CREATION ================= */

function createCard(emoji){
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `<div class="front">?</div><div class="back">${emoji}</div>`;

  card.addEventListener('click', () => {
    if(gameMode === "single" && currentPlayer === 2) return;
    flipCard(card);
  });

  return card;
}

function flipCard(card){
  if (lock || card.classList.contains('flipped') || flippedCards.length === 2) return;

  card.classList.add('flipped');
  flippedCards.push(card);

  if (flippedCards.length === 2) checkMatch();
}

/* ================= MATCH LOGIC ================= */

function checkMatch(){
  const [a, b] = flippedCards;
  const ea = a.querySelector('.back').textContent;
  const eb = b.querySelector('.back').textContent;

  if (ea === eb){
    scores[currentPlayer] += 1;
    matchedPairs += 1;
    flippedCards = [];
    updateTurnUI();

    if (matchedPairs === emojis.length){
      showGameOver();
      return;
    }

    if(gameMode === "single" && currentPlayer === 2){
      setTimeout(aiTurn, 800);
    }

  } else {
    lock = true;

    setTimeout(() => {
      a.classList.remove('flipped');
      b.classList.remove('flipped');
      flippedCards = [];
      currentPlayer = currentPlayer === 1 ? 2 : 1;
      updateTurnUI();
      lock = false;

      if(gameMode === "single" && currentPlayer === 2){
        setTimeout(aiTurn, 800);
      }

    }, 900);
  }
}

/* ================= SIMPLE AI ================= */

function aiTurn(){
  if(gameMode !== "single") return;
  if(matchedPairs === emojis.length) return;

  const available = [...document.querySelectorAll('.card:not(.flipped)')];
  if(available.length < 2) return;

  const first = available[Math.floor(Math.random() * available.length)];
  flipCard(first);

  setTimeout(() => {
    const remaining = [...document.querySelectorAll('.card:not(.flipped)')];
    const second = remaining[Math.floor(Math.random() * remaining.length)];
    flipCard(second);
  }, 500);
}

/* ================= GAME OVER ================= */

function showGameOver(){
  const p1 = scores[1];
  const p2 = scores[2];

  const p1Name = document.getElementById('p1Name').textContent;
  const p2Name = document.getElementById('p2Name').textContent;

  let msg = '🎉 GAME OVER! ';

  if(gameMode === "single"){
    msg += (p1 === p2) ? `It's a draw (${p1}-${p2})` :
           (p1 > p2) ? `${p1Name} wins! (${p1}-${p2})` :
                       `${p2Name} wins! (${p2}-${p1})`;
  } else {
    msg += (p1 === p2) ? `It's a draw (${p1}-${p2})` :
           (p1 > p2) ? `${p1Name} wins! (${p1}-${p2})` :
                       `${p2Name} wins! (${p2}-${p1})`;
  }

  const overlay = $('#overlay');
  const message = $('#winnerMessage');

  message.innerHTML = `
    ${msg}
    <br><br>
    <button class="restart-btn" id="restartBtn">Restart</button>
  `;

  overlay.classList.add('active');

  document.getElementById('restartBtn').addEventListener('click', () => {
    overlay.classList.remove('active');
    initGame();
  });
}

/* ================= INIT ================= */

function initGame(){
  const board = $('#gameBoard');
  board.innerHTML = '';
  matchedPairs = 0;
  flippedCards = [];
  lock = false;
  currentPlayer = 1;
  scores = { 1: 0, 2: 0 };

  updateModeLabels();
  updateTurnUI();

  const shuffled = shuffle([...emojis, ...emojis]);
  shuffled.forEach(e => board.appendChild(createCard(e)));
}

/* ================= MODE BUTTONS ================= */

document.getElementById('singleBtn').addEventListener('click', () => {
  gameMode = "single";
  document.getElementById('singleBtn').classList.add('active');
  document.getElementById('multiBtn').classList.remove('active');
  initGame();
});

document.getElementById('multiBtn').addEventListener('click', () => {
  gameMode = "multi";
  document.getElementById('multiBtn').classList.add('active');
  document.getElementById('singleBtn').classList.remove('active');
  initGame();
});

document.addEventListener('DOMContentLoaded', initGame);