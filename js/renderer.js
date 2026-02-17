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

        // Background sea creatures (underwater theme)
        this.bgCreatures = [];
        this._lastCreatureSpawn = 0;
        this._creatureSpawnInterval = 4000 + Math.random() * 6000; // 4-10s between spawns

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

        // Responsive avatar sizing
        this._avatarScale = 0.28;
        this._orbScale = 0.25;
        this._updateAvatarScale();
    }

    /**
     * Update avatar scale based on screen size
     */
    _updateAvatarScale() {
        const isMobile = this.canvas.width < 600;
        this._avatarScale = isMobile ? 0.38 : 0.28;
        this._orbScale = isMobile ? 0.33 : 0.25;
    }

    /**
     * Handle canvas resize
     */
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.calculateLayout();
        this.stars = this.createStarfield();
        this._updateAvatarScale();
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
        const particles = [];
        const count = 80;

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 0.5 + Math.random() * 2,
                baseOpacity: 0.2 + Math.random() * 0.4,
                twinkleSpeed: 0.5 + Math.random() * 2,
                twinklePhase: Math.random() * Math.PI * 2,
                // Star color
                hue: 220 + Math.random() * 40,
                saturation: 10 + Math.random() * 30,
                // Bubble/Leaf properties
                driftSpeed: 0.15 + Math.random() * 0.4, // pixels per frame
                wobblePhase: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.3 + Math.random() * 0.7,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                leafType: Math.floor(Math.random() * 3) // 0, 1, 2 for variety
            });
        }

        return particles;
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

        if (this.currentTheme === 'underwater') {
            this._renderBubbles(t);
        } else if (this.currentTheme === 'forest') {
            this._renderLeaves(t);
        } else {
            this._renderStars(t);
        }
    }

    /**
     * Render twinkling stars (Space theme)
     */
    _renderStars(t) {
        for (const star of this.stars) {
            const twinkle = Math.sin(t * star.twinkleSpeed + star.twinklePhase);
            const opacity = star.baseOpacity * (0.5 + twinkle * 0.5);

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

            this.ctx.fillStyle = `hsla(${star.hue}, ${star.saturation}%, 95%, ${opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    /**
     * Render rising bubbles (Underwater theme)
     */
    _renderBubbles(t) {
        for (const p of this.stars) {
            // Drift upward
            p.y -= p.driftSpeed;
            // Gentle horizontal wobble
            p.x += Math.sin(t * p.wobbleSpeed + p.wobblePhase) * 0.3;

            // Wrap around when off screen
            if (p.y < -10) {
                p.y = this.canvas.height + 10;
                p.x = Math.random() * this.canvas.width;
            }
            if (p.x < -10) p.x = this.canvas.width + 10;
            if (p.x > this.canvas.width + 10) p.x = -10;

            const bubbleSize = p.size * 2.5 + 1;
            const wobble = Math.sin(t * p.twinkleSpeed + p.twinklePhase);
            const opacity = p.baseOpacity * (0.4 + wobble * 0.2);

            // Bubble body — translucent circle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, bubbleSize, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(150, 220, 255, ${opacity * 0.8})`;
            this.ctx.lineWidth = 0.8;
            this.ctx.stroke();

            // Inner fill
            const grad = this.ctx.createRadialGradient(
                p.x - bubbleSize * 0.3, p.y - bubbleSize * 0.3, 0,
                p.x, p.y, bubbleSize
            );
            grad.addColorStop(0, `rgba(200, 240, 255, ${opacity * 0.25})`);
            grad.addColorStop(0.6, `rgba(100, 200, 255, ${opacity * 0.08})`);
            grad.addColorStop(1, `rgba(80, 180, 255, 0)`);
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, bubbleSize, 0, Math.PI * 2);
            this.ctx.fill();

            // Highlight/shine spot
            this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(
                p.x - bubbleSize * 0.3,
                p.y - bubbleSize * 0.3,
                bubbleSize * 0.2,
                0, Math.PI * 2
            );
            this.ctx.fill();
        }

        // Render background sea creatures
        this._updateAndRenderCreatures(t);
    }

    /**
     * Spawn, update, and render background sea creatures
     */
    _updateAndRenderCreatures(t) {
        const now = performance.now();

        // Spawn new creature occasionally (max 3 on screen)
        if (now - this._lastCreatureSpawn > this._creatureSpawnInterval && this.bgCreatures.length < 3) {
            this._spawnCreature();
            this._lastCreatureSpawn = now;
            this._creatureSpawnInterval = 3000 + Math.random() * 4000;
        }

        // Update and render each creature
        for (let i = this.bgCreatures.length - 1; i >= 0; i--) {
            const c = this.bgCreatures[i];

            // Move horizontally
            c.x += c.speed;

            // Gentle vertical bobbing
            c.y += Math.sin(t * c.bobSpeed + c.bobPhase) * 0.3;

            // Remove if off screen
            if ((c.speed > 0 && c.x > this.canvas.width + 100) ||
                (c.speed < 0 && c.x < -100)) {
                this.bgCreatures.splice(i, 1);
                continue;
            }

            // Render the creature
            this.ctx.save();
            this.ctx.translate(c.x, c.y);
            // Flip horizontally if swimming left
            if (c.speed < 0) this.ctx.scale(-1, 1);
            this.ctx.globalAlpha = c.opacity;

            if (c.type === 'shark') {
                this._drawSharkSilhouette(c.size, t);
            } else if (c.type === 'turtle') {
                this._drawTurtleSilhouette(c.size, t);
            } else {
                this._drawWhaleSilhouette(c.size, t);
            }

            this.ctx.globalAlpha = 1;
            this.ctx.restore();
        }
    }

    /**
     * Spawn a random sea creature off-screen
     */
    _spawnCreature() {
        const types = ['shark', 'turtle', 'whale'];
        const type = types[Math.floor(Math.random() * types.length)];

        // Determine size based on type
        const sizeMap = { shark: 30 + Math.random() * 20, turtle: 22 + Math.random() * 13, whale: 45 + Math.random() * 20 };
        const speedMap = { shark: 0.5 + Math.random() * 0.4, turtle: 0.25 + Math.random() * 0.2, whale: 0.35 + Math.random() * 0.25 };

        // Swim from left or right
        const fromLeft = Math.random() > 0.5;
        const speed = fromLeft ? speedMap[type] : -speedMap[type];
        const startX = fromLeft ? -80 : this.canvas.width + 80;

        // Random depth (avoid top HUD area and bottom controls)
        const y = 120 + Math.random() * (this.canvas.height - 300);

        this.bgCreatures.push({
            type,
            x: startX,
            y,
            size: sizeMap[type],
            speed,
            opacity: 0.25 + Math.random() * 0.2, // Visible but still background
            bobSpeed: 0.3 + Math.random() * 0.5,
            bobPhase: Math.random() * Math.PI * 2
        });
    }

    /**
     * Draw a shark silhouette
     */
    _drawSharkSilhouette(size, t) {
        const tailWag = Math.sin(t * 3) * 0.15;

        this.ctx.fillStyle = 'rgba(40, 80, 120, 1)';
        this.ctx.beginPath();

        // Body
        this.ctx.moveTo(size, 0); // Nose
        this.ctx.bezierCurveTo(size * 0.7, -size * 0.35, size * 0.2, -size * 0.4, -size * 0.3, -size * 0.15);
        // Dorsal fin
        this.ctx.lineTo(-size * 0.1, -size * 0.7);
        this.ctx.lineTo(-size * 0.4, -size * 0.15);
        // Tail
        this.ctx.lineTo(-size * 0.8, -size * (0.1 + tailWag));
        this.ctx.lineTo(-size, -size * (0.35 + tailWag));
        this.ctx.lineTo(-size * 0.85, 0);
        this.ctx.lineTo(-size, size * (0.25 - tailWag));
        this.ctx.lineTo(-size * 0.8, size * (0.05 - tailWag));
        // Bottom body
        this.ctx.bezierCurveTo(-size * 0.4, size * 0.2, size * 0.2, size * 0.3, size, 0);
        this.ctx.closePath();
        this.ctx.fill();

        // Pectoral fin
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.2, size * 0.15);
        this.ctx.lineTo(0, size * 0.45);
        this.ctx.lineTo(-size * 0.2, size * 0.15);
        this.ctx.closePath();
        this.ctx.fill();

        // Eye
        this.ctx.fillStyle = 'rgba(100, 160, 200, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(size * 0.65, -size * 0.08, size * 0.05, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Draw a turtle silhouette
     */
    _drawTurtleSilhouette(size, t) {
        const flipperAngle = Math.sin(t * 2) * 0.3;

        this.ctx.fillStyle = 'rgba(50, 100, 80, 1)';

        // Shell (oval)
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, size * 0.6, size * 0.45, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Head
        this.ctx.beginPath();
        this.ctx.ellipse(size * 0.7, -size * 0.05, size * 0.2, size * 0.15, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Front flipper (top)
        this.ctx.save();
        this.ctx.translate(size * 0.2, -size * 0.35);
        this.ctx.rotate(-0.4 + flipperAngle);
        this.ctx.beginPath();
        this.ctx.ellipse(0, -size * 0.2, size * 0.12, size * 0.3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // Front flipper (bottom)
        this.ctx.save();
        this.ctx.translate(size * 0.2, size * 0.35);
        this.ctx.rotate(0.4 - flipperAngle);
        this.ctx.beginPath();
        this.ctx.ellipse(0, size * 0.2, size * 0.12, size * 0.3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // Rear flipper (top)
        this.ctx.save();
        this.ctx.translate(-size * 0.4, -size * 0.3);
        this.ctx.rotate(-0.2 - flipperAngle * 0.5);
        this.ctx.beginPath();
        this.ctx.ellipse(0, -size * 0.1, size * 0.08, size * 0.2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // Rear flipper (bottom)
        this.ctx.save();
        this.ctx.translate(-size * 0.4, size * 0.3);
        this.ctx.rotate(0.2 + flipperAngle * 0.5);
        this.ctx.beginPath();
        this.ctx.ellipse(0, size * 0.1, size * 0.08, size * 0.2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // Shell pattern
        this.ctx.strokeStyle = 'rgba(30, 80, 60, 0.5)';
        this.ctx.lineWidth = 0.8;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, size * 0.35, size * 0.25, 0, 0, Math.PI * 2);
        this.ctx.stroke();

        // Eye
        this.ctx.fillStyle = 'rgba(100, 170, 140, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(size * 0.82, -size * 0.06, size * 0.04, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Draw a whale silhouette
     */
    _drawWhaleSilhouette(size, t) {
        const tailWag = Math.sin(t * 1.5) * 0.1;

        this.ctx.fillStyle = 'rgba(30, 60, 100, 1)';
        this.ctx.beginPath();

        // Body — large, rounded
        this.ctx.moveTo(size, -size * 0.05);
        // Top curve
        this.ctx.bezierCurveTo(size * 0.7, -size * 0.45, size * 0.1, -size * 0.5, -size * 0.3, -size * 0.3);
        // Back slope to tail
        this.ctx.bezierCurveTo(-size * 0.6, -size * 0.2, -size * 0.8, -size * 0.1, -size * 0.85, 0);
        // Tail fluke (top)
        this.ctx.lineTo(-size, -size * (0.3 + tailWag));
        this.ctx.lineTo(-size * 0.8, size * 0.02);
        // Tail fluke (bottom)
        this.ctx.lineTo(-size, size * (0.35 - tailWag));
        this.ctx.lineTo(-size * 0.85, size * 0.05);
        // Bottom body
        this.ctx.bezierCurveTo(-size * 0.6, size * 0.25, size * 0.1, size * 0.4, size, size * 0.05);
        this.ctx.closePath();
        this.ctx.fill();

        // Belly (lighter underbelly)
        this.ctx.fillStyle = 'rgba(50, 90, 140, 0.5)';
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.8, size * 0.05);
        this.ctx.bezierCurveTo(size * 0.4, size * 0.3, -size * 0.2, size * 0.25, -size * 0.6, size * 0.1);
        this.ctx.bezierCurveTo(-size * 0.2, size * 0.15, size * 0.4, size * 0.15, size * 0.8, size * 0.05);
        this.ctx.fill();

        // Pectoral fin
        this.ctx.fillStyle = 'rgba(30, 60, 100, 1)';
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.3, size * 0.15);
        this.ctx.bezierCurveTo(size * 0.2, size * 0.4, 0, size * 0.45, -size * 0.1, size * 0.2);
        this.ctx.closePath();
        this.ctx.fill();

        // Eye
        this.ctx.fillStyle = 'rgba(80, 140, 180, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(size * 0.7, -size * 0.05, size * 0.04, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Render falling leaves (Forest theme)
     */
    _renderLeaves(t) {
        const leafColors = [
            [60, 140, 40],   // Green
            [90, 160, 50],   // Light green
            [50, 120, 30],   // Dark green
            [140, 160, 40],  // Yellow-green
            [170, 130, 40],  // Autumn gold
        ];

        for (const p of this.stars) {
            // Drift downward
            p.y += p.driftSpeed * 0.6;
            // Gentle horizontal sway
            p.x += Math.sin(t * p.wobbleSpeed + p.wobblePhase) * 0.4;
            // Rotate slowly
            p.rotation += p.rotationSpeed;

            // Wrap around
            if (p.y > this.canvas.height + 10) {
                p.y = -10;
                p.x = Math.random() * this.canvas.width;
            }
            if (p.x < -10) p.x = this.canvas.width + 10;
            if (p.x > this.canvas.width + 10) p.x = -10;

            const wobble = Math.sin(t * p.twinkleSpeed + p.twinklePhase);
            const opacity = p.baseOpacity * (0.5 + wobble * 0.2);
            const leafSize = p.size * 2 + 1;
            const color = leafColors[p.leafType % leafColors.length];

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.globalAlpha = opacity;

            // Draw a simple leaf shape
            this.ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            this.ctx.beginPath();
            // Leaf body using bezier curves
            this.ctx.moveTo(0, -leafSize);
            this.ctx.bezierCurveTo(
                leafSize * 0.8, -leafSize * 0.5,
                leafSize * 0.8, leafSize * 0.5,
                0, leafSize
            );
            this.ctx.bezierCurveTo(
                -leafSize * 0.8, leafSize * 0.5,
                -leafSize * 0.8, -leafSize * 0.5,
                0, -leafSize
            );
            this.ctx.fill();

            // Leaf vein (center line)
            this.ctx.strokeStyle = `rgba(${color[0] - 20}, ${color[1] - 20}, ${color[2] - 10}, ${opacity * 0.5})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -leafSize * 0.8);
            this.ctx.lineTo(0, leafSize * 0.8);
            this.ctx.stroke();

            this.ctx.globalAlpha = 1;
            this.ctx.restore();
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
                wallX, wallY, this.cellSize * 0.3
            );
            gradient.addColorStop(0, `rgba(255, 80, 80, ${opacity * pulse})`);
            gradient.addColorStop(1, 'rgba(255, 80, 80, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(wallX, wallY, this.cellSize * 0.3, 0, Math.PI * 2);
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
     * Render the player character based on theme
     */
    renderPlayer(renderX, renderY, glowIntensity, energy = 1, rotationAngle = 0, reactivity = {}) {
        const pos = this.gridToScreen(renderX, renderY);
        const color = this.themes[this.currentTheme].orb;

        const flash = reactivity.collisionFlash || 0;
        const shake = reactivity.collisionShake || 0;
        const squash = reactivity.squashStretch || { x: 1, y: 1 };
        const speed = reactivity.speedStretch || 0;
        const lean = reactivity.leanAngle || 0;

        this.ctx.save();

        // Apply collision shake as random offset
        const shakeX = shake * (Math.random() - 0.5) * this.cellSize * 0.3;
        const shakeY = shake * (Math.random() - 0.5) * this.cellSize * 0.3;
        this.ctx.translate(pos.x + shakeX, pos.y + shakeY);

        // Apply squash/stretch deformation
        this.ctx.scale(squash.x, squash.y);

        // Combined visual angle (rotation + banking lean)
        const visualAngle = rotationAngle + lean;

        // Character rendering based on theme
        if (this.currentTheme === 'space') {
            this.renderSpaceship(0, 0, color, glowIntensity, energy, visualAngle, speed, flash);
        } else if (this.currentTheme === 'underwater') {
            this.renderFish(0, 0, color, glowIntensity, energy, visualAngle, speed, flash);
        } else {
            // Default orb (Forest/Default)
            this.renderOrb(0, 0, color, glowIntensity, energy, flash);
        }

        // Collision flash overlay — white flash on the entire avatar area
        if (flash > 0.05) {
            this.ctx.globalCompositeOperation = 'screen';
            const flashRadius = this.cellSize * 0.5;
            const flashGrad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, flashRadius);
            flashGrad.addColorStop(0, `rgba(255, 255, 255, ${flash * 0.7})`);
            flashGrad.addColorStop(0.5, `rgba(255, 200, 200, ${flash * 0.3})`);
            flashGrad.addColorStop(1, `rgba(255, 150, 150, 0)`);
            this.ctx.fillStyle = flashGrad;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, flashRadius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalCompositeOperation = 'source-over';
        }

        this.ctx.restore();
    }

    /**
     * Render standard Orb character
     */
    renderOrb(x, y, color, glowIntensity, energy, flash = 0) {
        const radius = this.cellSize * this._orbScale * Math.min(1, 0.5 + energy * 0.5); // Shrink slightly if low energy

        // Collision pulse — boost glow on hit
        const effectiveGlow = glowIntensity + flash * 1.5;

        // Inner core — flash shifts color toward white
        const cr = Math.min(255, color.r + flash * 75);
        const cg = Math.min(255, color.g + flash * 75);
        const cb = Math.min(255, color.b + flash * 75);

        this.ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
        this.ctx.shadowBlur = 20 * effectiveGlow;
        this.ctx.shadowColor = `rgb(${cr}, ${cg}, ${cb})`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
        this.ctx.fill();

        // Outer glow halo
        const gradient = this.ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 1.5);
        gradient.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${0.6 * effectiveGlow})`);
        gradient.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Middle glow
        const midGlow = this.ctx.createRadialGradient(
            0, 0, 0,
            0, 0, 30
        );
        midGlow.addColorStop(0, `rgba(${color.r + 40}, ${color.g + 30}, ${color.b}, ${0.4 * effectiveGlow})`);
        midGlow.addColorStop(0.6, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.2 * effectiveGlow})`);
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
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.95 * effectiveGlow})`);
        coreGradient.addColorStop(0.5, `rgba(${color.r + 50}, ${color.g + 40}, ${color.b}, ${0.8 * effectiveGlow})`);
        coreGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.4 * effectiveGlow})`);

        this.ctx.fillStyle = coreGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Render retro Spaceship character
     */
    renderSpaceship(x, y, color, glowIntensity, energy, angle, speed = 0, flash = 0) {
        const size = this.cellSize * this._avatarScale;

        // Apply speed stretch — elongate in movement direction
        const stretchScale = 1 + speed * 0.15;
        this.ctx.save();
        this.ctx.rotate(angle);
        this.ctx.scale(stretchScale, 1 / Math.sqrt(stretchScale)); // Stretch forward, compress height

        // Engine glow (behind) — boosted when moving
        const engineLength = 1.8 + speed * 1.2; // Gets longer with speed
        const engineOpacity = Math.min(1, 0.8 * energy + speed * 0.5);
        const engineGlow = this.ctx.createLinearGradient(-size, 0, -size * engineLength, 0);
        engineGlow.addColorStop(0, `rgba(100, 200, 255, ${engineOpacity})`);
        engineGlow.addColorStop(0.4, `rgba(150, 220, 255, ${engineOpacity * 0.6})`);
        engineGlow.addColorStop(1, 'rgba(100, 200, 255, 0)');

        this.ctx.fillStyle = engineGlow;
        this.ctx.beginPath();
        this.ctx.moveTo(-size * 0.5, size * (0.3 + speed * 0.1));
        this.ctx.lineTo(-size * engineLength, 0);
        this.ctx.lineTo(-size * 0.5, -size * (0.3 + speed * 0.1));
        this.ctx.fill();

        // Ship body (Triangle) — flash shifts color toward white
        const cr = Math.min(255, color.r + flash * 75);
        const cg = Math.min(255, color.g + flash * 75);
        const cb = Math.min(255, color.b + flash * 75);

        this.ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
        this.ctx.shadowBlur = 15 * (glowIntensity + flash);
        this.ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, 0.5)`;

        this.ctx.beginPath();
        this.ctx.moveTo(size, 0); // Nose
        this.ctx.lineTo(-size * 0.6, size * 0.6); // Right wing
        this.ctx.lineTo(-size * 0.3, 0); // Center notch
        this.ctx.lineTo(-size * 0.6, -size * 0.6); // Left wing
        this.ctx.closePath();
        this.ctx.fill();

        // Cockpit window
        this.ctx.fillStyle = `rgba(255, 255, 255, ${0.9 + flash * 0.1})`;
        this.ctx.shadowBlur = 5 + flash * 10;
        this.ctx.shadowColor = 'white';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    /**
     * Render Stylized Fish character
     */
    renderFish(x, y, color, glowIntensity, energy, angle, speed = 0, flash = 0) {
        const size = this.cellSize * this._avatarScale;
        const time = performance.now() / 200;

        // Apply speed stretch
        const stretchScale = 1 + speed * 0.12;
        this.ctx.save();
        this.ctx.rotate(angle); // Face movement direction
        this.ctx.scale(stretchScale, 1 / Math.sqrt(stretchScale));

        // Tail wiggle animation — faster when moving
        const wiggleSpeed = 5 + speed * 12;
        const wiggleAmount = 0.2 + speed * 0.25;
        const tailWiggle = Math.sin(time * wiggleSpeed) * wiggleAmount;

        // Flash shifts color toward white on collision
        const cr = Math.min(255, color.r + flash * 75);
        const cg = Math.min(255, color.g + flash * 75);
        const cb = Math.min(255, color.b + flash * 75);

        this.ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
        this.ctx.shadowBlur = 15 * (glowIntensity + flash);
        this.ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, 0.5)`;

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

        // Eye — widens on collision
        const eyeSize = size * (0.15 + flash * 0.08);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${0.9 + flash * 0.1})`;
        this.ctx.beginPath();
        this.ctx.arc(size * 0.4, -size * 0.2, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();

        // Pupil
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(size * 0.43, -size * 0.2, eyeSize * 0.45, 0, Math.PI * 2);
        this.ctx.fill();

        // Side fin — more animated during movement
        const finWave = Math.sin(time * (3 + speed * 5)) * (0.1 + speed * 0.15);
        this.ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, 0.8)`;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-size * 0.3, size * (0.4 + finWave));
        this.ctx.lineTo(size * 0.2, size * 0.2);
        this.ctx.fill();

        this.ctx.restore();
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
     * Render the solution path
     * @param {Array} path Array of grid coordinates {x, y}
     * @param {number} progress 0-1 percentage of path to draw
     */
    renderSolutionPath(path, progress) {
        if (!path || path.length < 2) return;

        const pointsToDraw = Math.floor(path.length * progress);
        if (pointsToDraw < 1) return;

        this.ctx.save();
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Outer glow
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = 'rgba(100, 255, 218, 0.8)'; // Cyan/Teal neon glow
        this.ctx.strokeStyle = 'rgba(100, 255, 218, 0.6)';
        this.ctx.lineWidth = 4;

        this.ctx.beginPath();
        const startPos = this.gridToScreen(path[0].x, path[0].y);
        this.ctx.moveTo(startPos.x, startPos.y);

        for (let i = 1; i < pointsToDraw; i++) {
            const pos = this.gridToScreen(path[i].x, path[i].y);
            this.ctx.lineTo(pos.x, pos.y);
        }

        // Draw partial segment for smooth animation
        if (pointsToDraw < path.length) {
            const partial = (path.length * progress) - pointsToDraw;
            const current = path[pointsToDraw - 1];
            const next = path[pointsToDraw];

            const currentPos = this.gridToScreen(current.x, current.y);
            const nextPos = this.gridToScreen(next.x, next.y);

            const x = currentPos.x + (nextPos.x - currentPos.x) * partial;
            const y = currentPos.y + (nextPos.y - currentPos.y) * partial;

            this.ctx.lineTo(x, y);
        }

        this.ctx.stroke();

        // Inner bright line
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = 'rgba(200, 255, 255, 0.9)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.restore();
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
