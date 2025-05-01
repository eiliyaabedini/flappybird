# Flappy Bird Game

A web-based implementation of the classic Flappy Bird game using HTML5 Canvas and JavaScript.

## Project Structure
```
flappybird/
│
├── index.html              # Main HTML file
├── README.md               # Project documentation
│
├── css/                    # Styling
│   └── style.css           # Main CSS file
│
├── js/                     # JavaScript files
│   ├── game.js             # Main game logic
│   ├── bird.js             # Bird entity logic
│   ├── pipes.js            # Pipe entity logic
│   ├── background.js       # Background rendering
│   ├── input.js            # Input handling
│   ├── collision.js        # Collision detection
│   ├── score.js            # ScoreManager (tracks current and high score)
│   └── assets.js           # Asset loading and management
│
└── assets/                 # Game assets
    ├── images/             # Image files
    └── sounds/             # Sound files
```

## Development Plan

### Branch 1: Core Setup
- Task 1: Create basic HTML structure and canvas setup
- Task 2: Set up main game loop and state management
- Task 3: Create asset loading system

### Branch 2: Player Mechanics
- Task 1: Implement bird entity with basic physics
- Task 2: Implement user input handling
- Task 3: Add bird animations and visual effects

### Branch 3: Environment
- Task 1: Implement scrolling background
- Task 2: Create pipe generation and movement
- Task 3: Implement collision detection

### Branch 4: Game Systems
- Task 1: Implement score tracking
- Task 2: Create UI elements (start screen, game over)
- Task 3: Add sound effects and polish

## Sprint Plan

### Sprint 1: Basic Game Framework
- Set up the project structure
- Create a canvas that fills the screen
- Implement a basic game loop
- Display a static bird on screen

### Sprint 2: Bird Mechanics
- Implement gravity and bird movement
- Add user input to make the bird jump
- Add basic bird animation

### Sprint 3: Game Environment
- Implement scrolling background
- Add pipes that move from right to left
- Implement basic collision detection

### Sprint 4: Game Systems
- Add score tracking
- Implement game states (start, playing, game over)
- Add UI elements and instructions
- Add sound effects

## How to Run
Open `index.html` in a modern web browser.

## Controls
- Click or press Spacebar to make the bird flap
- Press R to restart the game after game over
```
