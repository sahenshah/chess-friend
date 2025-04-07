let board = null;
const game = new Chess();
const moveList = [];
let capturedPieces = { white: [], black: [] };
let selectedSquare = null;
let isGameStarted = false; // Tracks if the game has started
let isGameForfeited = false; // Tracks if the game was forfeited
let isGameDrawn = false; // Tracks if the game was drawn

function onDragStart(source, piece, position, orientation) {
    // Prevent dragging if the game is over or forfeited
    if (game.game_over() || isGameForfeited || isGameDrawn) {
        return false;
    }

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
    // Check if the move is a pawn promotion
    const piece = game.get(source);
    const isPromotion = piece && piece.type === 'p' && (target[1] === '8' || target[1] === '1');

    let promotion = 'q'; // Default promotion to queen
    if (isPromotion) {
        // Prompt the player to choose a promotion piece
        promotion = prompt(
            'Promote to (q = Queen, r = Rook, b = Bishop, n = Knight):',
            'q'
        );

        // Validate the input
        if (!['q', 'r', 'b', 'n'].includes(promotion)) {
            alert('Invalid choice! Defaulting to Queen.');
            promotion = 'q';
        }
    }

    // Try to make the move
    const move = game.move({
        from: source,
        to: target,
        promotion: promotion, // Use the chosen promotion piece
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
    
    // Remove highlights after the move
    removeHighlights();
}

function handleBoardClick(event) {
    // Prevent clicking if the game is over or forfeited
    if (game.game_over() || isGameForfeited || isGameDrawn) {
        return;
    }

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
            promotion: 'q' // Default promotion to queen
        });

        if (move === null) {
            // If invalid move but clicked our own piece, select it
            if (piece && piece.color === game.turn()) {
                handlePieceSelection(square, piece.type);
            }
            return;
        }

        // Successful move
        updateAfterMove(move);

        // Update the board position
        board.position(game.fen());

        // Clear highlights
        removeHighlights();

        selectedSquare = null; // Clear the selected square
    } else {
        // Select the piece if it's our turn
        if (piece && piece.color === game.turn()) {
            handlePieceSelection(square, piece.type);
        }
    }
}

