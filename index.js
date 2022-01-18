/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */

// recursive algo, to calc minimax for most optimal coord to place a given character on the board
// char is just a int representing the char, eg: 'X' = 0, 'O' = 1,
// 0 is max seeking, 1 is min seeking
const miniMax = (board, turn, rowScore, colScore, diagScore) => {
  const inc = turn % 2 === 0 ? 1 : -1;

  let score = 0;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(rowScore[i]) === 3) {
      score = rowScore[i] === 3 ? 1 : -1;
    } else if (Math.abs(colScore[i]) === 3) {
      score = colScore[i] === 3 ? 1 : -1;
    }
  }
  if (Math.abs(diagScore[0]) === 3) {
    score = diagScore[0] === 3 ? 1 : -1;
  } else if (Math.abs(diagScore[2]) === 3) {
    score = diagScore[2] === 3 ? 1 : -1;
  }
  if (score !== 0 || turn === board.length * board[0].length) { // win state or board filled
    return [-1, -1, score];
  }

  let win = false;
  let res = [-1, -1, -1 * inc];

  for (let i = 0; i < board.length && !win; i++) {
    for (let j = 0; j < board[i].length && !win; j++) {
      if (board[i][j] === -1) {
        board[i][j] = turn;
        rowScore[i] += inc;
        colScore[j] += inc;
        if (i + j === 2) {
          diagScore[i + j] += inc;
        }
        if (i - j === 0) {
          diagScore[i - j] += inc;
        }

        const nextState = miniMax(board, turn + 1, rowScore, colScore, diagScore);
        if (res[2] === -2 || nextState[2] * inc > res[2] * inc) {
          res = [i, j, nextState[2]];
          win = res[2] * inc === 1; // early exit
        }

        board[i][j] = -1;
        rowScore[i] -= inc;
        colScore[j] -= inc;
        if (i + j === 2) {
          diagScore[i + j] -= inc;
        }
        if (i - j === 0) {
          diagScore[i - j] -= inc;
        }
      }
    }
  }

  return res;
};

const XLiteral = 'X';
const OLiteral = 'O';
const turnText = document.querySelector('.turn-text');

const boardManager = (() => {
  const rowScore = [0, 0, 0];
  const colScore = [0, 0, 0];
  const diagScore = { 0: 0, 2: 0 }; // record slopes 0 - \, 2 - /
  const board = [[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]];
  const boardCells = []; // store board cells dom

  const gameManager = (() => {
    let turn = 0;
    let gameEnd = false;

    const addTurn = () => {
      turn++;
    };
    const getTurn = () => turn;
    const endGame = () => {
      gameEnd = true;
    };
    const isGameEnd = () => gameEnd;
    const reset = () => {
      turn = 0;
      gameEnd = false;
      turnText.textContent = 'Go on, it\'s your move, remember you are: "X"'; // hardcoded player is always 'X',
    };

    return {
      addTurn, getTurn, endGame, isGameEnd, reset,
    };
  })();

  const checkWin = () => {
    let winner = '';
    for (let i = 0; i < 3 && winner === ''; i++) {
      if (Math.abs(rowScore[i]) === 3) {
        winner = rowScore[i] === 3 ? XLiteral : OLiteral;
      } else if (Math.abs(colScore[i]) === 3) {
        winner = colScore[i] === 3 ? XLiteral : OLiteral;
      }
    }
    if (Math.abs(diagScore[0]) === 3) {
      winner = diagScore[0] === 3 ? XLiteral : OLiteral;
    } else if (Math.abs(diagScore[2]) === 3) {
      winner = diagScore[2] === 3 ? XLiteral : OLiteral;
    }
    if (winner !== '' || gameManager.getTurn() === 9) {
      gameManager.endGame();
      if (gameManager.getTurn() === 9) {
        turnText.textContent = 'Draw. You held your own ground.';
      } else if (winner === XLiteral) {
        turnText.textContent = 'Win. Impossible, you are the messiah!';
      } else {
        turnText.textContent = 'Lose. You got bested by a bot.';
      }
    }
  };

  const updateBoardState = (i, j) => {
    const turn = gameManager.getTurn();
    gameManager.addTurn();
    board[i][j] = turn;

    let char = XLiteral;
    if (turn % 2 === 1) {
      char = OLiteral;
    }

    boardCells[i][j].innerHTML = `<span class="symbol">${char}</span>`;
    const inc = turn % 2 === 0 ? 1 : -1;
    rowScore[i] += inc;
    colScore[j] += inc;
    if (i + j === 2) {
      diagScore[i + j] += inc;
    }
    if (i - j === 0) {
      diagScore[i - j] += inc;
    }
  };

  const updateGame = async (i, j) => {
    updateBoardState(i, j);

    const turn = gameManager.getTurn();
    checkWin();
    if (!gameManager.isGameEnd()) { // update prompt
      if (gameManager.getTurn() % 2 === 0) { // player's turn
        turnText.textContent = 'Go on, it\'s your move, remember you are: "X"'; // hardcoded player is always 'X',
      } else {
        turnText.textContent = 'Bot\'s turn, calculating the most optimal move...';
        const res = miniMax(board, gameManager.getTurn(), rowScore, colScore, diagScore);
        if (res[2] === 0) {
          turnText.textContent = 'Bot foresees a draw. yawn...';
        } else if (res[2] === -1) {
          turnText.textContent = 'Bot foresees a certain win. EZ game.';
        } else {
          turnText.textContent = 'Bot foresees a certain lost... HOW?!';
        }
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((r) => setTimeout(r, 1000));
        if (turn !== gameManager.getTurn()) { // someone restarted during the sleep
          return;
        }
        turnText.textContent = 'Go on, it\'s your move, remember you are: "X"'; // hardcoded player is always 'X',
        updateBoardState(res[0], res[1]);
      }
    }
  };

  const start = () => {
    diagScore[0] = 0;
    diagScore[2] = 0;

    for (let i = 0; i < board.length; i++) {
      rowScore[i] = 0;
      colScore[i] = 0;
      const row = [];
      for (let j = 0; j < board[i].length; j++) {
        board[i][j] = -1;
        const cell = document.querySelector(`.cell[data-attribute="${i}-${j}"]`);
        cell.textContent = '';
        cell.addEventListener('click', () => {
          if (cell.innerHTML === '' && gameManager.getTurn() % 2 === 0 && !gameManager.isGameEnd()) {
            const coord = cell.getAttribute('data-attribute').split('-');
            updateGame(parseInt(coord[0], 10), parseInt(coord[1], 10));
          }
        });
        row.push(cell);
      }
      boardCells.push(row);
    }
    gameManager.reset();
  };

  return { start };
})();

boardManager.start();

const restartBtn = document.querySelector('.restart-btn');
const restartIcon = document.querySelector('.fa-refresh');
restartBtn.addEventListener('mouseover', () => {
  restartIcon.classList.add('rotate');
});
restartBtn.addEventListener('mouseout', () => {
  restartIcon.classList.remove('rotate');
});

restartBtn.addEventListener('click', async () => {
  boardManager.start();
});
