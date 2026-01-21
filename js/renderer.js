/**
 * Canvas Renderer — Invisible Maze
 * Handles all visual rendering: background, particles, player, trails, effects
 * Enhanced with start/end point visualization and time-based ambient effects
 */

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();

        // Grid layout
        this.cellSize = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.mazeWidth = 20;
        this.mazeHeight = 20;

        // Animation state
        this.time = 0;

        // Starfield
        this.stars = this.createStarfield();

        // Wall memory - cells where player hit walls
        this.wallMemory = new Map();

        // Background gradient animation
        this.gradientPhase = 0;

        // Time-based evolution
        this.timePhase = 0; // 0-1 representing progression
        this.ambientIntensity = 1.0;
    }

    /**
     * Handle canvas resize
     */
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.calculateLayout();
        this.stars = this.createStarfield();
    }

    /**
     * Calculate maze layout on screen
     */
    calculateLayout(mazeWidth = 20, mazeHeight = 20) {
        this.mazeWidth = mazeWidth;
        this.mazeHeight = mazeHeight;

        const padding = 80;
        const availableWidth = this.canvas.width - padding * 2;
        const availableHeight = this.canvas.height - padding * 2;

        this.cellSize = Math.min(
            availableWidth / mazeWidth,
            availableHeight / mazeHeight
        );

        // Center the maze
        const mazePixelWidth = this.cellSize * mazeWidth;
        const mazePixelHeight = this.cellSize * mazeHeight;

        this.offsetX = (this.canvas.width - mazePixelWidth) / 2;
        this.offsetY = (this.canvas.height - mazePixelHeight) / 2;
    }

    /**
     * Convert grid position to screen position
     */
    gridToScreen(gridX, gridY) {
        return {
            x: this.offsetX + (gridX + 0.5) * this.cellSize,
            y: this.offsetY + (gridY + 0.5) * this.cellSize
        };
    }

    /**
     * Create starfield for background
     */
    createStarfield() {
        const stars = [];
        const count = 80;

        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 0.5 + Math.random() * 2,
                baseOpacity: 0.2 + Math.random() * 0.4,
                twinkleSpeed: 0.5 + Math.random() * 2,
                twinklePhase: Math.random() * Math.PI * 2,
                // Color variation: white to slight blue/purple
                hue: 220 + Math.random() * 40,
                saturation: 10 + Math.random() * 30
            });
        }

        return stars;
    }

    /**
     * Update time-based ambient state
     */
    updateTimePhase(elapsedSeconds, maxSeconds) {
        this.timePhase = Math.min(elapsedSeconds / maxSeconds, 1);

        // Increase ambient intensity as time passes (subtle tension)
        this.ambientIntensity = 1.0 + this.timePhase * 0.3;
    }

    /**
     * Render animated gradient background with time evolution
     */
    renderBackground(time) {
        this.gradientPhase += 0.001;

        // Create moving gradient - gets slightly warmer as time passes
        const centerX = this.canvas.width / 2 + Math.sin(this.gradientPhase) * 100;
        const centerY = this.canvas.height / 2 + Math.cos(this.gradientPhase * 0.7) * 100;

        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, Math.max(this.canvas.width, this.canvas.height)
        );

        // Time-based color shift (blue -> slight purple as time passes)
        const redShift = Math.floor(this.timePhase * 10);

        gradient.addColorStop(0, `rgb(${20 + redShift}, ${20}, ${50})`);
        gradient.addColorStop(0.5, `rgb(${15 + redShift}, ${15}, ${42})`);
        gradient.addColorStop(1, `rgb(${10 + redShift}, ${10}, ${26})`);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Render the START point - outward swirling portal vortex (blue/cyan)
     */
    renderStartPoint(startX, startY) {
        const pos = this.gridToScreen(startX, startY);
        const time = performance.now() / 1000;

        // Spiral arms pushing outward
        const armCount = 5;
        const maxRadius = 50;

        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);

        // Rotating spiral arms
        for (let arm = 0; arm < armCount; arm++) {
            const baseAngle = (arm / armCount) * Math.PI * 2;

            // Draw spiral particles along each arm
            for (let i = 0; i < 12; i++) {
                const t = i / 12;
                const radius = 8 + t * maxRadius;
                // Spiral outward with rotation over time (pushing out effect)
                const spiralAngle = baseAngle + t * 1.5 - time * 1.2;

                const x = Math.cos(spiralAngle) * radius;
                const y = Math.sin(spiralAngle) * radius;

                const opacity = (1 - t) * 0.6;
                const size = (1 - t * 0.5) * 3;

                // Particle glow
                const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 3);
                gradient.addColorStop(0, `rgba(100, 180, 255, ${opacity})`);
                gradient.addColorStop(0.5, `rgba(80, 150, 255, ${opacity * 0.4})`);
                gradient.addColorStop(1, 'rgba(60, 120, 255, 0)');

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size * 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Central portal core
        const coreGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
        const corePulse = 0.8 + Math.sin(time * 3) * 0.2;
        coreGradient.addColorStop(0, `rgba(150, 200, 255, ${0.5 * corePulse})`);
        coreGradient.addColorStop(0.5, `rgba(100, 150, 255, ${0.25 * corePulse})`);
        coreGradient.addColorStop(1, 'rgba(80, 120, 255, 0)');

        this.ctx.fillStyle = coreGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner bright core
        this.ctx.fillStyle = `rgba(200, 230, 255, ${0.7 * corePulse})`;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    /**
     * Render the END point - inward swirling portal vortex (golden)
     */
    renderEndPoint(endX, endY) {
        const pos = this.gridToScreen(endX, endY);
        const time = performance.now() / 1000;

        // Spiral arms pulling inward
        const armCount = 5;
        const maxRadius = 60;

        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);

        // Outer beckoning glow
        const outerGlow = this.ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 1.5);
        const breathe = 0.7 + Math.sin(time * 1.5) * 0.3;
        outerGlow.addColorStop(0, `rgba(255, 200, 100, ${0.15 * breathe})`);
        outerGlow.addColorStop(0.5, `rgba(255, 180, 80, ${0.05 * breathe})`);
        outerGlow.addColorStop(1, 'rgba(255, 150, 50, 0)');

        this.ctx.fillStyle = outerGlow;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, maxRadius * 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Rotating spiral arms (pulling inward)
        for (let arm = 0; arm < armCount; arm++) {
            const baseAngle = (arm / armCount) * Math.PI * 2;

            // Draw spiral particles along each arm
            for (let i = 0; i < 15; i++) {
                const t = i / 15;
                const radius = maxRadius - t * (maxRadius - 8);
                // Spiral inward with rotation over time (pulling in effect)
                const spiralAngle = baseAngle - t * 2 + time * 1.5;

                const x = Math.cos(spiralAngle) * radius;
                const y = Math.sin(spiralAngle) * radius;

                const opacity = t * 0.7;
                const size = (0.5 + t * 0.8) * 3;

                // Particle glow
                const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 3);
                gradient.addColorStop(0, `rgba(255, 220, 120, ${opacity})`);
                gradient.addColorStop(0.5, `rgba(255, 180, 80, ${opacity * 0.4})`);
                gradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size * 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Central portal core - brighter and more inviting
        const coreGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
        const corePulse = 0.8 + Math.sin(time * 2.5) * 0.2;
        coreGradient.addColorStop(0, `rgba(255, 240, 180, ${0.7 * corePulse})`);
        coreGradient.addColorStop(0.4, `rgba(255, 200, 100, ${0.4 * corePulse})`);
        coreGradient.addColorStop(1, 'rgba(255, 180, 80, 0)');

        this.ctx.fillStyle = coreGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner bright core
        this.ctx.fillStyle = `rgba(255, 250, 220, ${0.9 * corePulse})`;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 7, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    /**
     * Render twinkling starfield
     */
    renderStarfield(time) {
        const t = time / 1000;

        for (const star of this.stars) {
            // Twinkling effect
            const twinkle = Math.sin(t * star.twinkleSpeed + star.twinklePhase);
            const opacity = star.baseOpacity * (0.5 + twinkle * 0.5);

            // Draw star with slight glow
            const gradient = this.ctx.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, star.size * 3
            );

            gradient.addColorStop(0, `hsla(${star.hue}, ${star.saturation}%, 90%, ${opacity})`);
            gradient.addColorStop(0.5, `hsla(${star.hue}, ${star.saturation}%, 80%, ${opacity * 0.3})`);
            gradient.addColorStop(1, `hsla(${star.hue}, ${star.saturation}%, 70%, 0)`);

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
            this.ctx.fill();

            // Bright core
            this.ctx.fillStyle = `hsla(${star.hue}, ${star.saturation}%, 95%, ${opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    /**
     * Add wall memory - mark a cell where player hit a wall
     */
    addWallMemory(gridX, gridY, direction) {
        const key = `${gridX},${gridY},${direction}`;
        this.wallMemory.set(key, {
            gridX,
            gridY,
            direction,
            intensity: 1.0,
            timestamp: performance.now()
        });
    }

    /**
     * Render wall memory hints - subtle red pulses where walls were hit
     */
    renderWallMemory() {
        const currentTime = performance.now();

        for (const [key, memory] of this.wallMemory) {
            // Fade over 10 seconds
            const age = (currentTime - memory.timestamp) / 1000;
            const fadeTime = 10;

            if (age > fadeTime) {
                this.wallMemory.delete(key);
                continue;
            }

            const opacity = (1 - age / fadeTime) * 0.3;
            const pos = this.gridToScreen(memory.gridX, memory.gridY);
            const halfCell = this.cellSize / 2;

            // Determine wall position based on direction
            let wallX = pos.x;
            let wallY = pos.y;
            let width = this.cellSize * 0.1;
            let height = this.cellSize;

            switch (memory.direction) {
                case 'n':
                    wallY = pos.y - halfCell;
                    width = this.cellSize;
                    height = this.cellSize * 0.1;
                    break;
                case 's':
                    wallY = pos.y + halfCell;
                    width = this.cellSize;
                    height = this.cellSize * 0.1;
                    break;
                case 'w':
                    wallX = pos.x - halfCell;
                    break;
                case 'e':
                    wallX = pos.x + halfCell;
                    break;
            }

            // Subtle pulsing glow
            const pulse = 0.7 + Math.sin(currentTime / 500) * 0.3;

            const gradient = this.ctx.createRadialGradient(
                wallX, wallY, 0,
                wallX, wallY, this.cellSize * 0.5
            );
            gradient.addColorStop(0, `rgba(255, 80, 80, ${opacity * pulse})`);
            gradient.addColorStop(1, 'rgba(255, 80, 80, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(wallX, wallY, this.cellSize * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    /**
     * Clear wall memory on restart
     */
    clearWallMemory() {
        this.wallMemory.clear();
    }

    /**
     * Render player trails
     */
    renderTrails(trails) {
        for (const trail of trails) {
            const pos = this.gridToScreen(trail.x, trail.y);
            const radius = 8 * trail.opacity;

            const gradient = this.ctx.createRadialGradient(
                pos.x, pos.y, 0,
                pos.x, pos.y, radius * 2
            );

            gradient.addColorStop(0, `rgba(180, 200, 255, ${trail.opacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(180, 200, 255, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, radius * 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    /**
     * Render ghost afterimages
     */
    renderGhosts(ghosts) {
        for (const ghost of ghosts) {
            const pos = this.gridToScreen(ghost.x, ghost.y);
            const radius = 12;

            const gradient = this.ctx.createRadialGradient(
                pos.x, pos.y, 0,
                pos.x, pos.y, radius * 2
            );

            gradient.addColorStop(0, `rgba(255, 255, 255, ${ghost.opacity * 0.3})`);
            gradient.addColorStop(0.5, `rgba(180, 200, 255, ${ghost.opacity * 0.15})`);
            gradient.addColorStop(1, 'rgba(180, 200, 255, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, radius * 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    /**
     * Render the player orb with energy-based glow
     */
    renderPlayer(renderX, renderY, glowIntensity, energy = 1) {
        const pos = this.gridToScreen(renderX, renderY);
        const time = performance.now() / 1000;

        // Pulsing core radius - faster pulse when low energy
        const pulseSpeed = 2 + (1 - energy) * 3;
        const pulseAmount = 1 + Math.sin(time * pulseSpeed) * 0.1;
        const coreRadius = 10 * pulseAmount;

        // Color shifts based on energy
        const r = Math.floor(180 + (1 - energy) * 75);
        const g = Math.floor(200 - (1 - energy) * 100);
        const b = 255;

        // Outer glow
        const outerGlow = this.ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, 60
        );
        outerGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.15 * glowIntensity})`);
        outerGlow.addColorStop(0.5, `rgba(${r - 60}, ${g - 50}, ${b}, ${0.05 * glowIntensity})`);
        outerGlow.addColorStop(1, `rgba(${r - 80}, ${g - 70}, ${b}, 0)`);

        this.ctx.fillStyle = outerGlow;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 60, 0, Math.PI * 2);
        this.ctx.fill();

        // Middle glow
        const midGlow = this.ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, 30
        );
        midGlow.addColorStop(0, `rgba(${r + 40}, ${g + 30}, ${b}, ${0.4 * glowIntensity})`);
        midGlow.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${0.2 * glowIntensity})`);
        midGlow.addColorStop(1, `rgba(${r - 30}, ${g - 20}, ${b}, 0)`);

        this.ctx.fillStyle = midGlow;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);
        this.ctx.fill();

        // Core
        const coreGradient = this.ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, coreRadius
        );
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.95 * glowIntensity})`);
        coreGradient.addColorStop(0.5, `rgba(${r + 50}, ${g + 40}, ${b}, ${0.8 * glowIntensity})`);
        coreGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${0.4 * glowIntensity})`);

        this.ctx.fillStyle = coreGradient;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, coreRadius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Render goal hint (only during win)
     */
    renderGoal(goalX, goalY, progress) {
        const pos = this.gridToScreen(goalX, goalY);
        const radius = 20 + progress * 30;

        const gradient = this.ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, radius
        );

        gradient.addColorStop(0, `rgba(255, 220, 150, ${0.8 * progress})`);
        gradient.addColorStop(0.5, `rgba(255, 200, 100, ${0.4 * progress})`);
        gradient.addColorStop(1, 'rgba(255, 180, 80, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Get collision wall position for flash effect
     */
    getWallPosition(gridX, gridY, direction) {
        const screenPos = this.gridToScreen(gridX, gridY);
        const halfCell = this.cellSize / 2;

        return {
            x: screenPos.x - halfCell,
            y: screenPos.y - halfCell,
            width: this.cellSize,
            height: this.cellSize,
            direction
        };
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
