/**
 * Player System — Invisible Maze
 * Handles player state, movement, trails, and animation
 */

export class Player {
    constructor(startX = 0, startY = 0) {
        // Grid position (integer)
        this.gridX = startX;
        this.gridY = startY;

        // Render position (interpolated for smooth movement)
        this.renderX = startX;
        this.renderY = startY;

        // Movement state
        this.isMoving = false;
        this.moveStartTime = 0;
        this.moveDuration = 280; // ms for one tile movement
        this.moveFrom = { x: startX, y: startY };
        this.moveTo = { x: startX, y: startY };

        // Bounce state (for wall collision)
        this.isBouncing = false;
        this.bounceStartTime = 0;
        this.bounceDuration = 150;
        this.bounceDirection = { x: 0, y: 0 };

        // Trail system
        this.trails = [];
        this.maxTrails = 15;
        this.trailInterval = 40; // ms between trail points
        this.lastTrailTime = 0;

        // Ghost afterimages
        this.ghosts = [];
        this.maxGhosts = 5;

        // Stats
        this.moveCount = 0;
        this.collisionCount = 0;
        this.startTime = Date.now();

        // Visual properties
        this.baseRadius = 12;
        this.glowIntensity = 1.0;
    }

    /**
     * Initiate movement to a new grid position
     */
    moveTo(x, y) {
        if (this.isMoving || this.isBouncing) return false;

        this.isMoving = true;
        this.moveStartTime = performance.now();
        this.moveFrom = { x: this.gridX, y: this.gridY };
        this.moveTo = { x, y };

        // Add ghost at current position
        this.addGhost();

        this.moveCount++;
        return true;
    }

    /**
     * Initiate bounce animation (wall collision)
     */
    bounce(direction) {
        if (this.isBouncing) return;

        this.isBouncing = true;
        this.bounceStartTime = performance.now();
        this.bounceDirection = direction;
        this.collisionCount++;

        // Decrease glow intensity slightly on collision
        this.glowIntensity = Math.max(0.5, this.glowIntensity - 0.05);
    }

    /**
     * Update player state each frame
     */
    update(currentTime) {
        // Update movement animation
        if (this.isMoving) {
            const elapsed = currentTime - this.moveStartTime;
            const progress = Math.min(elapsed / this.moveDuration, 1);

            // Ease-out cubic for smooth deceleration
            const eased = 1 - Math.pow(1 - progress, 3);

            this.renderX = this.moveFrom.x + (this.moveTo.x - this.moveFrom.x) * eased;
            this.renderY = this.moveFrom.y + (this.moveTo.y - this.moveFrom.y) * eased;

            // Add trail points during movement
            if (currentTime - this.lastTrailTime > this.trailInterval) {
                this.addTrail(this.renderX, this.renderY);
                this.lastTrailTime = currentTime;
            }

            if (progress >= 1) {
                this.isMoving = false;
                this.gridX = this.moveTo.x;
                this.gridY = this.moveTo.y;
                this.renderX = this.gridX;
                this.renderY = this.gridY;
            }
        }

        // Update bounce animation
        if (this.isBouncing) {
            const elapsed = currentTime - this.bounceStartTime;
            const progress = Math.min(elapsed / this.bounceDuration, 1);

            // Bounce uses sine wave for back-and-forth
            const bounceProgress = Math.sin(progress * Math.PI);
            const bounceAmount = 0.15; // 15% of a tile

            this.renderX = this.gridX + this.bounceDirection.x * bounceAmount * bounceProgress;
            this.renderY = this.gridY + this.bounceDirection.y * bounceAmount * bounceProgress;

            if (progress >= 1) {
                this.isBouncing = false;
                this.renderX = this.gridX;
                this.renderY = this.gridY;
            }
        }

        // Update trails (fade out)
        this.updateTrails(currentTime);

        // Update ghosts (fade out)
        this.updateGhosts(currentTime);

        // Slowly recover glow intensity
        this.glowIntensity = Math.min(1.0, this.glowIntensity + 0.001);
    }

    /**
     * Add a trail point
     */
    addTrail(x, y) {
        this.trails.push({
            x,
            y,
            opacity: 1,
            createdAt: performance.now(),
            lifetime: 800 // ms
        });

        // Limit trail length
        while (this.trails.length > this.maxTrails) {
            this.trails.shift();
        }
    }

    /**
     * Update trail opacities
     */
    updateTrails(currentTime) {
        this.trails = this.trails.filter(trail => {
            const age = currentTime - trail.createdAt;
            trail.opacity = 1 - (age / trail.lifetime);
            return trail.opacity > 0;
        });
    }

    /**
     * Add a ghost afterimage
     */
    addGhost() {
        this.ghosts.push({
            x: this.renderX,
            y: this.renderY,
            opacity: 0.6,
            createdAt: performance.now(),
            lifetime: 500 // ms
        });

        // Limit ghost count
        while (this.ghosts.length > this.maxGhosts) {
            this.ghosts.shift();
        }
    }

    /**
     * Update ghost opacities
     */
    updateGhosts(currentTime) {
        this.ghosts = this.ghosts.filter(ghost => {
            const age = currentTime - ghost.createdAt;
            ghost.opacity = 0.6 * (1 - (age / ghost.lifetime));
            return ghost.opacity > 0;
        });
    }

    /**
     * Check if player can accept input
     */
    canAcceptInput() {
        return !this.isMoving && !this.isBouncing;
    }

    /**
     * Get elapsed time in seconds
     */
    getElapsedTime() {
        return (Date.now() - this.startTime) / 1000;
    }

    /**
     * Format elapsed time as M:SS
     */
    getFormattedTime() {
        const elapsed = this.getElapsedTime();
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Reset player to start
     */
    reset(startX = 0, startY = 0) {
        this.gridX = startX;
        this.gridY = startY;
        this.renderX = startX;
        this.renderY = startY;
        this.isMoving = false;
        this.isBouncing = false;
        this.trails = [];
        this.ghosts = [];
        this.moveCount = 0;
        this.collisionCount = 0;
        this.startTime = Date.now();
        this.glowIntensity = 1.0;
    }
}
