let board = null;
const game = new Chess();
const moveList = [];

function onDragStart(source, piece, position, orientation) {
    // Only pick up pieces for the side to move
    if (game.game_over()) return false;
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

function onDrop(source, target) {
    // See if the move is legal
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // always promote to a queen for simplicity
    });

    // Illegal move
    if (move === null) return 'snapback';
    
    // Add move to move list
    addMoveToList(move);
    
    // Update the board
    board.position(game.fen());
    
    // Update game status
    updateStatus();
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
    const moveListElement = document.getElementById('move-list');
    
    // Clear existing list
    moveListElement.innerHTML = '';
    
    // Recreate list from moveList array
    moveList.forEach((move, index) => {
        const moveElement = document.createElement('li');
        moveElement.textContent = move;
        moveListElement.appendChild(moveElement);
    });
}

function onSnapEnd() {
    board.position(game.fen());
}

function updateStatus() {
    let status = '';
    let moveColor = 'White';
    if (game.turn() === 'b') {
        moveColor = 'Black';
    }

    // Checkmate?
    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
    }
    
    // Draw?
    else if (game.in_draw()) {
        status = 'Game over, drawn position';
    }
    
    // Game still on
    else {
        status = moveColor + ' to move';
        
        // Check?
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check';
        }
    }

    // Update some element to show game status
    document.getElementById('status').textContent = status;
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
    updateStatus();
});