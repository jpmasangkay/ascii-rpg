// ============================================================================
// Sprite System — High-Fidelity ASCII Art Billboards
// ============================================================================
// Supports multi-colored pixel/character sprites.
// Includes the iconic teardrop brazier flame from Kaer Thal.
// ============================================================================

import { GameMap } from './map';

export interface Sprite {
  x: number;
  y: number;
  type: string;
  dist: number;
  screenX: number;
  scale: number;
  visible: boolean;
}

export interface SpritePixel {
  char: string;
  color: [number, number, number];
  isSelfLit: boolean;
}

export class SpriteSystem {
  sprites: Sprite[] = [];

  constructor(private map: GameMap) {
    for (const def of map.spriteDefs) {
      this.sprites.push({
        x: def.x,
        y: def.y,
        type: def.type,
        dist: 0,
        screenX: 0,
        scale: 0,
        visible: false,
      });
    }
  }

  update(_time: number) {}

  // Returns a 2D grid of colored characters for the given sprite
  getArt(type: string, time: number): (SpritePixel | null)[][] {
    switch (type) {
      case 'brazier':
        return this.getBrazierArt(time);
      case 'torch_wall':
        return this.getTorchArt(time);
      case 'crystal':
        return this.getCrystalArt(time);
      case 'cauldron':
        return this.getCauldronArt(time);
      case 'throne':
        return this.getThroneArt();
      case 'sarcophagus':
        return this.getSarcophagusArt();
      case 'chest':
        return this.getChestArt();
      case 'banner':
        return this.getBannerArt();
      case 'barrel':
        return this.getBarrelArt();
      case 'crate':
        return this.getCrateArt();
      case 'skeleton':
        return this.getSkeletonArt();
      case 'potion':
        return this.getPotionArt(time);
      case 'bookshelf':
        return this.getBookshelfArt();
      case 'weapon_rack':
        return this.getWeaponRackArt();
      case 'chains':
        return this.getChainsArt();
      case 'skull_pile':
        return this.getSkullPileArt();
      case 'ale_keg':
        return this.getAleKegArt();
      case 'table':
        return this.getTableArt();
      case 'cage':
        return this.getCageArt();
      default:
        return [[{ char: '?', color: [255, 255, 255], isSelfLit: false }]];
    }
  }

  // ── BRAZIER (Exact match to reference screenshot) ──────────────────────────
  private getBrazierArt(time: number): (SpritePixel | null)[][] {
    // Teardrop flame color palette
    const W: [number, number, number] = [255, 252, 210]; // Glowing core white-yellow
    const Y: [number, number, number] = [255, 215, 45];  // Bright golden yellow
    const O: [number, number, number] = [255, 145, 20];  // Fiery orange
    const R: [number, number, number] = [185, 42, 12];   // Deep ember red

    // Iron brazier stand colors
    const B: [number, number, number] = [105, 100, 95];  // Iron bowl rim
    const L: [number, number, number] = [78, 74, 70];    // Iron legs
    const C: [number, number, number] = [90, 85, 80];    // Cross-strut

    // Organic flame flicker wobble
    const flick1 = Math.sin(time * 9.5) * 0.4;
    const flick2 = Math.cos(time * 14.2) * 0.3;

    // Pattern grid
    const template = [
      '       R       ',
      '      ROR      ',
      '      RYR      ',
      '     ROYOR     ',
      '     RYWYR     ',
      '    ROYWWYOR   ',
      '    RYWWWWYR   ',
      '    RYWWWWYR   ',
      '   ROYWWWWYOR  ',
      '   ROYWWWWYOR  ',
      '   RYWWWWWWYR  ',
      '   RYWWWWWWYR  ',
      '   ROYWWWWYOR  ',
      '    ROYYYYOR   ',
      '     ROOORR    ',
      '   BBBBBBBBBB  ',
      '   B========B  ',
      '    L      L   ',
      '    L      L   ',
      '    L======L   ',
      '    L      L   ',
      '    L      L   ',
      '   LL      LL  ',
    ];

    const grid: (SpritePixel | null)[][] = [];

    for (let y = 0; y < template.length; y++) {
      const row: (SpritePixel | null)[] = [];
      const line = template[y];
      const isFlame = y < 15;

      // Subtle horizontal sway on the upper flame
      const sway = isFlame ? Math.round((14 - y) * 0.08 * (flick1 + flick2)) : 0;

      for (let x = 0; x < line.length; x++) {
        const srcX = x - sway;
        const code = (srcX >= 0 && srcX < line.length) ? line[srcX] : ' ';

        if (code === ' ') {
          row.push(null);
        } else if (code === 'W') {
          row.push({ char: '█', color: W, isSelfLit: true });
        } else if (code === 'Y') {
          row.push({ char: '█', color: Y, isSelfLit: true });
        } else if (code === 'O') {
          row.push({ char: '▓', color: O, isSelfLit: true });
        } else if (code === 'R') {
          row.push({ char: '▒', color: R, isSelfLit: true });
        } else if (code === 'B') {
          row.push({ char: '█', color: B, isSelfLit: false });
        } else if (code === '=') {
          row.push({ char: '═', color: C, isSelfLit: false });
        } else if (code === 'L') {
          row.push({ char: '║', color: L, isSelfLit: false });
        } else {
          row.push(null);
        }
      }
      grid.push(row);
    }

    return grid;
  }

