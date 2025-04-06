let board = null;
const game = new Chess();
const moveList = [];
let capturedPieces = { white: [], black: [] };
let selectedSquare = null;
let isGameStarted = false; // Tracks if the game was started
let isGameForfeited = false; // Tracks if the game was forfeited
let isGameDrawn = false; // Tracks if the game was drawn

function onDragStart(source, piece, position, orientation) {
    // Prevent dragging if the game hasn't started, is over, or forfeited
    if (!isGameStarted || game.game_over() || isGameForfeited || isGameDrawn) {
        return false;
    }

    // Get the player's color from localStorage
    const aiSettings = JSON.parse(localStorage.getItem('aiSettings'));
    const playerColor = aiSettings ? aiSettings.playerColor : 'white';

    // Prevent dragging pieces of the computer's color
    if ((playerColor === 'white' && piece.startsWith('b')) || 
        (playerColor === 'black' && piece.startsWith('w'))) {
        return false;
    }

    // Only allow dragging pieces for the side to move
    if ((game.turn() === 'w' && piece.startsWith('b')) ||
        (game.turn() === 'b' && piece.startsWith('w'))) {
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
        return 'snapback'; // Return the piece to its original position
    }

    // Successful move
    updateAfterMove(move);

    // Remove highlights after the move
    removeHighlights();
}

