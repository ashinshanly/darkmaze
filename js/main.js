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
import { Leaderboard } from './leaderboard.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.winScreen = document.getElementById('winScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.instructions = document.getElementById('instructions');
        this.hud = document.getElementById('hud');
        this.startScreen = document.getElementById('startScreen');
        this.beginBtn = document.getElementById('beginBtn');

        // UI for Leaderboard
        this.winLeaderboard = document.getElementById('winLeaderboard');
        this.gameOverLeaderboard = document.getElementById('gameOverLeaderboard');
        this.nameEntryForm = document.getElementById('nameEntryForm');
        this.playerNameInput = document.getElementById('playerNameInput');
        this.submitScoreBtn = document.getElementById('submitScoreBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.quickRestartBtn = document.getElementById('quickRestart');

        // HUD elements
        this.hudMoves = document.getElementById('hudMoves');
        this.hudTime = document.getElementById('hudTime');
        this.energyFill = document.getElementById('energyFill');

        // Combo UI elements
        this.comboCounter = document.getElementById('comboCounter');
        this.comboValue = document.getElementById('comboValue');
        this.messagePopup = document.getElementById('messagePopup');

        // Initialize systems
        this.maze = new Maze(10, 10);
        this.player = new Player(0, 0);
        this.renderer = new Renderer(this.canvas);
        this.particles = new ParticleSystem(this.canvas);
        this.effects = new Effects();
        this.audio = new Audio();
        this.leaderboard = new Leaderboard();

        // Game state
        this.state = 'menu'; // menu, playing, winning, won, gameover
        this.winProgress = 0;
        this.pathProgress = 0;
        this.solutionPath = [];
        this.paletteIndex = 0;

        // Energy system
        this.energy = 1.0; // 0-1
        this.maxEnergy = 1.0;
        this.energyLossPerCollision = 0.03; // Lose ~3% per collision (about 33 hits to game over)

        // Time system
        this.timeLimit = 90; // 1.5 minutes in seconds
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.remainingTime = this.timeLimit;

        // Combo system
        this.combo = 0;
        this.maxCombo = 0;
        this.lastMessageTime = 0;
        this.messages = [
            { threshold: 3, texts: ['Nice!', 'Good!', 'Smooth!'] },
            { threshold: 5, texts: ['Great!', 'On fire!', 'Impressive!'] },
            { threshold: 10, texts: ['Amazing!', 'Unstoppable!', 'Legend!'] },
            { threshold: 15, texts: ['Incredible!', 'Master!', 'Godlike!'] }
        ];

        // Input state
        this.inputEnabled = true;
        this.hasMovedOnce = false;
        this.scoreSubmitted = false;

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
        this.restartBtn.addEventListener('click', () => {
            this.restart();
        });

        // Submit Score button
        this.submitScoreBtn.addEventListener('click', () => {
            this.submitScore();
        });

        // Retry button (game over screen)
        document.getElementById('retryBtn').addEventListener('click', () => {
            this.restart();
        });

        // Theme toggle button
        this.themeNameEl = document.getElementById('themeName');
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.cycleTheme();
            // Update button text
            if (this.themeNameEl) {
                this.themeNameEl.textContent = this.renderer.themes[this.renderer.getCurrentTheme()].name;
            }
        });

        // Mobile touch controls
        this.setupMobileControls();

        // Quick Restart button
        this.quickRestartBtn.addEventListener('click', () => {
            this.restart();
        });

        // Begin button
        this.beginBtn.addEventListener('click', () => {
            this.startGame();
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
     * Start the game from the menu
     */
    startGame() {
        if (this.state !== 'menu') return;

        // Transition visuals
        this.startScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
        this.hud.classList.add('visible');
        this.quickRestartBtn.classList.remove('hidden');

        // Set state
        this.state = 'playing';
        this.startTime = Date.now();

        // Show instructions briefly
        this.instructions.classList.remove('fade-out');
        setTimeout(() => {
            this.instructions.classList.add('fade-out');
        }, 5000);

        // Trigger start portal animation
        const startPos = this.renderer.gridToScreen(this.maze.start.x, this.maze.start.y);
        this.effects.triggerStartPortal(startPos.x, startPos.y);

        // Ensure audio works
        this.audio.init();
    }

    /**
     * Handle first move logic
     */
    onFirstMove() {
        this.hasMovedOnce = true;
        this.instructions.classList.add('fade-out');
        this.startTime = Date.now();

        // Ensure HUD is visible (in case it wasn't already)
        this.hud.classList.remove('hidden');
        this.hud.classList.add('visible');
    }

    /**
     * Setup mobile touch controls
     */
    setupMobileControls() {
        const controls = {
            btnUp: { direction: 'n', dx: 0, dy: -1 },
            btnDown: { direction: 's', dx: 0, dy: 1 },
            btnLeft: { direction: 'w', dx: -1, dy: 0 },
            btnRight: { direction: 'e', dx: 1, dy: 0 }
        };

        Object.entries(controls).forEach(([id, { direction, dx, dy }]) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            // Touch events for mobile
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                btn.classList.add('pressed');
                this.handleMobileInput(direction, dx, dy);
            });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                btn.classList.remove('pressed');
            });

            btn.addEventListener('touchcancel', () => {
                btn.classList.remove('pressed');
            });

            // Mouse events for testing on desktop
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                btn.classList.add('pressed');
                this.handleMobileInput(direction, dx, dy);
            });

            btn.addEventListener('mouseup', () => {
                btn.classList.remove('pressed');
            });

            btn.addEventListener('mouseleave', () => {
                btn.classList.remove('pressed');
            });
        });
    }

    /**
     * Handle mobile touch input
     */
    handleMobileInput(direction, dx, dy) {
        if (this.state !== 'playing' || !this.inputEnabled) return;
        if (!this.player.canAcceptInput()) return;

        // First move - fade instructions and start timer
        if (!this.hasMovedOnce) {
            this.onFirstMove();
        }

        // Check if move is blocked
        const blocked = this.maze.canMove(this.player.gridX, this.player.gridY, direction);

        if (blocked) {
            this.handleCollision(direction, dx, dy);
        } else {
            this.handleMove(dx, dy);
        }
    }

    /**
     * Handle keyboard input
     */
    handleKeyDown(e) {
        // Theme switching - works anytime
        if (e.key === 't' || e.key === 'T') {
            // Don't switch theme if typing name
            if (document.activeElement === this.playerNameInput) return;
            this.cycleTheme();
            return;
        }

        if (this.state !== 'playing' || !this.inputEnabled) return;
        if (!this.player.canAcceptInput()) return;

        // First move
        if (!this.hasMovedOnce) {
            this.onFirstMove();
        }

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
            this.audio.startAmbient(); // Start ambient soundtrack
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
     * Cycle through available themes
     */
    cycleTheme() {
        const themes = this.renderer.getThemeNames();
        const currentIndex = themes.indexOf(this.renderer.getCurrentTheme());
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];

        this.renderer.setTheme(nextTheme);
        this.particles.setTheme(nextTheme);

        // Update button text
        if (this.themeNameEl) {
            this.themeNameEl.textContent = this.renderer.themes[nextTheme].name;
        }

        // Show theme name briefly
        this.showMessage(this.renderer.themes[nextTheme].name);
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

        // Increment combo
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.updateComboUI();

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

        // Reset combo
        this.combo = 0;
        this.updateComboUI();

        // Add wall memory
        this.renderer.addWallMemory(this.player.gridX, this.player.gridY, direction);

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

            // Update ambient audio intensity based on remaining time
            const remainingRatio = this.remainingTime / this.timeLimit;
            this.audio.updateIntensity(remainingRatio);

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
     * Update combo counter UI
     */
    updateComboUI() {
        if (!this.comboCounter || !this.comboValue) return;

        if (this.combo >= 3) {
            this.comboCounter.classList.add('visible');
            this.comboValue.textContent = this.combo;

            // Add pulse animation
            this.comboCounter.classList.remove('pulse');
            void this.comboCounter.offsetWidth;
            this.comboCounter.classList.add('pulse');

            // Check for motivational message
            this.checkComboMessage();
        } else {
            this.comboCounter.classList.remove('visible');
        }
    }

    /**
     * Check and show motivational message for combo milestones
     */
    checkComboMessage() {
        const now = Date.now();
        // Don't spam messages - at least 2 seconds between
        if (now - this.lastMessageTime < 2000) return;

        // Find highest threshold we've hit
        let message = null;
        for (let i = this.messages.length - 1; i >= 0; i--) {
            if (this.combo === this.messages[i].threshold) {
                const texts = this.messages[i].texts;
                message = texts[Math.floor(Math.random() * texts.length)];
                break;
            }
        }

        if (message) {
            this.showMessage(message);
            this.lastMessageTime = now;
        }
    }

    /**
     * Show motivational message popup
     */
    showMessage(text) {
        if (!this.messagePopup) return;

        this.messagePopup.textContent = text;
        this.messagePopup.classList.remove('visible');
        void this.messagePopup.offsetWidth;
        this.messagePopup.classList.add('visible');

        // Auto-hide after animation
        setTimeout(() => {
            this.messagePopup.classList.remove('visible');
        }, 1500);
    }

    /**
     * Trigger game over
     */
    triggerGameOver(reason) {
        this.state = 'gameover';

        // Calculate solution path
        this.solutionPath = this.maze.solve();
        this.pathProgress = 0;

        // Stop ambient music
        this.audio.stopAmbient();

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

        // Hide HUD and quick restart
        this.hud.classList.add('hidden');
        this.quickRestartBtn.classList.add('hidden');

        // Fetch leaderboard info for game over (read-only)
        this.leaderboard.render(this.gameOverLeaderboard);
    }

    /**
     * Trigger win sequence
     */
    triggerWin() {
        this.state = 'winning';
        this.quickRestartBtn.classList.add('hidden');

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
    async showWinScreen() {
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

        // Fetch and show leaderboard immediately
        const topScores = await this.leaderboard.fetchTopScores();
        this.leaderboard.render(this.winLeaderboard, topScores);

        // Check if high score
        let isHighScore = false;
        if (topScores.length < 5) {
            isHighScore = true;
        } else {
            // Check against the last one (worst of the best)
            const worstScore = topScores[topScores.length - 1];
            if (this.player.moveCount < worstScore.moves) {
                isHighScore = true;
            } else if (this.player.moveCount === worstScore.moves && timeTaken < worstScore.time) {
                isHighScore = true;
            }
        }

        if (isHighScore) {
            // Show Name Entry UI
            this.nameEntryForm.classList.remove('hidden');
            this.playerNameInput.value = '';
            this.submitScoreBtn.disabled = false;
            this.submitScoreBtn.textContent = 'GO';
            this.restartBtn.classList.add('hidden');

            // Focus input
            setTimeout(() => this.playerNameInput.focus(), 500);
        } else {
            // No high score, just show restart
            this.nameEntryForm.classList.add('hidden');
            this.restartBtn.classList.remove('hidden');
            this.inviteToRetry("Rank: Unranked");
        }
    }

    inviteToRetry(msg) {
        // Optional: Add a small message if they didn't make the cut
        // For now, we just ensure the form is hidden and restart button is visible
    }

    /**
     * Submit score to leaderboard
     */
    async submitScore() {
        if (this.scoreSubmitted) return;

        const name = this.playerNameInput.value;
        if (!name || name.trim() === '') {
            this.showMessage("Please enter a name");
            return;
        }

        this.submitScoreBtn.disabled = true;
        this.submitScoreBtn.textContent = '...';

        const timeTaken = this.timeLimit - this.remainingTime;
        const success = await this.leaderboard.submitScore(name, this.player.moveCount, timeTaken);

        if (success) {
            this.scoreSubmitted = true;
            this.nameEntryForm.classList.add('hidden');
            this.restartBtn.classList.remove('hidden');

            // Render leaderboard
            this.leaderboard.render(this.winLeaderboard);
        } else {
            this.submitScoreBtn.disabled = false;
            this.submitScoreBtn.textContent = 'Retry';
            this.showMessage("Error submitting score");
        }
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

        // Stop ambient music
        this.audio.stopAmbient();

        // Reset game state
        this.state = 'playing';
        this.winProgress = 0;
        this.pathProgress = 0;
        this.solutionPath = [];
        this.hasMovedOnce = false;
        this.scoreSubmitted = false;

        // Reset energy
        this.energy = 1.0;
        this.updateEnergyBar();

        // Ensure UI is correct
        this.startScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
        this.hud.classList.add('visible');
        this.quickRestartBtn.classList.remove('hidden');

        // Reset time
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.remainingTime = this.timeLimit;
        this.hudTime.textContent = '1:30';

        // Reset combo
        this.combo = 0;
        this.maxCombo = 0;
        this.updateComboUI();

        // Clear wall memory
        this.renderer.clearWallMemory();

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

        // Trigger start portal animation
        setTimeout(() => {
            const startPos = this.renderer.gridToScreen(this.maze.start.x, this.maze.start.y);
            this.effects.triggerStartPortal(startPos.x, startPos.y);
        }, 600);
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

        // Get wall proximity for particle effects
        const wallProximity = this.maze.getAdjacentWallCount(this.player.gridX, this.player.gridY);

        // Update particles
        const isConverging = this.state === 'winning' || this.state === 'won';
        this.particles.update(currentTime, playerPos.x, playerPos.y, isConverging, goalPos.x, goalPos.y, wallProximity);

        // Update effects
        this.effects.update();

        // Handle win progression
        if (this.state === 'winning') {
            this.winProgress += 0.015;
            if (this.winProgress >= 1) {
                this.showWinScreen();
            }
        } else if (this.state === 'gameover') {
            // Animate path revelation
            this.pathProgress = Math.min(1, this.pathProgress + 0.005);
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

        // Starfield
        this.renderer.renderStarfield(currentTime);

        // Wall memory hints
        this.renderer.renderWallMemory();

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

        // Render solution path on game over
        if (this.state === 'gameover' && this.solutionPath.length > 0) {
            this.renderer.renderSolutionPath(this.solutionPath, this.pathProgress);
        }

        // Player (with energy affecting appearance)
        this.renderer.renderPlayer(
            this.player.renderX,
            this.player.renderY,
            this.player.glowIntensity,
            this.energy,
            this.player.rotationAngle // Pass rotation for characters
        );
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