  // ── TORCH (Wall mounted) ───────────────────────────────────────────────────
  private getTorchArt(time: number): (SpritePixel | null)[][] {
    const W: [number, number, number] = [255, 250, 190];
    const Y: [number, number, number] = [255, 205, 40];
    const O: [number, number, number] = [255, 135, 20];
    const R: [number, number, number] = [180, 40, 15];
    const M: [number, number, number] = [100, 75, 45]; // wood bracket

    const frame = Math.floor(time * 7) % 3;
    const flameRows = frame === 0
      ? ['  R  ', ' ROY ', 'RYWYR', ' ROY ']
      : frame === 1
      ? ['  R  ', ' YOR ', 'RYWYR', ' OYR ']
      : ['  R  ', ' ROY ', 'RWWYR', ' ROR '];

    const lines = [
      ...flameRows,
      '  █  ',
      ' ╔╩╗ ',
      '  ║  ',
      '  ╽  ',
    ];

    return this.parseGrid(lines, {
      W: { char: '█', color: W, lit: true },
      Y: { char: '▓', color: Y, lit: true },
      O: { char: '▒', color: O, lit: true },
      R: { char: '░', color: R, lit: true },
      '█': { char: '█', color: [70, 65, 60], lit: false },
      '╔': { char: '╔', color: [90, 85, 80], lit: false },
      '╩': { char: '╩', color: [90, 85, 80], lit: false },
      '╗': { char: '╗', color: [90, 85, 80], lit: false },
      '║': { char: '║', color: M, lit: false },
      '╽': { char: '╽', color: M, lit: false },
    });
  }

  // ── CRYSTAL (Arcane glowing) ───────────────────────────────────────────────
  private getCrystalArt(time: number): (SpritePixel | null)[][] {
    const pulse = 0.7 + 0.3 * Math.sin(time * 3);
    const C1: [number, number, number] = [Math.floor(210 * pulse), 180, 255];
    const C2: [number, number, number] = [Math.floor(140 * pulse), 90, 240];
    const C3: [number, number, number] = [Math.floor(90 * pulse), 50, 180];
    const B: [number, number, number] = [70, 65, 75];

    const lines = [
      '   1   ',
      '  121  ',
      ' 12321 ',
      ' 23232 ',
      '  232  ',
      '   2   ',
      ' ╔═══╗ ',
      ' ║BBB║ ',
    ];

    return this.parseGrid(lines, {
      '1': { char: '◇', color: C1, lit: true },
      '2': { char: '◆', color: C2, lit: true },
      '3': { char: '█', color: C3, lit: true },
      '╔': { char: '╔', color: B, lit: false },
      '═': { char: '═', color: B, lit: false },
      '╗': { char: '╗', color: B, lit: false },
      '║': { char: '║', color: B, lit: false },
      'B': { char: '▓', color: B, lit: false },
    });
  }

