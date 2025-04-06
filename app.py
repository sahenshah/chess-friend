import os

from flask import Flask, flash, redirect, render_template, request, session, jsonify
from stockfish import Stockfish

# Configure application
app = Flask(__name__)

STOCKFISH_PATH = "./stockfish/stockfish-ubuntu-x86-64-avx2"

@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/analyse-game")
def analyse_game():
    # Get the list of PGN files from the static/pgns folder
    pgn_folder = os.path.join(app.static_folder, 'pgns')
    pgn_files = [f for f in os.listdir(pgn_folder) if f.endswith('.pgn')]
    return render_template('analyse_game.html', pgn_files=pgn_files)

@app.route("/play-vs")
def playVs():
    return render_template("play_vs.html")

@app.route("/play-vs-ai")
def playVsAi():
    return render_template("play_vs_ai.html")

@app.route('/get_ai_move', methods=['POST'])
def get_ai_move():
    data = request.get_json()
    fen = data.get('fen')
    skill_level = int(data.get('skill', 10))  # Skill: 0 (weak) to 20 (strong)

    stockfish = Stockfish(path=STOCKFISH_PATH)
    stockfish.set_skill_level(skill_level)
    stockfish.set_fen_position(fen)

    best_move = stockfish.get_best_move()

    return jsonify({'move': best_move})

if __name__ == "__main__":
    app.run(debug=True)


