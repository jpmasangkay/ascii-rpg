# ⚔ The Ruins of Kaer Thal — ASCII RPG ⚔

A real-time, first-person 3D raycasting dungeon crawler engine rendered entirely with ASCII/Unicode characters on an HTML5 canvas.

```text
  ____ _  _ ____    ____ ___  ____ 
  |__| |\ | |  |    |__/ |__] | __ 
  |  | | \| |__|    |  \ |    |__] 
  ⚔ THE RUINS OF KAER THAL ⚔
```

---

## 🏰 Overview

**The Ruins of Kaer Thal** combines classic retro 3D raycasting (in the spirit of Wolfenstein 3D) with a terminal-aesthetic ASCII character display. Every frame is rasterized into high-density character cells with solid background tones, dynamic light attenuation, and CRT scanline styling.

Explore ancient fortress courtyards under starry night skies, venture through grand pillar halls, delve into bone-inlaid crypts, and navigate dark prison cells illuminated by flickering torches and iron braziers.

---

## ✨ Features

- **3D ASCII Raycasting Engine**: High-density grid rendering with custom character selection based on surface angle, depth, and illumination.
- **Dynamic Lighting & Torch Flickering**: Real-time radial lighting calculations with organic flame flicker and ambient light decay.
- **Outdoor & Indoor Environments**:
  - Starry night sky with twinkling glyph stars (`*`, `·`, `✦`).
  - Castle courtyard with towering stone keep masonry and arrow slits.
  - Multi-room dungeon fortress (Hall of Pillars, Throne Room, Arcane Sanctum, Crypt of the Fallen, Prison Cells, Armory).
- **Billboard ASCII Sprites**: Perspective-scaled sprites including iron braziers, wall torches, treasure chests, barrels, weapon racks, bone piles, and altars.
- **Mini-map HUD**: Real-time top-down dungeon radar showing player position, orientation cone, and explored geometry.
- **Smooth Pointer Lock & Mouse Look**: Standard WASD movement with fluid mouse camera controls.

---

## 🎮 Controls

| Action | Control |
|---|---|
| **Move Forward / Backward** | `W` / `S` or `Up` / `Down` Arrow |
| **Strafe Left / Right** | `A` / `D` |
| **Look Around** | `Mouse` |
| **Lock / Unlock Cursor** | Click to Lock / `Esc` to Unlock |

---

## 🛠️ Tech Stack

- **Runtime / Framework**: [Vite](https://vitejs.dev/) + TypeScript
- **Rendering**: HTML5 Canvas 2D Context (custom ASCII raycaster)
- **Zero Heavy 3D Dependencies**: Pure mathematical raycasting and character mapping—no WebGL or Three.js required.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`, `pnpm`, or `yarn`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jpmasangkay/ascii-rpg.git
   cd ascii-rpg
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser, click to enter the ruins, and enjoy!

### Production Build

```bash
npm run build
npm run preview
```

---

## 📜 License

MIT License. Feel free to explore, modify, and build upon this engine!
