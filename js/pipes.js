/**
 * Represents the pipe obstacles in the game.
 * Manages the creation, movement, drawing, and collision detection of pipes.
 */
class Pipes {
    /**
     * Initializes the pipe manager.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     * @param {number} canvasWidth - The width of the canvas.
     * @param {number} canvasHeight - The height of the canvas.
     * @param {AssetLoader} assetLoader - The asset loader instance to get pipe images.
     */
    constructor(ctx, canvasWidth, canvasHeight, assetLoader) { // Added assetLoader parameter
        this.ctx = ctx;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.assetLoader = assetLoader; // Store asset loader
        this.pipes = []; // Array to hold pipe pairs

        // Pipe images
        this.pipeNorthImage = this.assetLoader.getImage('pipeNorth');
        this.pipeSouthImage = this.assetLoader.getImage('pipeSouth');
        if (!this.pipeNorthImage || !this.pipeSouthImage) {
            console.error("[Pipes Init] Pipe images not found in AssetLoader!");
            // Optional: Add fallback or stop execution
        }

        // Pipe properties
        this.pipeWidth = 52; // Standard width for Flappy Bird pipes (matches SVG)
        this.pipeImageHeight = 320; // Natural height of the SVG pipe images
        this.gap = 150;      // Vertical gap between top and bottom pipes
        this.minPipeHeight = 60; // Minimum height for top or bottom pipe section visible
        this.speed = 45;     // Default horizontal speed (pixels per second) - Game sets this via game.pipeSpeed
        this.generationInterval = 1.5; // Time in seconds between generating new pipes
        this.timeSinceLastPipe = 0; // Timer for generating pipes (Starts at 0, first pipe after interval)

        console.log(`[DEBUG] Pipes manager initialized (Gap: ${this.gap}, Interval: ${this.generationInterval}s, Min Height: ${this.minPipeHeight})`);
    }

    /**
     * Resets the pipes state, clearing all existing pipes and resetting timers.
     */
    reset() {
        this.pipes = [];
        this.timeSinceLastPipe = 0; // Reset timer, first pipe will appear after generationInterval
        console.log("[DEBUG] Pipes reset.");
    }

    /**
     * Updates the position of all pipes, generates new ones, and removes old ones.
     * @param {number} deltaTime - The time elapsed since the last update in seconds.
     */
    update(deltaTime) {
        // Move existing pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            this.pipes[i].x -= this.speed * deltaTime;

            // Remove pipes that have moved off-screen
            if (this.pipes[i].x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }

        // Generate new pipes periodically
        this.timeSinceLastPipe += deltaTime;
        if (this.timeSinceLastPipe > this.generationInterval) {
            this.generate();
            this.timeSinceLastPipe = 0; // Reset timer
        }
        // console.log(`Updating pipes... Count: ${this.pipes.length}, Time since last: ${this.timeSinceLastPipe.toFixed(2)}s`);
    }

    /**
     * Draws all the pipes onto the canvas using the loaded images or fallback rectangles.
     */
    draw() {
        const drawFallback = !this.pipeNorthImage || !this.pipeSouthImage;
        if (drawFallback) {
            // console.warn("[Pipes Draw] Pipe image(s) missing. Drawing fallback rectangles.");
        }

        this.pipes.forEach(pipe => {
            const bottomPipeY = pipe.topHeight + this.gap;
            const bottomPipeHeight = this.canvasHeight - bottomPipeY;

            if (drawFallback) {
                // Draw simple green rectangles if images are missing
                this.ctx.fillStyle = 'green';
                // Top pipe rectangle
                this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
                // Bottom pipe rectangle
                this.ctx.fillRect(pipe.x, bottomPipeY, this.pipeWidth, bottomPipeHeight);
            } else {
                // --- Draw Top Pipe (pipeNorth) ---
                // Source rectangle (from the bottom part of the north pipe image)
                const sourceNorthY = this.pipeImageHeight - pipe.topHeight;
                const sourceNorthHeight = pipe.topHeight;
                // Destination rectangle (at the top of the canvas)
                const destNorthY = 0;
                const destNorthHeight = pipe.topHeight;

                this.ctx.drawImage(
                    this.pipeNorthImage,
                    0, sourceNorthY,           // Source x, y
                    this.pipeWidth, sourceNorthHeight, // Source width, height
                    pipe.x, destNorthY,         // Destination x, y
                    this.pipeWidth, destNorthHeight   // Destination width, height
                );

                // --- Draw Bottom Pipe (pipeSouth) ---
                // Source rectangle (from the top part of the south pipe image)
                const sourceSouthY = 0;
                const sourceSouthHeight = bottomPipeHeight;
                // Destination rectangle (below the gap)
                const destSouthY = bottomPipeY;
                const destSouthHeight = bottomPipeHeight;

                 this.ctx.drawImage(
                    this.pipeSouthImage,
                    0, sourceSouthY,           // Source x, y
                    this.pipeWidth, sourceSouthHeight, // Source width, height
                    pipe.x, destSouthY,         // Destination x, y
                    this.pipeWidth, destSouthHeight   // Destination width, height
                );
            } // End if/else drawFallback
        });
        // console.log(`Drawing ${this.pipes.length} pipes...`);
    }

