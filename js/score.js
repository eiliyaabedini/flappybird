/**
 * Manages the game score, including current score and high score persistence.
 */
class ScoreManager {
    /**
     * Initializes the score manager.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     * @param {number} canvasWidth - The width of the canvas.
     * @param {number} canvasHeight - The height of the canvas.
     * @param {AssetLoader} assetLoader - The asset loader for playing sounds.
     */
    constructor(ctx, canvasWidth, canvasHeight, assetLoader) { // Added assetLoader
        this.ctx = ctx;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.assetLoader = assetLoader; // Store asset loader
        this.score = 0;
        this.highScore = this.getHighScore(); // Load high score on init

        // Visual properties
        this.font = "bold 48px 'Courier New', Courier, monospace"; // More prominent font
        this.color = "white";
        this.strokeColor = "black"; // Outline color
        this.lineWidth = 2;         // Outline width
        this.x = canvasWidth / 2;   // Center horizontally
        this.y = 60;                // Position near the top-center

        // Score "Pop" Animation properties
        this.displayScore = 0;      // Score value visually displayed (can lag behind actual score for effect)
        this.scoreScale = 1.0;      // Current scale for animation
        this.scoreScaleTarget = 1.0;// Target scale for animation
        this.scoreScaleSpeed = 4.0; // How fast the scale animates (higher is faster) - Increased from default
        this.scoreColor = "white";  // Base color
        this.popColor = "#FFD700"; // Gold color during pop - Optional

        // High score pulse properties (Separate from score pop)
        this.isNewHighScore = false;
        this.highScorePulseScale = 1.0;
        this.highScorePulseSpeed = 2.0; // Speed of pulsing
        this.highScorePulseMax = 1.1; // Max scale during pulse
        this.highScorePulseMin = 0.9; // Min scale during pulse
        this._pulseDirection = 1;     // Internal: 1 for growing, -1 for shrinking

        // Medal properties
        this.medal = null; // 'bronze', 'silver', 'gold', or null
        this.medalThresholds = { gold: 40, silver: 20, bronze: 10 }; // Example thresholds

        console.log(`ScoreManager initialized. High score: ${this.highScore}. Font: ${this.font}`);
    }

    /**
     * Increments the current score by one point.
     * Typically called when the bird successfully passes a pipe.
     * Increments the current score by one point and triggers animation/sound.
     * Typically called when the bird successfully passes a pipe.
     */
    incrementScore() {
        const oldScore = this.score;
        this.score++;
        this.scoreScaleTarget = 1.5; // Target scale for the "pop" effect - Increased from 1.0
        console.log(`[DEBUG_SCORE] Score incremented from ${oldScore} to ${this.score}. Triggering pop animation (target scale: ${this.scoreScaleTarget}).`);

        // Play score sound
        if (this.assetLoader) {
            this.assetLoader.playSound('score', 0.8); // Play score sound at 80% volume
        }
    }

    /**
     * Placeholder update method as requested.
     * Updates the score animation state (scale, pulsing).
     * @param {number} deltaTime - Time elapsed since the last frame in seconds.
     */
    update(deltaTime) {
        // --- Animate Score Scale (Pop Effect) ---
        if (this.scoreScale !== this.scoreScaleTarget) {
            const diff = this.scoreScaleTarget - this.scoreScale;
            this.scoreScale += diff * this.scoreScaleSpeed * deltaTime;

            // Check if the animation is returning to normal scale after a pop
            // If the target was > 1 (a pop), and the difference is now negative (moving back towards 1),
            // and we are close enough to 1, snap back and reset the target.
            if (this.scoreScaleTarget > 1.0 && diff < 0 && this.scoreScale < 1.05) {
                // console.log(`[DEBUG_SCORE_ANIM] Snapping scale back to 1.0 from ${this.scoreScale.toFixed(2)}`);
                this.scoreScale = 1.0;
                this.scoreScaleTarget = 1.0; // Reset target to normal scale
            }
            // If the target was already 1.0 (e.g., after reset) and we are very close, snap to 1.0
            else if (this.scoreScaleTarget === 1.0 && Math.abs(1.0 - this.scoreScale) < 0.01) {
                 this.scoreScale = 1.0;
            }
        }

        // --- Animate High Score Pulse (Separate Effect) ---
        if (this.isNewHighScore) {
            this.highScorePulseScale += this._pulseDirection * this.highScorePulseSpeed * deltaTime;
            if (this.highScorePulseScale >= this.highScorePulseMax) {
                this.highScorePulseScale = this.highScorePulseMax;
                this._pulseDirection = -1; // Shrink
            } else if (this.highScorePulseScale <= this.highScorePulseMin) {
                this.highScorePulseScale = this.highScorePulseMin;
                this._pulseDirection = 1; // Grow
            }
        } else {
            // Reset pulse if not a new high score (e.g., on restart)
            this.highScorePulseScale = 1.0;
            this._pulseDirection = 1;
        }

        // Update display score (optional, could just use this.score)
        this.displayScore = this.score;

        // Debug log for animation state
        // console.log(`[DEBUG_SCORE_UPDATE] Score: ${this.score}, Display: ${this.displayScore}, Scale: ${this.scoreScale.toFixed(2)}, Target: ${this.scoreScaleTarget}, PulseScale: ${this.highScorePulseScale.toFixed(2)}`);
    }

