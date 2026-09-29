// ============================================================================
// Player — First-Person Camera, Controls, and Physics
// ============================================================================

import { GameMap } from './map';

export class Player {
  // Spawn in the Castle Courtyard facing North directly toward the Keep
  x: number = 24.2;
  y: number = 42.5;
  angle: number = -Math.PI / 2; // Facing North
  pitch: number = 0.05; // Slightly looking up at the towering castle

  // Movement physics
  vx: number = 0;
  vy: number = 0;
  moveForward: number = 0;
  moveStrafe: number = 0;

  // Camera settings
  readonly fov: number = Math.PI / 3; // 60 degrees
  readonly moveSpeed: number = 3.5;
  readonly turnSpeed: number = 0.003;
  readonly collisionRadius: number = 0.25;

  // Head bob
  bobPhase: number = 0;
  bobAmount: number = 0;

  constructor(private map: GameMap) {}

  update(dt: number) {
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);

    const wishX = (this.moveForward * cos - this.moveStrafe * sin) * this.moveSpeed;
    const wishY = (this.moveForward * sin + this.moveStrafe * cos) * this.moveSpeed;

    this.vx += (wishX - this.vx) * Math.min(1, dt * 12);
    this.vy += (wishY - this.vy) * Math.min(1, dt * 12);

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 0.5) {
      this.bobPhase += dt * speed * 2.5;
      this.bobAmount += (0.02 * speed - this.bobAmount) * dt * 5;
    } else {
      this.bobAmount *= 1 - dt * 3;
    }

    const newX = this.x + this.vx * dt;
    const newY = this.y + this.vy * dt;
    const r = this.collisionRadius;

    if (!this.checkCollision(newX, this.y, r)) {
      this.x = newX;
    } else {
      this.vx = 0;
    }
    if (!this.checkCollision(this.x, newY, r)) {
      this.y = newY;
    } else {
      this.vy = 0;
    }

    this.pitch = Math.max(-0.6, Math.min(0.6, this.pitch));
  }

  private checkCollision(x: number, y: number, r: number): boolean {
    return (
      this.map.isWall(x - r, y - r) ||
      this.map.isWall(x + r, y - r) ||
      this.map.isWall(x - r, y + r) ||
      this.map.isWall(x + r, y + r) ||
      this.map.isSolidProp(x, y, r)
    );
  }

  getHeadBob(): number {
    return Math.sin(this.bobPhase) * this.bobAmount;
  }
}
