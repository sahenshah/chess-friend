let board = null;
const game = new Chess();
var moves = [];
var currentMoveIndex = -1;
let capturedPieces = { white: [], black: [] };
const evaluationCache = {}; // Cache to store evaluations by FEN
let isEvaluationInProgress = false; // Flag to track if an evaluation request is in progress

/* Configuration for analysis board (no move functionality) */
const config = {
    draggable: false, // Disable piece dragging
    position: 'start',
    pieceTheme: piece => `/static/img/${piece}.png` // Updated path to the new location
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
    const statusElement = document.getElementById('status');
    if (!statusElement) return;

    let status = '';

    if (game.in_checkmate()) {
        status = `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins.`;
        statusElement.style.backgroundColor = '#9c1313'; // Red background for checkmate
        statusElement.style.color = '#ffffff'; // White text
    } else if (game.in_stalemate()) {
        status = 'Stalemate!';
        statusElement.style.backgroundColor = '#f0f4f8'; // Neutral background
        statusElement.style.color = '#000000'; // Black text
    } else if (game.in_draw()) {
        status = 'Draw!';
        statusElement.style.backgroundColor = '#f0f4f8'; // Neutral background
        statusElement.style.color = '#000000'; // Black text
    } else if (game.in_check()) {
        status = 'Check!';
        statusElement.style.backgroundColor = '#ffe08a'; // Yellow background for check
        statusElement.style.color = '#000000'; // Black text
    } else {
        status = `${game.turn() === 'w' ? 'White' : 'Black'} to move`;
        if (game.turn() === 'w') {
            statusElement.style.backgroundColor = '#ffffff'; // White background
            statusElement.style.color = '#000000'; // Black text
        } else {
            statusElement.style.backgroundColor = '#000000'; // Black background
            statusElement.style.color = '#ffffff'; // White text
        }
    }

    // Update the status text
    statusElement.textContent = status;

    // Highlight check or checkmate
    highlightCheckAndCheckmate();
}

