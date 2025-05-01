/**
 * Represents the game background, including sky and ground.
 */
class Background {
    /**
     * Creates a new Background instance.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     * @param {number} canvasWidth - The width of the game canvas.
     * @param {number} canvasHeight - The height of the game canvas.
     * @param {AssetLoader} assetLoader - The asset loader instance.
     */
    constructor(ctx, canvasWidth, canvasHeight, assetLoader) { // Added assetLoader
        this.ctx = ctx;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.assetLoader = assetLoader;

        // Get images from asset loader
        this.backgroundImage = this.assetLoader.getImage('background');
        this.groundImage = this.assetLoader.getImage('ground');

        if (!this.backgroundImage) {
            console.error("[Background Init] Background image 'background' not found in AssetLoader!");
        }
        if (!this.groundImage) {
            console.error("[Background Init] Ground image 'ground' not found in AssetLoader!");
        }

        // Use ground image height if available, otherwise fallback
        this.groundHeight = this.groundImage ? this.groundImage.height : 112;

        // Speeds will be set by the Game class for better control (e.g., linking to pipeSpeed)
        this.backgroundSpeed = 0; // Pixels per second for the sky/background layer
        this.groundSpeed = 0;     // Pixels per second for the ground layer (should match pipes)

        this.backgroundPosition = 0; // Current horizontal scroll position for background
        this.groundPosition = 0;     // Current horizontal scroll position for ground

        console.log(`[Background Init] Initialized with ground height: ${this.groundHeight}`);
    }

    /**
     * Updates the background and ground positions for parallax scrolling effect.
     * @param {number} deltaTime - The time elapsed since the last update in seconds.
     * @param {number} [speedMultiplier=1] - Optional multiplier for scroll speed (e.g., for ready/gameover states).
     */
    update(deltaTime, speedMultiplier = 1) {
        // Update background position
        this.backgroundPosition -= this.backgroundSpeed * speedMultiplier * deltaTime;
        // Reset background position for seamless loop (assumes background image width >= canvas width)
        // Using canvasWidth for looping ensures it works even if image is slightly different.
        if (this.backgroundPosition <= -this.canvasWidth) {
            this.backgroundPosition = 0;
        }

        // Update ground position
        if (this.groundImage) {
            this.groundPosition -= this.groundSpeed * speedMultiplier * deltaTime;
            // Reset ground position for seamless loop based on ground image width
            if (this.groundPosition <= -this.groundImage.width) {
                this.groundPosition = 0;
            }
        }
    }

    /**
     * Draws the background (sky image) and ground (ground image) on the canvas.
     */
    draw() {
        // --- Draw Background Image ---
        if (this.backgroundImage) {
            // Draw the first background image
            this.ctx.drawImage(this.backgroundImage, this.backgroundPosition, 0, this.canvasWidth, this.canvasHeight - this.groundHeight);
            // Draw the second background image immediately following the first to cover the loop seam
            // Ensure it's drawn at the correct height
            this.ctx.drawImage(this.backgroundImage, this.backgroundPosition + this.canvasWidth, 0, this.canvasWidth, this.canvasHeight - this.groundHeight);
        } else {
            // Fallback: Draw solid color if image missing
            this.ctx.fillStyle = '#70c5ce'; // Default sky blue
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight - this.groundHeight);
            console.warn("[Background Draw] Background image missing, drawing fallback color.");
        }

        // --- Draw Ground Image ---
        if (this.groundImage) {
            const groundY = this.canvasHeight - this.groundHeight;
            const groundImgWidth = this.groundImage.width;

            // Draw enough ground segments to cover the canvas plus one extra for smooth scrolling
            let currentX = this.groundPosition;
            while (currentX < this.canvasWidth) {
                 this.ctx.drawImage(this.groundImage, currentX, groundY, groundImgWidth, this.groundHeight);
                 currentX += groundImgWidth;
            }
             // Ensure there's always one drawn just off screen to the right if needed
             if (currentX <= this.canvasWidth) {
                 this.ctx.drawImage(this.groundImage, currentX, groundY, groundImgWidth, this.groundHeight);
             }

        } else {
            // Fallback: Draw solid color if image missing
            this.ctx.fillStyle = '#D2B48C'; // Default ground tan
            this.ctx.fillRect(0, this.canvasHeight - this.groundHeight, this.canvasWidth, this.groundHeight);
            console.warn("[Background Draw] Ground image missing, drawing fallback color.");
        }
    }
}

// Make the Background class globally available
// This allows other scripts loaded via <script> tags to access it,
// avoiding the need for ES module imports/exports in this simple setup.
window.Background = Background;
