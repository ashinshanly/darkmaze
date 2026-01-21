/**
 * Visual Effects — Invisible Maze
 * Screen shake, distortion, wall flash, and other feedback effects
 */

export class Effects {
    constructor() {
        this.overlay = document.getElementById('effectsOverlay');
        this.wallFlashes = [];
        this.screenBrightness = 0;
        this.isWinning = false;
        this.isStarting = false;
        this.startProgress = 0;
    }

    /**
     * Trigger collision effects
     */
    triggerCollision(wallX, wallY, wallWidth, wallHeight, direction) {
        // Screen shake
        this.overlay.classList.add('shake');

        // Screen darken
        this.overlay.classList.add('darken');

        // Distortion effect
        this.overlay.classList.add('distort');

        // Create wall flash element
        this.createWallFlash(wallX, wallY, wallWidth, wallHeight, direction);

        // Remove effects after animation
        setTimeout(() => {
            this.overlay.classList.remove('shake');
        }, 150);

        setTimeout(() => {
            this.overlay.classList.remove('darken');
            this.overlay.classList.remove('distort');
        }, 100);
    }

    /**
     * Create a wall flash element at collision point
     */
    createWallFlash(x, y, width, height, direction) {
        const flash = document.createElement('div');
        flash.className = 'wall-flash';

        // Position and size based on wall direction
        const thickness = 4;

        switch (direction) {
            case 'n':
                flash.style.left = `${x}px`;
                flash.style.top = `${y}px`;
                flash.style.width = `${width}px`;
                flash.style.height = `${thickness}px`;
                break;
            case 's':
                flash.style.left = `${x}px`;
                flash.style.top = `${y + height - thickness}px`;
                flash.style.width = `${width}px`;
                flash.style.height = `${thickness}px`;
                break;
            case 'e':
                flash.style.left = `${x + width - thickness}px`;
                flash.style.top = `${y}px`;
                flash.style.width = `${thickness}px`;
                flash.style.height = `${height}px`;
                break;
            case 'w':
                flash.style.left = `${x}px`;
                flash.style.top = `${y}px`;
                flash.style.width = `${thickness}px`;
                flash.style.height = `${height}px`;
                break;
        }

        document.body.appendChild(flash);

        // Remove after animation
        setTimeout(() => {
            flash.remove();
        }, 100);
    }

    /**
     * Trigger start portal effect - dramatic portal opening animation
     */
    triggerStartPortal(x, y) {
        // Create multiple expanding rings for the portal effect
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ring = document.createElement('div');
                ring.className = 'start-portal-ring';
                ring.style.left = `${x}px`;
                ring.style.top = `${y}px`;
                document.body.appendChild(ring);

                setTimeout(() => ring.remove(), 1500);
            }, i * 200);
        }

        // Create particle burst effect
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'start-portal-particle';
            const angle = (i / 12) * Math.PI * 2;

            // Pre-calculate positions for animation
            const midDist = 20;
            const endDist = 120;
            const txMid = Math.cos(angle) * midDist;
            const tyMid = Math.sin(angle) * midDist;
            const txEnd = Math.cos(angle) * endDist;
            const tyEnd = Math.sin(angle) * endDist;

            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.setProperty('--tx-mid', `${txMid}px`);
            particle.style.setProperty('--ty-mid', `${tyMid}px`);
            particle.style.setProperty('--tx-end', `${txEnd}px`);
            particle.style.setProperty('--ty-end', `${tyEnd}px`);
            particle.style.setProperty('--delay', `${i * 50}ms`);
            document.body.appendChild(particle);

            setTimeout(() => particle.remove(), 1200);
        }

        // Central flash/glow
        const flash = document.createElement('div');
        flash.className = 'start-portal-flash';
        flash.style.left = `${x}px`;
        flash.style.top = `${y}px`;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 1000);

        this.isStarting = true;
        this.startProgress = 0;
    }

    /**
     * Trigger goal reveal effect
     */
    triggerGoalReveal(x, y) {
        const reveal = document.createElement('div');
        reveal.className = 'goal-reveal';
        reveal.style.left = `${x}px`;
        reveal.style.top = `${y}px`;
        reveal.style.width = '100px';
        reveal.style.height = '100px';

        document.body.appendChild(reveal);

        setTimeout(() => {
            reveal.remove();
        }, 2000);
    }

    /**
     * Start win sequence
     */
    startWinSequence() {
        this.isWinning = true;
    }

    /**
     * Update brightness for win and start sequences
     */
    update() {
        if (this.isWinning && this.screenBrightness < 0.3) {
            this.screenBrightness += 0.005;
            this.overlay.style.background = `rgba(255, 255, 255, ${this.screenBrightness})`;
        }

        // Update start portal progress
        if (this.isStarting && this.startProgress < 1) {
            this.startProgress += 0.02;
            if (this.startProgress >= 1) {
                this.isStarting = false;
            }
        }
    }

    /**
     * Reset effects
     */
    reset() {
        this.overlay.classList.remove('shake', 'darken', 'distort');
        this.overlay.style.background = '';
        this.screenBrightness = 0;
        this.isWinning = false;
        this.isStarting = false;
        this.startProgress = 0;
    }
}
