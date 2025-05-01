/**
 * Represents the main game controller.
 */
class Game {
    /**
     * Initializes the game environment, canvas, and context.
     * @param {AssetLoader} assetLoader - The pre-loaded asset loader instance.
     */
    constructor(assetLoader) { // Accept assetLoader
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'loading'; // Possible states: loading, ready, playing, gameover
        this.lastTime = 0;
        this.frameCount = 0; // For FPS calculation
        this.fps = 0; // To store calculated FPS
        this.logTimer = 0; // Timer to log FPS periodically
        this.background = null;
        this.scoreManager = null; // Use ScoreManager
        this.bird = null; // Initialize bird property
        this.pipes = null; // Initialize pipes property
        this.inputHandler = null;
        this.collisionDetector = null;
        this.assetLoader = assetLoader; // Store the asset loader

        // Game settings & state
        this.basePipeSpeed = 130; // Initial speed
        this.pipeSpeed = this.basePipeSpeed;
        this.difficultyTier = 0;
        this.difficultyInterval = 10; // Increase difficulty every 10 points
        this.maxDifficultyTier = 5; // Limit speed increases

        // Visual Effects State
        this.initialBirdY = 0;
        this.bobbingTimer = 0;
        this.bobbingAmplitude = 3;
        this.bobbingFrequency = 2;
        this.flashOpacity = 0; // For collision flash effect
        this.flashDuration = 0.3; // seconds
        this.shakeIntensity = 0;
        this.shakeDuration = 0.3; // seconds
        this.shakeTimer = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
        this.simpleMode = false; // Flag for simplified rendering/logic

        // Placeholder for Particle System (Requires js/particles.js)
        // this.particleManager = null;

        // Day/Night Cycle Manager
        this.timeManager = null; // Initialize TimeManager property

        this.updateLogCounter = 0; // Counter for periodic logging
        this.musicPlayer = null; // Initialize music player property

        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.startGamePlay = this.startGamePlay.bind(this); // Bind the new method
        this.forceSimpleMode = this.forceSimpleMode.bind(this);
    }

    /**
     * Forces the game into simple mode, disabling advanced graphics and sounds.
     */
    forceSimpleMode() {
        if (!this.simpleMode) {
//            this.simpleMode = true;
//            this.assetLoader.enableSimpleMode(); // Ensure asset loader is also in simple mode
//            console.warn("[Game] Forced Simple Mode Enabled. Using fallback graphics and no sound.");
            // Potentially disable other features reliant on assets or performance
            // e.g., particle effects, complex animations
            // if (this.particleManager) this.particleManager.disable();
        }
    }

    /**
     * Initializes game components, loads assets, etc.
     */
    init() {
        // Set canvas dimensions (example, could be dynamic)
        this.canvas.width = 288; // Typical Flappy Bird width
        this.canvas.height = 512; // Typical Flappy Bird height

        // Initialize game objects
        // Pass assetLoader to Background constructor (Background class needs similar fallback logic)
        // We assume Background class exists and handles missing assets gracefully or Game handles its drawing fallback.
        // Since Background.js wasn't provided, we'll focus on what we can control.
        try {
            this.background = new Background(this.ctx, this.canvas.width, this.canvas.height, this.assetLoader);
        } catch (e) {
            console.error("[GAME_INIT] Failed to initialize Background:", e);
            this.background = null; // Ensure background is null if init fails
            this.forceSimpleMode(); // Force simple mode if background fails
        }

        // Use ScoreManager, passing the assetLoader for sounds
        try {
            this.scoreManager = new ScoreManager(this.ctx, this.canvas.width, this.canvas.height, this.assetLoader);
        } catch (e) {
             console.error("[GAME_INIT] Failed to initialize ScoreManager:", e);
             this.scoreManager = null; // Ensure scoreManager is null if init fails
             this.forceSimpleMode(); // Force simple mode if score manager fails
        }


        // Get the loaded bird image (Ensure assets are loaded before calling init)
        const birdImage = this.assetLoader.getImage('bird');
        if (!birdImage && !this.simpleMode) {
             console.warn("[GAME_INIT] Bird image asset not found! Forcing simple mode.");
             this.forceSimpleMode();
             // Bird constructor will handle null image internally now
        }

        this.bird = new Bird(
            this.canvas.width / 3,  // x position (1/3 from the left)
            this.canvas.height / 2, // y position (middle of screen)
            34,                     // width (Matches SVG asset)
            24,                     // height (Matches SVG asset)
            1250,                    // gravity (pixels/sec^2 - Increased from 150 for less floaty feel)
            330,                    // flap strength (pixels/sec - Increased from 200 to balance new gravity)
            birdImage               // Pass the loaded image asset
        );
        this.initialBirdY = this.bird.y; // Store initial Y after bird creation

        // Initialize Pipes with the defined speed and asset loader
        try {
            this.pipes = new Pipes(this.ctx, this.canvas.width, this.canvas.height, this.assetLoader); // Pass assetLoader
            this.pipes.speed = this.pipeSpeed; // Set initial speed
        } catch (e) {
            console.error("[GAME_INIT] Failed to initialize Pipes:", e);
            this.pipes = null; // Ensure pipes is null if init fails
            this.forceSimpleMode(); // Force simple mode if pipes fail
        }


        // Set background scroll speeds based on current pipeSpeed
        this.updateBackgroundSpeeds(); // This will check if this.background exists

        // Initialize Particle Manager (Requires js/particles.js)
        // if (window.ParticleManager) {
        //     this.particleManager = new ParticleManager(this.ctx, this.assetLoader); // Assuming ParticleManager needs ctx/assets
        // } else {
        //     console.warn("ParticleManager class not found. Skipping particle effects.");
        // }

        // Set up input handlers using the new class
        if (window.InputHandler) {
             this.inputHandler = new InputHandler(this);
             this.inputHandler.setupListeners();
        } else {
            console.error("InputHandler class not found!");
        }

        // Initialize Collision Detector
        if (window.CollisionDetector) {
            this.collisionDetector = new CollisionDetector(this);
        } else {
            console.error("CollisionDetector class not found!");
        }

        // Initialize Music Player if available
        if (window.MusicPlayer) {
            try {
                this.musicPlayer = new MusicPlayer();
                console.log("[GAME_INIT] MusicPlayer initialized.");
            } catch (e) {
                console.error("[GAME_INIT] Failed to initialize MusicPlayer:", e);
                this.musicPlayer = null; // Ensure it's null on failure
            }
        } else {
            console.warn("[GAME_INIT] MusicPlayer class not found. Background music disabled.");
        }

        // Initialize Time Manager
        if (window.TimeManager) {
            try {
                this.timeManager = new TimeManager(60); // Use a 5-second cycle for faster day/night transitions
                console.log("[GAME_INIT] TimeManager initialized.");
            } catch (e) {
                console.error("[GAME_INIT] Failed to initialize TimeManager:", e);
                this.timeManager = null;
            }
        } else {
            console.warn("[GAME_INIT] TimeManager class not found. Day/night cycle disabled.");
        }


        console.log("[GAME_INIT] Game components initialized.");
        // Game state will be set to 'ready' by the start method after loading completes.
    }

