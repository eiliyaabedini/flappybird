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
        this.y = 60;                // Position slightly lower

        // Animation properties
        this.displayScore = 0;      // Score value visually displayed (can lag behind actual score for effect)
        this.scoreScale = 1.0;      // Current scale for animation
        this.scoreScaleTarget = 1.0;// Target scale for animation
        this.scoreScaleSpeed = 4.0; // How fast the scale animates (higher is faster)

        // High score pulse properties
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
        this.score++;
        this.scoreScaleTarget = 1.5; // Target scale for the "pop" effect
        // Play score sound
        if (this.assetLoader) {
            this.assetLoader.playSound('score', 0.8); // Play score sound at 80% volume
        }
        // console.log(`Score increased: ${this.score}`);
    }

    /**
     * Placeholder update method as requested.
     * Updates the score animation state (scale, pulsing).
     * @param {number} deltaTime - Time elapsed since the last frame in seconds.
     */
    update(deltaTime) {
        // Animate score scale
        if (this.scoreScale !== this.scoreScaleTarget) {
            const diff = this.scoreScaleTarget - this.scoreScale;
            this.scoreScale += diff * this.scoreScaleSpeed * deltaTime;

            // If the target was larger (pop effect) and we are returning to normal
            if (this.scoreScaleTarget > 1.0 && diff < 0 && this.scoreScale < 1.05) {
                this.scoreScale = 1.0; // Snap back to 1
                this.scoreScaleTarget = 1.0; // Reset target
            }
            // If the target was 1.0 (resetting) and we are close
            else if (this.scoreScaleTarget === 1.0 && Math.abs(diff) < 0.01) {
                 this.scoreScale = 1.0; // Snap to 1
            }
        }

        // Animate high score pulse if new high score was achieved
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
    }

    /**
     * Draws the current score onto the canvas, applying animation scale and outline.
     */
    draw() {
        this.ctx.save(); // Save context state

        // Apply scale transformation for animation
        this.ctx.translate(this.x, this.y); // Move origin to score position
        this.ctx.scale(this.scoreScale, this.scoreScale); // Apply scale
        this.ctx.translate(-this.x, -this.y); // Move origin back

        // Style the text
        this.ctx.fillStyle = this.color;
        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.font = this.font;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle"; // Align vertically better

        const scoreText = this.displayScore.toString();

        // Draw outline first
        this.ctx.strokeText(scoreText, this.x, this.y);
        // Draw filled text on top
        this.ctx.fillText(scoreText, this.x, this.y);

        this.ctx.restore(); // Restore context state (removes scale)

        // Note: High score display during gameplay is handled in game.js render()
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
