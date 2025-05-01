/**
 * Detects collisions between game entities.
 */
class CollisionDetector {
    /**
     * Initializes the CollisionDetector.
     * @param {Game} game - A reference to the main game object.
     */
    constructor(game) {
        this.game = game; // Store reference to the game object if needed later
        console.log("CollisionDetector initialized");
    }

    /**
     * Checks all relevant collision conditions.
     * @returns {boolean} True if any collision is detected, false otherwise.
     */
    checkCollisions() {
        // console.log("Checking all collisions..."); // Keep console logs minimal during gameplay loop
        const bird = this.game.bird;
        const pipes = this.game.pipes;
        const groundY = this.game.canvas.height; // Ground is at the bottom of the canvas

        if (!bird || !pipes) {
            console.warn("Collision check skipped: Bird or Pipes not available.");
            return false;
        }

        // Check each collision type
        const pipeCollision = this.checkPipeCollisions(bird, pipes);
        const groundCollision = this.checkGroundCollision(bird, groundY);
        const boundaryCollision = this.checkBoundaryCollision(bird); // Checks top boundary

        // Return true if any collision occurred
        return pipeCollision || groundCollision || boundaryCollision;
    }

    /**
     * Checks for collision between the bird and any pipes.
     * @param {Bird} bird - The bird object.
     * @param {Pipes} pipes - The pipes manager object.
     * @returns {boolean} True if a collision occurs, false otherwise.
     */
    checkPipeCollisions(bird, pipes) {
        // console.log("Checking pipe collisions..."); // Keep console logs minimal
        // Assumes pipes.pipes is an array of pipe pair objects
        // Assumes each pipe object has: x, width, topHeight, bottomY
        if (!pipes || !pipes.pipes || pipes.pipes.length === 0) {
            return false; // No pipes to collide with
        }

        // Define a margin for collision forgiveness (makes bird hitbox slightly smaller)
        // Increased from 2 to 3 for more forgiveness
        const collisionMargin = 3; // pixels

        // Calculate the effective bird hitbox for collision detection
        const birdRect = {
            x: bird.x + collisionMargin,
            y: bird.y + collisionMargin,
            width: bird.width - 2 * collisionMargin,
            height: bird.height - 2 * collisionMargin
        };

        // Ensure width/height don't become negative if margin is too large
        if (birdRect.width < 0) birdRect.width = 0;
        if (birdRect.height < 0) birdRect.height = 0;


        for (const pipe of pipes.pipes) {
            // Define bounding box for the top pipe
            const topPipeRect = {
                x: pipe.x,
                y: 0, // Top pipe starts from the top edge
                width: pipes.pipeWidth, // Use pipeWidth from the Pipes object
                height: pipe.topHeight
            };

            // Define bounding box for the bottom pipe using the stored bottomY
            const bottomPipeRect = {
                x: pipe.x,
                y: pipe.bottomY, // Use the pre-calculated bottom pipe's top edge Y
                width: pipes.pipeWidth, // Use pipeWidth from the Pipes object
                height: this.game.canvas.height - pipe.bottomY // Height extends to the bottom
            };

            // Check for collision with top pipe
            if (this.isRectOverlap(birdRect, topPipeRect)) {
                console.log("Collision detected with TOP pipe!");
                return true;
            }

            // Check for collision with bottom pipe
            if (this.isRectOverlap(birdRect, bottomPipeRect)) {
                console.log("Collision detected with BOTTOM pipe!");
                return true;
            }
        }

        return false; // No collision with any pipe
    }

    /**
     * Checks if the bird has collided with the ground.
     * @param {Bird} bird - The bird object.
     * @param {number} groundY - The y-coordinate of the ground.
     * @returns {boolean} True if the bird hits the ground, false otherwise.
     */
    checkGroundCollision(bird, groundY) {
        // console.log("Checking ground collision..."); // Keep console logs minimal
        // Check if the bird's bottom edge touches or goes below the ground level
        if (bird.y + bird.height >= groundY) {
             console.log("Collision detected with GROUND!");
             return true;
        }
        return false;
    }

    /**
     * Checks if the bird has gone out of the screen boundaries (e.g., hit the top).
     * @param {Bird} bird - The bird object.
     * @returns {boolean} True if the bird is out of bounds, false otherwise.
     */
    checkBoundaryCollision(bird) {
        // console.log("Checking boundary collision..."); // Keep console logs minimal
        // Check if the bird's top edge touches or goes above the top boundary (y=0)
        // Note: Bird physics might already prevent this, but good for robustness.
        if (bird.y <= 0) {
            console.log("Collision detected with TOP BOUNDARY!");
            return true;
        }
        return false;
    }

    /**
     * Helper function to check for overlap between two rectangles (AABB).
     * @param {object} rect1 - The first rectangle {x, y, width, height}.
     * @param {object} rect2 - The second rectangle {x, y, width, height}.
     * @returns {boolean} True if the rectangles overlap, false otherwise.
     */
    isRectOverlap(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }
}

// Make the CollisionDetector class globally available
window.CollisionDetector = CollisionDetector;
