/**
 * Handles loading and management of game assets (images, sounds).
 */
class AssetLoader {
    /**
     * Initializes the AssetLoader.
     */
    constructor() {
        this.images = {}; // Store loaded Image objects
        this.sounds = {}; // Store loaded Audio objects
        this._promises = []; // Store promises for loading assets
        this._assetsToLoad = 0; // Total number of assets queued
        this._assetsLoaded = 0; // Number of assets successfully loaded
        this.simpleMode = false; // Flag for fallback rendering

        // --- Predefined SVG Assets ---
        this.predefinedAssets = {
            images: [
                { name: 'bird', src: this._createBirdSvgDataUrl() },
                { name: 'pipeNorth', src: this._createPipeSvgDataUrl(true) }, // Top pipe
                { name: 'pipeSouth', src: this._createPipeSvgDataUrl(false) },// Bottom pipe
                { name: 'background', src: this._createBackgroundSvgDataUrl() },
                { name: 'ground', src: this._createGroundSvgDataUrl() }
            ],
            sounds: [
                // Using base64 encoded WAV data URLs for simplicity
                { name: 'flap', src: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA' }, // Short click/swoosh
                { name: 'score', src: 'data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhEgAAAAEA////AAAAAP///wAAAAAAAP////AAAAAAAP///w==' }, // Simple ding
                { name: 'hit', src: 'data:audio/wav;base64,UklGRjwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhJAAAAAEAAQACAAIAAwADAAQABAAEAAUABQAFAAYABgAGAAcABw=' }, // Dull thud
                { name: 'die', src: 'data:audio/wav;base64,UklGRkAAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhHAAAAAEACgAPABQAGgAfACQAKQAwADUAPgBDAEgATQBSAFc=' }, // Falling tone
                { name: 'start', src: 'data:audio/wav;base64,UklGRkAAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhHAAAAAEAEwAYAB0AIgAnACwAMgA3ADwAQwBIAE0AUgBXAFo=' } // Rising tone
            ]
        };

        // Automatically queue predefined assets for loading
        this._queuePredefinedAssets();
        this.audioContext = null; // Initialize AudioContext reference
        this.masterGainNode = null; // Initialize Master Gain Node
        this._initAudioContext(); // Attempt to initialize AudioContext on load
    }

    /**
     * Enables simple mode, preventing sound playback and potentially skipping asset loads.
     */
    enableSimpleMode() {
        this.simpleMode = true;
        console.warn("[AssetLoader] Simple mode enabled. Sounds will be disabled and fallback graphics may be used.");
        // Optionally, cancel any ongoing loading promises if possible/needed,
        // but current setup loads quickly, so just preventing playback might suffice.
    }

    /**
     * Queues the predefined assets for loading.
     * Called internally by the constructor.
     */
    _queuePredefinedAssets() {
        this.predefinedAssets.images.forEach(img => this.loadImage(img.name, img.src));
        this.predefinedAssets.sounds.forEach(snd => this.loadSound(snd.name, snd.src));
        console.log(`[AssetLoader] Queued ${this.predefinedAssets.images.length} images and ${this.predefinedAssets.sounds.length} sounds for loading.`);
    }


    // --- SVG Generation Methods ---

    /**
     * Creates an SVG data URL for the bird.
     * @returns {string} SVG data URL.
     */
    _createBirdSvgDataUrl() {
        // Simple yellow bird (approx 34x24)
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 24" width="34" height="24">
            <defs>
                <linearGradient id="birdGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#FFEB3B;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#FBC02D;stop-opacity:1" />
                </linearGradient>
            </defs>
            <!-- Body -->
            <ellipse cx="17" cy="12" rx="15" ry="10" fill="url(#birdGradient)" stroke="#D4AF37" stroke-width="1"/>
            <!-- Wing -->
            <path d="M 10 12 Q 17 8 24 12 Q 17 16 10 12 Z" fill="#FFF176" stroke="#E0C040" stroke-width="0.5"/>
            <!-- Eye -->
            <circle cx="24" cy="9" r="2" fill="black"/>
            <circle cx="24.5" cy="8.5" r="0.7" fill="white"/> <!-- Eye highlight -->
            <!-- Beak -->
            <polygon points="31,11 36,13 31,15" fill="#FFA726" stroke="#E65100" stroke-width="0.5"/>
        </svg>`;
        return this._svgToDataUrl(svg);
    }

    /**
     * Creates an SVG data URL for a pipe segment.
     * @param {boolean} isNorth - True for the top pipe (opening down), false for bottom (opening up).
     * @returns {string} SVG data URL.
     */
    _createPipeSvgDataUrl(isNorth) {
        // Green pipe segment (52px wide, 320px tall - can be clipped)
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 320" width="52" height="320" preserveAspectRatio="none">
            <defs>
                <linearGradient id="pipeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#558B2F;stop-opacity:1" />
                    <stop offset="20%" style="stop-color:#7CB342;stop-opacity:1" />
                    <stop offset="80%" style="stop-color:#7CB342;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#558B2F;stop-opacity:1" />
                </linearGradient>
                <linearGradient id="pipeCapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
                    <stop offset="20%" style="stop-color:#8BC34A;stop-opacity:1" />
                    <stop offset="80%" style="stop-color:#8BC34A;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#4CAF50;stop-opacity:1" />
                </linearGradient>
            </defs>
            <!-- Pipe Body -->
            <rect x="2" y="${isNorth ? 20 : 0}" width="48" height="${isNorth ? 300 : 300}" fill="url(#pipeGradient)" stroke="#33691E" stroke-width="1"/>
            <!-- Pipe Cap -->
            <rect x="0" y="${isNorth ? 0 : 300}" width="52" height="20" fill="url(#pipeCapGradient)" stroke="#33691E" stroke-width="1"/>
            <rect x="3" y="${isNorth ? 1 : 301}" width="46" height="18" fill="none" stroke="#9CCC65" stroke-width="1.5" rx="2" ry="2"/> <!-- Inner highlight -->
        </svg>`;
        return this._svgToDataUrl(svg);
    }

    /**
     * Creates an SVG data URL for the background.
     * @returns {string} SVG data URL.
     */
    _createBackgroundSvgDataUrl() {
        // Sky blue background with clouds (288x512)
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 288 512" width="288" height="512" preserveAspectRatio="none">
            <defs>
                <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#81D4FA;stop-opacity:1" />  <!-- Light Sky Blue -->
                    <stop offset="100%" style="stop-color:#29B6F6;stop-opacity:1" /> <!-- Deeper Sky Blue -->
                </linearGradient>
                <filter id="cloudBlur">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
                </filter>
            </defs>
            <!-- Sky -->
            <rect width="100%" height="100%" fill="url(#skyGradient)" />
            <!-- Clouds (simple shapes) -->
            <g fill="white" opacity="0.9" filter="url(#cloudBlur)">
                <ellipse cx="60" cy="100" rx="40" ry="20" />
                <ellipse cx="90" cy="110" rx="50" ry="25" />
                <ellipse cx="130" cy="105" rx="45" ry="20" />

                <ellipse cx="200" cy="200" rx="50" ry="25" />
                <ellipse cx="240" cy="215" rx="60" ry="30" />
                <ellipse cx="180" cy="210" rx="40" ry="20" />

                <ellipse cx="100" cy="350" rx="35" ry="18" />
                <ellipse cx="140" cy="360" rx="45" ry="22" />
            </g>
        </svg>`;
        return this._svgToDataUrl(svg);
    }

    /**
     * Creates an SVG data URL for the ground.
     * @returns {string} SVG data URL.
     */
    _createGroundSvgDataUrl() {
        // Textured ground (288 wide, 112 high - typical Flappy Bird ground height)
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 288 112" width="288" height="112" preserveAspectRatio="none">
            <defs>
                <!-- Base ground color -->
                <linearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#A1887F;stop-opacity:1" /> <!-- Brownish top -->
                    <stop offset="100%" style="stop-color:#795548;stop-opacity:1" /> <!-- Darker Brown bottom -->
                </linearGradient>
                <!-- Grass pattern -->
                <pattern id="grassPattern" patternUnits="userSpaceOnUse" width="20" height="10" viewBox="0 0 20 10">
                    <path d="M0 10 V 5 Q 5 0 10 5 V 10 Z" fill="#8BC34A" opacity="0.7"/>
                    <path d="M10 10 V 5 Q 15 0 20 5 V 10 Z" fill="#7CB342" opacity="0.7"/>
                </pattern>
                 <!-- Dirt texture pattern -->
                <pattern id="dirtTexture" patternUnits="userSpaceOnUse" width="10" height="10">
                    <rect width="10" height="10" fill="#A1887F"/>
                    <circle cx="2" cy="2" r="1" fill="#8D6E63" opacity="0.3"/>
                    <circle cx="7" cy="5" r="1.2" fill="#8D6E63" opacity="0.3"/>
                    <circle cx="5" cy="8" r="0.8" fill="#8D6E63" opacity="0.3"/>
                </pattern>
            </defs>
            <!-- Base ground -->
            <rect width="100%" height="100%" fill="url(#groundGradient)" />
            <!-- Dirt Texture Overlay -->
            <rect width="100%" height="100%" fill="url(#dirtTexture)" opacity="0.5"/>
            <!-- Top grass layer -->
            <rect width="100%" height="15" fill="url(#grassPattern)" />
            <!-- Grass edge highlight -->
            <line x1="0" y1="1" x2="288" y2="1" stroke="#9CCC65" stroke-width="2"/>
        </svg>`;
        return this._svgToDataUrl(svg);
    }

    /**
     * Converts an SVG string to a data URL.
     * Uses encodeURIComponent for better compatibility than btoa.
     * @param {string} svgString - The raw SVG markup.
     * @returns {string} The data URL string.
     */
    _svgToDataUrl(svgString) {
        // Trim whitespace for cleaner output
        const cleanedSvg = svgString.trim().replace(/\s+/g, ' ');
        return `data:image/svg+xml;utf8,${encodeURIComponent(cleanedSvg)}`;
    }

    /**
     * Attempts to initialize the Web Audio API AudioContext.
     * This should ideally be triggered by a user interaction.
     */
    _initAudioContext() {
        try {
            // Check if context already exists or if the API is unavailable
            if (this.audioContext || !(window.AudioContext || window.webkitAudioContext)) {
                if (!this.audioContext) console.warn("Web Audio API not supported in this browser.");
                return;
            }
            // Create AudioContext
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create a Master Gain Node for volume control
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = 1.0; // Default volume (0.0 to 1.0+)
            this.masterGainNode.connect(this.audioContext.destination); // Connect gain node to output

            console.log("[AssetLoader] AudioContext initialized successfully.");

            // Resume context if it's suspended (required by some browsers after user interaction)
            this._resumeAudioContext();

        } catch (e) {
            console.error("Error initializing AudioContext:", e);
            this.audioContext = null; // Ensure context is null if init failed
            this.masterGainNode = null;
        }
    }

     /**
     * Resumes the AudioContext if it's in a suspended state.
     * Needs to be called after a user interaction (like a click or keypress).
     */
    _resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log("AudioContext resumed successfully.");
            }).catch(e => {
                console.error("Error resuming AudioContext:", e);
            });
        }
    }


    /**
     * Starts loading an image asset.
     * @param {string} name - The key to store and retrieve the image.
     * @param {string} src - The path to the image file.
     */
    loadImage(name, src) {
        this._assetsToLoad++;
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[name] = img;
                this._assetsLoaded++;
                console.log(`Image loaded: ${name} (${src})`);
                resolve(img);
            };
            img.onerror = (err) => {
                console.error(`Failed to load image: ${name} (${src})`, err);
                reject(err); // Reject the promise on error
            };
            img.src = src;
        });
        this._promises.push(promise);
    }

    /**
     * Starts loading a sound asset.
     * @param {string} name - The key to store and retrieve the sound.
     * @param {string} src - The path to the sound file.
     */
    loadSound(name, src) {
        this._assetsToLoad++;
        const promise = new Promise((resolve, reject) => {
            const audio = new Audio();
            // 'canplaythrough' is a good event, but 'loadeddata' might fire sooner
            // and is often sufficient for knowing the sound can start playing.
            audio.onloadeddata = () => {
                this.sounds[name] = audio;
                this._assetsLoaded++;
                console.log(`Sound loaded: ${name} (${src})`);
                resolve(audio);
            };
            audio.onerror = (err) => {
                console.error(`Failed to load sound: ${name} (${src})`, err);
                reject(err); // Reject the promise on error
            };
            audio.src = src;
        });
        this._promises.push(promise);
    }

    /**
     * Retrieves a previously loaded image asset.
     * @param {string} name - The key of the image asset.
     * @returns {Image|null} The Image object or null if not found.
     */
    getImage(name) {
        return this.images[name] || null;
    }

    /**
     * Retrieves a previously loaded sound asset.
     * @param {string} name - The key of the sound asset.
     * @returns {Audio|null} The Audio object or null if not found.
     */
    getSound(name) {
        return this.sounds[name] || null;
    }

    /**
     * Plays a loaded sound asset.
     * Ensures the AudioContext is resumed (requires prior user interaction).
     * @param {string} name - The key of the sound asset to play.
     * @param {number} [volume=1.0] - Optional volume multiplier (0.0 to 1.0+).
     */
    playSound(name, volume = 1.0) {
        if (this.simpleMode) {
            // console.log(`[AssetLoader] Sound '${name}' skipped (Simple Mode).`);
            return; // Don't play sounds in simple mode
        }

        // Ensure AudioContext is initialized and resumed (important for browsers)
        this._initAudioContext(); // Try to init if not already
        this._resumeAudioContext(); // Try to resume if suspended

        const sound = this.getSound(name);
        if (!sound) {
            console.warn(`Sound not found: ${name}`);
            return;
        }

        if (this.audioContext && this.masterGainNode) {
            // Use Web Audio API for better control if available
            try {
                // Create a buffer source node
                const source = this.audioContext.createBufferSource();

                // Check if the sound has an associated AudioBuffer (loaded via Web Audio)
                // If not, we might need to decode it first (more complex setup)
                // For simplicity with <audio> elements loaded via src:
                // We can create a MediaElementAudioSourceNode, but it's often easier
                // to just use the <audio> element's play() method directly for simple cases.

                // Fallback/Simpler method: Use the HTMLAudioElement directly
                sound.volume = this.masterGainNode.gain.value * volume; // Apply master gain * specific volume
                sound.currentTime = 0; // Rewind to start
                sound.play().catch(e => {
                    // Playback can fail if triggered without user interaction, etc.
                    // The _resumeAudioContext call helps, but isn't foolproof.
                    if (e.name === 'NotAllowedError') {
                        console.warn(`Playback prevented for '${name}'. User interaction likely required first.`);
                    } else {
                        console.error(`Error playing sound '${name}':`, e);
                    }
                });

            } catch (e) {
                console.error(`Error setting up Web Audio playback for '${name}':`, e);
                // Fallback to basic HTMLAudioElement play if Web Audio setup fails
                sound.volume = volume; // Basic volume control
                sound.currentTime = 0;
                sound.play().catch(e => console.error(`Error playing sound '${name}' (fallback):`, e));
            }
        } else {
            // Fallback if Web Audio API is not available or failed to initialize
            sound.volume = volume; // Basic volume control
            sound.currentTime = 0; // Rewind to the beginning
            sound.play().catch(e => console.error(`Error playing sound '${name}' (no AudioContext):`, e));
        }
    }


    /**
     * Initiates the loading process for all queued assets.
     * @param {function} callback - The function to call when all assets are loaded successfully.
     * @param {function} [errorCallback] - Optional function to call if any asset fails to load.
     */
    loadAll(callback, errorCallback) {
        if (this._promises.length === 0) {
            console.log("No assets queued for loading.");
            if (callback) callback();
            return;
        }

        console.log(`Starting loading of ${this._assetsToLoad} assets...`);

        Promise.all(this._promises)
            .then(() => {
                console.log(`All ${this._assetsLoaded} assets loaded successfully.`);
                if (callback) {
                    callback();
                }
            })
            .catch((error) => {
                console.error("Error loading one or more assets:", error);
                if (errorCallback) {
                    errorCallback(error);
                }
            });
    }

    /**
     * Gets the loading progress as a fraction (0 to 1).
     * @returns {number} Loading progress.
     */
    getProgress() {
        if (this._assetsToLoad === 0) return 1; // Avoid division by zero
        return this._assetsLoaded / this._assetsToLoad;
    }
}

