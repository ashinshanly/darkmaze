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

        // Theme system
        this.themes = {
            space: {
                name: 'Space',
                bg: { r1: 20, g1: 20, b1: 50, r2: 10, g2: 10, b2: 26 },
                startPortal: { r: 100, g: 180, b: 255 },
                endPortal: { r: 255, g: 200, b: 100 },
                orb: { r: 180, g: 200, b: 255 },
                starHue: 220
            },
            underwater: {
                name: 'Underwater',
                bg: { r1: 10, g1: 40, b1: 60, r2: 5, g2: 20, b2: 40 },
                startPortal: { r: 100, g: 220, b: 200 },
                endPortal: { r: 255, g: 120, b: 150 },
                orb: { r: 150, g: 230, b: 220 },
                starHue: 180
            },
            forest: {
                name: 'Forest',
                bg: { r1: 15, g1: 35, b1: 20, r2: 8, g2: 18, b2: 12 },
                startPortal: { r: 150, g: 255, b: 150 },
                endPortal: { r: 255, g: 200, b: 100 },
                orb: { r: 200, g: 255, b: 180 },
                starHue: 60
            }
        };
        this.currentTheme = 'space';
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
        const theme = this.themes[this.currentTheme];
        const bg = theme.bg;

        // Create moving gradient - gets slightly warmer as time passes
        const centerX = this.canvas.width / 2 + Math.sin(this.gradientPhase) * 100;
        const centerY = this.canvas.height / 2 + Math.cos(this.gradientPhase * 0.7) * 100;

        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, Math.max(this.canvas.width, this.canvas.height)
        );

        // Time-based color shift
        const redShift = Math.floor(this.timePhase * 10);

        gradient.addColorStop(0, `rgb(${bg.r1 + redShift}, ${bg.g1}, ${bg.b1})`);
        gradient.addColorStop(0.5, `rgb(${Math.floor(bg.r1 * 0.75) + redShift}, ${Math.floor(bg.g1 * 0.75)}, ${Math.floor(bg.b1 * 0.84)})`);
        gradient.addColorStop(1, `rgb(${bg.r2 + redShift}, ${bg.g2}, ${bg.b2})`);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Render the START point - outward swirling portal vortex
     */
    renderStartPoint(startX, startY) {
        const pos = this.gridToScreen(startX, startY);
        const time = performance.now() / 1000;
        const theme = this.themes[this.currentTheme];
        const c = theme.startPortal;

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

                // Particle glow with theme colors
                const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 3);
                gradient.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${opacity})`);
                gradient.addColorStop(0.5, `rgba(${Math.floor(c.r * 0.8)}, ${Math.floor(c.g * 0.83)}, ${c.b}, ${opacity * 0.4})`);
                gradient.addColorStop(1, `rgba(${Math.floor(c.r * 0.6)}, ${Math.floor(c.g * 0.67)}, ${c.b}, 0)`);

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size * 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Central portal core
        const coreGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
        const corePulse = 0.8 + Math.sin(time * 3) * 0.2;
        coreGradient.addColorStop(0, `rgba(${Math.min(255, c.r + 50)}, ${Math.min(255, c.g + 20)}, ${c.b}, ${0.5 * corePulse})`);
        coreGradient.addColorStop(0.5, `rgba(${c.r}, ${Math.floor(c.g * 0.83)}, ${c.b}, ${0.25 * corePulse})`);
        coreGradient.addColorStop(1, `rgba(${Math.floor(c.r * 0.8)}, ${Math.floor(c.g * 0.67)}, ${c.b}, 0)`);

        this.ctx.fillStyle = coreGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner bright core
        this.ctx.fillStyle = `rgba(${Math.min(255, c.r + 100)}, ${Math.min(255, c.g + 50)}, ${c.b}, ${0.7 * corePulse})`;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    /**
     * Render the END point - inward swirling portal vortex
     */
    renderEndPoint(endX, endY) {
        const pos = this.gridToScreen(endX, endY);
        const time = performance.now() / 1000;
        const theme = this.themes[this.currentTheme];
        const c = theme.endPortal;

        // Spiral arms pulling inward
        const armCount = 5;
        const maxRadius = 60;

        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);

        // Outer beckoning glow
        const outerGlow = this.ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 1.5);
        const breathe = 0.7 + Math.sin(time * 1.5) * 0.3;
        outerGlow.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${0.15 * breathe})`);
        outerGlow.addColorStop(0.5, `rgba(${c.r}, ${Math.floor(c.g * 0.9)}, ${Math.floor(c.b * 0.8)}, ${0.05 * breathe})`);
        outerGlow.addColorStop(1, `rgba(${c.r}, ${Math.floor(c.g * 0.75)}, ${Math.floor(c.b * 0.5)}, 0)`);

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

                // Particle glow with theme colors
                const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 3);
                gradient.addColorStop(0, `rgba(${c.r}, ${Math.min(255, c.g + 20)}, ${Math.min(255, c.b + 20)}, ${opacity})`);
                gradient.addColorStop(0.5, `rgba(${c.r}, ${Math.floor(c.g * 0.9)}, ${Math.floor(c.b * 0.8)}, ${opacity * 0.4})`);
                gradient.addColorStop(1, `rgba(${c.r}, ${Math.floor(c.g * 0.75)}, ${Math.floor(c.b * 0.5)}, 0)`);

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size * 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Central portal core - brighter and more inviting
        const coreGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
        const corePulse = 0.8 + Math.sin(time * 2.5) * 0.2;
        coreGradient.addColorStop(0, `rgba(${c.r}, ${Math.min(255, c.g + 40)}, ${Math.min(255, c.b + 80)}, ${0.7 * corePulse})`);
        coreGradient.addColorStop(0.4, `rgba(${c.r}, ${c.g}, ${c.b}, ${0.4 * corePulse})`);
        coreGradient.addColorStop(1, `rgba(${c.r}, ${Math.floor(c.g * 0.9)}, ${Math.floor(c.b * 0.8)}, 0)`);

        this.ctx.fillStyle = coreGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner bright core
        this.ctx.fillStyle = `rgba(${c.r}, ${Math.min(255, c.g + 50)}, ${Math.min(255, c.b + 120)}, ${0.9 * corePulse})`;
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
    /**
     * Render the player character based on theme
     */
    renderPlayer(renderX, renderY, glowIntensity, energy = 1, rotationAngle = 0) {
        const pos = this.gridToScreen(renderX, renderY);
        const color = this.themes[this.currentTheme].orb;

        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);

        // Character rendering based on theme
        if (this.currentTheme === 'space') {
            this.renderSpaceship(0, 0, color, glowIntensity, energy, rotationAngle);
        } else if (this.currentTheme === 'underwater') {
            this.renderFish(0, 0, color, glowIntensity, energy, rotationAngle);
        } else {
            // Default orb (Forest/Default)
            this.renderOrb(0, 0, color, glowIntensity, energy);
        }

        this.ctx.restore();
    }

    /**
     * Render standard Orb character
     */
    renderOrb(x, y, color, glowIntensity, energy) {
        const radius = this.cellSize * 0.35 * Math.min(1, 0.5 + energy * 0.5); // Shrink slightly if low energy

        // Inner core
        this.ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        this.ctx.shadowBlur = 20 * glowIntensity;
        this.ctx.shadowColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
        this.ctx.fill();

        // Outer glow halo
        const gradient = this.ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 1.5);
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.6 * glowIntensity})`);
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Middle glow
        const midGlow = this.ctx.createRadialGradient(
            0, 0, 0,
            0, 0, 30
        );
        midGlow.addColorStop(0, `rgba(${color.r + 40}, ${color.g + 30}, ${color.b}, ${0.4 * glowIntensity})`);
        midGlow.addColorStop(0.6, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.2 * glowIntensity})`);
        midGlow.addColorStop(1, `rgba(${color.r - 30}, ${color.g - 20}, ${color.b}, 0)`);

        this.ctx.fillStyle = midGlow;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 30, 0, Math.PI * 2);
        this.ctx.fill();

        // Core
        const coreGradient = this.ctx.createRadialGradient(
            0, 0, 0,
            0, 0, 10
        );
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.95 * glowIntensity})`);
        coreGradient.addColorStop(0.5, `rgba(${color.r + 50}, ${color.g + 40}, ${color.b}, ${0.8 * glowIntensity})`);
        coreGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.4 * glowIntensity})`);

        this.ctx.fillStyle = coreGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Render retro Spaceship character
     */
    renderSpaceship(x, y, color, glowIntensity, energy, angle) {
        const size = this.cellSize * 0.4;

        this.ctx.rotate(angle);

        // Engine glow (behind)
        const engineGlow = this.ctx.createLinearGradient(-size, 0, -size * 2, 0);
        engineGlow.addColorStop(0, `rgba(100, 200, 255, ${0.8 * energy})`);
        engineGlow.addColorStop(1, 'rgba(100, 200, 255, 0)');

        this.ctx.fillStyle = engineGlow;
        this.ctx.beginPath();
        this.ctx.moveTo(-size * 0.5, size * 0.3);
        this.ctx.lineTo(-size * 1.8, 0);
        this.ctx.lineTo(-size * 0.5, -size * 0.3);
        this.ctx.fill();

        // Ship body (Triangle)
        this.ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        this.ctx.shadowBlur = 15 * glowIntensity;
        this.ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;

        this.ctx.beginPath();
        this.ctx.moveTo(size, 0); // Nose
        this.ctx.lineTo(-size * 0.6, size * 0.6); // Right wing
        this.ctx.lineTo(-size * 0.3, 0); // Center notch
        this.ctx.lineTo(-size * 0.6, -size * 0.6); // Left wing
        this.ctx.closePath();
        this.ctx.fill();

        // Cockpit window
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = 'white';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Render Stylized Fish character
     */
    renderFish(x, y, color, glowIntensity, energy, angle) {
        const size = this.cellSize * 0.4;
        const time = performance.now() / 200;

        this.ctx.rotate(angle); // Face movement direction

        // Tail wiggle animation
        const tailWiggle = Math.sin(time * 5) * 0.2;

        this.ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        this.ctx.shadowBlur = 15 * glowIntensity;
        this.ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;

        this.ctx.beginPath();
        // Body
        this.ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Tail
        this.ctx.save();
        this.ctx.translate(-size * 0.8, 0);
        this.ctx.rotate(tailWiggle);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-size * 0.6, -size * 0.5);
        this.ctx.lineTo(-size * 0.6, size * 0.5);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();

        // Eye
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(size * 0.4, -size * 0.2, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();

        // Side fin
        this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-size * 0.3, size * 0.4);
        this.ctx.lineTo(size * 0.2, size * 0.2);
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

    /**
     * Set the visual theme
     */
    setTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
            // Regenerate starfield with theme colors
            this.stars = this.createStarfield();
        }
    }

    /**
     * Get list of available theme names
     */
    getThemeNames() {
        return Object.keys(this.themes);
    }

    /**
     * Get current theme name
     */
    getCurrentTheme() {
        return this.currentTheme;
    }
}