     /**
      * Updates the background scroll speeds based on the current pipeSpeed.
      */
     updateBackgroundSpeeds() {
        // Only update if background exists and we're not in simple mode (where background might be static)
        if (this.background && !this.simpleMode) {
            try {
                this.background.groundSpeed = this.pipeSpeed; // Ground moves with pipes
                this.background.backgroundSpeed = this.pipeSpeed / 3; // Background moves slower
            } catch (e) {
                console.warn("[Game] Could not update background speeds (maybe missing methods in Background class?).", e);
            }
        } else if (this.background && this.simpleMode) {
             // Ensure speeds are 0 in simple mode if background exists but shouldn't scroll
             try {
                this.background.groundSpeed = 0;
                this.background.backgroundSpeed = 0;
             } catch (e) { /* Ignore */ }
        }
     }


    /**
     * The main game loop, called recursively via requestAnimationFrame.
     * @param {number} timestamp - The current time provided by requestAnimationFrame.
     */
    gameLoop(timestamp) {
        const now = performance.now();
        const deltaTime = now - this.lastTime;
        this.lastTime = now;

        // FPS Calculation
        this.frameCount++;
        this.logTimer += deltaTime;
        if (this.logTimer >= 1000) { // Log FPS every second
            this.fps = this.frameCount;
            // console.debug(`FPS: ${this.fps}`); // Optional: Keep FPS logging if desired
            this.frameCount = 0;
            this.logTimer -= 1000;
        }

        this.update(deltaTime);
        this.render();

        // Continue the loop
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Updates the game state.
     * @param {number} deltaTime - The time elapsed since the last frame in milliseconds.
     */
    update(deltaTime) {
        // Convert deltaTime from milliseconds to seconds for physics calculations
        const dtSeconds = deltaTime / 1000;

        // --- Update Time Manager and Background Cycle (if applicable) ---
        // Do this before state-specific updates that might depend on time of day
        if (this.gameState !== 'loading' && this.gameState !== 'error' && this.timeManager && !this.simpleMode) {
            this.timeManager.update(dtSeconds);
            const timeState = this.timeManager.getTimeState();

            // Pass time state to background for visual updates
            if (this.background && typeof this.background.updateCycle === 'function') {
                try {
                    this.background.updateCycle(timeState); // Pass the whole state object
                } catch (e) {
                    console.warn("[Game Update] Error calling background.updateCycle.", e);
                }
            }
        }

        // Update effects timers regardless of state (for fade-outs)
        if (this.flashOpacity > 0) {
            this.flashOpacity -= dtSeconds / this.flashDuration;
            if (this.flashOpacity < 0) this.flashOpacity = 0;
        }
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dtSeconds;
            if (this.shakeTimer <= 0) {
                this.shakeTimer = 0;
                this.shakeOffsetX = 0;
                this.shakeOffsetY = 0;
                this.shakeIntensity = 0;
            } else {
                // Update shake offset randomly
                this.shakeOffsetX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
                this.shakeOffsetY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            }
        }

        // Update based on game state
        if (this.gameState === 'loading') {
            // Loading is handled primarily in render, nothing dynamic needed here yet.
            // Potentially update a loading animation if we add one.
        } else if (this.gameState === 'playing') {
            const timestamp = performance.now();

            // --- Periodic Logging ---
            this.updateLogCounter++;

            // Log bird state periodically (e.g., every 10 frames)
            if (this.updateLogCounter % 10 === 0 && this.bird) {
                 console.log(`[BIRD_POS] x: ${this.bird.x.toFixed(1)}, y: ${this.bird.y.toFixed(1)}, vy: ${this.bird.vy.toFixed(2)}, time: ${timestamp.toFixed(0)}ms`);
            }

            // Boundary Proximity Warnings (Check before bird update potentially moves it out of bounds)
            const proximityThreshold = 50; // Pixels near boundary to trigger warning
            if (this.bird) {
                const distToGround = this.canvas.height - (this.bird.y + this.bird.height);
                const distToCeiling = this.bird.y;

                if (distToGround < proximityThreshold && this.bird.vy > 0) { // Moving down near ground
                    console.warn(`[BIRD_WARN] Approaching ground! y: ${this.bird.y.toFixed(1)}, dist: ${distToGround.toFixed(1)}px`);
                }
                if (distToCeiling < proximityThreshold && this.bird.vy < 0) { // Moving up near ceiling
                     console.warn(`[BIRD_WARN] Approaching ceiling! y: ${this.bird.y.toFixed(1)}, dist: ${distToCeiling.toFixed(1)}px`);
                }
                 // Log exact position when hitting boundaries (handled within bird.update now)
            }
            // --- End Periodic Logging ---

            // Update background (full speed or static in simple mode), bird, and pipes
            // TimeManager and background.updateCycle are now handled earlier
            const backgroundSpeedMultiplier = this.simpleMode ? 0 : 1; // No scroll in simple mode
            if (this.background) {
                try {
                    // Determine ground height for bird collision (needs fallback if background fails)
                    const groundHeight = this.background.groundHeight !== undefined ? this.background.groundHeight : 112; // Default fallback ground height
                    this.background.update(dtSeconds, backgroundSpeedMultiplier);

                    if (this.bird) {
                        this.bird.update(dtSeconds, this.canvas.height - groundHeight);
                    }
                } catch (e) {
                     console.warn("[Game Update] Error updating background or getting ground height. Using fallback.", e);
                     const groundHeight = 112; // Fallback ground height
                     if (this.bird) {
                         this.bird.update(dtSeconds, this.canvas.height - groundHeight);
                     }
                }
            } else {
                 // Fallback if background object doesn't exist
                 const groundHeight = 112; // Fallback ground height
                 if (this.bird) {
                     this.bird.update(dtSeconds, this.canvas.height - groundHeight);
                 }
            }

            // Update bird separately if background update failed but bird exists
            // (This logic is now integrated above)

            // Update Particles (Placeholder) - Skip in simple mode
            // if (this.particleManager && !this.simpleMode) {
                // Emit flap particles (Placeholder)
                // if (this.particleManager && /* check if bird just flapped */) {
                //     this.particleManager.emit('flap', this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2, 5);
                // }
            // Misplaced brace removed from here
            if (this.pipes) {
                this.pipes.update(dtSeconds);
            }
            // Update Particles (Placeholder)
            // if (this.particleManager) this.particleManager.update(dtSeconds);

            // Update score manager animations
            if (this.scoreManager) {
                this.scoreManager.update(dtSeconds);
            }

            // Check if bird passed a pipe
            if (this.pipes && this.bird && this.scoreManager && this.pipes.checkPipePassed(this.bird)) {
                console.log(`[SCORE_EVENT] Pipe passed by bird at x=${this.bird.x.toFixed(1)}, y=${this.bird.y.toFixed(1)}. Incrementing score.`);
                this.scoreManager.incrementScore(); // ScoreManager handles sound and visual pop animation trigger

                // --- Difficulty Progression --- (Keep difficulty progression even in simple mode)
                const currentScore = this.scoreManager.getScore();
                const targetTier = Math.floor(currentScore / this.difficultyInterval);

                if (targetTier > this.difficultyTier && this.difficultyTier < this.maxDifficultyTier) {
                    this.difficultyTier = targetTier;
                    // Increase speed slightly - adjust multiplier as needed
                    this.pipeSpeed = this.basePipeSpeed * (1 + this.difficultyTier * 0.15);
                    this.pipes.speed = this.pipeSpeed;
                    this.updateBackgroundSpeeds(); // Update background to match new pipe speed
                    console.log(`[DIFFICULTY] Increased to Tier ${this.difficultyTier}. Pipe Speed: ${this.pipeSpeed.toFixed(1)}`);
                    // Optional: Decrease pipe gap or generation interval here
                    // this.pipes.gap -= 5; // Requires modification in Pipes class
                    // this.pipes.generationInterval -= 0.1; // Requires modification in Pipes class
                }
            }

            // Check for collisions
            const collisionResult = this.collisionDetector && this.collisionDetector.checkCollisions();
            if (collisionResult) { // Assuming checkCollisions returns truthy on collision (e.g., type of collision)
                this.handleCollision(collisionResult); // Centralize collision handling
            }
        } // Correct closing brace for 'playing' state inserted here
        else if (this.gameState === 'ready') {
            // Keep the background scrolling slowly
            this.background.update(dtSeconds, 0.25);
            // Make the bird bob up and down in the ready state (Skip if simple mode?) - Let's keep it for now.
            if (this.bird) {
                this.bobbingTimer += dtSeconds;
                const bobbingOffset = Math.sin(this.bobbingTimer * this.bobbingFrequency) * this.bobbingAmplitude;
                this.bird.y = this.initialBirdY + bobbingOffset;

                // Ensure bird doesn't bob below ground (use background's groundHeight or fallback)
                let groundHeight = 112; // Fallback
                try {
                    if (this.background && this.background.groundHeight !== undefined) {
                        groundHeight = this.background.groundHeight;
                    }
                } catch (e) { /* Use fallback */ }
                const groundLevel = this.canvas.height - groundHeight;

                if (this.bird.y + this.bird.height > groundLevel) {
                     this.bird.y = groundLevel - this.bird.height;
                }
                // Reset velocity and rotation for ready state
                this.bird.vy = 0;
                this.bird.rotation = 0;
            }
            // Update Particles (Placeholder) - Skip in simple mode
            // if (this.particleManager && !this.simpleMode) this.particleManager.update(dtSeconds);

        } else if (this.gameState === 'gameover') {
             // Keep background scrolling slowly (or static in simple mode)
             const backgroundSpeedMultiplier = this.simpleMode ? 0 : 0.25;
             if (this.background) {
                 try {
                    this.background.update(dtSeconds, backgroundSpeedMultiplier);
                 } catch (e) { /* Ignore error */ }
             }

             // Bird physics stop, but let it fall to the ground
             let groundHeight = 112; // Fallback
             try {
                 if (this.background && this.background.groundHeight !== undefined) {
                     groundHeight = this.background.groundHeight;
                 }
             } catch (e) { /* Use fallback */ }
             const groundLevel = this.canvas.height - groundHeight;

             if (this.bird && this.bird.y + this.bird.height < groundLevel) { // Check if bird exists and is above ground
                 // Apply gravity effect
                 this.bird.vy += this.bird.gravity * dtSeconds * 0.5; // Slower gravity effect
                 this.bird.y += this.bird.vy * dtSeconds;
                 // Check if bird hit or passed the ground level in this step
                 if (this.bird.y + this.bird.height >= groundLevel) {
                     this.bird.y = groundLevel - this.bird.height; // Place exactly on ground
                     this.bird.vy = 0; // Stop vertical movement
                     this.bird.rotation = 90 * Math.PI / 180; // Point down on ground
                     // Play 'die' sound only once when hitting ground after initial 'hit' (Skip in simple mode)
                     if (!this.playedDieSound && !this.simpleMode) {
                         this.assetLoader.playSound('die', 0.7); // AssetLoader handles simpleMode check internally
                         this.playedDieSound = true; // Flag to prevent repeated plays
                     } else if (this.simpleMode) {
                         this.playedDieSound = true; // Ensure flag is set even if sound skipped
                     }
                     // Emit ground hit particles (Placeholder) - Skip in simple mode
                     // if (this.particleManager && !this.simpleMode) {
                     //     this.particleManager.emit('ground', this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height, 10);
                     // }
                 } else {
                     // Only update rotation if bird exists
                     if (this.bird) this.bird.updateRotation(); // Update rotation while falling
                 }
             }
             // Update Particles (Placeholder) - Skip in simple mode
             // if (this.particleManager && !this.simpleMode) this.particleManager.update(dtSeconds);
        }
    }