function handleBoardClick(event) {
    // Prevent clicking if the game hasn't started, is over, or forfeited
    if (!isGameStarted || game.game_over() || isGameForfeited || isGameDrawn) {
        return;
    }

    const squareElement = event.target.closest('.square-55d63');
    if (!squareElement) {
        return;
    }

    const square = squareElement.getAttribute('data-square');

    if (!square) {
        return;
    }

    const piece = game.get(square);

    // Get the player's color from localStorage
    const aiSettings = JSON.parse(localStorage.getItem('aiSettings'));
    const playerColor = aiSettings ? aiSettings.playerColor : 'white';

    // Prevent clicking on the computer's pieces
    if ((playerColor === 'white' && piece && piece.color === 'b') || 
        (playerColor === 'black' && piece && piece.color === 'w')) {
        return;
    }

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

    // Check if it's the computer's turn
    checkComputerTurn();

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

    // Create a new image element for the captured piece
    const pieceImage = document.createElement('img');
    pieceImage.src = `/static/img/${capturedPieceColor}${move.captured.toUpperCase()}.png`;
    pieceImage.alt = `${capturedPieceColor}${move.captured}`;
    pieceImage.className = 'captured-piece';

    // Append the captured piece to the container
    container.appendChild(pieceImage);
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
        statusElement.className = 'status-forfeit';
        statusElement.style.backgroundColor = '#ffcc00'; // Yellow for forfeit
        statusElement.style.color = 'black';
    } else if (isGameDrawn) {
        status = 'Game drawn by agreement!';
        statusElement.className = 'status-draw';
        statusElement.style.backgroundColor = '#f0f4f8'; // Light gray for draw
        statusElement.style.color = 'black';
    } else if (game.game_over()) {
        // Check for specific game-ending conditions
        if (game.in_checkmate()) {
            status = `Checkmate! ${moveColor} loses.`;
            statusElement.className = 'status-checkmate';
            statusElement.style.backgroundColor = '#9c1313'; // Red for checkmate
            statusElement.style.color = 'white';
        } else if (game.in_draw()) {
            status = 'Game drawn!';
            statusElement.className = 'status-draw';
            statusElement.style.backgroundColor = '#f0f4f8'; // Light gray for draw
            statusElement.style.color = 'black';
        } else {
            status = 'Game over!';
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

function updatePlayerNames(playerColor) {
    const whitePlayerInput = document.getElementById('whitePlayerName');
    const blackPlayerInput = document.getElementById('blackPlayerName');

    if (playerColor === 'white') {
        whitePlayerInput.value = 'Player'; // User is White
        blackPlayerInput.value = 'Computer'; // AI is Black
        whitePlayerInput.disabled = false; // Allow input for the user
        blackPlayerInput.disabled = true; // Disable input for the AI
    } else if (playerColor === 'black') {
        whitePlayerInput.value = 'Computer'; // AI is White
        blackPlayerInput.value = 'Player'; // User is Black
        whitePlayerInput.disabled = true; // Disable input for the AI
        blackPlayerInput.disabled = false; // Allow input for the user
    }


    // Update the vsAiChessGameState in localStorage
    const savedState = localStorage.getItem('vsAiChessGameState');
    const gameState = savedState ? JSON.parse(savedState) : {};

    gameState.whitePlayerName = whitePlayerInput.value;
    gameState.blackPlayerName = blackPlayerInput.value;

    localStorage.setItem('vsAiChessGameState', JSON.stringify(gameState));
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

async function handleOfferDraw() {
    if (game.game_over() || isGameDrawn) {
        return; // Don't allow draw if the game is already over or drawn
    }

    // Check if the opponent is the AI
    const aiSettings = JSON.parse(localStorage.getItem('aiSettings'));
    const playerColor = aiSettings ? aiSettings.playerColor : 'white';
    const computerColor = playerColor === 'white' ? 'black' : 'white';

    // Let the AI decide whether to accept or decline the draw
    const aiDecision = await getAIDrawDecision(game.fen());
    if (aiDecision === 'accept') {
        // Mark the game as drawn
        isGameDrawn = true;

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

        return;
    } else {
        showCustomAlert('AI declined the draw offer.');
        return;
    }

    checkComputerTurn();
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

function redirectToAnalyse() {
    // Redirect to the Analyse Game page
    window.location.href = "/analyse-game"; // Ensure this matches your Flask route
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
        whitePlayerName: document.getElementById('whitePlayerName').value.trim() || '',
        blackPlayerName: document.getElementById('blackPlayerName').value.trim() || '',
        isGameStarted: isGameStarted // Save the game started flag
    };
    localStorage.setItem('vsAiChessGameState', JSON.stringify(gameState));
}

function loadGameState() {
    const savedState = localStorage.getItem('vsAiChessGameState');
    if (savedState) {
        const gameState = JSON.parse(savedState);

        // Load the FEN position
        game.load(gameState.fen);
        board.position(gameState.fen);

        // Restore the move list
        moveList.length = 0; // Clear the current move list
        if (gameState.moves && Array.isArray(gameState.moves)) {
            moveList.push(...gameState.moves); // Restore the saved moves
        }

        // Replay the moves to rebuild the game state
        gameState.moves.forEach(move => {
            const moveDetails = game.move(move.replace(/^\d+\.\s*/, '')); // Remove move numbers if present
            if (moveDetails) {
                updateAfterMove(moveDetails);
            }
        });

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

        // Update the player names
        document.getElementById('whitePlayerName').value = gameState.whitePlayerName;
        document.getElementById('blackPlayerName').value = gameState.blackPlayerName;

        // Update the UI
        updateMoveListDisplay(); // Refresh the move list in the UI
        updateGameStatus(); // Update the game status
    }
}

async function getAIMove(fen, skill) {
    const response = await fetch('/get_ai_move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen, skill })
    });

    if (!response.ok) {
        console.error('Failed to get AI move');
        return null;
    }

    const data = await response.json();
    return data.move;
}

async function checkComputerTurn() {
    // Get the player's color from localStorage
    const aiSettings = JSON.parse(localStorage.getItem('aiSettings'));
    const playerColor = aiSettings ? aiSettings.playerColor : 'white';
    const aiStrength = aiSettings ? aiSettings.aiStrength : '1';
    const skill = parseInt(aiStrength, 10);

    // Determine the computer's color
    const computerColor = playerColor === 'white' ? 'black' : 'white';

    // Check if it's the computer's turn
    if (game.turn() === computerColor[0]) { // 'w' for white, 'b' for black
        try {
            // Get the AI move
            const currentFEN = game.fen();
            const aiMove = await getAIMove(currentFEN, skill);

            if (aiMove) {
                // Parse the AI move into `from` and `to` squares
                const from = aiMove.slice(0, 2); // First two characters (e.g., "c7")
                const to = aiMove.slice(2, 4);   // Next two characters (e.g., "c5")
                const promotion = aiMove.length > 4 ? aiMove[4] : undefined; // Promotion piece if present

                // Apply the AI move
                const moveDetails = game.move({
                    from: from,
                    to: to,
                    promotion: promotion // Use the promotion piece if provided
                });

                if (moveDetails) {
                    board.position(game.fen());
                    updateAfterMove(moveDetails);

                    // Remove highlights after the move
                    removeHighlights();
                }
            }
        } catch (error) {
            // Handle errors silently
        }
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

async function getAIDrawDecision(fen) {
    try {
        const response = await fetch('/get_ai_evaluation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fen })
        });

        if (!response.ok) {
            console.error('Failed to get AI evaluation');
            return 'decline'; // Default to declining the draw if there's an error
        }

        const data = await response.json();
        const evaluation = data.evaluation; // Stockfish evaluation score

        // Decide based on the evaluation score
        // Positive score favors the AI, negative score favors the opponent
        if (evaluation > 0.5) {
            return 'decline'; // AI is in a favorable position
        } else if (evaluation < -0.5) {
            return 'accept'; // AI is in an unfavorable position
        } else {
            return Math.random() < 0.5 ? 'accept' : 'decline'; // Neutral position, random decision
        }
    } catch (error) {
        console.error('Error in getAIDrawDecision:', error);
        return 'decline'; // Default to declining the draw in case of an error
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

    const aiSettingsButtonContainer = document.getElementById('aiSettingsButtonContainer');
    const playerInfoContainer = document.getElementById('playerInfoContainer');
    const moveDisplayContainer = document.getElementById('moveDisplayContainer');

    // Load AI settings from localStorage
    const savedAISettings = localStorage.getItem('aiSettings');
    if (savedAISettings) {
        const { aiStrength, playerColor } = JSON.parse(savedAISettings);

        // Apply the saved AI settings
        document.getElementById('aiStrength').value = aiStrength;
        document.getElementById('playerColor').value = playerColor;

        // Set the board orientation and player names
        if (playerColor === 'white' || playerColor === 'black') {
            board.orientation(playerColor);
            updatePlayerNames(playerColor);
        } else {
            const randomColor = Math.random() < 0.5 ? 'white' : 'black';
            board.orientation(randomColor);
            updatePlayerNames(randomColor);
        }

        // Show the Player Info and Move Display containers
        if (playerInfoContainer && moveDisplayContainer) {
            playerInfoContainer.style.display = 'block';
            moveDisplayContainer.style.display = 'block';
        }

         // Hide the AI Settings button
         if (aiSettingsButtonContainer) {
            aiSettingsButtonContainer.style.display = 'none';
        }
    } else {
        // Show the AI Settings button
        if (aiSettingsButtonContainer) {
            aiSettingsButtonContainer.style.display = 'block';
        }

        // Hide the Player Info and Move Display containers
        if (playerInfoContainer && moveDisplayContainer) {
            playerInfoContainer.style.display = 'none';
            moveDisplayContainer.style.display = 'none';
        }
            
        isGameStarted = false; // Disable board interactions
    }

    // Open the settings modal when the button is clicked
    const openSettingsButton = document.getElementById('openSettingsButton');
    const settingsModal = document.getElementById('settingsModal');
    openSettingsButton.addEventListener('click', () => {
        if (settingsModal) {
            settingsModal.style.display = 'block';
        } else {
            console.error('Settings modal not found!');
        }
    });

    // Handle AI Settings form submission
    const aiSettingsForm = document.getElementById('aiSettingsForm');
    aiSettingsForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        // Get the selected AI strength and player color
        const aiStrength = document.getElementById('aiStrength').value;
        let playerColor = document.getElementById('playerColor').value;
        if (playerColor === 'random') {
            const randomColor = Math.random() < 0.5 ? 'white' : 'black';
            playerColor = randomColor;
            document.getElementById('playerColor').value = randomColor; // Update the input value
        }

        // Save AI settings to localStorage
        localStorage.setItem('aiSettings', JSON.stringify({ aiStrength, playerColor }));

        // Reset the game
        game.reset();
        board.start();

        // Set the board orientation based on the selected player color
        if (playerColor === 'black') {
            board.orientation('black');
        } else { 
            board.orientation('white');
        } 
        
        // Update player names based on the selected color
        updatePlayerNames(playerColor);

        // Show the Player Info and Move Display containers
        if (playerInfoContainer && moveDisplayContainer) {
            playerInfoContainer.style.display = 'block';
            moveDisplayContainer.style.display = 'block';
        }

        // Hide the AI Settings button
        if (aiSettingsButtonContainer) {
            aiSettingsButtonContainer.style.display = 'none';
        }

        // Enable board interactions
        isGameStarted = true;

        // Close the modal
        settingsModal.style.display = 'none';
    });

    // Close the modal when the cancel button is clicked
    const closeModalButton = document.getElementById('closeModalButton');
    closeModalButton.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    // Close the modal when clicking outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    // Attach event listener for the "Analyse" button
    const analyseButton = document.getElementById('analyseButton');
    if (analyseButton) {
        analyseButton.disabled = false; // Ensure the button is enabled
        analyseButton.addEventListener('click', handleAnalyseButtonClick);
    }

    // Handle the "New Game" button click
    const newGameButton = document.getElementById('newGameButton');
    if (newGameButton) {
        newGameButton.disabled = false; // Ensure the button is enabled
        newGameButton.addEventListener('click', () => {
            // Clear the saved AI settings from localStorage
            localStorage.removeItem('aiSettings');
            
            // Clear the saved game settings from localStorage
            localStorage.removeItem('vsAiChessGameState');

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

            // Reset player names to null strings
            document.getElementById('whitePlayerName').value = '';
            document.getElementById('blackPlayerName').value = '';

            // Reset the selected square
            selectedSquare = null;

            // Remove all highlights
            removeHighlights();

            // Reset the board configuration
            board = Chessboard('myBoard', config);

            // Disable board interactions until "Start Game" is pressed again
            isGameStarted = false;

            // Save the reset game state
            saveGameState();

            // Update the game status
            updateGameStatus();

            // Refresh the page to clear the game info and move list
            location.reload();
        });
    }

    const boardContainer = document.getElementById('myBoard');
    if (boardContainer) {
        boardContainer.addEventListener('click', handleBoardClick);
    } else {
        console.error('Board container not found!');
    }

    // Attach event listener for the "Forfeit" button
    const forfeitButton = document.getElementById('forfeitButton');
    if (forfeitButton) {
        forfeitButton.addEventListener('click', handleForfeitGame);
    } else {
        console.error('Forfeit button not found!');
    }

    // Attach event listener for the "Offer Draw" button
    const offerDrawButton = document.getElementById('offerDrawButton');
    if (offerDrawButton) {
        offerDrawButton.addEventListener('click', handleOfferDraw);
    } else {
        console.error('Offer Draw button not found!');
    }

    // Attach event listener for the "Flip Board" button
    const flipBoardButton = document.getElementById('flipBoard');
    if (flipBoardButton) {
        flipBoardButton.addEventListener('click', flipBoard);
    }

    // Load the saved game state
    loadGameState();

    updateGameStatus();
});
