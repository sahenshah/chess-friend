# CHESS FRIEND

#### Video Demo:  <URL HERE>

---

## Overview

**Chess Friend** is a full-featured web application for chess enthusiasts, designed to make chess analysis and play accessible and intuitive. The project combines a modern web interface with the powerful Stockfish chess engine, allowing users to analyze games, play against a strong AI, or enjoy two-player chess locally. Chess Friend is built using Flask for the backend, JavaScript for the frontend, and Bootstrap for responsive, user-friendly styling. Jinja templating is used to keep the HTML modular and maintainable.

---

## Features

- **PGN Import and Game Analysis:**  
  Users can upload a chess game in PGN (Portable Game Notation) format. The application parses the PGN, reconstructs the game move by move, and displays it on an interactive board. For each position, Stockfish evaluates the move, providing real-time feedback and insights. Evaluations are cached locally to minimize server requests and speed up navigation through the game.

- **Play Against Stockfish AI:**  
  Users can play a full game of chess against the Stockfish engine. The AI’s difficulty can be adjusted, allowing both beginners and advanced players to enjoy a challenging experience. The backend handles move validation and AI move generation, ensuring fair play and a smooth user experience.

- **Two-Player Local Mode:**  
  The application supports a two-player mode, enabling two users to play chess on the same device. This is ideal for casual games or in-person analysis.

- **Responsive and Modern UI:**  
  The interface is styled with Bootstrap, ensuring it looks great on desktops, tablets, and mobile devices. Chess piece images and board graphics are crisp and clear, and the layout adapts to different screen sizes.

- **Move List and Navigation:**  
  For imported games, a move list is displayed alongside the board. Users can click on any move to jump to that position, and use navigation buttons to step forward or backward through the game. The evaluation bar and textual feedback update instantly as the position changes.

- **Evaluation Caching:**  
  To improve performance, evaluations for each move are stored in the browser’s localStorage. When a user revisits a position, the cached evaluation is used instead of making a new server request, resulting in a faster and more efficient experience.

---

## Project Structure and File Descriptions

```
/chess_friend
    ├── /static
    │   ├── /css
    │   │   └── styles.css         # Custom CSS styles
    │   ├── /js
    │   │   └── scripts.js         # JavaScript for interactive features
    │   └── /images                # Chess piece and board images
    ├── /templates
    │   ├── layout.html            # Base template with common layout
    │   ├── index.html            # Home page template
    │   ├── upload.html           # Template for PGN upload page
    │   └── play.html             # Template for playing chess
    ├── app.py                     # Main application file
    ├── config.py                  # Configuration settings
    ├── requirements.txt            # Python package dependencies
    └── README.md                  # Project documentation
```

- **/static:** This directory contains static files such as CSS, JavaScript, and images. The CSS folder has a `styles.css` file for custom styles. The JavaScript folder contains `scripts.js` for interactive features, and the images folder has all the chess piece and board images.
- **/templates:** This directory holds the HTML templates used by Jinja for rendering pages. `layout.html` is the base template that includes the common layout for all pages. `index.html` is the home page template, `upload.html` is for the PGN upload page, and `play.html` is for the chess playing page.
- **app.py:** The main file that runs the Flask application. It includes the route definitions, request handlers, and integration with the Stockfish engine.
- **config.py:** This file contains configuration settings for the Flask app, such as the secret key and upload folder settings.
- **requirements.txt:** A file listing the Python package dependencies needed to run the project.
- **README.md:** This markdown file, which provides an overview of the project, how to set it up, and how to use it.


---

## File Descriptions

- **app.py**  
  The main Flask backend. Handles routing, API endpoints for evaluation and move generation, and integration with the Stockfish engine.

- **static/js/analyse_game.js**  
  JavaScript for the analysis board. Manages PGN import, move navigation, evaluation caching, and updates the evaluation bar and UI elements.

- **static/js/play_vs.js**  
  JavaScript for playing against the AI. Handles user moves, communicates with the backend to get Stockfish’s moves, and updates the board accordingly.

- **templates/**  
  Contains Jinja2 HTML templates. `base.html` provides a common layout, while other templates extend it for specific pages (home, analysis, play vs AI, etc.).

- **stockfish/**  
  Contains the Stockfish chess engine and its documentation. The engine is used for all chess analysis and AI moves.

- **static/css/**  
  Custom CSS for additional styling on top of Bootstrap.

- **static/img/**  
  Chess piece images and other static assets.

- **requirements.txt**  
  Lists Python dependencies (Flask, etc.).

---

## Design Choices

- **Separation of Concerns:**  
  The backend (Flask) is responsible for routing, API endpoints, and Stockfish integration, while the frontend (JavaScript) manages user interaction and UI updates. This modular approach makes the codebase easier to maintain and extend.

- **Evaluation Caching:**  
  Evaluations for each move in the analysis section are cached in `localStorage` to avoid redundant server requests and improve performance, especially when navigating through long games.

- **Real Time Evaluation Optimisation:**  
  Real time Stockfish evaluations optimised to continuously evaluate the current board position and stop when the evaluation result becomes stable for a number of iterations or a timeout/abort occurs. This improves performance at faster play speeds and improves evaluation when left over a longer period of time. (current max calculation timeout is set to 10s)

- **Evaluation Styling:**  
  Simple Evaluation bar and evaluation score displayed to user
 
- **Jinja Templating:**  
  Jinja is used to keep HTML DRY and maintainable, allowing for easy updates to navigation, layout, and shared components.

- **Stockfish Integration:**  
  The Stockfish engine runs server-side for security and performance. The frontend communicates with the backend via AJAX to request evaluations or AI moves.

- **Bootstrap Styling:**  
  Bootstrap is used for responsive, modern UI components, ensuring the site looks good on all devices.

---

## How to Use

1. **Import a Game:**  
   Upload a PGN file to analyze a chess game. The board will display the game, and Stockfish will evaluate each position.

2. **Play vs AI:**  
   Play against Stockfish at various difficulty levels. The AI move is calculated server-side and displayed on the board.

3. **Two Player Mode:**  
   Play chess locally with another person on the same device.

---

## Contributing

Pull requests and suggestions are welcome! Please open an issue or submit a PR.

---

## License

This project uses Stockfish, which is licensed under the GNU GPL v3. See `stockfish/Copying.txt` for details.

---

## Available Scripts

In the project directory, you can run:    

### `flask run` 

Runs the app in development mode.  
Open [http://localhost:5000](http://localhost:5000) to view it in your browser.

---

## Live Site 
