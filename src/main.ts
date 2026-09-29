// ============================================================================
// ASCII RPG — 3D Raycasting Engine Rendered with ASCII Characters
// ============================================================================
// A complete first-person 3D engine that renders a medieval castle scene
// using only ASCII/Unicode characters on a canvas. Features:
//   - Raycasting with textured walls (ASCII patterns)
//   - Dynamic torch lighting with flickering flames
//   - Atmospheric fog and night sky
//   - Floor/ceiling casting
//   - Sprite rendering (torches, objects)
//   - Minimap
// ============================================================================

import { GameMap, TILE } from './map';
import { Player } from './player';
import { Renderer } from './renderer';
import { InputManager } from './input';
import { LightingSystem } from './lighting';
import { SpriteSystem } from './sprites';
import { MinimapRenderer } from './minimap';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private map: GameMap;
  private player: Player;
  private renderer: Renderer;
  private input: InputManager;
  private lighting: LightingSystem;
  private sprites: SpriteSystem;
  private minimap: MinimapRenderer;
  
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fpsTime: number = 0;
  private fps: number = 0;
  private statsEl: HTMLElement;
  private hintEl: HTMLElement;
  private hintTimer: number = 0;
  private started: boolean = false;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d', { alpha: false })!;
    this.statsEl = document.getElementById('stats')!;
    this.hintEl = document.getElementById('controls-hint')!;
    
    this.map = new GameMap();
    this.player = new Player(this.map);
    this.input = new InputManager(this.canvas, this.player);
    this.lighting = new LightingSystem(this.map);
    this.sprites = new SpriteSystem(this.map);
    this.renderer = new Renderer(this.canvas, this.ctx, this.map, this.player, this.lighting, this.sprites);
    
    const minimapCanvas = document.getElementById('minimap') as HTMLCanvasElement;
    this.minimap = new MinimapRenderer(minimapCanvas, this.map, this.player);
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Loading screen click handler
    const loading = document.getElementById('loading')!;
    const startGame = () => {
      if (this.started) return;
      this.started = true;
      loading.style.opacity = '0';
      setTimeout(() => loading.style.display = 'none', 500);
      this.canvas.requestPointerLock();
    };
    loading.addEventListener('click', startGame);
    document.addEventListener('click', () => {
      if (this.started && !document.pointerLockElement) {
        this.canvas.requestPointerLock();
      }
    });
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio, 1); // Keep 1:1 for ASCII clarity
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.renderer.onResize(this.canvas.width, this.canvas.height);
  }

  start() {
    this.lastTime = performance.now();
    this.fpsTime = this.lastTime;
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(time: number) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05); // cap delta
    this.lastTime = time;

    // FPS counter
    this.frameCount++;
    if (time - this.fpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTime = time;
    }

    // Update
    this.input.update(dt);
    this.player.update(dt);
    this.lighting.update(time / 1000);
    this.sprites.update(time / 1000);

    // Render
    this.renderer.render(time / 1000);
    this.minimap.render();

    // Stats
    this.statsEl.textContent = `FPS: ${this.fps} | Pos: ${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)}`;

    // Hide hint after 5s
    this.hintTimer += dt;
    if (this.hintTimer > 5) {
      this.hintEl.style.opacity = '0';
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}

// Boot
const game = new Game();
game.start();