  // ── CAULDRON ──────────────────────────────────────────────────────────────
  private getCauldronArt(time: number): (SpritePixel | null)[][] {
    const g = Math.floor(180 + 75 * Math.sin(time * 3));
    const BUBBLE: [number, number, number] = [80, g, 100];
    const POT: [number, number, number] = [60, 60, 65];

    const lines = [
      '  o * o  ',
      ' ╭─────╮ ',
      ' │ooooo│ ',
      ' │░░░░░│ ',
      ' ╰─┬─┬─╯ ',
      '  ╱   ╲  ',
    ];

    return this.parseGrid(lines, {
      'o': { char: 'o', color: BUBBLE, lit: true },
      '*': { char: '*', color: BUBBLE, lit: true },
      '╭': { char: '╭', color: POT, lit: false },
      '─': { char: '─', color: POT, lit: false },
      '╮': { char: '╮', color: POT, lit: false },
      '│': { char: '│', color: POT, lit: false },
      '░': { char: '░', color: [40, 110, 50], lit: true },
      '╰': { char: '╰', color: POT, lit: false },
      '┬': { char: '┬', color: POT, lit: false },
      '╯': { char: '╯', color: POT, lit: false },
      '╱': { char: '╱', color: POT, lit: false },
      '╲': { char: '╲', color: POT, lit: false },
    });
  }

  // ── THRONE ─────────────────────────────────────────────────────────────────
  private getThroneArt(): (SpritePixel | null)[][] {
    const GOLD: [number, number, number] = [220, 180, 60];
    const RED: [number, number, number] = [150, 30, 30];
    const WOOD: [number, number, number] = [110, 80, 45];

    const lines = [
      '  ╔═✦═╗  ',
      '  ║ R ║  ',
      ' ╔╬═══╬╗ ',
      ' ║║RRR║║ ',
      ' ╚╩═══╩╝ ',
      '  ║   ║  ',
    ];

    return this.parseGrid(lines, {
      '╔': { char: '╔', color: GOLD, lit: false },
      '═': { char: '═', color: GOLD, lit: false },
      '✦': { char: '✦', color: GOLD, lit: true },
      '╗': { char: '╗', color: GOLD, lit: false },
      '║': { char: '║', color: WOOD, lit: false },
      'R': { char: '▓', color: RED, lit: false },
      '╬': { char: '╬', color: GOLD, lit: false },
      '╚': { char: '╚', color: WOOD, lit: false },
      '╩': { char: '╩', color: WOOD, lit: false },
      '╝': { char: '╝', color: WOOD, lit: false },
    });
  }

  // ── SARCOPHAGUS ────────────────────────────────────────────────────────────
  private getSarcophagusArt(): (SpritePixel | null)[][] {
    const S: [number, number, number] = [135, 130, 120];
    const B: [number, number, number] = [170, 165, 150];

    const lines = [
      ' ╔═════╗ ',
      ' ║ ╳ ╳ ║ ',
      ' ║  ☠  ║ ',
      ' ║ ╳ ╳ ║ ',
      ' ╚═════╝ ',
    ];

    return this.parseGrid(lines, {
      '╔': { char: '╔', color: S, lit: false },
      '═': { char: '═', color: S, lit: false },
      '╗': { char: '╗', color: S, lit: false },
      '║': { char: '║', color: S, lit: false },
      '╳': { char: '╳', color: S, lit: false },
      '☠': { char: '☠', color: B, lit: false },
      '╚': { char: '╚', color: S, lit: false },
      '╝': { char: '╝', color: S, lit: false },
    });
  }

