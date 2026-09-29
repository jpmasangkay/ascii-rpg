// ============================================================================
// Game Map — Dark Fantasy Castle & Dungeons: "The Ruins of Kaer Thal"
// ============================================================================
// Features:
//   - Outer Castle Courtyard at night under open starry skies
//   - Towering Castle Keep with running-bond stone masonry & arrow slits
//   - Freestanding iron braziers casting warm radial amber pools
//   - Grand Interior Fortress: Hall of Pillars, Throne Room, Arcane Sanctum,
//     Crypt of the Fallen, Prison Cells, Armory, and Secret Chambers.
// ============================================================================

export const TILE = {
  EMPTY: 0,
  CASTLE_TOWER: 1,    // Massive stone keep masonry with arrow slits (outdoor)
  STONE_WALL: 2,      // Ancient hewn stone blocks
  ARCHWAY: 3,         // Stone archway entrance
  BRICK_WALL: 4,      // Crumbling weathered brick
  WOOD_WALL: 5,       // Rotting timber planks (tavern/storage)
  IRON_DOOR: 6,       // Heavy iron-banded door
  MOSSY_STONE: 7,     // Moss-covered dungeon stone
  DARK_STONE: 8,      // Obsidian-dark volcanic stone
  PILLAR: 9,          // Carved stone column
  RUNIC_WALL: 10,     // Wall with glowing arcane runes
  CRYPT_WALL: 11,     // Bone-inlaid crypt wall
  CELL_BARS: 12,      // Prison cell iron bars
  TAPESTRY: 13,       // Tattered royal banner / tapestry
  CARVED_STONE: 14,   // Ornately carved throne room masonry
} as const;
export type TILE = (typeof TILE)[keyof typeof TILE];

export interface TorchDef {
  x: number;
  y: number;
  radius: number;
  intensity: number;
  color: [number, number, number];
}

export interface SpriteDef {
  x: number;
  y: number;
  type: 'torch_wall' | 'brazier' | 'barrel' | 'crate' | 'skeleton' | 'chest' |
        'potion' | 'bookshelf' | 'throne' | 'sarcophagus' | 'cauldron' |
        'weapon_rack' | 'chains' | 'skull_pile' | 'ale_keg' | 'table' |
        'cage' | 'crystal' | 'banner';
}

export class GameMap {
  readonly width = 48;
  readonly height = 48;
  readonly tiles: number[][];
  readonly torches: TorchDef[];
  readonly spriteDefs: SpriteDef[];
  readonly areaMap: string[][];

  // Base material colors for each tile type
  static readonly TILE_COLORS: Record<number, [number, number, number]> = {
    [TILE.CASTLE_TOWER]: [92, 82, 74],     // Weathered brownish-grey castle stone
    [TILE.STONE_WALL]:   [95, 90, 82],     // Ancient hewn stone
    [TILE.ARCHWAY]:      [85, 78, 70],     // Darker stone arch
    [TILE.BRICK_WALL]:   [125, 75, 50],    // Old reddish brick
    [TILE.WOOD_WALL]:    [85, 60, 32],     // Dark aged wood
    [TILE.IRON_DOOR]:    [65, 70, 75],     // Heavy cold iron
    [TILE.MOSSY_STONE]:  [60, 88, 55],     // Green mossy stone
    [TILE.DARK_STONE]:   [42, 38, 48],     // Near-black volcanic rock
    [TILE.PILLAR]:       [120, 115, 105],  // Carved lighter stone
    [TILE.RUNIC_WALL]:   [75, 65, 105],    // Arcane purple stone
    [TILE.CRYPT_WALL]:   [90, 85, 72],     // Bone-tinted crypt stone
    [TILE.CELL_BARS]:    [55, 60, 65],     // Dark rusted iron bars
    [TILE.TAPESTRY]:     [115, 35, 30],    // Faded crimson tapestry
    [TILE.CARVED_STONE]: [110, 100, 82],   // Warm carved throne stone
  };

