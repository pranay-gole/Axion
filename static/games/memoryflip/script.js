const emojis = ['🎮','👾','🚀','🛸','🌌','🧠','🕹️','💾'];

let flippedCards = [];
let matchedPairs = 0;
let lock = false;
let currentPlayer = 1;
let scores = { 1: 0, 2: 0 };

function $(sel){ return document.querySelector(sel); }

function shuffle(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function updateTurnUI(){
  $('#p1').classList.toggle('active', currentPlayer === 1);
  $('#p2').classList.toggle('active', currentPlayer === 2);
  $('#p1Score').textContent = scores[1];
  $('#p2Score').textContent = scores[2];
}

function createCard(emoji){
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `<div class="front">?</div><div class="back">${emoji}</div>`;
  card.addEventListener('click', () => flipCard(card));
  return card;
}

function flipCard(card){
  if (lock || card.classList.contains('flipped') || flippedCards.length === 2) return;
  card.classList.add('flipped');
  flippedCards.push(card);
  if (flippedCards.length === 2) checkMatch();
}

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
      const p1 = scores[1], p2 = scores[2];
      let msg = '🎉 Game Over! ';
      msg += (p1 === p2) ? `It's a draw (${p1}-${p2})` :
             (p1 > p2)  ? `Player 1 wins (${p1}-${p2})` :
                          `Player 2 wins (${p2}-${p1})`;
      const overlay = $('#overlay');
      const message = $('#winnerMessage');
      message.textContent = msg;
      overlay.classList.add('active');

      // 🔁 Restart automatically after 3 seconds
      setTimeout(() => {
        overlay.classList.remove('active');
        initGame();
      }, 3000);
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
    }, 900);
  }
}

function initGame(){
  const board = $('#gameBoard');
  board.innerHTML = '';
  matchedPairs = 0;
  flippedCards = [];
  lock = false;
  currentPlayer = 1;
  scores = { 1: 0, 2: 0 };
  updateTurnUI();

  const shuffled = shuffle([...emojis, ...emojis]);
  shuffled.forEach(e => board.appendChild(createCard(e)));
}

document.addEventListener('DOMContentLoaded', initGame);
