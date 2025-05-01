/**
 * Handles user input for the Flappy Bird game using a class-based approach.
 */
class InputHandler {
    /**
     * Initializes the InputHandler with a reference to the game object.
     * @param {Game} game - The main game instance.
     */
    constructor(game) {
        if (!game) {
            console.error("InputHandler requires a valid game instance.");
            return;
        }
        this.game = game;
        // Bind methods to ensure 'this' context is correct when used as event listeners
        this.handleClick = this.handleClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
    }

    /**
     * Sets up event listeners for mouse clicks, keyboard presses, and touch events.
     */
    setupListeners() {
        window.addEventListener('click', this.handleClick);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('touchstart', this.handleTouchStart, { passive: false }); // passive: false to allow preventDefault
        console.log("Input listeners set up.");
    }

    /**
     * Removes event listeners to prevent memory leaks or duplicate handling.
     */
    removeListeners() {
        window.removeEventListener('click', this.handleClick);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('touchstart', this.handleTouchStart);
        console.log("Input listeners removed.");
    }

    /**
     * Handles the core flap or game start logic based on game state.
     */
    _handleAction() {
        console.log(`_handleAction called. Game state: ${this.game.gameState}`); // Debug log
        if (!this.game || !this.game.bird) {
            console.warn("_handleAction: Game or bird not available.");
            return; // Safety check
        }

        if (this.game.gameState === 'playing') {
            this.game.bird.flap();
        } else if (this.game.gameState === 'ready') {
            this.game.gameState = 'playing';
            console.log("Game started via input!");
            this.game.bird.flap(); // Flap on the first input that starts the game
        }
        // No action needed for 'loading' or 'gameover' states here (restart is handled in handleKeyDown)
    }

    /**
     * Handles mouse click events.
     * @param {MouseEvent} event - The mouse event object.
     */
    handleClick(event) {
        console.log("Click event detected."); // Debug log
        this._handleAction();
    }

     /**
     * Handles touch start events.
     * @param {TouchEvent} event - The touch event object.
     */
    handleTouchStart(event) {
        console.log("Touch start event detected."); // Debug log
        // Prevent touch events from also triggering click events if possible
        // Also prevents default touch actions like scrolling
        event.preventDefault();
        this._handleAction();
    }

    /**
     * Handles keyboard key down events.
     * @param {KeyboardEvent} event - The keyboard event object.
     */
    handleKeyDown(event) {
        console.log(`Key down event detected: ${event.code}`); // Debug log

        // Flap on Spacebar
        if (event.code === 'Space' || event.keyCode === 32) { // keyCode for older browsers
            console.log("Spacebar pressed."); // Debug log
            this._handleAction();
            event.preventDefault(); // Prevent spacebar from scrolling the page

            if (this.game.gameState === 'gameover') {
                console.log("To restarting press 'Space' or Tap on the screen"); // Debug log
                this.game.restart();
            }
        }
    }
}

// Make the InputHandler class globally accessible
window.InputHandler = InputHandler;
