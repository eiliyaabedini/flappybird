/**
 * MusicPlayer Class
 *
 * Uses the Web Audio API to generate and play simple, looping background music
 * without requiring external audio files.
 */
class MusicPlayer {
    /**
     * Initializes the AudioContext and gain node for volume control.
     */
    constructor() {
        try {
            // Standard AudioContext or vendor-prefixed version
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Attempt to resume context immediately in case it starts suspended
            this._resumeContextIfNeeded();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
            this.audioContext = null; // Indicate failure
            // Prevent further initialization if context fails
            document.body.dispatchEvent(new CustomEvent('musicPlayerFailed')); // Notify game potentially
            return;
        }

        // Main volume control node
        this.mainGain = this.audioContext.createGain();
        // Delay node for reverb/echo effect
        this.delayNode = this.audioContext.createDelay(1.0); // Max delay time 1 second
        this.feedbackGain = this.audioContext.createGain();
        this.wetGain = this.audioContext.createGain();

        // Routing: Main Gain -> Destination (Dry)
        //         Main Gain -> Delay -> Feedback -> Delay (Feedback loop)
        //         Delay -> Wet Gain -> Destination (Wet)
        this.mainGain.connect(this.audioContext.destination); // Dry path
        this.mainGain.connect(this.delayNode);                // Send to delay
        this.delayNode.connect(this.feedbackGain);
        this.feedbackGain.connect(this.delayNode);            // Feedback loop
        this.delayNode.connect(this.wetGain);
        this.wetGain.connect(this.audioContext.destination);  // Wet path to output

        // State variables
        this.isPlaying = false;
        this.isMuted = false;
        this._currentVolume = 0.25; // Start at a lower volume
        this.mainGain.gain.setValueAtTime(this._currentVolume, this.audioContext.currentTime);

        // --- Lavender Town Inspired Music Composition ---
        this.tempo = 95; // Slower, eerie tempo
        // Use eighth notes for the main melody feel
        this.noteDuration = (60 / this.tempo) * 0.5; // Duration of each note (8th note)

        // Lavender Town main melody notes
        this.melody = [
            'B5', 'D6', 'E6', 'F#6', 'E6', 'D6', 'B5', 'C6',
            'F#6', 'E6', 'D6', 'E6', 'B5', null, null, null // Added rests for pacing
        ];
        // Pre-calculate frequencies for melody
        this.noteFrequencies = this.melody.map(note => note ? this._noteToFreq(note) : null);

        // Harmony parameters
        this.harmonyOffset = this.noteDuration / 3; // Slight delay for harmony
        this.harmonyGain = 0.4; // Harmony volume relative to melody (0.8)

        // Delay/Reverb parameters (Reduced for a drier, more unsettling sound)
        this.delayNode.delayTime.setValueAtTime(this.noteDuration * 0.75, this.audioContext.currentTime); // Shorter delay
        this.feedbackGain.gain.setValueAtTime(0.15, this.audioContext.currentTime); // Lower feedback
        this.wetGain.gain.setValueAtTime(0.1, this.audioContext.currentTime); // Lower wet signal (less reverb)

        // Scheduler parameters
        this.scheduleAheadTime = 0.1; // How far ahead to schedule notes (in seconds)
        this.nextNoteTime = 0.0;      // Time when the next note should start playing
        this.currentNoteIndex = 0;    // Index of the next note in the melody array
        this.schedulerInterval = null;// ID of the setInterval used for scheduling
        // Oscillator types and detune will be handled in _scheduleNote
    }

