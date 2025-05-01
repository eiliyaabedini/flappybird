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
        this.cloudSpeed = 15;        // Pixels per second for clouds (slower than ground)

        // Day/Night cycle properties
        this.skyColor = '#70c5ce'; // Default day sky color
        this.daySkyColor = '#70c5ce';
        this.nightSkyColor = '#0d1b2a'; // Dark blue for night
        this.duskDawnColor = '#ffaf40'; // Orangey for transitions
        this.timeOfDay = 'day'; // Track current time segment

        // Cloud properties
        this.clouds = [];
        this._initClouds(5); // Initialize 5 clouds

        // Star properties
        this.stars = [];
        this._initStars(100); // Initialize 100 stars

        // Sun/Moon properties
        this.sunPos = { x: 0, y: 0 };
        this.moonPos = { x: 0, y: 0 };
        this.celestialOpacity = 1.0; // For fading sun/moon

        console.log(`[Background Init] Initialized with ground height: ${this.groundHeight}, ${this.clouds.length} clouds, ${this.stars.length} stars.`);
    }

    /** Initializes cloud objects with random properties. */
    _initClouds(count) {
        for (let i = 0; i < count; i++) {
            const speedMultiplier = 0.8 + Math.random() * 0.4; // 80% to 120% of base speed
            this.clouds.push({
                x: Math.random() * this.canvasWidth,
                y: Math.random() * (this.canvasHeight * 0.4) + (this.canvasHeight * 0.1), // Upper 40% of sky, offset from top
                width: 50 + Math.random() * 50, // Random width
                height: 20 + Math.random() * 20, // Random height
                speed: this.cloudSpeed * speedMultiplier,
                opacity: 0.8 + Math.random() * 0.2 // Start slightly transparent
            });
        }
    }

    /** Initializes star objects with random properties. */
    _initStars(count) {
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.canvasWidth,
                y: Math.random() * (this.canvasHeight - this.groundHeight), // Only in the sky area
                size: Math.random() * 1.5 + 0.5, // Small size variation
                opacity: 0 // Start invisible
            });
        }
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

        // Update cloud positions
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed * speedMultiplier * deltaTime;
            // Wrap cloud around the screen
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvasWidth;
                // Optional: Randomize y position slightly when wrapping
                cloud.y = Math.random() * (this.canvasHeight * 0.4) + (this.canvasHeight * 0.1);
            }
        });
    }

    /**
     * Updates the background visuals based on the time of day.
     * @param {object} timeState - An object containing { cycleProgress, timeOfDay }.
     */
    updateCycle(timeState) {
        const { cycleProgress, timeOfDay } = timeState;
        this.timeOfDay = timeOfDay; // Store for drawing logic

        // --- Sky Color Interpolation ---
        let startColor, endColor, transitionProgress;

        if (timeOfDay === 'day') {
            this.skyColor = this.daySkyColor; // Pure day
        } else if (timeOfDay === 'dusk') {
            // Transition from day to night (progress 0.45 to 0.55)
            startColor = this.daySkyColor;
            endColor = this.nightSkyColor;
            // Normalize progress within the dusk phase (0 to 1)
            transitionProgress = (cycleProgress - 0.45) / (0.55 - 0.45);
            this.skyColor = this._interpolateColor(startColor, this.duskDawnColor, transitionProgress * 2 < 1 ? transitionProgress * 2 : 1); // Day -> Orange
            this.skyColor = this._interpolateColor(this.duskDawnColor, endColor, transitionProgress * 2 >= 1 ? (transitionProgress * 2 - 1) : 0); // Orange -> Night
        } else if (timeOfDay === 'night') {
            this.skyColor = this.nightSkyColor; // Pure night
        } else { // Dawn
            // Transition from night to day (progress 0.95 to 1.0)
            startColor = this.nightSkyColor;
            endColor = this.daySkyColor;
            // Normalize progress within the dawn phase (0 to 1)
            transitionProgress = (cycleProgress - 0.95) / (1.0 - 0.95);
             this.skyColor = this._interpolateColor(startColor, this.duskDawnColor, transitionProgress * 2 < 1 ? transitionProgress * 2 : 1); // Night -> Orange
             this.skyColor = this._interpolateColor(this.duskDawnColor, endColor, transitionProgress * 2 >= 1 ? (transitionProgress * 2 - 1) : 0); // Orange -> Day
        }

        // --- Sun/Moon Position & Opacity ---
        // Calculate position based on a simple arc
        const angle = cycleProgress * 2 * Math.PI; // Full circle over the cycle
        const radius = this.canvasWidth / 2.5; // Adjust radius as needed
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight - this.groundHeight; // Base the arc near the ground

        // Sun position (visible during day/transitions)
        this.sunPos.x = centerX + radius * Math.cos(angle - Math.PI / 2); // Offset angle to start at bottom
        this.sunPos.y = centerY - radius * Math.sin(angle - Math.PI / 2);

        // Moon position (opposite side of the cycle)
        this.moonPos.x = centerX + radius * Math.cos(angle + Math.PI / 2); // Offset angle
        this.moonPos.y = centerY - radius * Math.sin(angle + Math.PI / 2);

        // Calculate celestial body opacity based on time of day
        if (timeOfDay === 'day') {
            this.celestialOpacity = 1.0; // Full sun
        } else if (timeOfDay === 'night') {
            this.celestialOpacity = 1.0; // Full moon
        } else if (timeOfDay === 'dusk') { // Fading sun, appearing moon
            // Use transitionProgress (0 to 1 during dusk)
            this.celestialOpacity = 1.0 - transitionProgress; // Sun fades out
            // Moon fades in during the second half of dusk
            // this.celestialOpacity = transitionProgress; // Moon fades in (handled in draw)
        } else { // Dawn: Fading moon, appearing sun
            // Use transitionProgress (0 to 1 during dawn)
            this.celestialOpacity = 1.0 - transitionProgress; // Moon fades out
            // Sun fades in during the second half of dawn
            // this.celestialOpacity = transitionProgress; // Sun fades in (handled in draw)
        }


        // --- Cloud Opacity/Visibility ---
        this.clouds.forEach((cloud, index) => {
            let targetOpacity = 0.9; // Default day opacity
            if (timeOfDay === 'night') {
                // Fewer, dimmer clouds at night
                targetOpacity = (index < 2) ? 0.3 : 0; // Only show first 2 clouds dimly
            } else if (timeOfDay === 'dusk') {
                // Fade clouds slightly during dusk
                targetOpacity = 0.9 - (transitionProgress * 0.6); // Fade from 0.9 down to 0.3
                if (index >= 2 && transitionProgress > 0.5) targetOpacity = 0; // Hide later clouds halfway through dusk
            } else if (timeOfDay === 'dawn') {
                 // Fade clouds back in during dawn
                targetOpacity = 0.3 + (transitionProgress * 0.6); // Fade from 0.3 up to 0.9
                 if (index < 2 && transitionProgress < 0.5) targetOpacity = 0.3; // Keep first 2 dim initially
                 else if (index >= 2 && transitionProgress < 0.5) targetOpacity = 0; // Keep later clouds hidden initially
            }
             // Smoothly transition opacity (optional, can be expensive)
             // cloud.opacity += (targetOpacity - cloud.opacity) * 0.1;
             cloud.opacity = targetOpacity; // Direct set is simpler
        });

        // --- Star Opacity ---
        this.stars.forEach(star => {
            let targetOpacity = 0;
            if (timeOfDay === 'night') {
                targetOpacity = 0.5 + Math.random() * 0.5; // Random brightness at night
            } else if (timeOfDay === 'dusk') {
                // Fade in stars during dusk
                targetOpacity = transitionProgress * (0.5 + Math.random() * 0.5);
            } else if (timeOfDay === 'dawn') {
                // Fade out stars during dawn
                targetOpacity = (1.0 - transitionProgress) * (0.5 + Math.random() * 0.5);
            }
            star.opacity = targetOpacity;
        });

        // TODO: Adjust ground color slightly based on time of day? (Optional)
    }

     /**
      * Interpolates between two hex colors.
      * @param {string} color1 - Start color hex string (e.g., '#RRGGBB').
      * @param {string} color2 - End color hex string (e.g., '#RRGGBB').
      * @param {number} factor - Interpolation factor (0 to 1).
      * @returns {string} Interpolated hex color string.
      */
     _interpolateColor(color1, color2, factor) {
        // Ensure factor is clamped between 0 and 1
        factor = Math.max(0, Math.min(1, factor));

        const c1 = parseInt(color1.substring(1), 16);
        const c2 = parseInt(color2.substring(1), 16);

        const r1 = (c1 >> 16) & 255;
        const g1 = (c1 >> 8) & 255;
        const b1 = c1 & 255;

        const r2 = (c2 >> 16) & 255;
        const g2 = (c2 >> 8) & 255;
        const b2 = c2 & 255;

        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);

        return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).padStart(6, '0')}`;
     }


    /**
     * Draws the background (sky image) and ground (ground image) on the canvas.
     */
    draw() {
        // --- Draw Background ---
        // Use the calculated skyColor instead of the image or default fallback color
        // --- Draw Sky Color ---
        this.ctx.fillStyle = this.skyColor;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight); // Fill entire canvas first

        // --- Draw Sun / Moon ---
        this.ctx.save();
        if (this.timeOfDay === 'day' || this.timeOfDay === 'dawn' || this.timeOfDay === 'dusk') {
            let sunOpacity = 0;
            if (this.timeOfDay === 'day') sunOpacity = 1.0;
            else if (this.timeOfDay === 'dusk') sunOpacity = this.celestialOpacity; // Fades out
            else if (this.timeOfDay === 'dawn') sunOpacity = 1.0 - this.celestialOpacity; // Fades in
            if (this.sunPos.y < this.canvasHeight - this.groundHeight && sunOpacity > 0) { // Only draw if above horizon
                this.ctx.fillStyle = `rgba(255, 223, 0, ${sunOpacity})`; // Yellow sun
                this.ctx.beginPath();
                this.ctx.arc(this.sunPos.x, this.sunPos.y, 20, 0, Math.PI * 2); // Sun size = 20 radius
                this.ctx.fill();
            }
        }
         if (this.timeOfDay === 'night' || this.timeOfDay === 'dusk' || this.timeOfDay === 'dawn') {
            let moonOpacity = 0;
            if (this.timeOfDay === 'night') moonOpacity = 1.0;
            else if (this.timeOfDay === 'dusk') moonOpacity = 1.0 - this.celestialOpacity; // Fades in
            else if (this.timeOfDay === 'dawn') moonOpacity = this.celestialOpacity; // Fades out
             if (this.moonPos.y < this.canvasHeight - this.groundHeight && moonOpacity > 0) { // Only draw if above horizon
                this.ctx.fillStyle = `rgba(240, 240, 240, ${moonOpacity})`; // White moon
                this.ctx.beginPath();
                this.ctx.arc(this.moonPos.x, this.moonPos.y, 15, 0, Math.PI * 2); // Moon size = 15 radius
                this.ctx.fill();
            }
        }
        this.ctx.restore();


        // --- Draw Stars ---
        this.ctx.save();
        this.stars.forEach(star => {
            if (star.opacity > 0) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                this.ctx.fillRect(star.x, star.y, star.size, star.size); // Simple square stars
            }
        });
        this.ctx.restore();

        // --- Draw Clouds ---
        this.ctx.save();
        this.clouds.forEach(cloud => {
            if (cloud.opacity > 0) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
                // Draw simple ellipse shape for cloud
                this.ctx.beginPath();
                this.ctx.ellipse(cloud.x + cloud.width / 2, cloud.y + cloud.height / 2, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        this.ctx.restore();


        // --- Draw Ground Image ---
        // Ensure ground is drawn *above* the sky color fill that now covers the whole canvas
        const groundY = this.canvasHeight - this.groundHeight;
        if (this.groundImage) {
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
            this.ctx.fillStyle = '#A1887F'; // Match ground SVG base
            this.ctx.fillRect(0, groundY, this.canvasWidth, this.groundHeight);
            console.warn("[Background Draw] Ground image missing, drawing fallback color.");
        }
    }
}

// Make the Background class globally available
// This allows other scripts loaded via <script> tags to access it,
// avoiding the need for ES module imports/exports in this simple setup.
window.Background = Background;
