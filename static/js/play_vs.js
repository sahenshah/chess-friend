let board = null;
const game = new Chess();
const moveList = [];
let capturedPieces = { white: [], black: [] };

function onDragStart(source, piece, position, orientation) {
    // Only pick up pieces for the side to move
    if (game.game_over()) return false;
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

function onDrop(source, target) {
    // Check if the move is a pawn promotion
    const isPawnPromotion = (source[1] === '7' && target[1] === '8' && game.turn() === 'w') ||
                            (source[1] === '2' && target[1] === '1' && game.turn() === 'b');

    let promotionPiece = 'q'; // Default promotion to queen

    if (isPawnPromotion) {
        // Prompt the player to choose a promotion piece
        const validPromotions = ['q', 'r', 'b', 'n']; // Queen, Rook, Bishop, Knight
        let choice = prompt(
            "Promote pawn to (q = Queen, r = Rook, b = Bishop, n = Knight):",
            "q"
        );

        // Validate the player's choice
        if (choice && validPromotions.includes(choice.toLowerCase())) {
            promotionPiece = choice.toLowerCase();
        } else {
            alert("Invalid choice! Defaulting to Queen.");
        }
    }

    const move = game.move({
        from: source,
        to: target,
        promotion: promotionPiece // Use the selected promotion piece
    });

    if (move === null) return 'snapback'; // Illegal move

    board.position(game.fen());
    addMoveToList(move); // Add the move to the move list
    updateCapturedPieces(move); // Update captured pieces
    updateStatus(); // Update the game status
}

function addMoveToList(move) {
    // Determine move number
    const moveNumber = Math.ceil(moveList.length / 2) + 1;

    // Create move notation
    const moveNotation = `${move.color === 'w' ? moveNumber + '. ' : ''}${move.san}`;

    // Add to move list array
    moveList.push(moveNotation);

    // Update move list display
    updateMoveListDisplay();
}

function updateMoveListDisplay() {
    const moveListElement = document.getElementById('move-list-body');

    // Ensure the element exists
    if (!moveListElement) {
        console.error('Element with ID "move-list-body" not found.');
        return;
    }

    // Clear existing list
    moveListElement.innerHTML = '';

    // Recreate list from moveList array
    moveList.forEach((move, index) => {
        const moveNumber = Math.floor(index / 2) + 1; // Calculate move number
        const isWhiteMove = index % 2 === 0;

        // Create a new row for every pair of moves
        if (isWhiteMove) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${moveNumber}</td>
                <td>${move}</td>
                <td></td>
            `;
            moveListElement.appendChild(row);
        } else {
            // Update the black move in the last row
            const lastRow = moveListElement.lastElementChild;
            if (lastRow) {
                lastRow.children[2].textContent = move;
            }
        }
    });
}

function updateCapturedPieces(move) {
    const whiteCapturedElement = document.getElementById('black-captured');
    const blackCapturedElement = document.getElementById('white-captured');

    // Ensure the elements exist
    if (!whiteCapturedElement || !blackCapturedElement) {
        console.error('Captured pieces elements not found.');
        return;
    }

    // Check if a piece was captured
    if (move.captured) {
        const capturedPieceColor = move.color === 'w' ? 'b' : 'w'; // Opponent's color
        const capturedPieceType = move.captured; // Type of the captured piece

        // Construct the image path with the correct format (e.g., bP, wN)
        const capturedPieceImage = document.createElement('img');
        capturedPieceImage.src = `/static/${capturedPieceColor}${capturedPieceType.toUpperCase()}.png`; // First letter lowercase, second uppercase
        capturedPieceImage.alt = `${capturedPieceColor}${capturedPieceType}`;
        capturedPieceImage.className = 'captured-piece';

        // Add the captured piece to the appropriate section
        if (move.color === 'w') {
            whiteCapturedElement.appendChild(capturedPieceImage); // Black's captured pieces
        } else {
            blackCapturedElement.appendChild(capturedPieceImage); // White's captured pieces
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
    let moveColor = 'White';
    if (game.turn() === 'b') {
        moveColor = 'Black';
    }

    // Checkmate?
    if (game.in_checkmate()) {
        status = `Game over, ${moveColor} is in checkmate.`;
        statusElement.style.backgroundColor = '#9c1313'; // Red background for checkmate
        statusElement.style.color = '#ffffff'; // White text
    }
    // Draw?
    else if (game.in_draw()) {
        status = 'Game over, drawn position.';
        statusElement.style.backgroundColor = '#f0f4f8'; // Neutral light gray background
        statusElement.style.color = '#000000'; // Black text
    }
    // Game still on
    else {
        status = `${moveColor} to move`;

        // Check?
        if (game.in_check()) {
            status += `, ${moveColor} is in check.`;
            statusElement.style.backgroundColor = '#ffe08a'; // Yellow background for check
            statusElement.style.color = '#000000'; // Black text
        } else {
            // Normal turn
            if (game.turn() === 'w') {
                statusElement.style.backgroundColor = '#ffffff'; // White background for White's turn
                statusElement.style.color = '#000000'; // Black text
            } else {
                statusElement.style.backgroundColor = '#000000'; // Black background for Black's turn
                statusElement.style.color = '#ffffff'; // White text
            }
        }
    }

    // Update the status text
    statusElement.textContent = status;
}

function flipBoard() {
    board.flip();
    updateStatus(); // Update the game status
}

function updatePlayerNames() {
    const whitePlayerInput = document.getElementById('whitePlayerName');
    const blackPlayerInput = document.getElementById('blackPlayerName');

    const whitePlayerName = whitePlayerInput.value.trim() || 'Player 1';
    const blackPlayerName = blackPlayerInput.value.trim() || 'Player 2';

    // Update the player info display (if needed elsewhere in the UI)
    console.log(`White Player: ${whitePlayerName}, Black Player: ${blackPlayerName}`);
}

function forfeitGame() {
    const moveColor = game.turn() === 'w' ? 'White' : 'Black';
    alert(`${moveColor} has forfeited the game!`);
    resetGame(); // Reset the game after forfeit
}

function offerDraw() {
    const offer = confirm('Do you want to offer a draw?');
    if (offer) {
        alert('The game is a draw!');
        resetGame(); // Reset the game after a draw
    }
}

function resetGame() {
    game.reset();
    board.position('start');
    updateStatus();
    clearCapturedPieces();
    clearMoveList();
}

function clearCapturedPieces() {
    const whiteCapturedElement = document.getElementById('black-captured');
    const blackCapturedElement = document.getElementById('white-captured');
    if (whiteCapturedElement) whiteCapturedElement.innerHTML = '';
    if (blackCapturedElement) blackCapturedElement.innerHTML = '';
}

function clearMoveList() {
    const moveListElement = document.getElementById('move-list-body');
    if (moveListElement) moveListElement.innerHTML = '';
}

const config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: function(piece) {
        return `/static/${piece}.png`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    board = Chessboard('myBoard', config);

    // Attach event listener to the Flip Board button
    const flipBoardButton = document.getElementById('flipBoard');
    if (flipBoardButton) {
        flipBoardButton.addEventListener('click', flipBoard);
    }

    // Attach event listener to the Forfeit button
    const forfeitButton = document.getElementById('forfeitButton');
    if (forfeitButton) {
        forfeitButton.addEventListener('click', forfeitGame);
    }

    // Attach event listener to the Offer Draw button
    const offerDrawButton = document.getElementById('offerDrawButton');
    if (offerDrawButton) {
        offerDrawButton.addEventListener('click', offerDraw);
    }

    // Initialize player names
    const whitePlayerInput = document.getElementById('whitePlayerName');
    const blackPlayerInput = document.getElementById('blackPlayerName');

    // Set default player names
    whitePlayerInput.value = 'Player 1';
    blackPlayerInput.value = 'Player 2';

    // Add event listeners to update player names dynamically
    whitePlayerInput.addEventListener('input', () => {
        updatePlayerNames();
    });

    blackPlayerInput.addEventListener('input', () => {
        updatePlayerNames();
    });

    updateStatus(); // Initial game status
});