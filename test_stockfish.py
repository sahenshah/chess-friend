from stockfish import Stockfish

STOCKFISH_PATH = "./stockfish/stockfish-ubuntu-x86-64-avx2"  # Update this to the correct binary path

try:
    # Initialize Stockfish
    stockfish = Stockfish(path=STOCKFISH_PATH)

    # Test if Stockfish is initialized by setting a position and getting a move
    stockfish.set_fen_position("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")  # Starting position
    best_move = stockfish.get_best_move()

    if best_move:
        print(f"Stockfish is running. Best move: {best_move}")
    else:
        print("Stockfish is initialized but could not determine a move.")
except Exception as e:
    print(f"Error initializing Stockfish: {e}")