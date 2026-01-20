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

        // Light rays
        this.lightRays = this.createLightRays();

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
        this.lightRays = this.createLightRays();
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
     * Create light rays for background effect
     */
    createLightRays() {
        const rays = [];
        const count = 5;

        for (let i = 0; i < count; i++) {
            rays.push({
                angle: (Math.PI * 2 * i) / count,
                width: 0.1 + Math.random() * 0.2,
                opacity: 0.02 + Math.random() * 0.02,
                speed: 0.0002 + Math.random() * 0.0003
            });
        }

        return rays;
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
     * Render the START point - pulsing origin marker
     */
    renderStartPoint(startX, startY) {
        const pos = this.gridToScreen(startX, startY);
        const time = performance.now() / 1000;

        // Gentle pulsing rings emanating outward
        const pulseCount = 3;

        for (let i = 0; i < pulseCount; i++) {
            const phase = (time * 0.5 + i / pulseCount) % 1;
            const radius = 15 + phase * 40;
            const opacity = (1 - phase) * 0.15;

            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(100, 150, 255, ${opacity})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // Soft inner glow
        const innerGlow = this.ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, 25
        );
        innerGlow.addColorStop(0, 'rgba(100, 150, 255, 0.15)');
        innerGlow.addColorStop(0.5, 'rgba(80, 120, 200, 0.08)');
        innerGlow.addColorStop(1, 'rgba(60, 100, 180, 0)');

        this.ctx.fillStyle = innerGlow;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Render the END point - beckoning golden glow
     */
    renderEndPoint(endX, endY) {
        const pos = this.gridToScreen(endX, endY);
        const time = performance.now() / 1000;

        // Beckoning pulse - breathing effect
        const breathe = 0.7 + Math.sin(time * 1.5) * 0.3;
        const radius = 35 * breathe;

        // Outer warm glow
        const outerGlow = this.ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, radius * 2
        );
        outerGlow.addColorStop(0, `rgba(255, 200, 100, ${0.2 * breathe})`);
        outerGlow.addColorStop(0.4, `rgba(255, 180, 80, ${0.1 * breathe})`);
        outerGlow.addColorStop(1, 'rgba(255, 150, 50, 0)');

        this.ctx.fillStyle = outerGlow;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radius * 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner core glow
        const innerGlow = this.ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, radius * 0.5
        );
        innerGlow.addColorStop(0, `rgba(255, 230, 180, ${0.3 * breathe})`);
        innerGlow.addColorStop(1, 'rgba(255, 200, 100, 0)');

        this.ctx.fillStyle = innerGlow;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radius * 0.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Subtle rotating sparkles
        const sparkleCount = 4;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (time * 0.3) + (Math.PI * 2 * i / sparkleCount);
            const sparkleRadius = radius * 1.2;
            const sparkleX = pos.x + Math.cos(angle) * sparkleRadius;
            const sparkleY = pos.y + Math.sin(angle) * sparkleRadius;
            const sparkleOpacity = 0.3 + Math.sin(time * 2 + i) * 0.2;

            this.ctx.beginPath();
            this.ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 220, 150, ${sparkleOpacity})`;
            this.ctx.fill();
        }
    }

    /**
     * Render light rays with time-based intensity
     */
    renderLightRays(time, playerScreenX, playerScreenY) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        for (const ray of this.lightRays) {
            ray.angle += ray.speed * (time / 16);

            // Bend rays toward player
            const dx = playerScreenX - centerX;
            const dy = playerScreenY - centerY;
            const bendFactor = 0.1;

            const bendAngle = Math.atan2(dy, dx);
            const effectiveAngle = ray.angle + Math.sin(ray.angle - bendAngle) * bendFactor;

            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(effectiveAngle);

            // Intensity increases with time
            const intensity = ray.opacity * this.ambientIntensity;

            const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
            gradient.addColorStop(0, `rgba(100, 120, 180, ${intensity})`);
            gradient.addColorStop(1, 'rgba(100, 120, 180, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(this.canvas.width, -this.canvas.width * ray.width);
            this.ctx.lineTo(this.canvas.width, this.canvas.width * ray.width);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.restore();
        }
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