    /**
     * Handles the consequences of a collision.
     * @param {string|object} collisionType - Information about the collision (e.g., 'pipe', 'ground').
     */
    handleCollision(collisionType) {
        if (this.gameState !== 'playing') return; // Only handle collisions if playing

        this.gameState = 'gameover';
        console.log(`[GAME_STATE] Collision detected (${collisionType})! State changed to: ${this.gameState}`);
        this.assetLoader.playSound('hit', 0.9); // Play hit sound immediately (AssetLoader handles simpleMode)
        this.playedDieSound = false; // Reset die sound flag (will play when bird hits ground, unless simpleMode)

        // Pause music on collision
        if (this.musicPlayer) {
            this.musicPlayer.pause();
            console.log("[MUSIC] Paused due to collision.");
        }

        // Trigger visual effects (Keep flash, maybe reduce/skip shake in simple mode?)
        this.flashOpacity = 1.0; // Start screen flash
        if (!this.simpleMode) {
            this.shakeIntensity = 8; // Start screen shake (adjust intensity)
            this.shakeTimer = this.shakeDuration;
        } else {
            this.shakeIntensity = 0; // No shake in simple mode
            this.shakeTimer = 0;
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
        }

        // Update and save high score
        if (this.scoreManager) {
            this.scoreManager.setHighScore(); // Plays high score sound if applicable
        }
        console.log(`[GAME_OVER] Final Score: ${this.scoreManager.getScore()}, High Score: ${this.scoreManager.highScore}`);

        // Stop pipe generation immediately (optional, but prevents pipes appearing after game over)
        // if (this.pipes) this.pipes.stopGeneration(); // Needs implementation in Pipes class
    }

