# Invisible Maze

An interactive visual art experience disguised as a browser game.

Navigate through absence made visible. The maze is never shown, but its presence is constantly felt through graphics, motion, light, and feedback.

## How to Play

1. Open `index.html` in a modern browser
2. Use **Arrow Keys** or **WASD** to move
3. Find the invisible exit (bottom-right of the maze)

## What You'll Experience

- **No visible walls** — the maze exists only through feedback
- **Collision reveals** — when you hit a wall, it briefly flashes and disappears forever
- **Ambient motion** — particles, gradients, and light rays respond to your movement
- **Smooth transitions** — liquid-like player movement with trails and afterimages
- **Gentle audio** — spatial thumps on collision, harmonic tones on movement

## Technical Details

- Pure HTML, CSS, and vanilla JavaScript
- Canvas-based rendering at 60fps
- Web Audio API for spatial sound
- No dependencies or build step required
- Deployable directly to GitHub Pages

## Project Structure

```
invisible_maze/
├── index.html          # Single-page entry point
├── css/
│   └── style.css       # Visual styling and CSS animations
├── js/
│   ├── main.js         # Game initialization and loop
│   ├── maze.js         # DFS maze generation
│   ├── player.js       # Player movement and trails
│   ├── renderer.js     # Canvas rendering layers
│   ├── particles.js    # Ambient particle system
│   ├── effects.js      # Collision feedback effects
│   └── audio.js        # Web Audio spatial sounds
└── README.md
```

## Design Philosophy

This is not about winning fast. It is about feeling space you cannot see.

The game should feel:
- Immersive
- Slightly disorienting
- Visually mesmerizing
- Quietly frustrating

---

*"You didn't see the maze. You became aware of it."*