function updateAfterMove(move) {
    // Set the game as started on the first move
    if (!isGameStarted) {
        isGameStarted = true;
    }

    // Update the move list
    addMoveToList(move);

    // Update captured pieces
    updateCapturedPieces(move);

    // Highlight check or checkmate
    highlightCheckAndCheckmate();

    // Update the game status
    updateGameStatus();

    // Save the game state
    saveGameState();

    // Enable the Forfeit and Offer Draw buttons
    enableGameButtons();
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

function updateMoveList() {
    const moveListElement = document.getElementById('move-list-body');
    if (!moveListElement) return;

    // Clear the current move list
    moveListElement.innerHTML = '';

    // Get the move history from the game
    const moves = game.history({ verbose: true });

    // Populate the move list
    moves.forEach((move, index) => {
        const moveNumber = Math.floor(index / 2) + 1; // Calculate the move number
        const isWhiteMove = index % 2 === 0; // Check if it's a white move

        if (isWhiteMove) {
            // Create a new row for the move
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${moveNumber}</td>
                <td>${move.san}</td>
                <td></td>
            `;
            moveListElement.appendChild(row);
        } else {
            // Add the black move to the last row
            const lastRow = moveListElement.lastElementChild;
            if (lastRow) {
                lastRow.children[2].textContent = move.san;
            }
        }
    });

    // Scroll to the bottom of the move list
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

    // Add the captured piece to the capturedPieces object
    const capturedColor = move.color === 'w' ? 'black' : 'white';
    capturedPieces[capturedColor].push(move.captured);

    // Create a new image element for the captured piece
    const pieceImage = document.createElement('img');
    pieceImage.src = `/static/img/${capturedPieceColor}${move.captured.toUpperCase()}.png`;
    pieceImage.alt = `${capturedPieceColor}${move.captured}`;
    pieceImage.className = 'captured-piece';

    // Append the captured piece to the container
    container.appendChild(pieceImage);

    // Save the updated game state
    saveGameState();
}

function onSnapEnd() {
    board.position(game.fen());
}

function highlightCheckAndCheckmate() {
    // Remove previous highlights from squares
    document.querySelectorAll('.square-55d63').forEach(square => {
        square.classList.remove('check', 'checkmate');
    });

    // If the game is in check or checkmate
    if (game.in_check() || game.in_checkmate()) {
        // Get the king's position
        let kingPos = null;
        const kingColor = game.turn();
        const pieces = game.board();

        // Find the king's position
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (pieces[i][j] && pieces[i][j].type === 'k' && pieces[i][j].color === kingColor) {
                    kingPos = String.fromCharCode(97 + j) + (8 - i); // Convert to chess notation
                    break;
                }
            }
            if (kingPos) break;
        }

        if (kingPos) {
            const kingSquare = document.querySelector(`.square-${kingPos}`);
            if (kingSquare) {
                if (game.in_checkmate()) {
                    kingSquare.classList.add('checkmate');
                } else if (game.in_check()) {
                    kingSquare.classList.add('check');
                }
            }
        }
    }
}

// Function to update the game status
function updateGameStatus() {
    const statusElement = document.getElementById('status');
    if (!statusElement) return;

    let status = '';
    const moveColor = game.turn() === 'w' ? 'White' : 'Black';

    if (isGameForfeited) {
        status = 'Game forfeited!';
        isGameStarted = false;
        statusElement.className = 'status-forfeit';
        statusElement.style.backgroundColor = '#ffcc00'; // Yellow for forfeit
        statusElement.style.color = 'black';
    } else if (isGameDrawn) {
        status = 'Game drawn by agreement!';
        isGameStarted = false;
        statusElement.className = 'status-draw';
        statusElement.style.backgroundColor = '#f0f4f8'; // Light gray for draw
        statusElement.style.color = 'black';
    } else if (game.game_over()) {
        // Check for specific game-ending conditions
        if (game.in_checkmate()) {
            status = `Checkmate! ${moveColor} loses.`;
            isGameStarted = false;
            statusElement.className = 'status-checkmate';
            statusElement.style.backgroundColor = '#9c1313'; // Red for checkmate
            statusElement.style.color = 'white';
        } else if (game.in_draw()) {
            status = 'Game drawn!';
            isGameStarted = false;
            statusElement.className = 'status-draw';
            statusElement.style.backgroundColor = '#f0f4f8'; // Light gray for draw
            statusElement.style.color = 'black';
        } else {
            status = 'Game over!';
            isGameStarted = false;
            statusElement.className = 'status-over';
            statusElement.style.backgroundColor = '#6c757d'; // Gray for generic game over
            statusElement.style.color = 'white';
        }
    } else {
        // Game is still active
        status = `${moveColor} to move`;
        if (game.in_check()) {
            status += ` (in check)`;
            statusElement.className = 'status-check';
            statusElement.style.backgroundColor = '#ffcccb'; // Light red for check
            statusElement.style.color = 'black';
        } else {
            if (game.turn() === 'w') {
                statusElement.style.backgroundColor = 'white'; // White's turn
                statusElement.style.color = 'black';
            } else {
                statusElement.style.backgroundColor = 'black'; // Black's turn
                statusElement.style.color = 'white';
            }
            statusElement.className = game.turn() === 'w' ? 'status-white' : 'status-black';
        }
    }

    statusElement.textContent = status;
}

function flipBoard() {
    board.flip();
    updateGameStatus();
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

        // Save the original content of the square
        if (!squareElement.dataset.originalContent) {
            squareElement.dataset.originalContent = squareElement.innerHTML;
        }

        // Add the hover preview
        const piece = game.get(selectedSquare);
        if (piece) {
            squareElement.innerHTML = `
                <div class="move-preview">
                    <img src="/static/img/${piece.color}${piece.type.toUpperCase()}.png" 
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

        // Remove the hover preview
        const preview = squareElement.querySelector('.move-preview');
        if (preview) {
            preview.remove();
        }

        // Restore the original content of the square if it was saved
        if (squareElement.dataset.originalContent) {
            squareElement.innerHTML = squareElement.dataset.originalContent;
            delete squareElement.dataset.originalContent; // Clean up the saved content
        }
    }
}

function handleOfferDraw() {
    if (game.game_over() || isGameDrawn) {
        return; // Don't allow draw if the game is already over or drawn
    }

    showCustomConfirm('Accept Draw Offer?', (confirmOfferDraw) => {
        if (!confirmOfferDraw) {
            showCustomAlert('Draw offer declined.'); // Use custom alert
            return; // Player declined the draw
        }

        const moveColor = game.turn() === 'w' ? 'White' : 'Black';

        // Mark the game as drawn
        isGameDrawn = true;

        // Set the game as not started
        isGameStarted = false;
        
        // Update the game status
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = 'Game drawn by agreement!';
            statusElement.className = 'status-draw';
            statusElement.style.backgroundColor = '#f0f4f8'; // Light gray for draw
            statusElement.style.color = 'black';
        }

        // Disable all interactions on the board
        board = Chessboard('myBoard', {
            ...config,
            draggable: false, // Disable dragging
            position: game.fen() // Keep the current board position
        });

        // Disable buttons
        document.getElementById('forfeitButton').disabled = true;
        document.getElementById('offerDrawButton').disabled = true;
    });
}

function handleForfeitGame() {
    if (game.game_over() || isGameForfeited) {
        return; // Don't allow forfeit if the game is already over or forfeited
    }

    showCustomConfirm('Are you sure you want to forfeit the game?', (confirmForfeit) => {
        if (!confirmForfeit) {
            return; // Player canceled the forfeit
        }

        const moveColor = game.turn() === 'w' ? 'White' : 'Black';
        const opponentColor = moveColor === 'White' ? 'Black' : 'White';

        // Add forfeit to move history
        const moveNumber = Math.ceil(moveList.length / 2);
        moveList.push(`${moveNumber}. ${moveColor} forfeits`);
        updateMoveListDisplay();

        // Mark the game as forfeited
        isGameForfeited = true;

        // Set the game as not started
        isGameStarted = false;
        
        // Update the game status
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = `${opponentColor} wins by forfeit!`;
            statusElement.className = 'status-forfeit';
            statusElement.style.backgroundColor = '#ffcc00'; // Yellow for forfeit
        }

        // Disable all interactions on the board
        board = Chessboard('myBoard', {
            ...config,
            draggable: false, // Disable dragging
            position: game.fen() // Keep the current board position
        });

        // Disable buttons
        document.getElementById('forfeitButton').disabled = true;
        document.getElementById('offerDrawButton').disabled = true;
    });
}

function handleAnalyseButtonClick() {
    // Generate the PGN from the current game state
    let pgn = game.pgn({ maxWidth: 80, newline: '\n' }); // Ensure moves are included

    // Get the player names from the input fields
    const whitePlayerInput = document.getElementById('whitePlayerName').value.trim() || 'White';
    const blackPlayerInput = document.getElementById('blackPlayerName').value.trim() || 'Black';

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const date = today.toISOString().split('T')[0]; // Extract the date part

    // Prepend the headers to the PGN
    const headers = [
        `[Event "Epic ${whitePlayerInput} vs ${blackPlayerInput} Chess Match!"]`,
        `[EventDate "${date}"]`,
        `[White "${whitePlayerInput}"]`,
        `[Black "${blackPlayerInput}"]`
    ];
    pgn = headers.join('\n') + '\n\n' + pgn; // Add headers and a blank line before the moves

    // Save the PGN to localStorage
    localStorage.setItem('savedPGN', pgn);

    // Redirect to the Analyse Game page
    window.location.href = "/analyse-game"; // Ensure this matches your Flask route
}

function saveGameState() {
    const gameState = {
        fen: game.fen(), // Current board position
        moves: moveList, // Save the moves array
        whitePlayerName: document.getElementById('whitePlayerName').value.trim() || 'Player 1',
        blackPlayerName: document.getElementById('blackPlayerName').value.trim() || 'Player 2',
        isGameStarted: isGameStarted, // Save the game started flag
        capturedPieces: capturedPieces // Save captured pieces
    };
    localStorage.setItem('vsChessGameState', JSON.stringify(gameState));
}

function populateCapturedPieces() {
    const whiteCapturedContainer = document.getElementById('white-captured');
    const blackCapturedContainer = document.getElementById('black-captured');

    // Clear previous captured pieces
    whiteCapturedContainer.innerHTML = '';
    blackCapturedContainer.innerHTML = '';

    // Add captured pieces for white (pieces captured by black)
    capturedPieces.white.forEach(piece => {
        const pieceImg = document.createElement('img');
        pieceImg.src = `/static/img/w${piece.toUpperCase()}.png`; // White pieces captured by black
        pieceImg.alt = piece;
        pieceImg.className = 'captured-piece';
        whiteCapturedContainer.appendChild(pieceImg);
    });

    // Add captured pieces for black (pieces captured by white)
    capturedPieces.black.forEach(piece => {
        const pieceImg = document.createElement('img');
        pieceImg.src = `/static/img/b${piece.toUpperCase()}.png`; // Black pieces captured by white
        pieceImg.alt = piece;
        pieceImg.className = 'captured-piece';
        blackCapturedContainer.appendChild(pieceImg);
    });
}

function loadGameState() {
    const savedState = localStorage.getItem('vsChessGameState');
    if (savedState) {
        const gameState = JSON.parse(savedState);

        // Load the FEN position
        game.load(gameState.fen);
        board.position(gameState.fen);

        // Restore the move list
        moveList.length = 0; // Clear the existing move list
        gameState.moves.forEach(move => moveList.push(move));

        // Replay the moves to rebuild the game state
        gameState.moves.forEach(move => {
            const moveDetails = game.move(move.replace(/^\d+\.\s*/, '')); // Remove move numbers if present
            if (moveDetails) {
                updateAfterMove(moveDetails);
            }
        });

        // Update the player names
        document.getElementById('whitePlayerName').value = gameState.whitePlayerName;
        document.getElementById('blackPlayerName').value = gameState.blackPlayerName;

        // Restore captured pieces
        capturedPieces = gameState.capturedPieces || { white: [], black: [] };
        populateCapturedPieces();

        // Restore the `isGameStarted` flag
        isGameStarted = gameState.isGameStarted || false;

        // Restore the button states
        const forfeitButton = document.getElementById('forfeitButton');
        const offerDrawButton = document.getElementById('offerDrawButton');
        if (forfeitButton) {
            forfeitButton.disabled = !isGameStarted || isGameForfeited || game.game_over();
        }
        if (offerDrawButton) {
            offerDrawButton.disabled = !isGameStarted || isGameDrawn || game.game_over();
        }

        // Update the UI
        updateMoveListDisplay(); // Refresh the move list in the UI
        updateGameStatus(); // Update the game status
    }
}

function enableGameButtons() {
    const forfeitButton = document.getElementById('forfeitButton');
    const offerDrawButton = document.getElementById('offerDrawButton');

    if (forfeitButton) {
        forfeitButton.disabled = false; // Enable the Forfeit button
    }

    if (offerDrawButton) {
        offerDrawButton.disabled = false; // Enable the Offer Draw button
    }
}

const config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: function(piece) {
        return `/static/img/${piece}.png`;
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

    const forfeitButton = document.getElementById('forfeitButton');
    if (forfeitButton) {
        forfeitButton.addEventListener('click', handleForfeitGame);
    }

    const offerDrawButton = document.getElementById('offerDrawButton');
    if (offerDrawButton) {
        offerDrawButton.addEventListener('click', handleOfferDraw);
    }

    const whitePlayerInput = document.getElementById('whitePlayerName');
    const blackPlayerInput = document.getElementById('blackPlayerName');

    whitePlayerInput.addEventListener('input', () => {
        updatePlayerNames();
        saveGameState(); 
    });

    blackPlayerInput.addEventListener('input', () => {
        updatePlayerNames();
        saveGameState();
    });

    const analyseButton = document.getElementById('analyseButton');
    if (analyseButton) {
        analyseButton.disabled = false; // Ensure the button is enabled
        analyseButton.addEventListener('click', handleAnalyseButtonClick);
    }

    const newGameButton = document.getElementById('newGameButton');
    if (newGameButton) {
        newGameButton.disabled = false; // Ensure the button is enabled
        newGameButton.addEventListener('click', () => {
            // Reset the game
            game.reset();
            board.start();

            // Reset the forfeited and drawn flags
            isGameForfeited = false;
            isGameDrawn = false;

            // Clear the move list
            moveList.length = 0; // Reset the move list array
            updateMoveListDisplay(); // Update the move list in the UI

            // Clear captured pieces
            capturedPieces.white = [];
            capturedPieces.black = [];
            document.getElementById('white-captured').innerHTML = '';
            document.getElementById('black-captured').innerHTML = '';

            // Reset player names to default
            document.getElementById('whitePlayerName').value = 'Player 1';
            document.getElementById('blackPlayerName').value = 'Player 2';

            // Reset the selected square
            selectedSquare = null;

            // Remove all highlights
            removeHighlights();

            // Reset the board configuration
            board = Chessboard('myBoard', config);

            // Save the reset game state
            saveGameState();

            // Update the game status
            updateGameStatus();
        });
    }

    // Load the saved game state
    loadGameState();

    updateGameStatus();
});