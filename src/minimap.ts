// ============================================================================
// Minimap Renderer — Fantasy Dungeon Top-down View
// ============================================================================

import { GameMap, TILE } from './map';
import { Player } from './player';

export class MinimapRenderer {
  private ctx: CanvasRenderingContext2D;
  private readonly cellSize = 4;

  constructor(
    private canvas: HTMLCanvasElement,
    private map: GameMap,
    private player: Player,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.canvas.width = map.width * this.cellSize;
    this.canvas.height = map.height * this.cellSize;
  }

  render() {
    const ctx = this.ctx;
    const cs = this.cellSize;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Dark parchment background
    ctx.fillStyle = 'rgba(8, 6, 12, 0.88)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw tiles with area-appropriate colors
    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const tile = this.map.tiles[y][x];
        if (tile !== TILE.EMPTY) {
          const colors = GameMap.TILE_COLORS[tile];
          if (colors) {
            ctx.fillStyle = `rgb(${colors[0] >> 1},${colors[1] >> 1},${colors[2] >> 1})`;
          } else {
            ctx.fillStyle = '#333';
          }
          ctx.fillRect(x * cs, y * cs, cs, cs);
        }
      }
    }

    // Draw torches as glowing dots
    for (const torch of this.map.torches) {
      const [r, g, b] = torch.color;
      // Glow
      ctx.fillStyle = `rgba(${r},${g},${b},0.15)`;
      ctx.beginPath();
      ctx.arc(torch.x * cs, torch.y * cs, torch.radius * cs * 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Core
      ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
      ctx.beginPath();
      ctx.arc(torch.x * cs, torch.y * cs, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player direction line
    const px = this.player.x * cs;
    const py = this.player.y * cs;

    ctx.strokeStyle = '#4f8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(
      px + Math.cos(this.player.angle) * cs * 3,
      py + Math.sin(this.player.angle) * cs * 3
    );
    ctx.stroke();

    // FOV cone
    ctx.strokeStyle = 'rgba(80, 255, 130, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(
      px + Math.cos(this.player.angle - this.player.fov / 2) * cs * 6,
      py + Math.sin(this.player.angle - this.player.fov / 2) * cs * 6
    );
    ctx.moveTo(px, py);
    ctx.lineTo(
      px + Math.cos(this.player.angle + this.player.fov / 2) * cs * 6,
      py + Math.sin(this.player.angle + this.player.fov / 2) * cs * 6
    );
    ctx.stroke();

    // Player dot
    ctx.fillStyle = '#4f8';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();

    // Border — aged gold
    ctx.strokeStyle = 'rgba(160, 130, 60, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
