## OOP Platform Game

Teach or explore the four pillars of object-oriented programming by playing (and tweaking) a side-scrolling platformer built with nothing more than HTML5 canvas and vanilla JavaScript. The project is intentionally self-contained so you can drop it into any workshop folder or open it directly in a browser.

### Features

- Pure front-end stack (`platformgame.html` + `platformgame.js`), no build tools required.
- Scrollable 2.4k px level with moving platforms, collectibles, enemies, parallax clouds, HUD, and win/lose overlays.
- Power-ups such as double jump, health hearts, and score-boosting stars.
- Explicit examples of abstraction, inheritance, encapsulation, and polymorphism highlighted directly in the code.
- Simple class hierarchy (`Entity` → `Player`/`Enemy`/`Platform`/`Collectible`) that is easy to extend in live-coding sessions.

### Project Structure

```
platformgame.html   # Canvas + buttons wired to the Game instance
platformgame.js     # Full game logic (recommended entry point for study)
virtualpet.js       # Alternate script copy kept for comparison/backups
```

### Getting Started

1. **Clone or download** this folder wherever you run the workshop.
2. **Open the game**:
   - Easiest: double-click `platformgame.html` to open it in Chrome, Edge, or Firefox.
   - Optionally run a lightweight static server if the browser blocks local keyboard events:
     ```
     # from this directory
     npx serve .
     # or
     python3 -m http.server 8000
     ```
     Then browse to `http://localhost:8000/platformgame.html`.
3. Use the on-screen buttons (Start / Pause / Reset) or the keyboard controls below.

### Controls

- `←` / `→`: Move
- `↑` or `Space`: Jump (double jump becomes available after grabbing the blue power-up)
- `R`: Reset after winning or losing
- On-screen buttons call `game.start()`, `game.stop()`, and `game.reset()` for quick demos.

### Gameplay Goals

- Reach the final platform around `x ≈ 2250` to trigger the victory screen.
- Collect coins, stars, and hearts to raise your score and stay alive.
- Jump on enemies to defeat them; touching them otherwise costs one heart.
- Falling off the level or losing all hearts shows the Game Over overlay (press `R` to try again).

### OOP Concepts Highlighted

- **Abstraction**: `Entity` centralizes shared state and behavior (position, collision helpers). Every other class extends it.
- **Encapsulation**: Player physics, enemy AI, platform motion, and collectible animation all keep their internal state private to the class.
- **Inheritance**: `Player`, `Enemy`, `Platform`, and `Collectible` inherit core members while specializing their own constructors and helpers.
- **Polymorphism**: Each subclass overrides `update()` and `render()`; the `Game` class treats them uniformly inside `update()` / `render()` loops.

### Extending the Game

- **Add a new enemy type**: Extend `Entity`, override `update()` for your AI pattern, then push instances in `createEnemies()`.
- **Tweak difficulty**: Adjust `player.speed`, `player.jumpPower`, gravity, health, or the number/placement of enemies and platforms.
- **Create new collectibles**: Add a new `type` branch inside `Collectible` to define visuals and rewards, then spawn it in `createCollectibles()`.
- **Experiment with mechanics**: Because everything runs in one file, you can live-code features such as wall jumps, projectiles, checkpoints, or boss fights during a lesson.

### Troubleshooting & Tips

- If you see a blank screen, open the browser console; direct instantiation of `Entity` (without subclassing) or syntax errors will surface there.
- Ensure the canvas keeps focus: clicking outside the window will pause keyboard input until you click back.
- The `virtualpet.js` file mirrors the same class structure and can be used as a scratchpad if you want to demo alternative mechanics without touching the main script.

Have fun hacking on it, and encourage learners to read the inline comments—they point directly to where each OOP pillar is used.
