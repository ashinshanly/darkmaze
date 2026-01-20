/**
 * Main Game Controller — Invisible Maze
 * Coordinates all game systems and handles the main loop
 * Enhanced with energy system, time limit, and game over conditions
 */

import { Maze } from './maze.js';
import { Player } from './player.js';
import { ParticleSystem } from './particles.js';
import { Renderer } from './renderer.js';
import { Effects } from './effects.js';
import { Audio } from './audio.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.winScreen = document.getElementById('winScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.instructions = document.getElementById('instructions');
        this.hud = document.getElementById('hud');

        // HUD elements
        this.hudMoves = document.getElementById('hudMoves');
        this.hudTime = document.getElementById('hudTime');
        this.energyFill = document.getElementById('energyFill');

        // Initialize systems
        this.maze = new Maze(10, 10);
        this.player = new Player(0, 0);
        this.renderer = new Renderer(this.canvas);
        this.particles = new ParticleSystem(this.canvas);
        this.effects = new Effects();
        this.audio = new Audio();

        // Game state
        this.state = 'playing'; // playing, winning, won, gameover
        this.winProgress = 0;
        this.paletteIndex = 0;

        // Energy system
        this.energy = 1.0; // 0-1
        this.maxEnergy = 1.0;
        this.energyLossPerCollision = 0.06; // Lose ~6% per collision (about 16 hits to game over)

        // Time system
        this.timeLimit = 180; // 3 minutes in seconds
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.remainingTime = this.timeLimit;

        // Input state
        this.inputEnabled = true;
        this.hasMovedOnce = false;

        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.gameLoop = this.gameLoop.bind(this);

        // Setup
        this.setupEventListeners();
        this.handleResize();

        // Start game loop
        requestAnimationFrame(this.gameLoop);

        // Expose for debugging
        window.game = this;
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('resize', this.handleResize);

        // Restart button (win screen)
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });

        // Retry button (game over screen)
        document.getElementById('retryBtn').addEventListener('click', () => {
            this.restart();
        });

        // Initialize audio on first click/key
        const initAudio = () => {
            this.audio.init();
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
        };
        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);
    }

    /**
     * Handle keyboard input
     */
    handleKeyDown(e) {
        if (this.state !== 'playing' || !this.inputEnabled) return;
        if (!this.player.canAcceptInput()) return;

        let direction = null;
        let dx = 0, dy = 0;

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                direction = 'n';
                dy = -1;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                direction = 's';
                dy = 1;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                direction = 'w';
                dx = -1;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                direction = 'e';
                dx = 1;
                break;
            default:
                return;
        }

        e.preventDefault();

        // First move - fade instructions and show HUD
        if (!this.hasMovedOnce) {
            this.hasMovedOnce = true;
            this.instructions.classList.add('fade-out');
            this.hud.classList.add('visible');
            this.startTime = Date.now(); // Start timer on first move
        }

        // Check if move is blocked
        const blocked = this.maze.canMove(this.player.gridX, this.player.gridY, direction);

        if (blocked) {
            // Collision!
            this.handleCollision(direction, dx, dy);
        } else {
            // Valid move
            this.handleMove(dx, dy);
        }
    }

    /**
     * Handle valid movement
     */
    handleMove(dx, dy) {
        const newX = this.player.gridX + dx;
        const newY = this.player.gridY + dy;

        // Update player movement
        this.player.moveFrom = { x: this.player.gridX, y: this.player.gridY };
        this.player.moveTo = { x: newX, y: newY };
        this.player.isMoving = true;
        this.player.moveStartTime = performance.now();
        this.player.addGhost();
        this.player.moveCount++;

        // Play move sound
        this.audio.playMove();

        // Check for win
        if (this.maze.isGoal(newX, newY)) {
            this.triggerWin();
        }
    }

    /**
     * Handle wall collision
     */
    handleCollision(direction, dx, dy) {
        // Bounce player
        this.player.bounce({ x: dx, y: dy });
        this.player.collisionCount++;

        // Lose energy
        this.energy = Math.max(0, this.energy - this.energyLossPerCollision);

        // Update energy bar visual
        this.updateEnergyBar();

        // Check for game over
        if (this.energy <= 0) {
            this.triggerGameOver('energy');
            return;
        }

        // Play collision sound
        this.audio.playCollision();

        // Get wall position for visual effect
        const wallPos = this.renderer.getWallPosition(
            this.player.gridX + dx,
            this.player.gridY + dy,
            direction
        );

        // Trigger visual effects
        this.effects.triggerCollision(
            wallPos.x,
            wallPos.y,
            wallPos.width,
            wallPos.height,
            direction
        );
    }

    /**
     * Update energy bar visual
     */
    updateEnergyBar() {
        const percentage = this.energy * 100;
        this.energyFill.style.width = `${percentage}%`;

        // Update color class based on energy level
        this.energyFill.classList.remove('medium', 'low');
        if (this.energy < 0.3) {
            this.energyFill.classList.add('low');
        } else if (this.energy < 0.6) {
            this.energyFill.classList.add('medium');
        }
    }

    /**
     * Update HUD display
     */
    updateHUD() {
        // Update moves
        this.hudMoves.textContent = this.player.moveCount;

        // Update time
        if (this.hasMovedOnce) {
            this.elapsedTime = (Date.now() - this.startTime) / 1000;
            this.remainingTime = Math.max(0, this.timeLimit - this.elapsedTime);

            const minutes = Math.floor(this.remainingTime / 60);
            const seconds = Math.floor(this.remainingTime % 60);
            this.hudTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Check for time-based game over
            if (this.remainingTime <= 0 && this.state === 'playing') {
                this.triggerGameOver('time');
            }

            // Update HUD urgency state
            this.updateHUDUrgency();
        }
    }

    /**
     * Update HUD urgency based on time remaining
     */
    updateHUDUrgency() {
        this.hud.classList.remove('urgency-low', 'urgency-medium', 'urgency-high');

        if (this.remainingTime > 120) {
            this.hud.classList.add('urgency-low');
        } else if (this.remainingTime > 60) {
            this.hud.classList.add('urgency-medium');
        } else {
            this.hud.classList.add('urgency-high');
        }
    }

    /**
     * Trigger game over
     */
    triggerGameOver(reason) {
        this.state = 'gameover';

        // Update game over screen
        document.getElementById('goMoves').textContent = this.player.moveCount;

        const reasonText = document.getElementById('gameOverReason');
        if (reason === 'energy') {
            reasonText.textContent = 'Your energy faded into the walls.';
        } else if (reason === 'time') {
            reasonText.textContent = 'Time dissolved around you.';
        }

        // Show game over screen
        this.gameOverScreen.classList.remove('hidden');
        void this.gameOverScreen.offsetWidth; // Force reflow
        this.gameOverScreen.classList.add('visible');

        // Hide HUD
        this.hud.classList.add('hidden');
    }

    /**
     * Trigger win sequence
     */
    triggerWin() {
        this.state = 'winning';

        // Play win sound
        this.audio.playWin();

        // Start win effects
        this.effects.startWinSequence();

        // Get goal screen position
        const goalPos = this.renderer.gridToScreen(this.maze.goal.x, this.maze.goal.y);
        this.effects.triggerGoalReveal(goalPos.x, goalPos.y);
    }

    /**
     * Show win screen with stats
     */
    showWinScreen() {
        this.state = 'won';

        // Calculate actual time taken
        const timeTaken = this.timeLimit - this.remainingTime;
        const minutes = Math.floor(timeTaken / 60);
        const seconds = Math.floor(timeTaken % 60);

        // Update stats
        document.getElementById('statMoves').textContent = this.player.moveCount;
        document.getElementById('statCollisions').textContent = this.player.collisionCount;
        document.getElementById('statTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Show win screen
        this.winScreen.classList.remove('hidden');
        void this.winScreen.offsetWidth;
        this.winScreen.classList.add('visible');

        // Hide HUD
        this.hud.classList.add('hidden');
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.renderer.resize();
        this.renderer.calculateLayout(this.maze.width, this.maze.height);
        this.particles.resize();
    }

    /**
     * Restart the game
     */
    restart() {
        // Generate new maze
        this.maze.regenerate();

        // Reset player
        this.player.reset(0, 0);

        // Reset effects
        this.effects.reset();

        // Reset game state
        this.state = 'playing';
        this.winProgress = 0;
        this.hasMovedOnce = false;

        // Reset energy
        this.energy = 1.0;
        this.updateEnergyBar();

        // Reset time
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.remainingTime = this.timeLimit;
        this.hudTime.textContent = '3:00';

        // Hide screens
        this.winScreen.classList.remove('visible');
        this.gameOverScreen.classList.remove('visible');
        setTimeout(() => {
            this.winScreen.classList.add('hidden');
            this.gameOverScreen.classList.add('hidden');
        }, 500);

        // Reset HUD
        this.hud.classList.remove('hidden', 'visible', 'urgency-low', 'urgency-medium', 'urgency-high');
        this.hudMoves.textContent = '0';

        // Show instructions again
        this.instructions.classList.remove('fade-out');

        // Cycle color palette
        this.paletteIndex = (this.paletteIndex + 1) % 4;
        document.body.className = `palette-${this.paletteIndex + 1}`;

        // Reinitialize particles
        this.particles.init();
    }

    /**
     * Main game loop
     */
    gameLoop(currentTime) {
        // Update systems
        this.player.update(currentTime);

        // Update HUD
        if (this.state === 'playing') {
            this.updateHUD();
        }

        // Get player screen position
        const playerPos = this.renderer.gridToScreen(
            this.player.renderX,
            this.player.renderY
        );

        // Goal position for particle convergence
        const goalPos = this.renderer.gridToScreen(
            this.maze.goal.x,
            this.maze.goal.y
        );

        // Update time-based rendering
        this.renderer.updateTimePhase(this.elapsedTime, this.timeLimit);

        // Update particles
        const isConverging = this.state === 'winning' || this.state === 'won';
        this.particles.update(currentTime, playerPos.x, playerPos.y, isConverging, goalPos.x, goalPos.y);

        // Update effects
        this.effects.update();

        // Handle win progression
        if (this.state === 'winning') {
            this.winProgress += 0.015;
            if (this.winProgress >= 1) {
                this.showWinScreen();
            }
        }

        // Render
        this.render(currentTime, playerPos.x, playerPos.y);

        // Continue loop
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Render all visual elements
     */
    render(currentTime, playerScreenX, playerScreenY) {
        // Clear canvas
        this.renderer.clear();

        // Background
        this.renderer.renderBackground(currentTime);

        // Light rays (bent by player)
        this.renderer.renderLightRays(currentTime, playerScreenX, playerScreenY);

        // Start point marker (only if not at start and game is playing)
        if (this.state === 'playing' || this.state === 'winning') {
            this.renderer.renderStartPoint(this.maze.start.x, this.maze.start.y);
        }

        // End point marker (always visible as beckoning target)
        if (this.state === 'playing') {
            this.renderer.renderEndPoint(this.maze.goal.x, this.maze.goal.y);
        }

        // Particles
        this.particles.render(this.renderer.ctx);

        // Ghost afterimages
        this.renderer.renderGhosts(this.player.ghosts);

        // Trails
        this.renderer.renderTrails(this.player.trails);

        // Goal (only during win)
        if (this.state === 'winning' || this.state === 'won') {
            this.renderer.renderGoal(this.maze.goal.x, this.maze.goal.y, this.winProgress);
        }

        // Player (with energy affecting appearance)
        this.renderer.renderPlayer(
            this.player.renderX,
            this.player.renderY,
            this.player.glowIntensity,
            this.energy
        );
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
