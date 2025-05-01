/**
 * Represents the bird entity in the game.
 */
class Bird {
    /**
     * Creates a new Bird instance.
     * @param {number} x - The initial x position of the bird.
     * @param {number} y - The initial y position of the bird.
     * @param {number} width - The width of the bird.
     * @param {number} height - The height of the bird.
     * @param {number} gravity - The gravitational force acting on the bird (pixels/sec^2).
     * @param {number} flapStrength - The initial upward velocity applied when flapping (pixels/sec).
     * @param {HTMLImageElement} image - The image asset for the bird.
     */
    constructor(x, y, width, height, gravity, flapStrength, image) {
        this.x = x;
        this.y = y;
        this.width = width; // Used for hitbox and drawing reference
        this.height = height;
        this.vy = 0; // Vertical velocity (pixels/sec)
        this.gravity = gravity; // Adjusted gravity (pixels/sec^2)
        this.flapStrength = flapStrength; // Adjusted flap strength (pixels/sec)
        this.rotation = 0; // Rotation angle in radians
        this.maxVelocity = 400; // Max downward velocity (pixels/sec) - Increased significantly from 5
        this.minVelocity = -flapStrength; // Max upward velocity (pixels/sec) - Matches flap strength
        this.image = image; // Store the image asset
        // this.debugHitbox = false; // Removed - No longer toggled by game.js
        console.log(`[Bird Init] Gravity: ${this.gravity}, Flap Strength: ${this.flapStrength}, Max Vel: ${this.maxVelocity}, Min Vel: ${this.minVelocity}`);
        if (!this.image) {
            console.warn("[Bird Init] Bird image asset not provided!");
        }
    }

    /**
     * Updates the bird's position based on its velocity, gravity, and checks for ground collision.
     * @param {number} deltaTime - The time elapsed since the last update in seconds.
     * @param {number} canvasHeight - The height of the game canvas.
     */
    update(deltaTime, canvasHeight) {
        const initialY = this.y;
        const initialVy = this.vy;
        // console.log(`[Bird Update Start] y=${initialY.toFixed(2)}, vy=${initialVy.toFixed(2)}, dt=${deltaTime.toFixed(4)}s`);

        // 1. Apply Gravity
        // Apply gravity regardless of position, but check boundaries later
        const gravityEffect = this.gravity * deltaTime;
        this.vy += gravityEffect;
        // console.log(`[Bird Gravity] vy changed by ${gravityEffect.toFixed(4)} -> new vy=${this.vy.toFixed(2)}`);

        // 2. Apply Velocity Limits (Cap velocity)
        // Cap downward velocity
        if (this.vy > this.maxVelocity) {
            // console.log(`[Bird Velocity Cap] Downward velocity ${this.vy.toFixed(2)} capped to ${this.maxVelocity}`);
            this.vy = this.maxVelocity;
        }
        // Cap upward velocity (minVelocity is negative)
        else if (this.vy < this.minVelocity) {
            // console.log(`[Bird Velocity Cap] Upward velocity ${this.vy.toFixed(2)} capped to ${this.minVelocity}`);
            this.vy = this.minVelocity;
        }

        // 3. Update Position
        const deltaY = this.vy * deltaTime;
        this.y += deltaY;
        // console.log(`[Bird Position Update] y changed by ${deltaY.toFixed(2)} -> new y=${this.y.toFixed(2)}`);

        // 4. Boundary Checks (Hard limits)
        // Top boundary check - Prevent going above screen
        if (this.y < 0) {
            console.warn(`[Bird Boundary] Hit Top! y was ${this.y.toFixed(2)}, reset to 0. vy reset from ${this.vy.toFixed(2)} to 0.`);
            this.y = 0; // Set position exactly to the top edge
            this.vy = 0; // Stop upward movement immediately
        }

        // Ground collision check - Prevent going below screen
        if (this.y + this.height > canvasHeight) {
            // console.warn(`[Bird Boundary] Hit Ground! y was ${this.y.toFixed(2)}, reset to ${canvasHeight - this.height}. vy reset from ${this.vy.toFixed(2)} to 0.`);
            this.y = canvasHeight - this.height; // Set position exactly to ground level
            this.vy = 0; // Stop vertical movement
            this.rotation = 90 * Math.PI / 180; // Point downwards when hitting the ground
        } else {
            // Update rotation based on velocity only if not hitting the ground this frame
            this.updateRotation();
        }
        // console.log(`[Bird Update End] y=${this.y.toFixed(2)}, vy=${this.vy.toFixed(2)}`);
    }

    /**
     * Updates the bird's rotation based on its vertical velocity.
     */
    updateRotation() {
        // Simple mapping: faster down = more rotation down, faster up = more rotation up
        // Convert degrees to radians: angleInRadians = angleInDegrees * Math.PI / 180;
        const maxUpwardRotation = -25 * Math.PI / 180; // -25 degrees in radians
        const maxDownwardRotation = 90 * Math.PI / 180; // 90 degrees in radians

        // Increase rotation proportionally to downward velocity, but faster
        // Gradually rotate down when falling
        if (this.vy > 1) {
            this.rotation += 0.03; // Slower downward rotation
        // Gradually rotate up when flapping/moving up
        } else if (this.vy < -0.5) { // Start rotating up sooner
             this.rotation -= 0.05; // Gradual upward rotation
        }

        // Clamp rotation
        if (this.rotation < maxUpwardRotation) {
            this.rotation = maxUpwardRotation;
        }
        if (this.rotation > maxDownwardRotation) {
            this.rotation = maxDownwardRotation;
        }
    }

    /**
     * Draws the bird on the canvas.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     */
    draw(ctx) {
        ctx.save(); // Save the current context state

        // Translate to the center of the bird
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // Rotate the context
        ctx.rotate(this.rotation);

        // Draw the bird image centered at the new origin (0, 0)
        if (this.image) {
            // Draw the image centered around the bird's logical center point
            ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // Fallback drawing if image is missing
            ctx.fillStyle = 'red'; // Indicate error
            ctx.fillStyle = 'yellow'; // Simple fallback color
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            // console.warn("[Bird Draw] Drawing fallback rectangle for bird (image missing).");
        }

        // --- Debug Hitbox Drawing Removed ---
        // The logic for drawing the hitbox based on this.debugHitbox has been removed.
        // If hitbox visualization is needed later, it can be re-added manually or
        // controlled by a different mechanism.

        ctx.restore(); // Restore the context state
    }

    /**
     * Makes the bird flap, applying an upward velocity.
     */
    flap() {
        const vyBeforeFlap = this.vy;
        // console.log(`[Bird Flap Start] Current vy: ${vyBeforeFlap.toFixed(2)}`);
        // Set velocity directly to the negative flap strength (upward)
        // Ensure it doesn't exceed the minimum velocity (maximum upward speed)
        this.vy = Math.max(this.minVelocity, -this.flapStrength);
        console.log(`[Bird Flap] Flap triggered! Velocity set to ${this.vy.toFixed(2)} (from ${vyBeforeFlap.toFixed(2)}). Flap strength: ${this.flapStrength}`);
    }
}

// Make the Bird class globally available
window.Bird = Bird;