// Update move list display
function updateMoveList() {
    const moveListBody = document.getElementById('move-list-body');
    moveListBody.innerHTML = ''; // Clear the table body

    for (let i = 0; i < moves.length; i += 2) {
        const moveNumber = Math.floor(i / 2) + 1; // Calculate the move number
        const whiteMove = moves[i] || ''; // Get the white move
        const blackMove = moves[i + 1] || ''; // Get the black move

        // Create a new row for the move
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${moveNumber}</td>
            <td class="move-item" data-index="${i}">${whiteMove}</td>
            <td class="move-item" data-index="${i + 1}">${blackMove}</td>
        `;

        // Add click event listeners for navigation
        row.querySelectorAll('.move-item').forEach((cell) => {
            cell.addEventListener('click', function () {
                const clickedIndex = parseInt(this.getAttribute('data-index'));
                navigateToMove(clickedIndex);
            });
        });

        moveListBody.appendChild(row); // Append the row to the table body
    }
}

function highlightCurrentMove() {
    // Remove previous highlights
    document.querySelectorAll('.move-item').forEach(item => {
        item.classList.remove('highlighted');
    });
    
    // Highlight the current move if valid
    if (currentMoveIndex >= 0 && currentMoveIndex < moves.length) {
        const moveItem = document.querySelector(`.move-item[data-index="${currentMoveIndex}"]`);
        if (moveItem) {
            moveItem.classList.add('highlighted');
            // Only scroll to the move on large screens
            if (window.innerWidth > 900) {
                moveItem.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
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
        pieceImg.src = `/static/img/${piece}.png`; // Correct path for captured pieces
        pieceImg.alt = piece; // Add alt text for accessibility
        pieceImg.className = 'captured-piece';
        whiteCaptured.appendChild(pieceImg);
    });
    
    // Add captured pieces for black (pieces white captured)
    capturedPieces.black.forEach(piece => {
        const pieceImg = document.createElement('img');
        pieceImg.src = `/static/img/${piece}.png`;
        pieceImg.alt = piece; // Add alt text for accessibility
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
    highlightCurrentMove(); // Highlight and scroll to the current move

    runEvaluationLoop();
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

function populateCapturedPieces() {
    // Reset captured pieces
    capturedPieces = { white: [], black: [] };

    // Reset the game to the starting position
    game.reset();

    // Play through all the moves and track captured pieces
    for (let i = 0; i < moves.length; i++) {
        const move = game.move(moves[i]);
        if (move?.captured) {
            const color = move.color === 'w' ? 'black' : 'white'; // Opponent's color
            const piece = (move.color === 'w' ? 'b' : 'w') + move.captured.toUpperCase();
            capturedPieces[color].push(piece);
        }
    }

    // Update the captured pieces UI
    updateCapturedPieces();
}

function scrollToBoardIfMobile() {
    if (window.innerWidth <= 900) { // Adjust breakpoint as needed
        const board = document.getElementById('myBoard');
        if (board) {
            // Calculate the offset position with a gap (e.g., 40px)
            const rect = board.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const gap = 40; // px, adjust as needed
            const top = rect.top + scrollTop - gap;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    }
}

/* Evaluation Functions */
async function runEvaluationLoop() {
    if (isEvaluationInProgress) {
        // If a request is already in progress, skip this call
        return;
    }

    isEvaluationInProgress = true; // Set the flag to indicate a request is in progress

    let depth = 10; // Starting depth
    let previousEvaluation = null;
    let stableCount = 0;
    const maxStableIterations = 3;
    const timeoutDuration = 5000; // Timeout duration in milliseconds

    const fen = game.fen(); // Get the current FEN string
    const moveIndex = currentMoveIndex; // Get the current move index

    // Load evaluationTable from localStorage
    const evaluationTable = JSON.parse(localStorage.getItem('evaluationTable')) || [];

    // Check if the evaluation is already cached in evaluationTable
    if (evaluationTable[moveIndex] !== null) {
        // Use the cached evaluation
        console.log(`Using cached evaluation for move ${moveIndex}:`, evaluationTable[moveIndex]);
        updateEvaluationWithResult(evaluationTable[moveIndex], depth);
        isEvaluationInProgress = false; // Reset the flag
        return;
    }

    while (stableCount < maxStableIterations) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutDuration);

        try {
            const evaluation = await getCurrentEvaluation(fen, depth, controller.signal);
            clearTimeout(timeout);

            if (!evaluation || typeof evaluation.value === 'undefined') {
                console.warn(`Invalid evaluation received for move ${moveIndex}:`, evaluation);
                break;
            }

            // Update evaluationTable with the new evaluation
            evaluationTable[moveIndex] = evaluation;
            localStorage.setItem('evaluationTable', JSON.stringify(evaluationTable));

            // Log the evaluation result
            console.log(`AI Evaluation for move ${moveIndex}:`, evaluation);

            updateEvaluationWithResult(evaluation, depth);

            const evaluationValue = evaluation.value;
            const scaledEvaluationValue = evaluation.type === 'cp'
                ? Math.max(-10, Math.min(10, (evaluationValue / 1000) * 10))
                : evaluation.type === 'mate'
                ? (evaluationValue > 0 ? 10 : -10)
                : 0;

            const roundedEvaluation = parseFloat(scaledEvaluationValue.toFixed(1));

            if (previousEvaluation !== null && roundedEvaluation === previousEvaluation) {
                stableCount++;
            } else {
                stableCount = 0;
            }

            previousEvaluation = roundedEvaluation;
            depth += 1;
        } catch (error) {
            clearTimeout(timeout);
            if (error.name === 'AbortError') {
                console.warn(`Request timed out at depth: ${depth}`);
                break;
            } else {
                console.error('Error fetching evaluation:', error);
                break;
            }
        }
    }

    isEvaluationInProgress = false; // Reset the flag when the request completes
    return previousEvaluation;
}

function updateEvaluationWithResult(evaluation, depth) {
    const evaluationText = document.getElementById('evaluation-text');
    const evalBar = document.getElementById('eval-bar');

    if (!evaluationText || !evalBar) {
        console.error('Evaluation elements not found!');
        return;
    }

    if (!evaluation || typeof evaluation.value === 'undefined') {
        console.warn('Invalid evaluation object:', evaluation);
        evaluationText.textContent = 'Evaluation: N/A';
        evalBar.style.background = 'linear-gradient(to bottom, black 50%, white 50%)'; // Neutral bar
        return;
    }

    // Access the evaluation value
    const evaluationValue = evaluation.value;

    // Scale the evaluation value to the range [-10, 10]
    const scaledEvaluationValue = evaluation.type === 'cp'
        ? Math.max(-10, Math.min(10, (evaluationValue / 1000) * 10)) // Scale centipawns to [-10, 10]
        : evaluation.type === 'mate'
        ? (evaluationValue > 0 ? 10 : -10) // Use ±10 for mate evaluations
        : 0; // Default to 0 for unknown types

    // Update the evaluation text
    const formattedEvaluationText = scaledEvaluationValue > 0
        ? `+${scaledEvaluationValue.toFixed(1)}`
        : scaledEvaluationValue.toFixed(1);
    evaluationText.textContent = formattedEvaluationText;

    // Update the eval-bar to reflect the scaled evaluation
    const evalPercentage = ((scaledEvaluationValue + 10) / 20) * 100; // Map -10 to 10 range to 0% to 100%
    evalBar.style.background = `linear-gradient(to top, white ${evalPercentage}%, black ${evalPercentage}%)`;

}

async function getCurrentEvaluation(fen, depth, signal) {
    try {
        const response = await fetch('/get_ai_evaluation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fen, depth }),
            signal // Pass the AbortSignal to the fetch request
        });

        if (!response.ok) {
            console.error('Failed to get AI evaluation. Status:', response.status);
            return null;
        }

        const data = await response.json();
        return data; // Return the full evaluation data, including depth
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('Evaluation request aborted due to timeout.');
        } else {
            console.error('Error fetching AI evaluation:', error);
        }
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the board
    board = Chessboard('myBoard', config);
    setupMoveListHandlers();

    const boardContainer = document.getElementById('myBoard');
    const savedPGN = localStorage.getItem('savedPGN');
    const uploadSection = document.getElementById('uploadSection');
    const playerInfo = document.getElementById('playerInfo');
    const whitePlayerName = document.getElementById('whitePlayerName');
    const blackPlayerName = document.getElementById('blackPlayerName');
    const event = document.getElementById('event');
    const eventDate = document.getElementById('eventDate');
    const analyseNewGameButton = document.getElementById('analyseNewGameButton');
    const evalBar = document.getElementById('eval-bar');
    const evaluationText = document.getElementById('evaluation-text'); // Evaluation display element
   
     // Function to update the height of the eval-bar
    const updateEvalBarHeight = () => {
        if (boardContainer && evalBar) {
            evalBar.style.height = `${boardContainer.offsetHeight}px`;
        }
    };

    // Set the initial height of the eval-bar
    updateEvalBarHeight();

    if (savedPGN) {
        if (!game.load_pgn(savedPGN)) {
            // Clear saved PGN from localStorage
            localStorage.removeItem('savedPGN');
            showCustomAlert('Failed to load local game!');
        } else {
            // Hide the upload section and show the player info
            uploadSection.style.display = 'none';
            playerInfo.style.display = 'block';

            // Extract headers from the PGN
            const headers = game.header();
            whitePlayerName.textContent = headers.White || 'Unknown';
            blackPlayerName.textContent = headers.Black || 'Unknown';
            event.textContent = headers.Event || 'Unknown'; 
            eventDate.textContent = headers.EventDate || 'Unknown';
            
            // Update the evaluation display
            //setInterval(() => {
            //    runEvaluationLoop();
            //}, 5000); // Run every 5 seconds

            // Update the board position
            board.position(game.fen());

            // Extract moves and update the move list
            moves = game.history(); // Get the list of moves from the PGN
            updateMoveList(); // Populate the move list in the UI
        
            // Populate captured pieces
            populateCapturedPieces();
        }
    }

    // Handle "Analyse New Game" button click
    if (analyseNewGameButton) {
        analyseNewGameButton.addEventListener('click', () => {
            // Reset the game
            game.reset();
            board.start();
            moves = [];
            currentMoveIndex = -1;

            // Clear the move list
            updateMoveList();

            // Clear player info
            whitePlayerName.textContent = '';
            blackPlayerName.textContent = '';
            eventDate.textContent = '';

            // Show the upload section and hide the player info
            uploadSection.style.display = 'block';
            playerInfo.style.display = 'none';

            // Clear saved PGN and eval from localStorage
            localStorage.removeItem('savedPGN');
            localStorage.removeItem('evaluationTable');
        
        });
    }

    // Handle PGN upload
    const pgnUpload = document.getElementById('pgnUpload');
    if (pgnUpload) {
        pgnUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const pgn = e.target.result.trim();
                if (!game.load_pgn(pgn)) {
                    alert('Invalid PGN file!');
                } else {
                    // Save the PGN to localStorage
                    localStorage.setItem('savedPGN', pgn);

                    // Hide the upload section and show the player info
                    uploadSection.style.display = 'none';
                    playerInfo.style.display = 'block';

                    // Extract headers from the PGN
                    const headers = game.header();
                    whitePlayerName.textContent = headers.White || 'Unknown';
                    blackPlayerName.textContent = headers.Black || 'Unknown';
                    eventDate.textContent = headers.EventDate || 'Unknown';

                    // Update the board position
                    board.position(game.fen());

                    // Extract moves and update the move list
                    moves = game.history(); // Get the list of moves from the PGN
                    updateMoveList(); // Populate the move list in the UI
                    console.log('Moves loaded from PGN:', moves); // Debugging log

                    // Initialize evaluationTable with null values for each move
                    const evaluationTable = Array(moves.length).fill(null);
                    localStorage.setItem('evaluationTable', JSON.stringify(evaluationTable));
                    console.log('Initialized evaluationTable:', evaluationTable); // Debugging log

                }
            };
            reader.readAsText(file);
        });
    }

    const flipBoardBtn = document.getElementById('flipBoard');
    const nextMoveBtn = document.getElementById('nextMove');
    const prevMoveBtn = document.getElementById('prevMove');
    const moveListBtn = document.getElementById('move-list-container');
    
    // Only add event listeners if elements exist
    if (flipBoardBtn) {
        flipBoardBtn.addEventListener('click', flipChessBoard);
    }
    
    if (nextMoveBtn) {
        nextMoveBtn.addEventListener('click', () => {
            navigateToMove(currentMoveIndex + 1);
            scrollToBoardIfMobile();
        });
    }

    if (prevMoveBtn) {
        prevMoveBtn.addEventListener('click', () => {
            navigateToMove(currentMoveIndex - 1);
            scrollToBoardIfMobile();
        });
    }

    if(moveListBtn){
        moveListBtn.addEventListener('click', handleMoveClick);
    }

    // Handle PGN selection from the list
    const pgnList = document.getElementById('pgn-list');
    if (pgnList) {
        pgnList.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior

            const target = event.target;
            if (target.tagName === 'A' && target.dataset.pgn) {
                const selectedPGN = target.dataset.pgn.trim();

                // Fetch the PGN content from the server
                fetch(`/static/pgns/${selectedPGN}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to fetch PGN file');
                        }
                        return response.text();
                    })
                    .then(pgnContent => {
                        // Save the PGN content to localStorage
                        localStorage.setItem('savedPGN', pgnContent);

                        // Load the PGN into the game
                        if (!game.load_pgn(pgnContent)) {
                            alert('Invalid PGN file!');
                            console.error('Failed to load PGN:', pgnContent); // Debugging log
                            return;
                        }

                        // Extract moves from the PGN
                        moves = game.history(); // Get the list of moves
                        console.log('Moves loaded from PGN:', moves); // Debugging log

                        // Initialize evaluationTable with null values for each move
                        const evaluationTable = Array(moves.length).fill(null);
                        localStorage.setItem('evaluationTable', JSON.stringify(evaluationTable));
                        console.log('Initialized evaluationTable:', evaluationTable); // Debugging log

                        // Redirect to the Analyse Game page
                        window.location.href = "/analyse-game";
                    })
                    .catch(error => {
                        console.error('Error fetching PGN file:', error);
                        alert('Failed to load PGN file.');
                    });
            }
        });
    }
});