// --- Global Instance ---
// Example of how you might instantiate and use it in your main game file (e.g., game.js):
/*
window.addEventListener('load', () => {
    const assetLoader = new AssetLoader();

    assetLoader.loadAll(() => {
        console.log("Assets ready! Initializing game...");
        // Now that assets are loaded, you can pass them to the game or components
        const game = new Game(assetLoader); // Pass loader or specific assets
        if (game.ctx) {
            window.flappyGame = game;
            game.start();
        } else {
            console.error("[GAME_INIT] Failed to initialize game context. Game cannot start.");
        }
    }, (error) => {
        console.error("Failed to load assets. Cannot start game.", error);
        // Display an error message to the user on the page
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'red';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Error loading assets. Please refresh.', canvas.width / 2, canvas.height / 2);
        }
    });
});
*/

// --- Asset Definitions (Commented out as they are now internal) ---
// const assetsToLoad = {
//     images: [
//         // SVGs are now generated internally
//         { name: 'bird', src: 'assets/images/bird.png' },
//         { name: 'background', src: 'assets/images/background.png' },
//         { name: 'pipeNorth', src: 'assets/images/pipeNorth.png' },
//         { name: 'pipeSouth', src: 'assets/images/pipeSouth.png' },
//         { name: 'ground', src: 'assets/images/ground.png' }
//     ],
//     sounds: [
//         { name: 'flap', src: 'assets/sounds/flap.wav' },
//         { name: 'score', src: 'assets/sounds/score.wav' },
//         { name: 'hit', src: 'assets/sounds/hit.wav' }
//     ],
//     sounds: [
//         // { name: 'flap', src: 'assets/sounds/flap.wav' },
//         // { name: 'score', src: 'assets/sounds/score.wav' },
//         // { name: 'hit', src: 'assets/sounds/hit.wav' }
//     ]
// };

// Make the AssetLoader class globally available
// Note: The instantiation and loading logic should ideally happen within your main game script (e.g., game.js)
// as shown in the example comment block above.
window.AssetLoader = AssetLoader;
