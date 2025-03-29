let board = null;
const game = new Chess();
var moves = [];
var currentMoveIndex = -1;
let capturedPieces = { white: [], black: [] };

/* Configuration for analysis board (no move functionality) */
const config = {
    draggable: false, // Disable piece dragging
    position: 'start',
    pieceTheme: piece => `/static/${piece}.png`
};

// Function to highlight squares/pieces when in check or checkmate
function highlightCheckAndCheckmate() {
    // Remove previous highlights from squares
    $('.square-55d63').removeClass('check checkmate');

    // If the game is in check or checkmate
    if (game.in_check() || game.in_checkmate()) {
        // Get the king's position
        var kingPos = null;
        var kingColor = game.turn();
        var pieces = game.board();

        // Find the king's position
        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 8; j++) {
                if (pieces[i][j] && pieces[i][j].type === 'k' && pieces[i][j].color === kingColor) {
                    kingPos = String.fromCharCode(97 + j) + (8 - i);
                    break;
                }
            }
            if (kingPos) break;
        }

        if (kingPos) {
            if (game.in_checkmate()) {
                $('.square-' + kingPos).addClass('checkmate');
            } else if (game.in_check()) {
                $('.square-' + kingPos).addClass('check');
            }
        }
    }
}

// Function to update the game status
function updateGameStatus() {
    var statusElement = document.getElementById('status');
    if (!statusElement) return;

    if (game.in_checkmate()) {
        statusElement.textContent = 'Checkmate! ' + (game.turn() === 'w' ? 'Black' : 'White') + ' wins.';
        highlightCheckAndCheckmate();
    } else if (game.in_stalemate()) {
        statusElement.textContent = 'Stalemate!';
    } else if (game.in_draw()) {
        statusElement.textContent = 'Draw!';
    } else if (game.in_check()) {
        statusElement.textContent = 'Check!';
        highlightCheckAndCheckmate();
    } else {
        statusElement.textContent = (game.turn() === 'w' ? 'White' : 'Black') + ' to move';
        highlightCheckAndCheckmate();
    }
}

// Update move list display
function updateMoveList() {
    const moveListContainer = document.getElementById('move-list-container');
    
    if (!moveListContainer) return;
    
    // Clear previous content
    moveListContainer.innerHTML = '';
    
    // Create table structure
    const table = document.createElement('table');
    table.className = 'move-table';
    
    // Add header row
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>White</th><th>Black</th>';
    table.appendChild(headerRow);
    
    // Group moves into pairs (white+black)
    const movePairs = [];
    for (let i = 0; i < moves.length; i += 2) {
        movePairs.push({
            white: moves[i],
            black: i + 1 < moves.length ? moves[i + 1] : null
        });
    }
    
    // Create table rows
    movePairs.forEach((pair, pairIndex) => {
        const row = document.createElement('tr');
        
        // White move cell
        const whiteCell = document.createElement('td');
        if (pair.white) {
            const whiteMove = document.createElement('div');
            whiteMove.className = 'move-item';
            whiteMove.setAttribute('data-index', pairIndex * 2);
            whiteMove.textContent = pair.white;
            whiteCell.appendChild(whiteMove);
        }
        
        // Black move cell
        const blackCell = document.createElement('td');
        if (pair.black) {
            const blackMove = document.createElement('div');
            blackMove.className = 'move-item';
            blackMove.setAttribute('data-index', pairIndex * 2 + 1);
            blackMove.textContent = pair.black;
            blackCell.appendChild(blackMove);
        }
        
        row.appendChild(whiteCell);
        row.appendChild(blackCell);
        table.appendChild(row);
    });
    
    moveListContainer.appendChild(table);
    highlightCurrentMove();
    scrollToCurrentMove();
}

function highlightCurrentMove() {
    // Remove previous highlights
    document.querySelectorAll('.move-item').forEach(item => {
        item.classList.remove('highlighted');
    });
    
    // Highlight current move if valid
    if (currentMoveIndex >= 0 && currentMoveIndex < moves.length) {
        const moveItem = document.querySelector(`.move-item[data-index="${currentMoveIndex}"]`);
        if (moveItem) {
            moveItem.classList.add('highlighted');
        }
    }
}