    /**
     * Draws the current score onto the canvas, applying animation scale and outline.
     */
    draw() {
        this.ctx.save(); // Save context state before applying transformations and styles

        // Apply scale transformation for the pop animation
        // Translate origin to the score's position, scale, then translate back
        this.ctx.translate(this.x, this.y);
        this.ctx.scale(this.scoreScale, this.scoreScale);
        this.ctx.translate(-this.x, -this.y);

        // Style the text
        // Optional: Change color during pop animation peak
        // this.ctx.fillStyle = (this.scoreScale > 1.1) ? this.popColor : this.scoreColor;
        this.ctx.fillStyle = this.scoreColor; // Keep color consistent for now
        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.font = this.font;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle"; // Better vertical alignment

        const scoreText = this.displayScore.toString();

        // Draw outline first for better visibility
        this.ctx.strokeText(scoreText, this.x, this.y);
        // Draw filled text on top
        this.ctx.fillText(scoreText, this.x, this.y);

        this.ctx.restore(); // Restore context state (removes scale and style changes)

        // Debug log for drawing state (uncomment if needed)
        // console.log(`[DEBUG_SCORE_DRAW] Drawing score: ${scoreText} at (${this.x}, ${this.y}), Scale: ${this.scoreScale.toFixed(2)}`);

        // Note: High score display during gameplay is handled separately in game.js render()
    }

    /**
     * Resets the current score, animation state, and medal.
     */
    reset() {
        this.score = 0;
        this.displayScore = 0;
        this.scoreScale = 1.0;
        this.scoreScaleTarget = 1.0;
        this.isNewHighScore = false; // Reset high score flag
        this.highScorePulseScale = 1.0; // Reset pulse scale
        this._pulseDirection = 1;
        this.medal = null; // Reset medal
        console.log("ScoreManager reset. Score: 0");
    }

    /**
     * Returns the current score.
     * @returns {number} The current score.
     */
    getScore() {
        return this.score;
    }

    /**
     * Updates the high score if the current score is higher.
     * Saves the new high score to localStorage.
     */
    setHighScore() {
        this.isNewHighScore = false; // Assume not a new high score initially
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.isNewHighScore = true; // Flag for pulsing effect
            try {
                localStorage.setItem('flappyBirdHighScore', this.highScore.toString());
                console.log(`[SCORE] New high score set: ${this.highScore}`);
                // Play a special sound for new high score (e.g., 'start' sound)
                if (this.assetLoader) {
                    this.assetLoader.playSound('start', 0.9); // Use 'start' sound, slightly lower volume
                }
            } catch (e) {
                console.error("Failed to save high score to localStorage:", e);
            }
        }
        // Determine medal based on the final score
        this.determineMedal();
    }

    /**
     * Retrieves the high score from localStorage.
     * @returns {number} The stored high score, or 0 if none exists or fails to parse.
     */
    getHighScore() {
        try {
            const storedScore = localStorage.getItem('flappyBirdHighScore');
            return storedScore ? parseInt(storedScore, 10) : 0;
        } catch (e) {
            console.error("Failed to retrieve high score from localStorage:", e);
            return 0;
        }
    }

    /**
     * Determines the medal earned based on the current score and thresholds.
     * Stores the result in this.medal.
     */
    determineMedal() {
        this.medal = null; // Start with no medal
        if (this.score >= this.medalThresholds.gold) {
            this.medal = 'gold';
        } else if (this.score >= this.medalThresholds.silver) {
            this.medal = 'silver';
        } else if (this.score >= this.medalThresholds.bronze) {
            this.medal = 'bronze';
        }
        if (this.medal) {
            console.log(`[SCORE] Medal awarded: ${this.medal} (Score: ${this.score})`);
        }
    }

    /**
     * Returns the calculated medal.
     * @returns {string|null} 'bronze', 'silver', 'gold', or null.
     */
    getMedal() {
        return this.medal;
    }

    /**
     * Returns properties needed for the high score pulse effect.
     * @returns {object} Object containing isNewHighScore and highScorePulseScale.
     */
    getPulseInfo() {
        return {
            isNew: this.isNewHighScore,
            scale: this.highScorePulseScale
        };
    }
}

// Make the ScoreManager class globally available
window.ScoreManager = ScoreManager;
