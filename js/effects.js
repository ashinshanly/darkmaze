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
     * Update brightness for win sequence
     */
    update() {
        if (this.isWinning && this.screenBrightness < 0.3) {
            this.screenBrightness += 0.005;
            this.overlay.style.background = `rgba(255, 255, 255, ${this.screenBrightness})`;
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
    }
}
