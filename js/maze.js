/**
 * Maze Generator — Invisible Maze
 * Uses Depth-First Search (DFS) with recursive backtracking
 * to create a perfect maze (exactly one path between any two cells)
 */

export class Maze {
    constructor(width = 20, height = 20) {
        this.width = width;
        this.height = height;
        this.grid = [];
        this.start = { x: 0, y: 0 };
        this.goal = { x: width - 1, y: height - 1 };
        this.generate();
    }

    /**
     * Initialize grid with all walls present
     * Each cell has 4 walls: North, East, South, West
     */
    initGrid() {
        this.grid = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push({
                    x,
                    y,
                    walls: { n: true, e: true, s: true, w: true },
                    visited: false
                });
            }
            this.grid.push(row);
        }
    }

    /**
     * Generate maze using DFS with recursive backtracking
     */
    generate() {
        this.initGrid();
        const stack = [];
        const startCell = this.grid[0][0];
        startCell.visited = true;
        stack.push(startCell);

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.getUnvisitedNeighbors(current);

            if (neighbors.length === 0) {
                stack.pop();
            } else {
                // Choose random unvisited neighbor
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                this.removeWall(current, next);
                next.visited = true;
                stack.push(next);
            }
        }

        // Clean up visited flags
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                delete this.grid[y][x].visited;
            }
        }
    }

    /**
     * Get unvisited neighboring cells
     */
    getUnvisitedNeighbors(cell) {
        const neighbors = [];
        const { x, y } = cell;

        // North
        if (y > 0 && !this.grid[y - 1][x].visited) {
            neighbors.push(this.grid[y - 1][x]);
        }
        // East
        if (x < this.width - 1 && !this.grid[y][x + 1].visited) {
            neighbors.push(this.grid[y][x + 1]);
        }
        // South
        if (y < this.height - 1 && !this.grid[y + 1][x].visited) {
            neighbors.push(this.grid[y + 1][x]);
        }
        // West
        if (x > 0 && !this.grid[y][x - 1].visited) {
            neighbors.push(this.grid[y][x - 1]);
        }

        return neighbors;
    }

    /**
     * Remove wall between two adjacent cells
     */
    removeWall(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;

        if (dx === 1) {
            a.walls.e = false;
            b.walls.w = false;
        } else if (dx === -1) {
            a.walls.w = false;
            b.walls.e = false;
        } else if (dy === 1) {
            a.walls.s = false;
            b.walls.n = false;
        } else if (dy === -1) {
            a.walls.n = false;
            b.walls.s = false;
        }
    }

    /**
     * Check if player can move in a direction
     * @returns {boolean | string} false if can move, 'wall' if blocked by wall
     */
    canMove(x, y, direction) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return 'boundary';
        }

        const cell = this.grid[y][x];

        switch (direction) {
            case 'n': return cell.walls.n ? 'wall' : false;
            case 'e': return cell.walls.e ? 'wall' : false;
            case 's': return cell.walls.s ? 'wall' : false;
            case 'w': return cell.walls.w ? 'wall' : false;
            default: return 'invalid';
        }
    }

    /**
     * Check if position is the goal
     */
    isGoal(x, y) {
        return x === this.goal.x && y === this.goal.y;
    }

    /**
     * Regenerate the maze
     */
    regenerate() {
        this.generate();
    }

    /**
     * Get cell at position
     */
    getCell(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.grid[y][x];
        }
        return null;
    }

    /**
     * Get count of adjacent walls for a cell (0-4)
     * Used for wall proximity hints
     */
    getAdjacentWallCount(x, y) {
        const cell = this.getCell(x, y);
        if (!cell) return 0;

        let count = 0;
        if (cell.walls.n) count++;
        if (cell.walls.e) count++;
        if (cell.walls.s) count++;
        if (cell.walls.w) count++;
        return count;
    }
}
