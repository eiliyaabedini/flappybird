/**
 * Manages UI elements like the music toggle button.
 */
document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
        console.error("UI Error: Game container not found.");
        return;
    }

    // Check periodically if the game and music player are ready
    const checkGameReadyInterval = setInterval(() => {
        if (window.flappyGame && window.flappyGame.musicPlayer) {
            clearInterval(checkGameReadyInterval); // Stop checking
            createMusicToggleButton(gameContainer, window.flappyGame);
        } else if (window.flappyGame && window.flappyGame.gameState === 'error') {
             clearInterval(checkGameReadyInterval); // Stop if game failed
             console.log("UI: Game entered error state, not adding music button.");
        }
        // Add a timeout condition? Maybe not necessary if game handles its states.
    }, 100); // Check every 100ms
});

/**
 * Creates and appends the music toggle button.
 * @param {HTMLElement} container - The parent container (game-container).
 * @param {Game} gameInstance - The main game instance.
 */
function createMusicToggleButton(container, gameInstance) {
    const button = document.createElement('button');
    button.id = 'music-toggle'; // Use the specific ID for easier CSS targeting
    button.classList.add('ui-button'); // Keep general class for potential shared styles
    button.setAttribute('aria-label', 'Toggle Music');

    // Function to update the button's appearance based on mute state
    const updateButtonAppearance = () => {
        const isMuted = gameInstance.musicPlayer.isMuted;
        if (isMuted) {
            button.textContent = '🔇'; // Muted speaker icon
            button.classList.add('muted');
            button.setAttribute('aria-pressed', 'true');
        } else {
            button.textContent = '🔊'; // Speaker icon
            button.classList.remove('muted');
            button.setAttribute('aria-pressed', 'false');
        }
    };

    // Set initial appearance
    updateButtonAppearance();

    // Add click listener
    button.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent click from triggering game input if overlapping
        gameInstance.toggleMusic();
        updateButtonAppearance(); // Update icon immediately
    });

    // Append to the container
    container.appendChild(button);
    console.log("UI: Music toggle button added.");
}
