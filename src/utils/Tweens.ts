import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export type Ease = (t: number) => number;

export const easeOutCubic: Ease = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutBack: Ease = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/**
 * Minimal promise-based tween helper driven by the render loop.
 * Enough juice for card dealing/playing without pulling in an animation library.
 */
export class Tweens {
  /** Global animation speed multiplier — dev sugar for fast soak-testing (1 = normal). */
  static timeScale = 1;

  constructor(private scene: Scene) {}

  animate(durationMs: number, onUpdate: (t: number) => void, ease: Ease = easeOutCubic): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();
      const duration = durationMs / Tweens.timeScale;
      const observer = this.scene.onBeforeRenderObservable.add(() => {
        const raw = Math.min(1, (performance.now() - start) / duration);
        onUpdate(ease(raw));
        if (raw >= 1) {
          this.scene.onBeforeRenderObservable.remove(observer);
          resolve();
        }
      });
    });
  }

  moveTo(target: { position: Vector3 }, to: Vector3, durationMs: number, ease?: Ease): Promise<void> {
    const from = target.position.clone();
    return this.animate(durationMs, (t) => {
      Vector3.LerpToRef(from, to, t, target.position);
    }, ease);
  }

  rotateTo(target: { rotation: Vector3 }, to: Vector3, durationMs: number, ease?: Ease): Promise<void> {
    const from = target.rotation.clone();
    return this.animate(durationMs, (t) => {
      Vector3.LerpToRef(from, to, t, target.rotation);
    }, ease);
  }

  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms / Tweens.timeScale));
  }
}
