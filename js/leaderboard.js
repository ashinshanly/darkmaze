import { db } from './firebase-config.js';
import { ref, push, query, orderByChild, limitToLast, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

export class Leaderboard {
    constructor() {
        this.scoresRef = ref(db, 'maze_scores');
    }

    /**
     * Submit a new score to the leaderboard
     * @param {string} name - Player name
     * @param {number} moves - Number of moves
     * @param {number} time - Time in seconds
     * @returns {Promise} - Resolves when score is saved
     */
    async submitScore(name, moves, time) {
        // Validation
        if (!name || name.trim() === '') name = 'Anonymous';
        name = name.substring(0, 15); // Limit name length

        const scoreData = {
            name,
            moves,
            time,
            timestamp: Date.now()
        };

        try {
            // We use moves as the primary sorting key by negating it if we want descending, 
            // but Realtime DB sorts ascending. 
            // We want LOWEST moves to be first. 
            // So we can just sort by moves.
            await push(this.scoresRef, scoreData);
            return true;
        } catch (error) {
            console.error("Error submitting score:", error);
            return false;
        }
    }

    /**
     * Fetch top scores
     * @param {number} limit - Number of scores to fetch
     * @returns {Promise<Array>} - Array of score objects
     */
    async fetchTopScores(limit = 10) {
        try {
            // Get more than needed to handle potential ties/filtering client side if needed
            // Ordering by 'moves' ascending (lower is better)
            const q = query(this.scoresRef, orderByChild('moves'), limitToLast(limit * 2));
            // Wait, limitToLast? No, default order is ascending. 
            // If moves=10, moves=20. We want 10 first.
            // Firebase Realtime DB Default Order is Ascending.
            // So we want the FIRST records.
            // However, `limitToFirst` combined with `orderByChild` is what we want for lowest values.

            const scoresQuery = query(this.scoresRef, orderByChild('moves'), limitToFirst(limit));

            const snapshot = await get(scoresQuery);

            if (!snapshot.exists()) return [];

            const scores = [];
            snapshot.forEach((childSnapshot) => {
                scores.push(childSnapshot.val());
            });

            // Client-side sort to be sure (and handle ties by time)
            scores.sort((a, b) => {
                if (a.moves !== b.moves) {
                    return a.moves - b.moves; // Lower moves first
                }
                return a.time - b.time; // Lower time first
            });

            return scores.slice(0, 5); // Strict top 5
        } catch (error) {
            console.error("Error fetching scores:", error);
            return [];
        }
    }

    /**
     * Render the leaderboard into a container
     * @param {HTMLElement} container - The DOM element to render into
     * @param {Array} scores - Optional pre-fetched scores
     */
    async render(container, scores = null) {
        if (!container) return;

        container.innerHTML = '<div class="leaderboard-loading">Loading scores...</div>';

        if (!scores) {
            scores = await this.fetchTopScores();
        }

        container.innerHTML = `
            <h3 class="leaderboard-title">Leaderboard</h3>
            ${scores.length === 0 ? '<div class="leaderboard-empty">No scores yet. Be the first!</div>' : ''}
        `;

        scores.forEach((score, index) => {
            const minutes = Math.floor(score.time / 60);
            const seconds = Math.floor(score.time % 60);
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            const entryConfig = document.createElement('div');
            entryConfig.className = 'leaderboard-entry';
            entryConfig.style.animationDelay = `${index * 0.1}s`;

            entryConfig.innerHTML = `
                <span class="leaderboard-rank">#${index + 1}</span>
                <span class="leaderboard-name">${this.escapeHtml(score.name)}</span>
                <span class="leaderboard-moves">${score.moves} moves</span>
                <span class="leaderboard-time">${timeStr}</span>
            `;

            container.appendChild(entryConfig);
        });
    }

    escapeHtml(text) {
        if (!text) return text;
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}
