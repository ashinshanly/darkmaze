/**
 * Particle System — Invisible Maze
 * Ambient floating particles that respond to player proximity
 */

export class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.particles = [];
        this.count = 120;
        this.playerInfluenceRadius = 150; // pixels
        this.wallProximity = 0; // 0-4 walls adjacent to player

        // Theme configuration
        this.themes = {
            space: { baseHue: 180, hueRange: 40, saturation: 80, lightness: 75 },
            underwater: { baseHue: 200, hueRange: 30, saturation: 70, lightness: 65 },
            forest: { baseHue: 45, hueRange: 25, saturation: 85, lightness: 70 }
        };
        this.currentTheme = 'space';

        this.init();
    }

    /**
     * Initialize particle field
     */
    init() {
        this.particles = [];
        for (let i = 0; i < this.count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    /**
     * Create a single particle
     */
    createParticle(x = null, y = null) {
        return {
            x: x ?? Math.random() * this.canvas.width,
            y: y ?? Math.random() * this.canvas.height,
            baseX: x ?? Math.random() * this.canvas.width,
            baseY: y ?? Math.random() * this.canvas.height,
            size: 1 + Math.random() * 2,
            opacity: 0.1 + Math.random() * 0.15,
            driftSpeed: 0.2 + Math.random() * 0.3,
            driftAngle: Math.random() * Math.PI * 2,
            driftRadius: 20 + Math.random() * 40,
            phase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.5 + Math.random() * 0.5
        };
    }

    /**
     * Update all particles
     * @param wallProximity - number of walls (0-4) adjacent to player's cell
     */
    update(currentTime, playerScreenX, playerScreenY, isConverging = false, goalScreenX = 0, goalScreenY = 0, wallProximity = 0) {
        const time = currentTime / 1000;
        this.wallProximity = wallProximity;

        // Wall proximity affects particle behavior
        const proximityFactor = wallProximity / 4; // 0-1 normalized

        for (const particle of this.particles) {
            if (isConverging) {
                // Converge toward goal on win
                const dx = goalScreenX - particle.x;
                const dy = goalScreenY - particle.y;
                particle.x += dx * 0.02;
                particle.y += dy * 0.02;
                particle.opacity = Math.min(0.5, particle.opacity + 0.01);
            } else {
                // Natural drift motion (using noise-like movement)
                // Increase erratic movement when near walls
                const agitation = 1 + proximityFactor * 1.5;
                const driftX = Math.cos(time * particle.driftSpeed * agitation + particle.phase) * particle.driftRadius;
                const driftY = Math.sin(time * particle.driftSpeed * 0.7 * agitation + particle.phase) * particle.driftRadius;

                // Target position
                let targetX = particle.baseX + driftX;
                let targetY = particle.baseY + driftY;

                // Player influence - push particles away (stronger when near walls)
                const dx = particle.x - playerScreenX;
                const dy = particle.y - playerScreenY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.playerInfluenceRadius && distance > 0) {
                    const influence = 1 - (distance / this.playerInfluenceRadius);
                    const pushStrength = influence * (30 + proximityFactor * 20);
                    targetX += (dx / distance) * pushStrength;
                    targetY += (dy / distance) * pushStrength;
                }

                // Smooth movement toward target
                particle.x += (targetX - particle.x) * 0.02;
                particle.y += (targetY - particle.y) * 0.02;

                // Opacity pulsing - brighter when near walls
                const baseOpacity = 0.1 + proximityFactor * 0.15;
                const pulseAmount = 0.08 + proximityFactor * 0.1;
                particle.opacity = baseOpacity + Math.sin(time * particle.pulseSpeed * (1 + proximityFactor) + particle.phase) * pulseAmount;
            }

            // Wrap around screen edges
            if (particle.x < -50) particle.x = this.canvas.width + 50;
            if (particle.x > this.canvas.width + 50) particle.x = -50;
            if (particle.y < -50) particle.y = this.canvas.height + 50;
            if (particle.y > this.canvas.height + 50) particle.y = -50;
        }
    }

    /**
     * Render all particles - firefly style with glow
     * Colors shift based on theme and wall proximity
     */
    render(ctx) {
        const theme = this.themes[this.currentTheme];
        const proximityFactor = this.wallProximity / 4;

        // Shift hue toward warmer colors when near walls (add orange/red tint)
        const warmShift = proximityFactor * 30;

        for (const particle of this.particles) {
            // Firefly glow effect
            const glowRadius = particle.size * (4 + proximityFactor * 2);
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, glowRadius
            );

            // Theme-based colors with wall proximity warm shift
            const hue = theme.baseHue + Math.sin(particle.phase) * theme.hueRange - warmShift;
            const sat = theme.saturation + proximityFactor * 10;
            const light = theme.lightness + proximityFactor * 10;

            gradient.addColorStop(0, `hsla(${hue}, ${sat}%, ${light}%, ${particle.opacity * 0.9})`);
            gradient.addColorStop(0.4, `hsla(${hue}, ${sat - 10}%, ${light - 15}%, ${particle.opacity * 0.4})`);
            gradient.addColorStop(1, `hsla(${hue}, ${sat - 20}%, ${light - 25}%, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            // Bright core
            ctx.fillStyle = `hsla(${hue}, 100%, 90%, ${particle.opacity})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Resize handler - update base positions
     */
    resize() {
        for (const particle of this.particles) {
            particle.baseX = Math.random() * this.canvas.width;
            particle.baseY = Math.random() * this.canvas.height;
            particle.x = particle.baseX;
            particle.y = particle.baseY;
        }
    }

    /**
     * Set the visual theme
     */
    setTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
        }
    }
}
