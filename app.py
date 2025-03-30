import os

from flask import Flask, flash, redirect, render_template, request, session, jsonify

# Configure application
app = Flask(__name__)

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
def analyseGame():
    return render_template("analyse_game.html")

@app.route("/play-vs")
def playVs():
    return render_template("play_vs.html")

@app.route("/play-vs-ai")
def playVsAi():
    return render_template("play_vs_ai.html")

if __name__ == "__main__":
    app.run(debug=True)


