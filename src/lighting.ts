// ============================================================================
// Lighting System — Smooth Realistic Torch & Brazier Lighting
// ============================================================================
// Emits warm light with inverse-quadratic falloff, organic multi-frequency
// flicker animation, and soft ambient night darkness.
// ============================================================================

import { GameMap } from './map';

export interface LightSample {
  r: number;
  g: number;
  b: number;
  intensity: number;
}

export class LightingSystem {
  private flickerPhase: number[];
  private flickerSpeed: number[];
  private flickerPhase2: number[];
  private flickerSpeed2: number[];

  // Night courtyard ambient — deep indigo/navy darkness
  readonly ambientR = 12;
  readonly ambientG = 10;
  readonly ambientB = 22;
  readonly ambientIntensity = 0.05;

  constructor(private map: GameMap) {
    const n = map.torches.length;
    this.flickerPhase = Array.from({ length: n }, () => Math.random() * Math.PI * 2);
    this.flickerSpeed = Array.from({ length: n }, () => 3.0 + Math.random() * 3.5);
    this.flickerPhase2 = Array.from({ length: n }, () => Math.random() * Math.PI * 2);
    this.flickerSpeed2 = Array.from({ length: n }, () => 6.0 + Math.random() * 7.0);
  }

  update(_time: number) {}

  sampleLight(worldX: number, worldY: number, time: number): LightSample {
    let r = this.ambientR;
    let g = this.ambientG;
    let b = this.ambientB;
    let totalIntensity = this.ambientIntensity;

    for (let i = 0; i < this.map.torches.length; i++) {
      const t = this.map.torches[i];
      const dx = worldX - t.x;
      const dy = worldY - t.y;
      const distSq = dx * dx + dy * dy;
      const maxDistSq = t.radius * t.radius;

      if (distSq >= maxDistSq) continue;

      const dist = Math.sqrt(distSq);
      const norm = dist / t.radius;

      // Multi-layered organic flicker
      const f1 = Math.sin(time * this.flickerSpeed[i] + this.flickerPhase[i]);
      const f2 = Math.sin(time * this.flickerSpeed2[i] + this.flickerPhase2[i]);
      const flicker = 1.0 + f1 * 0.10 + f2 * 0.05;

      // Smooth soft falloff: (1 - (dist/R)^2)^1.5
      // Creates soft, realistic spherical light pools
      const atten = Math.pow(1.0 - norm * norm, 1.4);
      const contribution = t.intensity * atten * flicker;

      r += t.color[0] * contribution;
      g += t.color[1] * contribution;
      b += t.color[2] * contribution;
      totalIntensity += contribution;
    }

    return {
      r: Math.min(255, r),
      g: Math.min(255, g),
      b: Math.min(255, b),
      intensity: Math.min(2.5, totalIntensity),
    };
  }

  getTorchFlicker(index: number, time: number): number {
    if (index < 0 || index >= this.flickerSpeed.length) return 1.0;
    return 1.0 +
      0.12 * Math.sin(time * this.flickerSpeed[index] + this.flickerPhase[index]) +
      0.06 * Math.sin(time * this.flickerSpeed2[index] + this.flickerPhase2[index]);
  }
}