    /**
     * Renders the game objects onto the canvas.
     */
    render() {
        // console.log(`Rendering game state: ${this.gameState}`);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply screen shake transformation
        this.ctx.save();
        this.ctx.translate(this.shakeOffsetX, this.shakeOffsetY);

        // --- Main Drawing Layers ---

        // Draw background (always) - Needs fallback if background fails or is missing draw method
        if (this.background) {
            try {
                this.background.draw();
            } catch (e) {
                console.warn("[Render] Error drawing background. Drawing fallback.", e);
                this.drawSimpleBackgroundFallback(); // Draw simple fallback if background.draw fails
            }
        } else {
             this.drawSimpleBackgroundFallback(); // Draw simple fallback if background object missing
        }


        // Draw Pipes (playing state) - Pipes.draw() now handles its own fallback
        if (this.pipes && this.gameState === 'playing') {
            this.pipes.draw();
        }

        // Draw Bird (ready, playing, gameover states) - Bird.draw() handles its own fallback
        if (this.bird && (this.gameState === 'ready' || this.gameState === 'playing' || this.gameState === 'gameover')) {
            this.bird.draw(this.ctx);
        }

        // Draw Particles (Placeholder) - Skip in simple mode
        // if (this.particleManager && !this.simpleMode) {
        //     this.particleManager.draw();
        // }

        // Draw Score (playing state - uses ScoreManager's draw)
        if (this.scoreManager && this.gameState === 'playing') {
            // ScoreManager needs its own fallback logic if its assets fail
            // Assuming ScoreManager.draw() handles missing assets or simpleMode gracefully
            try {
                // console.log(`[DEBUG_RENDER] Calling scoreManager.draw() in 'playing' state.`); // Optional: uncomment for intense debugging
                this.scoreManager.draw();
            } catch (e) {
                console.warn("[Render] Error drawing score. Drawing fallback.", e);
                this.drawSimpleScoreFallback(); // Draw simple fallback if scoreManager.draw fails
            }
        } else if (!this.scoreManager && this.gameState === 'playing') {
             this.drawSimpleScoreFallback(); // Draw simple fallback if scoreManager object missing
        }
        // Removed misplaced this.scoreManager.draw(); call

        // --- Restore context before drawing UI overlays ---
        this.ctx.restore(); // Remove shake effect for UI elements

        // --- UI Overlays ---

        // Draw Loading Screen / Progress
        if (this.gameState === 'loading') {
            this.drawLoadingScreen();
        }

        // Draw High Score (Ready and Playing states, top-left)
        if (this.scoreManager && (this.gameState === 'ready' || this.gameState === 'playing')) {
            try {
                this.ctx.save(); // Save context for text styling
                    this.ctx.fillStyle = "white";
                    this.ctx.strokeStyle = "black"; // Outline for visibility
                    this.ctx.lineWidth = 1;
                    this.ctx.font = "16px Arial";
                    this.ctx.textAlign = "left";
                    const highScoreText = `High: ${this.scoreManager.highScore}`;
                    this.ctx.strokeText(highScoreText, 10, 30);
                    this.ctx.fillText(highScoreText, 10, 30);
                this.ctx.restore(); // Restore context
            } catch (e) {
                 console.warn("[Render] Error drawing high score.", e);
                 // Simple text fallback for high score if ScoreManager exists but drawing fails
                 this.ctx.fillStyle = "white";
                 this.ctx.font = "16px Arial";
                 this.ctx.textAlign = "left";
                 this.ctx.fillText(`High: ${this.scoreManager.highScore}`, 10, 30);
            }
        } else if (!this.scoreManager && (this.gameState === 'ready' || this.gameState === 'playing')) {
             // Simple text fallback if ScoreManager doesn't exist
             this.ctx.fillStyle = "white";
             this.ctx.font = "16px Arial";
             this.ctx.textAlign = "left";
             this.ctx.fillText("High: 0", 10, 30); // Assume 0 if no score manager
        }

        // Draw Collision Flash Effect
        if (this.flashOpacity > 0) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashOpacity})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw State-Specific Overlays
        if (this.gameState === 'ready') {
            this.drawReadyScreen();
        } else if (this.gameState === 'gameover') {
            this.drawGameOverScreen(); // This method will handle simpleMode internally
        }
    }

    /**
     * Draws a simple fallback background (e.g., blue sky, brown ground).
     */
    drawSimpleBackgroundFallback() {
        // Simple blue sky
        this.ctx.fillStyle = '#87CEEB'; // Sky blue
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // Simple brown ground
        const groundHeight = 112; // Standard ground height
        this.ctx.fillStyle = '#8B4513'; // Saddle brown
        this.ctx.fillRect(0, this.canvas.height - groundHeight, this.canvas.width, groundHeight);
    }

    /**
     * Draws a simple fallback score display.
     */
    drawSimpleScoreFallback() {
        const score = this.scoreManager ? this.scoreManager.getScore() : 0;
        this.ctx.fillStyle = "white";
        this.ctx.font = "30px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText(score.toString(), this.canvas.width / 2, 50);
    }


     /**
      * Draws the loading screen with progress bar.
      */
     drawLoadingScreen() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const barWidth = this.canvas.width * 0.6;
        const barHeight = 20;
        const progress = this.assetLoader.getProgress();

        // Background overlay
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Loading text
        this.ctx.fillStyle = "white";
        this.ctx.font = "24px 'Courier New', Courier, monospace";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Loading Assets...", centerX, centerY - 40);

        // Progress bar background
        this.ctx.fillStyle = "#555";
        this.ctx.fillRect(centerX - barWidth / 2, centerY, barWidth, barHeight);

        // Progress bar foreground
        this.ctx.fillStyle = "#4CAF50"; // Green progress
        this.ctx.fillRect(centerX - barWidth / 2, centerY, barWidth * progress, barHeight);

        // Progress percentage text
        this.ctx.fillStyle = "white";
        this.ctx.font = "14px 'Courier New', Courier, monospace";
        this.ctx.fillText(`${Math.round(progress * 100)}%`, centerX, centerY + barHeight + 20);
     }


    /**
     * Draws the 'Ready' screen overlay (enhanced or simple).
     */
    drawReadyScreen() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        if (this.simpleMode) {
            // Simple Ready Screen
            this.ctx.fillStyle = "white";
            this.ctx.font = "bold 36px Arial";
            this.ctx.textAlign = "center";
            this.ctx.fillText("Get Ready!", centerX, centerY - 40);
            this.ctx.font = "20px Arial";
            this.ctx.fillText("Tap/Space/Click", centerX, centerY + 20);
            return;
        }

        // Enhanced Ready Screen (Original Logic)
        // Draw "Get Ready" title
        this.ctx.fillStyle = "white";
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 3;
        this.ctx.font = "bold 48px 'Courier New', Courier, monospace";
        this.ctx.textAlign = "center";
        const readyText = "Get Ready!";
        this.ctx.strokeText(readyText, centerX, centerY - 80);
        this.ctx.fillText(readyText, centerX, centerY - 80);

        // Draw animated instruction text (flashing effect)
        const instructionText = "Tap or Space to Flap";
        const flashSpeed = 1.5; // Flashes per second
        const alpha = 0.6 + Math.sin(performance.now() / 1000 * flashSpeed * Math.PI * 2) * 0.4; // Oscillate alpha between 0.6 and 1.0
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.font = "20px 'Courier New', Courier, monospace";
        this.ctx.fillText(instructionText, centerX, centerY + 20);

        // Optional: Draw a small icon/graphic (e.g., tap icon)
        // this.ctx.drawImage(this.assetLoader.getImage('tapIcon'), centerX - 20, centerY + 50, 40, 40);
    }


    /**
     * Draws the 'Game Over' screen overlay (enhanced or simple).
     */
     drawGameOverScreen() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const score = this.scoreManager ? this.scoreManager.getScore() : 0;
        const highScore = this.scoreManager ? this.scoreManager.highScore : 0;

        if (this.simpleMode || !this.scoreManager) {
            // Simple Game Over Screen
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Semi-transparent overlay
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = "white";
            this.ctx.font = "bold 36px Arial";
            this.ctx.textAlign = "center";
            this.ctx.fillText("Game Over!", centerX, centerY - 60);

            this.ctx.font = "24px Arial";
            this.ctx.fillText(`Score: ${score}`, centerX, centerY);
            this.ctx.fillText(`Best: ${highScore}`, centerX, centerY + 40);

            this.ctx.font = "18px Arial";
            this.ctx.fillText("Press 'R' to Restart", centerX, centerY + 100);
            return;
        }

        // Enhanced Game Over Screen (Original Logic - assumes scoreManager exists)
        const overlayX = this.canvas.width / 8; // Slightly wider
        const overlayY = this.canvas.height / 5; // Slightly higher
        const overlayWidth = this.canvas.width * 3 / 4;
        const overlayHeight = this.canvas.height * 3 / 5; // Taller
        let currentY = overlayY + 40;

        // Background panel (Fallback to solid color if image missing or simple mode)
        const panelImage = this.assetLoader.getImage('gameOverPanel'); // Assuming this asset exists
        if (panelImage && !this.simpleMode) { // Check simpleMode here too
            this.ctx.drawImage(panelImage, overlayX, overlayY, overlayWidth, overlayHeight);
        } else {
            this.ctx.fillStyle = "rgba(50, 30, 20, 0.85)"; // Dark wood color fallback
            this.ctx.strokeStyle = "#D4AF37"; // Gold border
            this.ctx.lineWidth = 4;
            this.ctx.fillRect(overlayX, overlayY, overlayWidth, overlayHeight);
            this.ctx.strokeRect(overlayX, overlayY, overlayWidth, overlayHeight);
        }

         // --- Text Styling ---
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        // Game Over Title
        this.ctx.font = "bold 36px 'Courier New', Courier, monospace";
        this.ctx.fillStyle = "#DC143C"; // Crimson Red
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 2;
        const gameOverText = "Game Over!";
        this.ctx.strokeText(gameOverText, centerX, currentY);
        this.ctx.fillText(gameOverText, centerX, currentY);
        currentY += 60;

        // Score Display Box
        const scoreBoxY = currentY;
        const scoreBoxHeight = 80;
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        this.ctx.fillRect(overlayX + 20, scoreBoxY, overlayWidth - 40, scoreBoxHeight);

        // Score Label & Value
        this.ctx.font = "18px 'Courier New', Courier, monospace";
        this.ctx.fillStyle = "#FFD700"; // Gold color
        this.ctx.textAlign = "left";
        this.ctx.fillText("SCORE", overlayX + 40, scoreBoxY + 25);
        this.ctx.font = "bold 28px 'Courier New', Courier, monospace";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "right";
        this.ctx.fillText(score.toString(), overlayX + overlayWidth - 40, scoreBoxY + 25);

        // High Score Label & Value (with pulse effect if new, skip pulse in simple mode)
        const pulseInfo = this.scoreManager.getPulseInfo();
        const highScoreScale = (pulseInfo.isNew && !this.simpleMode) ? pulseInfo.scale : 1.0; // No pulse in simple mode
        this.ctx.save();
        this.ctx.translate(centerX, scoreBoxY + 55); // Translate for scaling
        this.ctx.scale(highScoreScale, highScoreScale);
        this.ctx.font = "18px 'Courier New', Courier, monospace";
        // Green if new AND not simple mode, else gold
        this.ctx.fillStyle = (pulseInfo.isNew && !this.simpleMode) ? "#00FF00" : "#FFD700";
        this.ctx.textAlign = "left";
        this.ctx.fillText("BEST", - (overlayWidth / 2) + 40, 0); // Adjust position due to translation
        this.ctx.font = "bold 28px 'Courier New', Courier, monospace";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "right";
        this.ctx.fillText(highScore.toString(), (overlayWidth / 2) - 40, 0); // Adjust position
        this.ctx.restore(); // Restore scale and translation

        currentY += scoreBoxHeight + 30; // Move below score box

        // Medal Display (if earned, skip in simple mode or if image missing)
        const medal = this.scoreManager.getMedal();
        if (medal && !this.simpleMode) {
            const medalImage = this.assetLoader.getImage(`medal_${medal}`); // Assumes medal_gold.png etc. exists
            if (medalImage) { // Only draw if image exists
                 const medalSize = 50;
                 this.ctx.drawImage(medalImage, centerX - medalSize / 2, currentY - medalSize / 2, medalSize, medalSize);
                 currentY += medalSize + 10; // Add space below medal
            } else {
                // Optional: Fallback text if medal image missing (but not in simple mode)
                // this.ctx.font = "16px 'Courier New', Courier, monospace";
                // this.ctx.fillStyle = "white";
                // this.ctx.textAlign = "center";
                // this.ctx.fillText(`Medal: ${medal.toUpperCase()}`, centerX, currentY);
                // currentY += 25;
            }
        } else if (medal && this.simpleMode) {
             // Optional: Show text medal in simple mode
             this.ctx.font = "16px Arial";
             this.ctx.fillStyle = "white";
             this.ctx.textAlign = "center";
             this.ctx.fillText(`Medal: ${medal.toUpperCase()}`, centerX, currentY);
             currentY += 25;
        }
        // End of Medal Display Logic


        // Restart Instruction
        this.ctx.font = "18px 'Courier New', Courier, monospace";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Press 'R' to Restart", centerX, overlayY + overlayHeight - 30); // Position at bottom
    }

    /**
     * Starts the game initialization and loading process.
     */
    start() {
        console.log("[GAME_START] Starting game initialization and asset loading...");
        this.gameState = 'loading'; // Set initial state to loading

        // Start the game loop immediately to show the loading screen
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);

        // Asset loading is handled by the global listener at the bottom,
        // which calls game.init() and sets state to 'ready' upon completion.
    }


    /**
     * Transitions the game state from 'ready' to 'playing'.
     * Typically called on the first player input.
     */
    startGamePlay() {
        if (this.gameState === 'ready') {
            this.gameState = 'playing';
            console.log(`[GAME_STATE] State changed from 'ready' to 'playing'. Initial flap triggered.`);
            // Ensure bird has initial flap velocity when starting
            if (this.bird) {
                console.log(`[BIRD_ACTION] Initial flap at y: ${this.bird.y.toFixed(1)}`);
                this.bird.flap();
                this.assetLoader.playSound('flap', 0.7); // Play flap sound on first flap (AssetLoader handles simpleMode)
                // Trigger initial flap particles (Placeholder) - Skip in simple mode
                // if (this.particleManager && !this.simpleMode) {
                //     this.particleManager.emit('flap', this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2, 5);
                // }
            } else {
                console.error("[BIRD_ACTION] Attempted to flap, but bird object is null.");
            }
        }
    }

    /**
     * Handles player input (flap action). Called by InputHandler.
     */
    handleInput() {
        // Resume audio context on first interaction (for both assets and music)
        this.assetLoader._resumeAudioContext();
        if (this.musicPlayer) {
            this.musicPlayer.userInteraction(); // Allow music player to resume its context
        }

        if (this.gameState === 'ready') {
            this.startGamePlay(); // Transition to playing state
        } else if (this.gameState === 'playing') {
            if (this.bird) {
                this.bird.flap();
                this.assetLoader.playSound('flap', 0.7); // Play flap sound (AssetLoader handles simpleMode)
                 // Trigger flap particles (Placeholder) - Skip in simple mode
                // if (this.particleManager && !this.simpleMode) {
                //     this.particleManager.emit('flap', this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2, 5);
                // }
            }
        }
        // No action needed if gameover or loading
    }

    /**
     * Restarts the game by resetting game components.
     */
    restart() {
        console.log("[GAME_ACTION] Restart requested...");
        // Only allow restart if game is over
        if (this.gameState !== 'gameover') {
            console.warn(`[GAME_ACTION] Cannot restart: Game not in 'gameover' state. Current state: ${this.gameState}`);
            return;
        }

        // Reset bird to initial ready state
        if (this.bird) {
            this.bird.y = this.initialBirdY; // Reset position to the initial ready Y
            this.bird.vy = 0;                // Reset velocity
            this.bird.rotation = 0;
        }
        this.bobbingTimer = 0;

        // Reset pipes
        if (this.pipes) {
            this.pipes.reset();
            // Reset difficulty and speed
            this.difficultyTier = 0;
            this.pipeSpeed = this.basePipeSpeed;
            this.pipes.speed = this.pipeSpeed;
            this.updateBackgroundSpeeds();
            // Optional: Reset gap/interval if modified
            // this.pipes.gap = INITIAL_GAP;
            // this.pipes.generationInterval = INITIAL_INTERVAL;
        }

        // Reset score manager
        if (this.scoreManager) {
            this.scoreManager.reset();
        }

        // Reset effects
        this.flashOpacity = 0;
        this.shakeTimer = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
        this.shakeIntensity = 0;

        // Reset Particles (Placeholder) - Skip in simple mode
        // if (this.particleManager && !this.simpleMode) this.particleManager.reset();

        // Reset Day/Night Cycle
        if (this.timeManager) {
            this.timeManager.reset();
            // Update background immediately to day state if applicable
            if (this.background && typeof this.background.updateCycle === 'function' && !this.simpleMode) {
                 this.background.updateCycle(this.timeManager.getTimeState());
            }
        }

        // Reset game state
        this.gameState = 'ready';
        console.log(`[GAME_STATE] Game restarted! State set to '${this.gameState}'. Pipe Speed: ${this.pipeSpeed}. Simple Mode: ${this.simpleMode}`);
        // Optional: Play a restart sound (Skip in simple mode)
        this.assetLoader.playSound('start', 0.6); // AssetLoader handles simpleMode check

        // Resume music if it exists and was playing
        if (this.musicPlayer) {
            this.musicPlayer.play(); // Restart music playback
            console.log("[MUSIC] Resumed on game restart.");
        }
    }

    /**
     * Toggles the mute state of the background music.
     */
    toggleMusic() {
        if (this.musicPlayer) {
            this.musicPlayer.toggleMute();
            console.log(`[MUSIC] Toggled mute. Muted: ${this.musicPlayer.isMuted}`);
        } else {
            console.warn("[MUSIC] Cannot toggle mute: MusicPlayer not initialized.");
        }
    }
    // dumpGameState method removed
}

