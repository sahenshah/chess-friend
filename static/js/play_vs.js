let board = null;
const game = new Chess();
const moveList = [];
let capturedPieces = { white: [], black: [] };
let selectedSquare = null;

function onDragStart(source, piece, position, orientation) {
    if (game.game_over()) return false;

    // Only allow dragging pieces for the side to move
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }

    // Toggle selection if clicking the same piece
    if (selectedSquare === source) {
        removeHighlights();
        selectedSquare = null;
        return false;
    }

    handlePieceSelection(source, piece);
    return true;
}

function handlePieceSelection(source, piece) {
    // Clear previous selection
    removeHighlights();

    // Highlight new selection
    const squareElement = document.querySelector(`.square-${source}`);
    if (squareElement) {
        squareElement.classList.add('selected-square');
    }

    // Highlight legal moves
    const legalMoves = game.moves({ square: source, verbose: true });
    legalMoves.forEach(move => {
        const square = document.querySelector(`.square-${move.to}`);
        if (square) {
            square.classList.add('valid-move');
            // Add custom data attribute for move details
            square.dataset.moveFrom = source;
            square.dataset.moveTo = move.to;
        }
    });

    selectedSquare = source;
}

function onDrop(source, target) {
    if (source === target) {
        return;
    }

    // Try to make the move
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q',
        legal: true // Only allow legal moves
    });

    if (move === null) {
        // If move is invalid, select the target square if it's our piece
        const piece = game.get(target);
        if (piece && piece.color === game.turn()) {
            handlePieceSelection(target, piece.type);
        }
        return 'snapback';
    }

    // Successful move
    updateAfterMove(move);
}

function handleBoardClick(event) {
    const squareElement = event.target.closest('.square-55d63');
    if (!squareElement) return;

    const square = squareElement.getAttribute('data-square');
    if (!square) return;

    const piece = game.get(square);

    // If we have a selected square, attempt to move
    if (selectedSquare) {
        const move = game.move({
            from: selectedSquare,
            to: square,
            promotion: 'q'
        });

        if (move === null) {
            // If invalid move but clicked our own piece, select it
            if (piece && piece.color === game.turn()) {
                handlePieceSelection(square, piece.type);
            }
            return;
        }

        updateAfterMove(move);
    } else {
        // Select the piece if it's our turn
        if (piece && piece.color === game.turn()) {
            handlePieceSelection(square, piece.type);
        }
    }
}

function updateAfterMove(move) {
    // Update the board position
    board.position(game.fen());

    // Update the move list
    addMoveToList(move);

    // Update captured pieces
    updateCapturedPieces(move);

    // Update the game status
    updateStatus();

    // Remove all highlights
    removeHighlights();

    // Clear the selected square
    selectedSquare = null;

    // Auto-flip board for black's turn if configured
    const autoFlipCheckbox = document.getElementById('autoFlip');
    if (game.turn() === 'b' && autoFlipCheckbox && autoFlipCheckbox.checked) {
        board.flip();
    }
}

function removeHighlights() {
    document.querySelectorAll('.valid-move, .selected-square, .hover-highlight').forEach(el => {
        el.classList.remove('valid-move', 'selected-square', 'hover-highlight');
    });
}

// Improved move list display with scroll to bottom
function updateMoveListDisplay() {
    const moveListElement = document.getElementById('move-list-body');
    if (!moveListElement) return;

    moveListElement.innerHTML = '';

    let currentRow = null;
    moveList.forEach((move, index) => {
        if (index % 2 === 0) {
            // White move (even index)
            currentRow = document.createElement('tr');
            currentRow.innerHTML = `
                <td>${Math.floor(index / 2) + 1}</td> <!-- Move number -->
                <td>${move.replace(/^\d+\.\s*/, '')}</td> <!-- White move without move number -->
                <td></td> <!-- Placeholder for black move -->
            `;
            moveListElement.appendChild(currentRow);
        } else if (currentRow) {
            // Black move (odd index)
            currentRow.children[2].textContent = move;
        }
    });

    // Scroll to bottom of move list
    moveListElement.parentElement.scrollTop = moveListElement.parentElement.scrollHeight;
}

function addMoveToList(move) {
    const moveNumber = Math.ceil(moveList.length / 2) + 1;
    const moveNotation = `${move.color === 'w' ? moveNumber + '. ' : ''}${move.san}`;
    moveList.push(moveNotation);
    updateMoveListDisplay();
}