  // ── CHEST ──────────────────────────────────────────────────────────────────
  private getChestArt(): (SpritePixel | null)[][] {
    const W: [number, number, number] = [140, 100, 45];
    const G: [number, number, number] = [215, 175, 45];

    const lines = [
      ' ╔═════╗ ',
      ' ║W W W║ ',
      ' ╠══●══╣ ',
      ' ║W W W║ ',
      ' ╚═════╝ ',
    ];

    return this.parseGrid(lines, {
      '╔': { char: '╔', color: G, lit: false },
      '═': { char: '═', color: G, lit: false },
      '╗': { char: '╗', color: G, lit: false },
      '║': { char: '║', color: G, lit: false },
      'W': { char: '▓', color: W, lit: false },
      '╠': { char: '╠', color: G, lit: false },
      '●': { char: '●', color: [255, 230, 120], lit: true },
      '╣': { char: '╣', color: G, lit: false },
      '╚': { char: '╚', color: G, lit: false },
      '╝': { char: '╝', color: G, lit: false },
    });
  }

  // ── BANNER ─────────────────────────────────────────────────────────────────
  private getBannerArt(): (SpritePixel | null)[][] {
    const R: [number, number, number] = [160, 40, 35];
    const G: [number, number, number] = [230, 190, 60];
    const P: [number, number, number] = [120, 95, 60];

    const lines = [
      ' ═══════ ',
      ' ║RRRRR║ ',
      ' ║R G R║ ',
      ' ║RGGG R║',
      ' ║R G R║ ',
      ' ║RRRRR║ ',
      '  ╲   ╱  ',
      '   ╲ ╱   ',
      '    V    ',
    ];

    return this.parseGrid(lines, {
      '═': { char: '═', color: P, lit: false },
      '║': { char: '║', color: P, lit: false },
      'R': { char: '█', color: R, lit: false },
      'G': { char: '✦', color: G, lit: true },
      ' ': null,
      '╲': { char: '╲', color: R, lit: false },
      '╱': { char: '╱', color: R, lit: false },
      'V': { char: 'V', color: G, lit: false },
    });
  }

  // ── BARREL ─────────────────────────────────────────────────────────────────
  private getBarrelArt(): (SpritePixel | null)[][] {
    const W: [number, number, number] = [135, 95, 45];
    const I: [number, number, number] = [80, 80, 85];

    const lines = [
      ' ╭───╮ ',
      ' │WWW│ ',
      ' │═══│ ',
      ' │WWW│ ',
      ' ╰───╯ ',
    ];

    return this.parseGrid(lines, {
      '╭': { char: '╭', color: I, lit: false },
      '─': { char: '─', color: I, lit: false },
      '╮': { char: '╮', color: I, lit: false },
      '│': { char: '│', color: I, lit: false },
      'W': { char: '▓', color: W, lit: false },
      '═': { char: '═', color: I, lit: false },
      '╰': { char: '╰', color: I, lit: false },
      '╯': { char: '╯', color: I, lit: false },
    });
  }

  // ── CRATE ──────────────────────────────────────────────────────────────────
  private getCrateArt(): (SpritePixel | null)[][] {
    const W: [number, number, number] = [125, 90, 42];

    const lines = [
      ' ┌───┐ ',
      ' │╲ ╱│ ',
      ' │ ╳ │ ',
      ' │╱ ╲│ ',
      ' └───┘ ',
    ];

    return this.parseGrid(lines, {
      '┌': { char: '┌', color: W, lit: false },
      '─': { char: '─', color: W, lit: false },
      '┐': { char: '┐', color: W, lit: false },
      '│': { char: '│', color: W, lit: false },
      '╲': { char: '╲', color: W, lit: false },
      '╱': { char: '╱', color: W, lit: false },
      '╳': { char: '╳', color: W, lit: false },
      '└': { char: '└', color: W, lit: false },
      '┘': { char: '┘', color: W, lit: false },
    });
  }

  // ── SKELETON ───────────────────────────────────────────────────────────────
  private getSkeletonArt(): (SpritePixel | null)[][] {
    const B: [number, number, number] = [190, 185, 170];

    const lines = [
      '   ☠   ',
      '  ╱│╲  ',
      ' ╱ │ ╲ ',
      '   │   ',
      '  ╱ ╲  ',
      ' ╱   ╲ ',
    ];

    return this.parseGrid(lines, {
      '☠': { char: '☠', color: B, lit: false },
      '╱': { char: '╱', color: B, lit: false },
      '│': { char: '│', color: B, lit: false },
      '╲': { char: '╲', color: B, lit: false },
    });
  }