    /**
            const bottomPipeHeight = this.canvasHeight - bottomPipeY;

            // --- Draw Top Pipe (pipeNorth) ---
            // Source rectangle (from the bottom part of the north pipe image)
            const sourceNorthY = this.pipeImageHeight - pipe.topHeight;
            const sourceNorthHeight = pipe.topHeight;
            // Destination rectangle (at the top of the canvas)
            const destNorthY = 0;
            const destNorthHeight = pipe.topHeight;

            this.ctx.drawImage(
                this.pipeNorthImage,
                0, sourceNorthY,           // Source x, y
                this.pipeWidth, sourceNorthHeight, // Source width, height
                pipe.x, destNorthY,         // Destination x, y
                this.pipeWidth, destNorthHeight   // Destination width, height
            );

            // --- Draw Bottom Pipe (pipeSouth) ---
            // Source rectangle (from the top part of the south pipe image)
            const sourceSouthY = 0;
            const sourceSouthHeight = bottomPipeHeight;
            // Destination rectangle (below the gap)
            const destSouthY = bottomPipeY;
            const destSouthHeight = bottomPipeHeight;

             this.ctx.drawImage(
                this.pipeSouthImage,
                0, sourceSouthY,           // Source x, y
                this.pipeWidth, sourceSouthHeight, // Source width, height
                pipe.x, destSouthY,         // Destination x, y
                this.pipeWidth, destSouthHeight   // Destination width, height
            );
        });
        // console.log(`Drawing ${this.pipes.length} pipes...`);
    }

    /**
     * Generates a new pair of pipes (top and bottom) and adds them to the pipes array.
     * Pipes should start off-screen to the right.
     */
    generate() {
        // Calculate the maximum possible height for the top pipe
        // It must leave space for the gap and the minimum bottom pipe height
        const maxTopHeight = this.canvasHeight - this.gap - this.minPipeHeight;
        // Ensure the top pipe also has a minimum height
        const topHeight = Math.random() * (maxTopHeight - this.minPipeHeight) + this.minPipeHeight;

        const bottomY = topHeight + this.gap;
        const newPipe = {
            x: this.canvasWidth, // Start off-screen to the right
            topHeight: topHeight,
            bottomY: bottomY, // Store the calculated Y position of the bottom pipe's top edge
            passed: false // Flag to track if the bird has passed this pipe for scoring
        };

        this.pipes.push(newPipe);
        console.log(`[DEBUG] Generated new pipe pair at x=${newPipe.x.toFixed(0)}, topHeight=${newPipe.topHeight.toFixed(0)}`);
    }

    /**
     * Checks if the bird has collided with any of the pipes.
     * @param {Bird} bird - The bird object (contains x, y, width, height).
     * @returns {boolean} True if a collision occurred, false otherwise.
     */
    checkCollision(bird) {
        // TODO: Implement collision detection logic between the bird and each pipe pair
        console.log("Checking collision with bird:", bird);
        // TODO: Implement collision detection logic between the bird and each pipe pair
        // Iterate through this.pipes
        // Check if bird's bounding box overlaps with top or bottom pipe's bounding box
        return false; // Placeholder
    }

    /**
     * Checks if the bird has just passed a pipe to increment the score.
     * @param {Bird} bird - The bird object.
     * @returns {boolean} True if a pipe was just passed, false otherwise.
     */
    checkPipePassed(bird) {
        for (let pipe of this.pipes) {
            // Check if the bird's front edge (bird.x) has passed the pipe's center line (pipeCenterX)
            // and the pipe hasn't been scored yet (!pipe.passed).
            const pipeCenterX = pipe.x + this.pipeWidth / 2;

            // Debug log for every check against an unpassed pipe
            // if (!pipe.passed) {
            //     console.log(`[Pipe Check] Bird X: ${bird.x.toFixed(1)}, Pipe Center X: ${pipeCenterX.toFixed(1)}, Pipe Passed: ${pipe.passed}`);
            // }

            if (!pipe.passed && bird.x > pipeCenterX) {
                pipe.passed = true; // Mark this pipe as passed to prevent multiple scores
                console.log(`[SCORE] Pipe Passed! Bird X: ${bird.x.toFixed(1)} > Pipe Center X: ${pipeCenterX.toFixed(1)}. Setting pipe.passed = true.`);
                return true; // Signal that a point should be scored
            }
        }
        return false; // No pipe passed in this frame
    }
}

// Make the Pipes class globally available
window.Pipes = Pipes;
