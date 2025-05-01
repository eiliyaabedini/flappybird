/**
 * Manages UI elements like the music toggle button.
 */
document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
        console.error("UI Error: Game container not found.");
        return;
    }

    let timeIndicatorElement = null; // Keep track of the indicator element
    let animationFrameId = null; // To control the animation loop

    // Check periodically if the game, music player, and time manager are ready
    const checkGameReadyInterval = setInterval(() => {
        const gameInstance = window.flappyGame;
        if (gameInstance && gameInstance.musicPlayer && gameInstance.timeManager && gameInstance.gameState !== 'loading') {
            clearInterval(checkGameReadyInterval); // Stop checking

            // Create UI elements only if not in error state
            if (gameInstance.gameState !== 'error') {
                createMusicToggleButton(gameContainer, gameInstance);
                timeIndicatorElement = createTimeIndicator(gameContainer, gameInstance); // Create and store the element
                // Start the update loop only after creating the element
                if (timeIndicatorElement) {
                    cancelAnimationFrame(animationFrameId); // Cancel previous loop if any
                    updateTimeIndicator(gameInstance, timeIndicatorElement); // Start the update loop
                }
            } else {
                console.log("UI: Game entered error state, not adding UI elements.");
            }

        } else if (gameInstance && gameInstance.gameState === 'error') {
             clearInterval(checkGameReadyInterval); // Stop if game failed
             console.log("UI: Game entered error state, stopping checks.");
             cancelAnimationFrame(animationFrameId); // Stop animation loop if game errors
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

/**
 * Creates and appends the time of day indicator element.
 * @param {HTMLElement} container - The parent container (game-container).
 * @param {Game} gameInstance - The main game instance.
 * @returns {HTMLElement} The created indicator element.
 */
function createTimeIndicator(container, gameInstance) {
    const indicator = document.createElement('div');
    indicator.id = 'time-indicator';
    indicator.classList.add('ui-indicator'); // General class for indicators
    indicator.setAttribute('aria-label', 'Time of Day');
    indicator.title = 'Time of Day'; // Tooltip

    // Initial state will be set by the update loop
    indicator.textContent = '☀️'; // Default to sun icon initially

    container.appendChild(indicator);
    console.log("UI: Time indicator element added.");
    return indicator; // Return the element so it can be updated
}

/**
 * Updates the time indicator's appearance based on the game's time state.
 * Runs in a requestAnimationFrame loop.
 * @param {Game} gameInstance - The main game instance.
 * @param {HTMLElement} indicatorElement - The indicator DOM element.
 */
function updateTimeIndicator(gameInstance, indicatorElement) {
    // Check if game is valid
    if (!gameInstance || !indicatorElement || gameInstance.gameState === 'error') {
        console.log("UI: Stopping time indicator update loop.");
        return; // Stop loop if game/element not available or game errored
    }

    try {
        // Only update if timeManager exists and has getTimeState method
        if (gameInstance.timeManager && typeof gameInstance.timeManager.getTimeState === 'function') {
            const timeState = gameInstance.timeManager.getTimeState();
            const currentTimeOfDay = timeState.timeOfDay;

            // Remove previous time classes
            indicatorElement.classList.remove('day', 'dusk', 'night', 'dawn');

            // Add current time class
            indicatorElement.classList.add(currentTimeOfDay); // Add class like 'day', 'night', etc.

            // Update icon based on time of day
            switch (currentTimeOfDay) {
                case 'day':
                    indicatorElement.textContent = '☀️'; // Sun
                    indicatorElement.title = 'Day';
                    break;
                case 'dusk':
                    indicatorElement.textContent = '🌇'; // Sunset
                    indicatorElement.title = 'Dusk';
                    break;
                case 'night':
                    indicatorElement.textContent = '🌙'; // Moon
                    indicatorElement.title = 'Night';
                    break;
                case 'dawn':
                    indicatorElement.textContent = '🌅'; // Sunrise
                    indicatorElement.title = 'Dawn';
                    break;
                default:
                    indicatorElement.textContent = '?';
                    indicatorElement.title = 'Unknown Time';
            }

            // Optional logging (uncomment for debugging)
            // console.log(`Time indicator updated: ${currentTimeOfDay}`);
        }
    } catch (error) {
        console.error("Error updating time indicator:", error);
    }

    // Continue the loop regardless of errors
    animationFrameId = requestAnimationFrame(() => updateTimeIndicator(gameInstance, indicatorElement));
}