  // Wall heights per tile type for realistic vertical architecture
  static readonly WALL_HEIGHTS: Record<number, number> = {
    [TILE.CASTLE_TOWER]: 2.2,  // Castle tower looms high into the sky!
    [TILE.STONE_WALL]:   1.2,
    [TILE.ARCHWAY]:      1.4,
    [TILE.BRICK_WALL]:   1.0,
    [TILE.WOOD_WALL]:    1.0,
    [TILE.IRON_DOOR]:    1.0,
    [TILE.MOSSY_STONE]:  1.0,
    [TILE.DARK_STONE]:   1.5,
    [TILE.PILLAR]:       1.1,
    [TILE.RUNIC_WALL]:   1.1,
    [TILE.CRYPT_WALL]:   1.0,
    [TILE.CELL_BARS]:    1.0,
    [TILE.TAPESTRY]:     1.0,
    [TILE.CARVED_STONE]: 1.2,
  };

  // Floor definitions per area
  static readonly AREA_FLOOR: Record<string, {
    chars: string;
    colors: [[number, number, number], [number, number, number]];
    outdoor: boolean;
  }> = {
    'courtyard': {
      chars: '·.,:░▒',
      // Earthy dark olive greens, soil, and cobblestone path
      colors: [[58, 62, 42], [42, 44, 32]],
      outdoor: true,
    },
    'dungeon': {
      chars: '·.,:;░',
      colors: [[48, 44, 36], [36, 32, 26]],
      outdoor: false,
    },
    'tavern': {
      chars: '═─┬┴·.',
      colors: [[78, 54, 28], [62, 42, 22]],
      outdoor: false,
    },
    'crypt': {
      chars: '·.:░▒ ',
      colors: [[52, 48, 44], [40, 36, 34]],
      outdoor: false,
    },
    'arcane': {
      chars: '·◊.:░◊',
      colors: [[38, 32, 58], [28, 25, 46]],
      outdoor: false,
    },
    'throne': {
      chars: '░▒·.:░',
      colors: [[68, 58, 42], [52, 45, 35]],
      outdoor: false,
    },
    'prison': {
      chars: '·.,:  ',
      colors: [[38, 36, 32], [28, 26, 24]],
      outdoor: false,
    },
    'armory': {
      chars: '·.:░▒ ',
      colors: [[52, 52, 55], [40, 40, 42]],
      outdoor: false,
    },
    'default': {
      chars: '·.:░▒ ',
      colors: [[48, 44, 36], [36, 32, 26]],
      outdoor: false,
    },
  };

  constructor() {
    this.tiles = Array.from({ length: this.height }, () =>
      new Array(this.width).fill(TILE.EMPTY)
    );
    this.areaMap = Array.from({ length: this.height }, () =>
      new Array(this.width).fill('courtyard')
    );

    this.torches = [];
    this.spriteDefs = [];

    this.buildWorld();
  }