function updateCapturedPieces(move) {
    if (!move.captured) return;

    const capturedPieceColor = move.color === 'w' ? 'b' : 'w';
    const containerId = move.color === 'w' ? 'black-captured' : 'white-captured';
    const container = document.getElementById(containerId);
    if (!container) return;

    // Create or update captured piece display
    const pieceType = move.captured.toLowerCase();
    let pieceElement = container.querySelector(`.captured-${pieceType}`);
    
    if (!pieceElement) {
        pieceElement = document.createElement('div');
        pieceElement.className = `captured-piece captured-${pieceType}`;
        pieceElement.innerHTML = `
            <img src="/static/${capturedPieceColor}${move.captured.toUpperCase()}.png" 
                 alt="${capturedPieceColor}${move.captured}">
            <span class="captured-count">1</span>
        `;
        container.appendChild(pieceElement);
    } else {
        const countElement = pieceElement.querySelector('.captured-count');
        if (countElement) {
            const currentCount = parseInt(countElement.textContent) || 0;
            countElement.textContent = currentCount + 1;
        }
    }
}

function onSnapEnd() {
    board.position(game.fen());
}

function updateStatus() {
    const statusElement = document.getElementById('status');
    if (!statusElement) return;

    let status = '';
    const moveColor = game.turn() === 'w' ? 'White' : 'Black';

    if (game.in_checkmate()) {
        status = `Checkmate! ${moveColor} loses.`;
        statusElement.className = 'status-checkmate';
    } else if (game.in_draw()) {
        status = 'Game drawn!';
        statusElement.className = 'status-draw';
    } else {
        status = `${moveColor} to move`;
        if (game.in_check()) {
            status += ` (in check)`;
            statusElement.className = 'status-check';
        } else {
            statusElement.className = game.turn() === 'w' ? 'status-white' : 'status-black';
        }
    }

    statusElement.textContent = status;
}

function flipBoard() {
    board.flip();
    updateStatus();
}

function updatePlayerNames() {
    const whitePlayerInput = document.getElementById('whitePlayerName');
    const blackPlayerInput = document.getElementById('blackPlayerName');

    const whitePlayerName = whitePlayerInput.value.trim() || 'Player 1';
    const blackPlayerName = blackPlayerInput.value.trim() || 'Player 2';
}

function handleMouseoverSquare(square) {
    if (!selectedSquare) return;

    const squareElement = document.querySelector(`.square-${square}`);
    if (!squareElement) return;

    // Check if this is a valid move from the selected square
    const legalMoves = game.moves({ square: selectedSquare, verbose: true });
    const isValidMove = legalMoves.some(move => move.to === square);

    if (isValidMove) {
        squareElement.classList.add('hover-highlight');
        
        // Preview the move (optional)
        const piece = game.get(selectedSquare);
        if (piece) {
            squareElement.innerHTML = `
                <div class="move-preview" style="opacity:0.5">
                    <img src="/static/${piece.color}${piece.type.toUpperCase()}.png" 
                         alt="${piece.color}${piece.type}">
                </div>
            `;
        }
    }
}

function handleMouseoutSquare(square) {
    const squareElement = document.querySelector(`.square-${square}`);
    if (squareElement) {
        squareElement.classList.remove('hover-highlight');
        // Remove any move preview
        const preview = squareElement.querySelector('.move-preview');
        if (preview) preview.remove();
    }
}

const config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: function(piece) {
        return `/static/${piece}.png`;
    },
    onMouseoverSquare: function(square) {
        handleMouseoverSquare(square);
    },
    onMouseoutSquare: function(square) {
        handleMouseoutSquare(square);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    board = Chessboard('myBoard', config);

    const boardContainer = document.getElementById('myBoard');
    if (boardContainer) {
        boardContainer.addEventListener('click', handleBoardClick);
    }

    const flipBoardButton = document.getElementById('flipBoard');
    if (flipBoardButton) {
        flipBoardButton.addEventListener('click', flipBoard);
    }

    const whitePlayerInput = document.getElementById('whitePlayerName');
    const blackPlayerInput = document.getElementById('blackPlayerName');

    whitePlayerInput.value = 'Player 1';
    blackPlayerInput.value = 'Player 2';

    whitePlayerInput.addEventListener('input', () => {
        updatePlayerNames();
    });

    blackPlayerInput.addEventListener('input', () => {
        updatePlayerNames();
    });

    updateStatus();
});