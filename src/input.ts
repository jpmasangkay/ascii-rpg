// ============================================================================
// Input Manager — Keyboard + Mouse controls
// ============================================================================

import { Player } from './player';

export class InputManager {
  private keys: Set<string> = new Set();

  constructor(private canvas: HTMLCanvasElement, private player: Player) {
    document.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      e.preventDefault();
    });
    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === this.canvas) {
        this.player.angle += e.movementX * this.player.turnSpeed;
        this.player.pitch -= e.movementY * this.player.turnSpeed;
      }
    });
  }

  update(_dt: number) {
    let forward = 0;
    let strafe = 0;

    if (this.keys.has('w') || this.keys.has('arrowup')) forward += 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) forward -= 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) strafe -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) strafe += 1;

    // Normalize diagonal movement
    if (forward !== 0 && strafe !== 0) {
      const inv = 1 / Math.sqrt(2);
      forward *= inv;
      strafe *= inv;
    }

    this.player.moveForward = forward;
    this.player.moveStrafe = strafe;
  }
}