// Wait for the DOM to be fully loaded before starting the game
window.addEventListener('load', () => {
    console.log("[LOAD] DOM fully loaded. Initializing AssetLoader...");

    const FORCE_SIMPLE_MODE = window.location.search.includes('simple=true');
    const LOADING_TIMEOUT_MS = 5000; // 5 seconds timeout for asset loading

    const assetLoader = new AssetLoader(); // Create loader instance
    const game = new Game(assetLoader); // Create game instance immediately
    let loadingTimedOut = false;
    let assetsLoadedSuccessfully = false;
    let loadingErrorOccurred = false;

    // Make game instance globally accessible
    window.flappyGame = game;
    console.log("[LOAD] Flappy Bird game instance created. Access with 'window.flappyGame'.");

    if (FORCE_SIMPLE_MODE) {
        console.warn("[LOAD] Forcing Simple Mode via URL parameter.");
        game.forceSimpleMode(); // Force simple mode in game and asset loader
    }

    // Start the game loop immediately (shows loading screen or simple screen)
    game.start();

    // --- Loading Completion Logic ---
    const finalizeGameLoad = () => {
        // Ensure this only runs once
        if (game.gameState === 'ready' || game.gameState === 'error') return;

        console.log("[LOAD] Finalizing game load...");
        const loadingOverlay = document.getElementById('loading-overlay');

        if (loadingTimedOut || loadingErrorOccurred) {
            console.warn(`[LOAD] Starting in Simple Mode due to ${loadingTimedOut ? 'timeout' : 'asset error'}.`);
            game.forceSimpleMode();
        }

        if (game.ctx) {
            try {
                game.init(); // Initialize all game components (bird, pipes, etc.) - Handles simple mode internally
                game.gameState = 'ready'; // Set state to ready
                console.log(`[LOAD] Game initialized. State: ${game.gameState}. Simple Mode: ${game.simpleMode}`);

                // Start background music if available and not in simple mode
                if (game.musicPlayer && !game.simpleMode) {
                    game.musicPlayer.play();
                    console.log("[LOAD] Background music started.");
                } else if (game.musicPlayer && game.simpleMode) {
                    console.log("[LOAD] Background music available but disabled in Simple Mode.");
                }

            } catch (initError) {
                 console.error("[LOAD] CRITICAL: Error during game.init(). Game may be unplayable.", initError);
                 game.gameState = 'error';
                 if (loadingOverlay) {
                    loadingOverlay.innerHTML = '<p class="error-message">Critical error during game init. Please refresh.</p>';
                 }
                 return; // Stop further processing
            }

            // Hide the loading overlay
            if (loadingOverlay) {
                // Use timeout to ensure rendering happens before hiding
                setTimeout(() => {
                    loadingOverlay.classList.add('hidden');
                    console.log("[LOAD] Loading overlay hidden.");
                }, 100); // Small delay
            } else {
                console.warn("[LOAD] Loading overlay element not found.");
            }
        } else {
            console.error("[LOAD] Game context (ctx) not found. Cannot initialize components.");
            game.gameState = 'error'; // Set an error state
            if (loadingOverlay) {
                loadingOverlay.innerHTML = '<p class="error-message">Error initializing game graphics. Please refresh.</p>';
            }
        }
    };

    // --- Asset Loading Callbacks ---
    const onAssetsLoaded = () => {
        clearTimeout(loadingTimeoutId); // Clear the timeout
        if (loadingTimedOut) return; // Don't proceed if already timed out
        console.log("[LOAD] AssetLoader reported successful load.");
        assetsLoadedSuccessfully = true;
        finalizeGameLoad();
    };

    const onAssetsError = (error) => {
        clearTimeout(loadingTimeoutId); // Clear the timeout
        if (loadingTimedOut) return; // Don't proceed if already timed out
        console.error("[LOAD] AssetLoader reported an error:", error);
        loadingErrorOccurred = true;
        // Still proceed to finalize load, but simple mode will be forced
        finalizeGameLoad();
    };

    // --- Loading Timeout ---
    const loadingTimeoutId = setTimeout(() => {
        if (assetsLoadedSuccessfully || loadingErrorOccurred) return; // Don't run if loading already finished/failed
        console.warn(`[LOAD] Asset loading timed out after ${LOADING_TIMEOUT_MS}ms.`);
        loadingTimedOut = true;
        finalizeGameLoad(); // Force finalize load in simple mode
    }, LOADING_TIMEOUT_MS);

    // --- Start Loading ---
    console.log("[LOAD] Starting asset load via assetLoader.loadAll()...");
    // Don't load assets if simple mode was forced via URL
    if (!FORCE_SIMPLE_MODE) {
        assetLoader.loadAll(onAssetsLoaded, onAssetsError);
    } else {
        // If simple mode forced, skip loadAll and go straight to finalize
        console.log("[LOAD] Skipping asset load due to forced simple mode.");
        // Need to ensure the flow completes as if loaded, but in simple mode
        assetsLoadedSuccessfully = true; // Mark as "success" to trigger finalize
        finalizeGameLoad();
    }
});