    /**
     * Resumes the AudioContext if it's in a suspended state.
     * This is often required after user interaction.
     * @private
     */
    _resumeContextIfNeeded() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log("AudioContext resumed successfully by MusicPlayer.");
            }).catch(e => console.error("MusicPlayer: Error resuming AudioContext:", e));
        }
    }

    /**
     * Converts a musical note name (e.g., "C4", "F#5") to its frequency in Hz.
     * @param {string} note - The note name.
     * @returns {number|null} The frequency in Hz, or null if the note name is invalid.
     * @private
     */
    _noteToFreq(note) {
        if (!note) return null;
        const A4 = 440; // Standard pitch A4 = 440 Hz
        // Defines the notes in an octave. Case-insensitive matching.
        const notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
        const noteUpper = note.toUpperCase();
        const octave = parseInt(noteUpper.slice(-1)); // Get the octave number
        // Get the note name part (e.g., "C#")
        const keyName = noteUpper.slice(0, noteUpper.search(/\d/));
        const keyNumber = notes.indexOf(keyName);

        // Basic validation
        if (keyNumber < 0 || isNaN(octave)) {
            console.warn(`Invalid note format: ${note}`);
            return null;
        }

        // Calculate the number of half-steps away from A4
        const halfStepsFromA4 = (octave - 4) * 12 + (keyNumber - notes.indexOf('A'));
        return A4 * Math.pow(2, halfStepsFromA4 / 12);
    }

    /**
     * Schedules a single note to be played at a specific time.
     * Creates an OscillatorNode and a GainNode for a simple ADSR envelope.
     * @param {number} startTime - The absolute time (from audioContext.currentTime) when the note should start.
     * @param {number|null} frequency - The frequency of the note in Hz, or null for a rest.
     * @param {number} gainValue - The peak gain for this note (0.0 to 1.0).
     * @private
     */
    _scheduleNote(startTime, frequency, gainValue) {
        // Don't schedule if context failed or if it's a rest (frequency is null)
        if (!this.audioContext || frequency === null) return;

        // --- Create ONE oscillator for a cleaner, sine-wave sound ---
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine'; // Use sine wave for the thin, eerie sound
        osc.frequency.setValueAtTime(frequency, startTime);

        // --- Create a GainNode for the note's envelope ---
        const noteGain = this.audioContext.createGain();
        // Envelope: Very fast attack, decay matching note duration for a slightly abrupt feel
        const attackTime = 0.005; // Very quick attack
        const decayTime = this.noteDuration * 0.9; // Decay slightly shorter than note duration
        noteGain.gain.setValueAtTime(0, startTime);
        noteGain.gain.linearRampToValueAtTime(gainValue, startTime + attackTime); // Attack to target volume
        noteGain.gain.linearRampToValueAtTime(0.0, startTime + attackTime + decayTime); // Decay to silence

        // --- Connect nodes ---
        // Oscillator -> Note Gain -> Main Gain (which feeds dry output and delay/wet output)
        osc.connect(noteGain);
        noteGain.connect(this.mainGain);

        // --- Start and Stop Oscillator ---
        const stopTime = startTime + attackTime + decayTime + 0.05; // Stop shortly after fade out
        osc.start(startTime);
        osc.stop(stopTime);
    }

    /**
     * The core scheduling loop. Runs periodically via setInterval.
     * Checks the current audio time and schedules upcoming notes.
     * @private
     */
    _scheduler() {
        if (!this.audioContext || !this.isPlaying) return; // Stop if paused or context failed

        // Check how far ahead we need to schedule notes
        const lookaheadTime = this.audioContext.currentTime + this.scheduleAheadTime;

        // Keep scheduling notes as long as their start time is within the lookahead window
        while (this.nextNoteTime < lookaheadTime) {
            // --- Schedule Melody Note ---
            const melodyFreq = this.noteFrequencies[this.currentNoteIndex];
            // Schedule the melody note with full gain (0.8)
            this._scheduleNote(this.nextNoteTime, melodyFreq, 0.8);

            // --- Schedule Harmony Note (Octave Lower) ---
            if (melodyFreq !== null) { // Only play harmony if melody note exists
                const harmonyFreq = melodyFreq / 2; // One octave lower
                const harmonyStartTime = this.nextNoteTime + this.harmonyOffset;
                // Schedule the harmony note with reduced gain and slight offset
                this._scheduleNote(harmonyStartTime, harmonyFreq, this.harmonyGain);
            }

            // Advance the time for the next note block
            this.nextNoteTime += this.noteDuration;
            // Move to the next note index, looping back to 0 if at the end of the melody
            this.currentNoteIndex = (this.currentNoteIndex + 1) % this.melody.length;
        }
    }

    /**
     * Starts playing the background music loop.
     * Resets the melody position and starts the scheduling interval.
     */
    play() {
        // Do nothing if context failed or already playing
        if (!this.audioContext || this.isPlaying) {
            return;
        }
        // Ensure the audio context is running (important for user interaction policies)
        this._resumeContextIfNeeded();

        this.isPlaying = true;
        this.currentNoteIndex = 0; // Start melody from the beginning
        // Schedule the first note slightly ahead to avoid initial delay issues
        this.nextNoteTime = this.audioContext.currentTime + 0.05;

        // Start the periodic scheduler function (checks every 50ms)
        // Store the interval ID so we can clear it later on pause/stop
        this.schedulerInterval = setInterval(() => this._scheduler(), 50);
        console.log("MusicPlayer: Playback started.");
    }

    /**
     * Pauses the background music loop.
     * Stops the scheduling interval. Currently playing notes will finish naturally.
     */
    pause() {
        // Do nothing if context failed or not playing
        if (!this.audioContext || !this.isPlaying) {
            return;
        }
        this.isPlaying = false;
        // Stop the scheduler interval
        clearInterval(this.schedulerInterval);
        this.schedulerInterval = null;

        // Note: This doesn't immediately silence already scheduled notes.
        // For instant silence, you'd need to disconnect the mainGain or track/stop oscillators.
        // Stopping the scheduler is usually sufficient for background music pausing.
        console.log("MusicPlayer: Playback paused.");
    }

    /**
     * Sets the volume of the music.
     * @param {number} volume - The desired volume level (0.0 to 1.0).
     */
    setVolume(volume) {
        if (!this.audioContext) return;
        // Clamp the volume value between 0 and 1
        const newVolume = Math.max(0, Math.min(1, volume));
        this._currentVolume = newVolume;

        // Only change the gain node's value if not currently muted
        if (!this.isMuted) {
            // Use linearRamp for a smooth volume transition over 0.1 seconds
            this.mainGain.gain.linearRampToValueAtTime(
                this._currentVolume,
                this.audioContext.currentTime + 0.1
            );
        }
        console.log(`MusicPlayer: Volume set to ${this._currentVolume.toFixed(2)}`);
    }

    /**
     * Toggles the mute state of the music.
     */
    toggleMute() {
        if (!this.audioContext) return;
        this.isMuted = !this.isMuted;

        if (this.isMuted) {
            // Fade out to 0 volume when muting
            this.mainGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
            console.log("MusicPlayer: Muted.");
        } else {
            // Restore the volume level when unmuting
            this.mainGain.gain.linearRampToValueAtTime(this._currentVolume, this.audioContext.currentTime + 0.1);
            console.log("MusicPlayer: Unmuted.");
        }
    }

    /**
     * Call this method in response to a user interaction (like a click or keypress)
     * to ensure the AudioContext is allowed to start or resume.
     */
    userInteraction() {
        this._resumeContextIfNeeded();
    }
}

// Make the MusicPlayer class globally accessible
window.MusicPlayer = MusicPlayer;

console.log("MusicPlayer class loaded and attached to window.MusicPlayer");

// Optional: Notify that the player is ready (or failed)
document.body.dispatchEvent(new CustomEvent('musicPlayerReady'));
