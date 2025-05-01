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

----

This is a project made by Claude Desktop and Desktop Commander MCP + Aider MCP (with paralel runs)

## Prompt for this project:
```
create a flappy bird game

But I want you first to think deep and plan the project,
Then create multiple tasks that can be done simultiniously in paralel which means no tasks should have dependency to each others, and tasks should be small and limited to one file,
Create a readme file that contains information about the project and tasks,
for each tasks share the readme and dependency files needed to **code_with_multiple_ai** tool so it can has knowledge about it 
For coding use **code_with_multiple_ai** but just run 4 tasks at same time,
which they are not dependet on each others,
I suggest you to create taks branches, which each branch work on different part of the app and they have no dependency, then run tasks one by one from different branches together, (like task 1 of different branches at same time, then task 2 and ...)

consider small tasks, and consider developing the app step by step,
which means, I need to have sprints,
after each sprint we need to have a runnable game, and I want you to use browser tool to run it so we can see,
for example sprint 1 can just load the game with nothing inside (but proper working)
then sprint 2, we might have the bird that can jump, with no wall 
then sprint 3 we add the walls and movements 
....
So all the time I can see the result.

if you need to run any command line, use your command line tool, don't give command running to our coder it can't run commands, it can just code 
don't code yourself, even if you need to review and if you find something is wrong don't fix it yourself, ask code_with_ai to fix it
if you found it is doing some mistakes all the time, then create a rule for it, and as part of prompt give it to it in next time run.
Also consider giving each task the methods and interfaces , method name, inputs and outputs, this way when they connect to eachother they don't have issue
```