  // ── POTION ─────────────────────────────────────────────────────────────────
  private getPotionArt(time: number): (SpritePixel | null)[][] {
    const pulse = 0.7 + 0.3 * Math.sin(time * 4);
    const LIQ: [number, number, number] = [Math.floor(60 * pulse), Math.floor(180 * pulse), 255];
    const GL: [number, number, number] = [180, 200, 230];

    const lines = [
      '  ┌┐  ',
      '  ││  ',
      ' ╱  ╲ ',
      ' │██│ ',
      ' ╰──╯ ',
    ];

    return this.parseGrid(lines, {
      '┌': { char: '┌', color: GL, lit: false },
      '┐': { char: '┐', color: GL, lit: false },
      '│': { char: '│', color: GL, lit: false },
      '╱': { char: '╱', color: GL, lit: false },
      '╲': { char: '╲', color: GL, lit: false },
      '█': { char: '█', color: LIQ, lit: true },
      '╰': { char: '╰', color: GL, lit: false },
      '─': { char: '─', color: GL, lit: false },
      '╯': { char: '╯', color: GL, lit: false },
    });
  }

  // ── BOOKSHELF ──────────────────────────────────────────────────────────────
  private getBookshelfArt(): (SpritePixel | null)[][] {
    const W: [number, number, number] = [115, 80, 45];
    const B1: [number, number, number] = [160, 45, 40];
    const B2: [number, number, number] = [45, 95, 160];
    const B3: [number, number, number] = [180, 150, 40];

    const lines = [
      ' ┌────┐ ',
      ' │1231│ ',
      ' │════│ ',
      ' │3123│ ',
      ' │════│ ',
      ' │2312│ ',
      ' └────┘ ',
    ];

    return this.parseGrid(lines, {
      '┌': { char: '┌', color: W, lit: false },
      '─': { char: '─', color: W, lit: false },
      '┐': { char: '┐', color: W, lit: false },
      '│': { char: '│', color: W, lit: false },
      '1': { char: '█', color: B1, lit: false },
      '2': { char: '█', color: B2, lit: false },
      '3': { char: '█', color: B3, lit: false },
      '═': { char: '═', color: W, lit: false },
      '└': { char: '└', color: W, lit: false },
      '┘': { char: '┘', color: W, lit: false },
    });
  }

  // ── WEAPON RACK ────────────────────────────────────────────────────────────
  private getWeaponRackArt(): (SpritePixel | null)[][] {
    const W: [number, number, number] = [110, 80, 45];
    const S: [number, number, number] = [180, 185, 195];

    const lines = [
      ' ┌─┬─┬─┐ ',
      ' │S│S│S│ ',
      ' │ │ │ │ ',
      ' │S│S│S│ ',
      ' └─┴─┴─┘ ',
    ];

    return this.parseGrid(lines, {
      '┌': { char: '┌', color: W, lit: false },
      '─': { char: '─', color: W, lit: false },
      '┬': { char: '┬', color: W, lit: false },
      '┐': { char: '┐', color: W, lit: false },
      '│': { char: '│', color: W, lit: false },
      'S': { char: '│', color: S, lit: false },
      '└': { char: '└', color: W, lit: false },
      '┴': { char: '┴', color: W, lit: false },
      '┘': { char: '┘', color: W, lit: false },
    });
  }

  // ── CHAINS ─────────────────────────────────────────────────────────────────
  private getChainsArt(): (SpritePixel | null)[][] {
    const I: [number, number, number] = [100, 100, 105];

    const lines = [
      ' ○   ○ ',
      ' ┃   ┃ ',
      ' ◯   ◯ ',
      ' ┃   ┃ ',
      ' ○   ○ ',
      ' ┃   ┃ ',
    ];

    return this.parseGrid(lines, {
      '○': { char: '○', color: I, lit: false },
      '┃': { char: '┃', color: I, lit: false },
      '◯': { char: '◯', color: I, lit: false },
    });
  }