function scrollToCurrentMove() {
    if (currentMoveIndex >= 0 && currentMoveIndex < moves.length) {
        const moveItem = document.querySelector(`.move-item[data-index="${currentMoveIndex}"]`);
        if (moveItem) {
            moveItem.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }
}

function displayPlayerInfo(pgnHeader) {
    const uploadSection = document.getElementById('uploadSection');
    const playerInfo = document.getElementById('playerInfo');
    
    uploadSection.style.display = 'none';
    playerInfo.style.display = 'block';
    
    document.getElementById('whitePlayerName').textContent = pgnHeader.White || 'Unknown';
    document.getElementById('blackPlayerName').textContent = pgnHeader.Black || 'Unknown';
    document.getElementById('eventDate').textContent = pgnHeader.eventDate || pgnHeader.Date || 'Unknown';
}

function flipChessBoard() {
    const newOrientation = board.orientation() === 'white' ? 'black' : 'white';
    board.orientation(newOrientation);
    
    if (game) {
        board.position(game.fen());
        setTimeout(() => {
            updateGameStatus();
            highlightCurrentMove();
            if (game.in_check() || game.in_checkmate()) {
                highlightCheckAndCheckmate();
            }
        }, 10);
    }
}

function updateCapturedPieces() {
    const whiteCaptured = document.getElementById('white-captured');
    const blackCaptured = document.getElementById('black-captured');
    
    // Clear previous captured pieces
    whiteCaptured.innerHTML = '';
    blackCaptured.innerHTML = '';
    
    // Add captured pieces for white (pieces black captured)
    capturedPieces.white.forEach(piece => {
        const pieceImg = document.createElement('img');
        pieceImg.src = `/static/${piece}.png`;
        pieceImg.className = 'captured-piece';
        whiteCaptured.appendChild(pieceImg);
    });
    
    // Add captured pieces for black (pieces white captured)
    capturedPieces.black.forEach(piece => {
        const pieceImg = document.createElement('img');
        pieceImg.src = `/static/${piece}.png`;
        pieceImg.className = 'captured-piece';
        blackCaptured.appendChild(pieceImg);
    });
}

function navigateToMove(targetIndex) {
    if (targetIndex < -1 || targetIndex >= moves.length) return;
    
    game.reset();
    capturedPieces = { white: [], black: [] };
    
    for (let i = 0; i <= targetIndex && i < moves.length; i++) {
        const move = game.move(moves[i]);
        if (move?.captured) {
            const color = move.color === 'w' ? 'black' : 'white';
            const piece = (move.color === 'w' ? 'b' : 'w') + move.captured.toUpperCase();
            capturedPieces[color].push(piece);
        }
    }
    
    currentMoveIndex = targetIndex;
    board.position(game.fen());
    updateGameStatus();
    updateMoveList();
    updateCapturedPieces();
}

function setupMoveListHandlers() {
    const moveListContainer = document.getElementById('move-list-container');
    
    if (moveListContainer) {
        moveListContainer.addEventListener('click', handleMoveClick);
    }
}

function handleMoveClick(e) {
    const moveItem = e.target.closest('.move-item');
    if (moveItem) {
        const clickedIndex = parseInt(moveItem.getAttribute('data-index'));
        navigateToMove(clickedIndex);
    }
}

// Initialize the board
document.addEventListener('DOMContentLoaded', () => {
    board = Chessboard('myBoard', config);
    setupMoveListHandlers();

    // Get DOM elements safely
    const flipBoardBtn = document.getElementById('flipBoard');
    const pgnUpload = document.getElementById('pgnUpload');
    const nextMoveBtn = document.getElementById('nextMove');
    const prevMoveBtn = document.getElementById('prevMove');
    const moveListBtn = document.getElementById('move-list-container');
    // Only add event listeners if elements exist
    if (flipBoardBtn) {
        flipBoardBtn.addEventListener('click', flipChessBoard);
    }
    
    if (pgnUpload) {
        pgnUpload.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const pgn = e.target.result.trim();
                if (!game.load_pgn(pgn)) {
                    alert("Invalid PGN file! Please upload a valid PGN.");
                    return;
                }
                
                const pgnHeader = game.header();
                displayPlayerInfo(pgnHeader);
                moves = game.history();
                
                // Reset to beginning
                navigateToMove(-1);
            };
            reader.readAsText(file);
        });
    }

    if (nextMoveBtn) {
        nextMoveBtn.addEventListener('click', () => {
            navigateToMove(currentMoveIndex + 1);
        });
    }

    if (prevMoveBtn) {
        prevMoveBtn.addEventListener('click', () => {
            navigateToMove(currentMoveIndex - 1);
        });
    }

    if(moveListBtn){
        moveListBtn.addEventListener('click', handleMoveClick);
    }
});
