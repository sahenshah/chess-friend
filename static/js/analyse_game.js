let board = null;
const game = new Chess();
var moves = [];
var currentMoveIndex = -1;
let capturedPieces = { white: [], black: [] };

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
            // Scroll to the current move and center it in the window
            moveItem.scrollIntoView({
                behavior: 'smooth', // Smooth scrolling
                block: 'center', // Center the move in the window
            });
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

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the board
    board = Chessboard('myBoard', config);
    setupMoveListHandlers();

    const savedPGN = localStorage.getItem('savedPGN');
    const uploadSection = document.getElementById('uploadSection');
    const playerInfo = document.getElementById('playerInfo');
    const whitePlayerName = document.getElementById('whitePlayerName');
    const blackPlayerName = document.getElementById('blackPlayerName');
    const event = document.getElementById('event');
    const eventDate = document.getElementById('eventDate');
    const analyseNewGameButton = document.getElementById('analyseNewGameButton');

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

            // Clear saved PGN from localStorage
            localStorage.removeItem('savedPGN');
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
