// ============================================================================
// Renderer — High-Density ASCII Raycasting Engine
// ============================================================================
// Renders the 3D scene using high-density character cells with solid color
// fills, CRT scanlines, running-bond stone masonry, arrow slits, dynamic
// radial torch lighting, and seamlessly scaled ASCII sprites.
// ============================================================================

import { GameMap, TILE } from './map';
import { Player } from './player';
import { LightingSystem } from './lighting';
import { SpriteSystem } from './sprites';

// Sky star glyphs
const STAR_GLYPHS = ['.', '·', '*', '✦'];

export class Renderer {
  private screenW: number = 0;
  private screenH: number = 0;

  // Character cell dimensions (pixels)
  readonly charW: number = 4;
  readonly charH: number = 6;
  private cols: number = 0;
  private rows: number = 0;
  private zBuffer: Float32Array = new Float32Array(0);

  // Pre-computed stars in the night sky
  private stars: { col: number; row: number; brightness: number; speed: number; glyph: string }[] = [];
  private starsReady: boolean = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
    private map: GameMap,
    private player: Player,
    private lighting: LightingSystem,
    private sprites: SpriteSystem,
  ) {
    this.ctx.textBaseline = 'top';
  }

  onResize(w: number, h: number) {
    this.screenW = w;
    this.screenH = h;
    this.cols = Math.floor(w / this.charW);
    this.rows = Math.floor(h / this.charH);
    this.zBuffer = new Float32Array(this.cols);
    this.starsReady = false;
  }

  private initStars() {
    this.stars = [];
    const horizonRow = Math.floor(this.rows * 0.5);
    const starCount = Math.floor(this.cols * 0.35);

    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        col: Math.floor(Math.random() * this.cols),
        row: Math.floor(Math.random() * horizonRow * 0.85),
        brightness: 0.25 + Math.random() * 0.75,
        speed: 1.5 + Math.random() * 3.5,
        glyph: STAR_GLYPHS[Math.floor(Math.random() * STAR_GLYPHS.length)],
      });
    }
    this.starsReady = true;
  }

  render(time: number) {
    if (this.cols === 0 || this.rows === 0) return;
    if (!this.starsReady) this.initStars();

    const ctx = this.ctx;

    // Pitch and head bob offsets
    const headBob = this.player.getHeadBob();
    const pitchOff = this.player.pitch * this.rows * 0.5;

    // 1. Draw Night Sky (for outdoor areas)
    this.drawSky(ctx, time, pitchOff);

    // 2. Draw 3D Raycasted Scene (Walls, Ceilings, Floors)
    this.drawScene(ctx, time, headBob, pitchOff);

    // 3. Draw Sprites (Braziers, Torches, Objects)
    this.drawSprites(ctx, time, headBob, pitchOff);

    // 4. Subtle Vignette & Retro CRT scanlines
    this.drawVignette(ctx);
  }

  // ── NIGHT SKY ──────────────────────────────────────────────────────────────
  private drawSky(ctx: CanvasRenderingContext2D, time: number, pitchOff: number) {
    const horizon = Math.floor(this.rows * 0.5 + pitchOff);
    const maxRow = Math.min(horizon, this.rows);
    if (maxRow <= 0) return;

    // Sky gradient: Deep navy at top -> dark twilight purple near horizon
    for (let row = 0; row < maxRow; row++) {
      const t = row / Math.max(1, horizon);
      const r = Math.floor(8 + t * 14);
      const g = Math.floor(7 + t * 10);
      const b = Math.floor(18 + t * 18);

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, row * this.charH, this.screenW, this.charH);
    }

    // Twinkling stars
    ctx.font = `${this.charH}px monospace`;
    for (const s of this.stars) {
      const row = s.row + Math.floor(pitchOff);
      if (row < 0 || row >= horizon || row >= this.rows) continue;

      const twinkle = 0.4 + 0.6 * Math.sin(time * s.speed + s.col * 0.5);
      const v = Math.floor(s.brightness * twinkle * 200);
      if (v < 30) continue;

      ctx.fillStyle = `rgb(${v},${v},${Math.min(255, v + 40)})`;
      ctx.fillText(s.glyph, s.col * this.charW, row * this.charH);
    }
  }

  // ── MAIN RAYCASTING SCENE ──────────────────────────────────────────────────
  private drawScene(ctx: CanvasRenderingContext2D, time: number, headBob: number, pitchOff: number) {
    const px = this.player.x;
    const py = this.player.y;
    const pa = this.player.angle;
    const fov = this.player.fov;
    const halfFov = fov / 2;
    const centerRow = this.rows / 2 + pitchOff + headBob * this.rows * 0.08;

    const isPlayerOutdoor = this.map.isOutdoor(px, py);

    for (let col = 0; col < this.cols; col++) {
      const rayAngle = pa - halfFov + (col / this.cols) * fov;
      const rc = Math.cos(rayAngle);
      const rs = Math.sin(rayAngle);
      const cosCorr = Math.cos(rayAngle - pa);

      const hit = this.castRay(px, py, rc, rs);
      const perpDist = hit.dist * cosCorr;
      this.zBuffer[col] = perpDist;

      // Base wall height in rows
      const wallH = this.rows / perpDist;
      const wallHeight = this.map.getWallHeight(hit.tile);

      // Wall anchored to ground level, extending upwards by wallHeight
      const groundRow = centerRow + wallH * 0.5;
      const wallBottom = Math.floor(groundRow);
      const wallTop = Math.floor(groundRow - wallH * wallHeight);

      // ── CEILING (Only rendered when player is indoors) ──
      const ceilEnd = Math.min(wallTop, this.rows);

      if (!isPlayerOutdoor && ceilEnd > 0) {
        for (let row = 0; row < ceilEnd; row++) {
          const rd = this.rows / (2 * Math.max(1, centerRow - row));
          if (rd < 0 || rd > 30) continue;
          const cd = rd / cosCorr;
          const fx = px + rc * cd;
          const fy = py + rs * cd;

          if (this.map.isOutdoor(fx, fy)) continue;

          const light = this.lighting.sampleLight(fx, fy, time);
          const fog = Math.max(0, 1 - rd * 0.08);
          const bri = light.intensity * fog * 0.25;

          const cr = Math.floor(Math.min(45, light.r * bri * 0.1 + 8));
          const cg = Math.floor(Math.min(42, light.g * bri * 0.08 + 7));
          const cb = Math.floor(Math.min(55, light.b * bri * 0.12 + 12));

          ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
          ctx.fillRect(col * this.charW, row * this.charH, this.charW, this.charH);
        }
      }

      // ── WALL ──
      if (hit.tile !== TILE.EMPTY) {
        const dTop = Math.max(0, wallTop);
        const dBot = Math.min(this.rows - 1, wallBottom);
        const tileCol = GameMap.TILE_COLORS[hit.tile] || [90, 85, 80];

        // Lighting sample at wall hit position
        const light = this.lighting.sampleLight(hit.hitX, hit.hitY, time);
        const fog = Math.max(0, 1 - perpDist * 0.045);
        // Subtle directional shadow: East/West walls slightly shaded
        const sideMul = hit.side === 0 ? 1.0 : 0.72;

        const totalWallH = Math.max(1, wallBottom - wallTop);

        for (let row = dTop; row <= dBot; row++) {
          const wallV = (row - wallTop) / totalWallH; // 0 (top) to 1 (bottom)
          const vUnits = (1.0 - wallV) * wallHeight;   // World units above ground

          let isMortar = false;
          let isArrowSlit = false;
          let blockVar = 1.0;

          if (hit.tile === TILE.CASTLE_TOWER || hit.tile === TILE.STONE_WALL) {
            // ── Running-bond masonry stone brick pattern ──
            const brickW = 0.55;  // Width of a stone block
            const brickH = 0.22;  // Height of a stone block

            const brickRow = Math.floor(vUnits / brickH);
            const rowOffset = (brickRow % 2 === 0) ? 0 : (brickW * 0.5);
            const brickCol = Math.floor((hit.wallU + rowOffset) / brickW);

            const uInBrick = ((hit.wallU + rowOffset) % brickW + brickW) % brickW;
            const vInBrick = (vUnits % brickH + brickH) % brickH;

            // Mortar lines
            const isMortarU = uInBrick < 0.035 || uInBrick > (brickW - 0.035);
            const isMortarV = vInBrick < 0.03 || vInBrick > (brickH - 0.03);
            isMortar = isMortarU || isMortarV;

            // Per-brick shade variation
            const brickSeed = (brickCol * 97 + brickRow * 179) & 0xffff;
            blockVar = 0.88 + ((brickSeed % 100) / 100) * 0.24;

            // ── Arrow Slits on Castle Tower ──
            if (hit.tile === TILE.CASTLE_TOWER && vUnits >= 0.7 && vUnits <= 1.55) {
              const slitDist = Math.abs((hit.hitX % 3.0) - 1.5);
              if (slitDist < 0.07) {
                isArrowSlit = true;
              }
            }
          } else if (hit.tile === TILE.BRICK_WALL) {
            const brickW = 0.35;
            const brickH = 0.15;
            const brickRow = Math.floor(vUnits / brickH);
            const rowOffset = (brickRow % 2 === 0) ? 0 : (brickW * 0.5);
            const uInBrick = ((hit.wallU + rowOffset) % brickW + brickW) % brickW;
            const vInBrick = (vUnits % brickH + brickH) % brickH;
            isMortar = (uInBrick < 0.03) || (vInBrick < 0.025);
          }

          let r: number, g: number, b: number;

          if (isArrowSlit) {
            // Dark interior shadow inside arrow slits
            r = 14; g = 12; b = 16;
          } else {
            const mortarDim = isMortar ? 0.55 : 1.0;
            // Vertical lighting gradient: slightly darker at top
            const vShade = 0.85 + (1.0 - wallV) * 0.15;
            const intensity = light.intensity * fog * sideMul * blockVar * mortarDim * vShade;

            // Blend material base color with torch light
            r = Math.floor(Math.min(255, tileCol[0] * intensity * 0.45 + light.r * intensity * 0.28));
            g = Math.floor(Math.min(255, tileCol[1] * intensity * 0.45 + light.g * intensity * 0.24));
            b = Math.floor(Math.min(255, tileCol[2] * intensity * 0.45 + light.b * intensity * 0.18));

            // Mossy stone green tint
            if (hit.tile === TILE.MOSSY_STONE) {
              const moss = 0.5 + 0.5 * Math.sin(hit.wallU * 8 + vUnits * 5);
              g = Math.floor(Math.min(255, g + moss * 35 * intensity));
            }
          }

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(col * this.charW, row * this.charH, this.charW, this.charH);
        }
      }

      // ── FLOOR / GROUND ──
      const floorStart = Math.max(0, wallBottom + 1);
      for (let row = floorStart; row < this.rows; row++) {
        const rd = this.rows / (2 * (row - centerRow));
        if (rd < 0 || rd > 35) continue;
        const cd = rd / cosCorr;
        const fx = px + rc * cd;
        const fy = py + rs * cd;

        const area = this.map.getArea(fx, fy);
        const floorDef = GameMap.AREA_FLOOR[area] || GameMap.AREA_FLOOR['courtyard'];

        const light = this.lighting.sampleLight(fx, fy, time);
        const fog = Math.max(0, 1 - rd * 0.05);

        let baseColor: [number, number, number];

        if (floorDef.outdoor) {
          // Outdoor Castle Courtyard ground:
          // Center path (fx ~ 24.2) is dark trampled earth/stone;
          // Sides are dark murky olive grass.
          const distFromCenter = Math.abs(fx - 24.2);
          const isPath = distFromCenter < 2.0;

          const patchNoise = Math.sin(fx * 2.3 + fy * 1.7) * Math.cos(fx * 1.1 - fy * 2.8);
          const noiseFactor = 0.85 + patchNoise * 0.25;

          if (isPath) {
            baseColor = [
              Math.floor(48 * noiseFactor),
              Math.floor(42 * noiseFactor),
              Math.floor(32 * noiseFactor),
            ];
          } else {
            baseColor = [
              Math.floor(34 * noiseFactor),
              Math.floor(38 * noiseFactor),
              Math.floor(26 * noiseFactor),
            ];
          }
        } else {
          // Indoor dungeon stone slab / tavern floor
          const ftx = Math.floor(fx * 2.5);
          const fty = Math.floor(fy * 2.5);
          const checker = ((ftx + fty) & 1) === 0;
          baseColor = checker ? floorDef.colors[0] : floorDef.colors[1];
        }

        // Balanced lighting on ground — warm amber firelight on dark medieval earth
        const effIntensity = Math.min(1.15, light.intensity * fog);
        const r = Math.floor(Math.min(255, baseColor[0] * (0.35 + effIntensity * 0.5) + light.r * effIntensity * 0.20));
        const g = Math.floor(Math.min(255, baseColor[1] * (0.35 + effIntensity * 0.5) + light.g * effIntensity * 0.16));
        const b = Math.floor(Math.min(255, baseColor[2] * (0.35 + effIntensity * 0.5) + light.b * effIntensity * 0.08));

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(col * this.charW, row * this.charH, this.charW, this.charH);
      }
    }
  }

  // ── DDA RAYCASTING ─────────────────────────────────────────────────────────
  private castRay(ox: number, oy: number, dx: number, dy: number): {
    dist: number; tile: number; side: number; wallU: number; hitX: number; hitY: number;
  } {
    let mapX = Math.floor(ox);
    let mapY = Math.floor(oy);
    const ddx = Math.abs(1 / dx);
    const ddy = Math.abs(1 / dy);
    const sx = dx > 0 ? 1 : -1;
    const sy = dy > 0 ? 1 : -1;
    let sdx = dx > 0 ? (mapX + 1 - ox) * ddx : (ox - mapX) * ddx;
    let sdy = dy > 0 ? (mapY + 1 - oy) * ddy : (oy - mapY) * ddy;

    let side = 0;

    for (let i = 0; i < 90; i++) {
      if (sdx < sdy) {
        sdx += ddx;
        mapX += sx;
        side = 0;
      } else {
        sdy += ddy;
        mapY += sy;
        side = 1;
      }

      if (mapX < 0 || mapX >= this.map.width || mapY < 0 || mapY >= this.map.height) {
        break;
      }
      if (this.map.tiles[mapY][mapX] !== TILE.EMPTY) {
        break;
      }
    }

    let dist = side === 0 ? sdx - ddx : sdy - ddy;
    dist = Math.max(dist, 0.001);

    const tile = (mapX >= 0 && mapX < this.map.width && mapY >= 0 && mapY < this.map.height)
      ? this.map.tiles[mapY][mapX] : TILE.STONE_WALL;

    const hitX = ox + dx * dist;
    const hitY = oy + dy * dist;

    // wallU represents horizontal coordinate along the wall face
    const wallU = side === 0 ? hitY : hitX;

    return { dist, tile, side, wallU, hitX, hitY };
  }

  // ── SPRITE RENDERING ───────────────────────────────────────────────────────
  // Uses screen-space rasterization so sprite pixels NEVER separate when close
  private drawSprites(ctx: CanvasRenderingContext2D, time: number, headBob: number, pitchOff: number) {
    const px = this.player.x;
    const py = this.player.y;
    const pa = this.player.angle;
    const centerRow = this.rows / 2 + pitchOff + headBob * this.rows * 0.08;

    const visible: typeof this.sprites.sprites = [];

    for (const sp of this.sprites.sprites) {
      const dx = sp.x - px;
      const dy = sp.y - py;
      sp.dist = Math.sqrt(dx * dx + dy * dy);

      let ang = Math.atan2(dy, dx) - pa;
      while (ang > Math.PI) ang -= 2 * Math.PI;
      while (ang < -Math.PI) ang += 2 * Math.PI;

      if (Math.abs(ang) > this.player.fov * 0.85) continue;

      sp.screenX = (0.5 + ang / this.player.fov) * this.cols;
      sp.scale = this.rows / sp.dist;
      sp.visible = true;
      visible.push(sp);
    }

    // Sort back-to-front
    visible.sort((a, b) => b.dist - a.dist);

    for (const sp of visible) {
      if (sp.dist < 0.3 || sp.dist > 35) continue;

      const art = this.sprites.getArt(sp.type, time);
      const h = art.length;
      if (h === 0) continue;
      const w = art[0].length;

      // Scale multiplier (braziers are large standing fire bowls)
      const scaleMul = sp.type === 'brazier' ? 0.70 : 0.42;
      const cellScale = (sp.scale * scaleMul) / h;

      // Sprite bounding box in screen coordinates (columns and rows)
      const spriteW = w * cellScale;
      const spriteH = h * cellScale;
      const spriteLeft = sp.screenX - spriteW * 0.5;
      const spriteRight = sp.screenX + spriteW * 0.5;
      const bottom = centerRow + sp.scale * 0.5;
      const top = bottom - spriteH;

      const startCol = Math.max(0, Math.floor(spriteLeft));
      const endCol = Math.min(this.cols - 1, Math.ceil(spriteRight));
      const startRow = Math.max(0, Math.floor(top));
      const endRow = Math.min(this.rows - 1, Math.ceil(bottom));

      const invW = 1 / Math.max(0.001, spriteW);
      const invH = 1 / Math.max(0.001, spriteH);

      const light = this.lighting.sampleLight(sp.x, sp.y, time);
      const fog = Math.max(0, 1 - sp.dist * 0.04);

      // Rasterize screen cells covered by sprite (guarantees NO gaps/separation)
      for (let col = startCol; col <= endCol; col++) {
        // Depth buffer test per column
        if (sp.dist > this.zBuffer[col]) continue;

        const u = (col - spriteLeft) * invW;
        const ax = Math.floor(u * w);
        if (ax < 0 || ax >= w) continue;

        for (let row = startRow; row <= endRow; row++) {
          const v = (row - top) * invH;
          const ay = Math.floor(v * h);
          if (ay < 0 || ay >= h) continue;

          const pixel = art[ay][ax];
          if (!pixel) continue; // Transparent

          let r: number, g: number, b: number;

          if (pixel.isSelfLit) {
            // Flame / glow: brilliant, vibrant colors unaffected by ambient darkness
            r = Math.floor(Math.min(255, pixel.color[0] * fog));
            g = Math.floor(Math.min(255, pixel.color[1] * fog));
            b = Math.floor(Math.min(255, pixel.color[2] * fog));
          } else {
            // Stand / object: illuminated by scene light
            const intensity = light.intensity * fog;
            r = Math.floor(Math.min(255, pixel.color[0] * intensity * 0.45 + light.r * intensity * 0.20));
            g = Math.floor(Math.min(255, pixel.color[1] * intensity * 0.45 + light.g * intensity * 0.16));
            b = Math.floor(Math.min(255, pixel.color[2] * intensity * 0.45 + light.b * intensity * 0.12));
          }

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(col * this.charW, row * this.charH, this.charW, this.charH);
        }
      }
    }
  }

  // ── VIGNETTE & RETRO CRT SCANLINES ─────────────────────────────────────────
  private drawVignette(ctx: CanvasRenderingContext2D) {
    // Subtle CRT scanline overlay across entire frame
    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    for (let y = 0; y < this.screenH; y += this.charH) {
      ctx.fillRect(0, y, this.screenW, 1);
    }

    // Radial vignette
    const grd = ctx.createRadialGradient(
      this.screenW * 0.5, this.screenH * 0.5, this.screenH * 0.25,
      this.screenW * 0.5, this.screenH * 0.5, this.screenH * 0.95
    );
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(0.65, 'rgba(0,0,0,0.18)');
    grd.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, this.screenW, this.screenH);
  }
}
