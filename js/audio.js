/**
 * Audio System — Invisible Maze
 * Spatial audio feedback and ambient soundtrack using Web Audio API
 */

export class Audio {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initialized = false;

        // Ambient music state
        this.ambientPlaying = false;
        this.intensity = 0; // 0-1, increases as time runs low
        this.masterGain = null;
        this.ambientNodes = [];

        // Music parameters
        this.droneFreqs = [55, 82.5, 110]; // A1, E2, A2 - deep mysterious drone
        this.pulseInterval = null;
    }

    /**
     * Initialize audio context (must be called after user interaction)
     */
    init() {
        if (this.initialized) return;

        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    /**
     * Resume audio context if suspended
     */
    async resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    /**
     * Start ambient soundtrack
     */
    startAmbient() {
        if (!this.enabled || !this.ctx || this.ambientPlaying) return;
        this.resume();
        this.ambientPlaying = true;

        // Create deep drone layer
        this.createDroneLayer();

        // Create rhythmic pulse layer
        this.startPulseLayer();
    }

    /**
     * Create continuous drone layer - mysterious atmospheric base
     */
    createDroneLayer() {
        const now = this.ctx.currentTime;

        this.droneFreqs.forEach((freq, i) => {
            // Main oscillator
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.value = freq;

            // Slow LFO for movement
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.type = 'sine';
            lfo.frequency.value = 0.1 + i * 0.05; // Slow modulation
            lfoGain.gain.value = freq * 0.02; // Subtle pitch wobble
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            lfo.start(now);

            // Low-pass filter for warmth
            filter.type = 'lowpass';
            filter.frequency.value = 400;
            filter.Q.value = 1;

            // Set volume (quieter for higher partials)
            gain.gain.value = 0.08 / (i + 1);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);

            this.ambientNodes.push({ osc, gain, filter, lfo, lfoGain });
        });

        // Add noise layer for texture
        this.createNoiseLayer();
    }

    /**
     * Create filtered noise layer for atmospheric texture
     */
    createNoiseLayer() {
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 200;
        noiseFilter.Q.value = 0.5;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.value = 0.015;

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noise.start();

        this.ambientNodes.push({ noise, noiseFilter, noiseGain });
    }

    /**
     * Start rhythmic pulse layer - tribal heartbeat
     */
    startPulseLayer() {
        let beatCount = 0;

        const playBeat = () => {
            if (!this.ambientPlaying || !this.ctx) return;

            const now = this.ctx.currentTime;

            // Base tempo increases with intensity
            const baseTempo = 800 - this.intensity * 400; // 800ms -> 400ms

            // Tribal pattern: strong-weak-weak-strong
            const pattern = [1, 0.3, 0.5, 0.8];
            const strength = pattern[beatCount % 4];

            // Low drum hit
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            const baseFreq = 60 + this.intensity * 20;
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.1);

            const volume = 0.12 * strength * (0.5 + this.intensity * 0.5);
            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 0.2);

            // Add shaker/rattle on off-beats at higher intensity
            if (this.intensity > 0.3 && beatCount % 2 === 1) {
                this.playShaker(now, strength * 0.5);
            }

            // Add melodic accent occasionally at higher intensity
            if (this.intensity > 0.5 && beatCount % 8 === 0) {
                this.playMelodicAccent(now);
            }

            beatCount++;

            // Schedule next beat
            this.pulseInterval = setTimeout(playBeat, baseTempo);
        };

        // Start after a short delay
        this.pulseInterval = setTimeout(playBeat, 1000);
    }

    /**
     * Play shaker/rattle sound
     */
    playShaker(time, strength) {
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 3000;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.08 * strength;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        source.start(time);
    }

    /**
     * Play melodic accent - mysterious tribal melody
     */
    playMelodicAccent(time) {
        // Pentatonic scale for tribal feel: A, C, D, E, G
        const scale = [220, 261.63, 293.66, 329.63, 392];
        const note = scale[Math.floor(Math.random() * scale.length)];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.value = note;

        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.06, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 0.5);
    }

    /**
     * Update intensity based on remaining time (0-1)
     */
    updateIntensity(remainingRatio) {
        // Intensity increases as time runs out
        // 0 = full time remaining (calm), 1 = no time (intense)
        this.intensity = Math.max(0, Math.min(1, 1 - remainingRatio));

        // Update drone filter frequency for tension
        if (this.ambientNodes.length > 0) {
            this.ambientNodes.forEach(node => {
                if (node.filter && node.filter.type === 'lowpass') {
                    // Open filter as intensity increases
                    const targetFreq = 400 + this.intensity * 800;
                    node.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.5);
                }
                if (node.noiseGain) {
                    // Increase noise presence
                    const targetGain = 0.015 + this.intensity * 0.025;
                    node.noiseGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.5);
                }
            });
        }
    }

    /**
     * Stop ambient soundtrack
     */
    stopAmbient() {
        if (!this.ambientPlaying) return;

        this.ambientPlaying = false;

        // Clear pulse interval
        if (this.pulseInterval) {
            clearTimeout(this.pulseInterval);
            this.pulseInterval = null;
        }

        // Fade out and stop all ambient nodes
        const now = this.ctx.currentTime;
        this.ambientNodes.forEach(node => {
            if (node.gain) {
                node.gain.gain.setTargetAtTime(0, now, 0.5);
            }
            if (node.noiseGain) {
                node.noiseGain.gain.setTargetAtTime(0, now, 0.5);
            }

            // Stop oscillators after fade
            setTimeout(() => {
                if (node.osc) node.osc.stop();
                if (node.lfo) node.lfo.stop();
                if (node.noise) node.noise.stop();
            }, 2000);
        });

        this.ambientNodes = [];
    }

    /**
     * Play collision sound - soft spatial thump
     */
    playCollision() {
        if (!this.enabled || !this.ctx) return;
        this.resume();

        const now = this.ctx.currentTime;

        // Low frequency thump
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * Play move sound - gentle harmonic tone
     */
    playMove() {
        if (!this.enabled || !this.ctx) return;
        this.resume();

        const now = this.ctx.currentTime;

        // Soft harmonic chord
        const frequencies = [220, 277.18, 329.63]; // A3, C#4, E4 (A major)

        frequencies.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            const volume = 0.05 / (i + 1); // Softer for higher harmonics
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(volume, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc.connect(gain);
            gain.connect(this.masterGain || this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.3);
        });
    }

    /**
     * Play win sound - ascending harmonics
     */
    playWin() {
        if (!this.enabled || !this.ctx) return;
        this.resume();

        // Stop ambient music on win
        this.stopAmbient();

        const now = this.ctx.currentTime;

        // Ascending tones
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.2);

            gain.gain.setValueAtTime(0, now + i * 0.2);
            gain.gain.linearRampToValueAtTime(0.1, now + i * 0.2 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.8);

            osc.connect(gain);
            gain.connect(this.masterGain || this.ctx.destination);

            osc.start(now + i * 0.2);
            osc.stop(now + i * 0.2 + 0.8);
        });
    }

    /**
     * Toggle audio
     */
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopAmbient();
        }
        return this.enabled;
    }
}
