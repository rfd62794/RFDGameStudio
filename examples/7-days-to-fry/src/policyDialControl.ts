/**
 * @file src/policyDialControl.ts
 * Policy Dial Drag Interaction Controller for Canvas HUD.
 */

import { HUD_RECTS } from './data';

export class PolicyDialDragController {
  private _isDragging = false;

  public get isDragging(): boolean {
    return this._isDragging;
  }

  public isWithinDialBounds(pos: { x: number; y: number }): boolean {
    const rect = HUD_RECTS.policyDial;
    return (
      pos.x >= rect.x &&
      pos.x <= rect.x + rect.width &&
      pos.y >= rect.y &&
      pos.y <= rect.y + rect.height
    );
  }

  public calculatePolicyValue(pos: { x: number; y: number }): number {
    const rect = HUD_RECTS.policyDial;
    const rawRatio = (pos.x - rect.trackX) / rect.trackWidth;
    const clamped = Math.max(0, Math.min(1, rawRatio));
    return Math.round(clamped * 100) / 100;
  }

  public handleMouseDown(pos: { x: number; y: number }): number | null {
    if (this.isWithinDialBounds(pos)) {
      this._isDragging = true;
      return this.calculatePolicyValue(pos);
    }
    return null;
  }

  public handleMouseMove(pos: { x: number; y: number }): number | null {
    if (!this._isDragging) return null;
    return this.calculatePolicyValue(pos);
  }

  public handleMouseUp(): void {
    this._isDragging = false;
  }
}

export const policyDialController = new PolicyDialDragController();