  // ── SKULL PILE ─────────────────────────────────────────────────────────────
  private getSkullPileArt(): (SpritePixel | null)[][] {
    const B: [number, number, number] = [190, 185, 165];

    const lines = [
      '  ☠ ☠  ',
      ' ☠☠☠☠ ',
      ' ▓▓▓▓▓ ',
    ];

    return this.parseGrid(lines, {
      '☠': { char: '☠', color: B, lit: false },
      '▓': { char: '▓', color: [100, 95, 85], lit: false },
    });
  }

  // ── ALE KEG ────────────────────────────────────────────────────────────────
  private getAleKegArt(): (SpritePixel | null)[][] {
    const W: [number, number, number] = [130, 90, 40];
    const I: [number, number, number] = [95, 95, 100];
    const G: [number, number, number] = [210, 170, 50];

    const lines = [
      ' ╭═══╮  ',
      ' │WWW│  ',
      ' │WWW├─┤',
      ' │WWW│  ',
      ' ╰═══╯  ',
    ];

    return this.parseGrid(lines, {
      '╭': { char: '╭', color: I, lit: false },
      '═': { char: '═', color: I, lit: false },
      '╮': { char: '╮', color: I, lit: false },
      '│': { char: '│', color: I, lit: false },
      'W': { char: '▓', color: W, lit: false },
      '├': { char: '├', color: G, lit: false },
      '─': { char: '─', color: G, lit: false },
      '┤': { char: '┤', color: G, lit: false },
      '╰': { char: '╰', color: I, lit: false },
      '╯': { char: '╯', color: I, lit: false },
    });
  }

  // ── TABLE ──────────────────────────────────────────────────────────────────
  private getTableArt(): (SpritePixel | null)[][] {
    const W: [number, number, number] = [115, 80, 42];

    const lines = [
      ' ┌─────┐ ',
      ' │░░░░░│ ',
      ' └┬───┬┘ ',
      '  │   │  ',
    ];

    return this.parseGrid(lines, {
      '┌': { char: '┌', color: W, lit: false },
      '─': { char: '─', color: W, lit: false },
      '┐': { char: '┐', color: W, lit: false },
      '│': { char: '│', color: W, lit: false },
      '░': { char: '░', color: W, lit: false },
      '└': { char: '└', color: W, lit: false },
      '┬': { char: '┬', color: W, lit: false },
      '┘': { char: '┘', color: W, lit: false },
    });
  }

  // ── CAGE ───────────────────────────────────────────────────────────────────
  private getCageArt(): (SpritePixel | null)[][] {
    const I: [number, number, number] = [85, 85, 90];

    const lines = [
      '   ○   ',
      '   ┃   ',
      ' ╭─┬─╮ ',
      ' │ │ │ ',
      ' │ │ │ ',
      ' ╰─┴─╯ ',
    ];

    return this.parseGrid(lines, {
      '○': { char: '○', color: I, lit: false },
      '┃': { char: '┃', color: I, lit: false },
      '╭': { char: '╭', color: I, lit: false },
      '─': { char: '─', color: I, lit: false },
      '┬': { char: '┬', color: I, lit: false },
      '╮': { char: '╮', color: I, lit: false },
      '│': { char: '│', color: I, lit: false },
      '╰': { char: '╰', color: I, lit: false },
      '┴': { char: '┴', color: I, lit: false },
      '╯': { char: '╯', color: I, lit: false },
    });
  }

  // Helper to map ASCII string matrix to SpritePixel grid
  private parseGrid(
    lines: string[],
    map: Record<string, { char: string; color: [number, number, number]; lit: boolean } | null>
  ): (SpritePixel | null)[][] {
    const grid: (SpritePixel | null)[][] = [];
    for (const line of lines) {
      const row: (SpritePixel | null)[] = [];
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === ' ' || !map[ch]) {
          row.push(null);
        } else {
          const entry = map[ch]!;
          row.push({
            char: entry.char,
            color: entry.color,
            isSelfLit: entry.lit,
          });
        }
      }
      grid.push(row);
    }
    return grid;
  }
}
