/**
 * Manages the in-game time and day/night cycle.
 */
class TimeManager {
    /**
     * Initializes the TimeManager.
     * @param {number} [dayDuration=60] - The duration of a full day-night cycle in seconds.
     */
    constructor(dayDuration = 60) {
        this.dayDuration = dayDuration; // Duration of a full cycle in seconds
        this.gameTime = 0; // Current time within the cycle (0 to dayDuration)
        this.cycleProgress = 0; // Current progress through the cycle (0 to 1)
        this.timeOfDay = 'day'; // Current phase ('day', 'dusk', 'night', 'dawn')

        console.log(`[TimeManager] Initialized with day duration: ${this.dayDuration}s`);
    }

    /**
     * Updates the game time and calculates the current cycle progress and time of day.
     * @param {number} deltaTime - The time elapsed since the last update in seconds.
     */
    update(deltaTime) {
        this.gameTime += deltaTime;
        // Wrap gameTime around the dayDuration
        this.gameTime %= this.dayDuration;

        // Calculate cycle progress (0 = start of day, 0.5 = start of night, 1 = end of night/start of day)
        this.cycleProgress = this.gameTime / this.dayDuration;

        // Determine the time of day based on progress
        if (this.cycleProgress < 0.45) { // Day (0% -> 45%)
            this.timeOfDay = 'day';
        } else if (this.cycleProgress < 0.55) { // Dusk (45% -> 55%)
            this.timeOfDay = 'dusk';
        } else if (this.cycleProgress < 0.95) { // Night (55% -> 95%)
            this.timeOfDay = 'night';
        } else { // Dawn (95% -> 100%)
            this.timeOfDay = 'dawn';
        }
        // Optional: Log time changes periodically
        // if (Math.random() < 0.01) { // Log roughly 1% of the time
        //     console.log(`[TimeManager] Time: ${this.gameTime.toFixed(1)}s, Progress: ${this.cycleProgress.toFixed(2)}, Phase: ${this.timeOfDay}`);
        // }
    }

    /**
     * Resets the game time back to the start of the day.
     */
    reset() {
        this.gameTime = 0;
        this.cycleProgress = 0;
        this.timeOfDay = 'day';
        console.log("[TimeManager] Reset to start of day.");
    }

    /**
     * Gets the current state of the time cycle.
     * @returns {object} An object containing { gameTime, cycleProgress, timeOfDay }.
     */
    getTimeState() {
        return {
            gameTime: this.gameTime,
            cycleProgress: this.cycleProgress,
            timeOfDay: this.timeOfDay
        };
    }
}

// Make the TimeManager class globally available
window.TimeManager = TimeManager;