  private buildWorld() {
    const rect = (x1: number, y1: number, x2: number, y2: number, tile: number) => {
      for (let x = x1; x <= x2; x++) {
        this.setTile(x, y1, tile);
        this.setTile(x, y2, tile);
      }
      for (let y = y1; y <= y2; y++) {
        this.setTile(x1, y, tile);
        this.setTile(x2, y, tile);
      }
    };

    const fillArea = (x1: number, y1: number, x2: number, y2: number, area: string) => {
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
            this.areaMap[y][x] = area;
          }
        }
      }
    };

    const CT = TILE.CASTLE_TOWER;
    const S = TILE.STONE_WALL;
    const A = TILE.ARCHWAY;
    const W = TILE.WOOD_WALL;
    const M = TILE.MOSSY_STONE;
    const D = TILE.DARK_STONE;
    const P = TILE.PILLAR;
    const R = TILE.RUNIC_WALL;
    const CR = TILE.CRYPT_WALL;
    const CB = TILE.CELL_BARS;
    const TP = TILE.TAPESTRY;
    const CS = TILE.CARVED_STONE;

    // ═════════════════════════════════════════════════════════════════
    // 1. OUTER BOUNDARY WALLS
    // ═════════════════════════════════════════════════════════════════
    for (let x = 0; x < this.width; x++) {
      this.setTile(x, 0, D);
      this.setTile(x, this.height - 1, D);
    }
    for (let y = 0; y < this.height; y++) {
      this.setTile(0, y, D);
      this.setTile(this.width - 1, y, D);
    }

    // ═════════════════════════════════════════════════════════════════
    // 2. THE CASTLE COURTYARD (y: 30 .. 46, outdoor night sky)
    // ═════════════════════════════════════════════════════════════════
    fillArea(1, 30, 46, 46, 'courtyard');

    // Courtyard perimeter battlements/walls
    for (let y = 30; y <= 46; y++) {
      this.setTile(8, y, S);
      this.setTile(40, y, S);
    }
    for (let x = 8; x <= 40; x++) {
      this.setTile(x, 46, S);
    }

    // ═════════════════════════════════════════════════════════════════
    // 3. THE GRAND CASTLE KEEP / FORTRESS TOWER (y: 28 .. 30)
    //    Directly ahead of player spawn at (24, 43) facing North
    // ═════════════════════════════════════════════════════════════════
    // The central keep front wall with running-bond stone masonry & arrow slits
    for (let x = 16; x <= 32; x++) {
      this.setTile(x, 30, CT);
    }

    // Archway entrance into the fortress interior (at center)
    this.setTile(24, 30, A);

    // Left tower corner / buttress
    for (let y = 26; y <= 30; y++) {
      this.setTile(16, y, CT);
    }

    // Right tower wing / buttress (extends forward into the courtyard)
    // Exactly matches the protruding wall/arch on the right of the reference!
    for (let y = 30; y <= 34; y++) {
      this.setTile(32, y, CT);
    }
    this.setTile(31, 34, CT);

    // ═════════════════════════════════════════════════════════════════
    // 4. THE COURTYARD BRAZIERS & LIGHTING
    //    Matches the reference screenshot with surgical precision!
    // ═════════════════════════════════════════════════════════════════
    // Right Brazier: closer to player (x: 27.8, y: 37.5)
    // Emits warm golden amber light onto the ground and right wing
    this.addTorch(27.8, 37.5, 14, 1.6, [255, 180, 50]);
    this.spriteDefs.push({ x: 27.8, y: 37.5, type: 'brazier' });

    // Left Brazier: further back near castle tower (x: 20.8, y: 33.2)
    // Illuminates the castle keep wall with soft radial amber glow
    this.addTorch(20.8, 33.2, 13, 1.4, [255, 175, 45]);
    this.spriteDefs.push({ x: 20.8, y: 33.2, type: 'brazier' });

    // Subtle courtyard ambient torches along the outer ramparts
    this.addTorch(10, 42, 7, 0.6, [230, 150, 40]);
    this.spriteDefs.push({ x: 10, y: 42, type: 'torch_wall' });

    this.addTorch(38, 42, 7, 0.6, [230, 150, 40]);
    this.spriteDefs.push({ x: 38, y: 42, type: 'torch_wall' });

    // ═════════════════════════════════════════════════════════════════
    // 5. GRAND ENTRANCE HALL (y: 21 .. 29, indoor fortress interior)
    // ═════════════════════════════════════════════════════════════════
    rect(16, 21, 32, 29, S);
    fillArea(17, 22, 31, 29, 'dungeon');

    // Connect archway to grand hall
    this.setTile(24, 29, TILE.EMPTY);
    this.setTile(24, 30, TILE.EMPTY); // Open passageway

    // Grand stone pillars lining the entrance hall
    this.setTile(19, 24, P);
    this.setTile(29, 24, P);
    this.setTile(19, 27, P);
    this.setTile(29, 27, P);

    // Torches and banners in Grand Hall
    this.addTorch(18, 23, 7, 1.0, [255, 180, 60]);
    this.addTorch(30, 23, 7, 1.0, [255, 180, 60]);
    this.spriteDefs.push(
      { x: 18, y: 23, type: 'torch_wall' },
      { x: 30, y: 23, type: 'torch_wall' },
      { x: 24, y: 23, type: 'banner' },
    );

    // ═════════════════════════════════════════════════════════════════
    // 6. TAVERN / COMMON ROOM (West Wing, y: 21 .. 29, x: 3 .. 15)
    // ═════════════════════════════════════════════════════════════════
    rect(3, 21, 15, 29, W);
    fillArea(4, 22, 14, 28, 'tavern');

    // Passage from Grand Hall to Tavern
    this.setTile(16, 25, TILE.EMPTY);
    this.setTile(15, 25, TILE.EMPTY);

    this.addTorch(6, 23, 7, 1.0, [255, 160, 40]);
    this.addTorch(12, 23, 7, 1.0, [255, 160, 40]);
    this.spriteDefs.push(
      { x: 6, y: 23, type: 'torch_wall' },
      { x: 12, y: 23, type: 'torch_wall' },
      { x: 8, y: 25, type: 'table' },
      { x: 11, y: 25, type: 'table' },
      { x: 5, y: 27, type: 'ale_keg' },
      { x: 6.5, y: 27, type: 'ale_keg' },
      { x: 13, y: 27, type: 'barrel' },
    );

    // ═════════════════════════════════════════════════════════════════
    // 7. ARMORY (East Wing, y: 21 .. 29, x: 33 .. 45)
    // ═════════════════════════════════════════════════════════════════
    rect(33, 21, 45, 29, S);
    fillArea(34, 22, 44, 28, 'armory');

    // Passage from Grand Hall to Armory
    this.setTile(32, 25, TILE.EMPTY);
    this.setTile(33, 25, TILE.EMPTY);

    this.addTorch(36, 23, 6, 0.8, [220, 160, 45]);
    this.addTorch(42, 23, 6, 0.8, [220, 160, 45]);
    this.spriteDefs.push(
      { x: 36, y: 23, type: 'torch_wall' },
      { x: 42, y: 23, type: 'torch_wall' },
      { x: 38, y: 25, type: 'weapon_rack' },
      { x: 41, y: 25, type: 'weapon_rack' },
      { x: 43, y: 27, type: 'chest' },
      { x: 35, y: 27, type: 'crate' },
    );

    // ═════════════════════════════════════════════════════════════════
    // 8. THRONE ROOM (Center-North, y: 7 .. 19, x: 15 .. 33)
    // ═════════════════════════════════════════════════════════════════
    rect(15, 7, 33, 19, CS);
    fillArea(16, 8, 32, 18, 'throne');

    // North corridor connecting Grand Hall to Throne Room
    for (let y = 19; y <= 21; y++) {
      this.setTile(23, y, M);
      this.setTile(25, y, M);
    }
    this.setTile(24, 19, TILE.EMPTY);
    this.setTile(24, 20, TILE.EMPTY);
    this.setTile(24, 21, TILE.EMPTY);

    // Pillars in throne room
    this.setTile(19, 11, P);
    this.setTile(29, 11, P);
    this.setTile(19, 15, P);
    this.setTile(29, 15, P);

    // Tapestries
    this.setTile(15, 11, TP);
    this.setTile(15, 15, TP);
    this.setTile(33, 11, TP);
    this.setTile(33, 15, TP);

    // Grand golden braziers in throne room
    this.addTorch(18, 9, 8, 1.2, [255, 195, 75]);
    this.addTorch(30, 9, 8, 1.2, [255, 195, 75]);
    this.addTorch(24, 9, 7, 1.1, [255, 210, 90]);
    this.spriteDefs.push(
      { x: 18, y: 9, type: 'brazier' },
      { x: 30, y: 9, type: 'brazier' },
      { x: 24, y: 9, type: 'throne' },
      { x: 24, y: 13, type: 'banner' },
    );

    // ═════════════════════════════════════════════════════════════════
    // 9. ALCHEMIST'S ARCANE SANCTUM (Northwest, y: 7 .. 18, x: 3 .. 14)
    // ═════════════════════════════════════════════════════════════════
    rect(3, 7, 14, 18, R);
    fillArea(4, 8, 13, 17, 'arcane');

    // Passage from Throne Room to Arcane Sanctum
    this.setTile(14, 13, TILE.EMPTY);
    this.setTile(15, 13, TILE.EMPTY);

    this.addTorch(6, 9, 7, 1.1, [90, 190, 255]);
    this.addTorch(11, 9, 7, 1.1, [90, 190, 255]);
    this.addTorch(8.5, 15, 6, 1.0, [110, 255, 190]);
    this.spriteDefs.push(
      { x: 6, y: 9, type: 'crystal' },
      { x: 11, y: 9, type: 'crystal' },
      { x: 8.5, y: 15, type: 'cauldron' },
      { x: 5, y: 12, type: 'bookshelf' },
      { x: 12, y: 12, type: 'potion' },
      { x: 12, y: 14, type: 'potion' },
    );

    // ═════════════════════════════════════════════════════════════════
    // 10. ANCIENT CRYPT (Northeast, y: 7 .. 18, x: 34 .. 45)
    // ═════════════════════════════════════════════════════════════════
    rect(34, 7, 45, 18, CR);
    fillArea(35, 8, 44, 17, 'crypt');

    // Passage from Throne Room to Crypt
    this.setTile(33, 13, TILE.EMPTY);
    this.setTile(34, 13, TILE.EMPTY);

    this.addTorch(37, 9, 6, 0.7, [125, 155, 255]);
    this.addTorch(42, 9, 6, 0.7, [125, 155, 255]);
    this.spriteDefs.push(
      { x: 37, y: 9, type: 'torch_wall' },
      { x: 42, y: 9, type: 'torch_wall' },
      { x: 39, y: 13, type: 'sarcophagus' },
      { x: 43, y: 13, type: 'sarcophagus' },
      { x: 42, y: 16, type: 'skull_pile' },
      { x: 37, y: 16, type: 'skeleton' },
    );

    // ═════════════════════════════════════════════════════════════════
    // 11. PRISON CELLS (Far West, y: 11 .. 19, x: 1 .. 8)
    // ═════════════════════════════════════════════════════════════════
    this.setTile(3, 13, TILE.EMPTY); // connect from arcane lab
    this.setTile(5, 11, CB);
    this.setTile(5, 12, CB);
    this.setTile(5, 14, CB);
    this.spriteDefs.push(
      { x: 4, y: 14, type: 'chains' },
      { x: 4, y: 16, type: 'skeleton' },
    );

    // ═════════════════════════════════════════════════════════════════
    // 12. SECRET CHAMBER (Behind Throne Room, y: 2 .. 6, x: 20 .. 28)
    // ═════════════════════════════════════════════════════════════════
    rect(20, 2, 28, 6, D);
    fillArea(21, 3, 27, 5, 'arcane');

    // Secret passage behind throne
    this.setTile(24, 7, TILE.EMPTY);
    this.setTile(24, 6, TILE.EMPTY);

    this.addTorch(24, 4, 6, 1.0, [190, 85, 255]);
    this.spriteDefs.push(
      { x: 24, y: 4, type: 'crystal' },
      { x: 22, y: 4, type: 'chest' },
      { x: 26, y: 4, type: 'bookshelf' },
    );
  }

  private setTile(x: number, y: number, tile: number) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix >= 0 && ix < this.width && iy >= 0 && iy < this.height) {
      this.tiles[iy][ix] = tile;
    }
  }

  private addTorch(x: number, y: number, radius: number, intensity: number, color: [number, number, number]) {
    this.torches.push({ x, y, radius, intensity, color });
  }

  isWall(x: number, y: number): boolean {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) return true;
    return this.tiles[iy][ix] !== TILE.EMPTY;
  }

  getTile(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) return TILE.STONE_WALL;
    return this.tiles[iy][ix];
  }

  getArea(x: number, y: number): string {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) return 'courtyard';
    return this.areaMap[iy][ix];
  }

  isOutdoor(x: number, y: number): boolean {
    const area = this.getArea(x, y);
    return GameMap.AREA_FLOOR[area]?.outdoor ?? false;
  }

  getWallHeight(tile: number): number {
    return GameMap.WALL_HEIGHTS[tile] ?? 1.0;
  }

  isSolidProp(x: number, y: number, r: number = 0.25): boolean {
    const solidTypes = new Set([
      'brazier', 'barrel', 'crate', 'chest', 'throne',
      'sarcophagus', 'cauldron', 'bookshelf', 'table', 'ale_keg'
    ]);
    for (const sp of this.spriteDefs) {
      if (solidTypes.has(sp.type)) {
        const dx = x - sp.x;
        const dy = y - sp.y;
        const minDist = r + 0.35;
        if (dx * dx + dy * dy < minDist * minDist) {
          return true;
        }
      }
    }
    return false;
  }
}
