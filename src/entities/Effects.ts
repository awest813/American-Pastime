import "@babylonjs/core/Particles/particleSystemComponent"; // side-effect: registers particles with the scene
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";

/**
 * One-shot cosmetic particle bursts. A single procedurally drawn soft dot
 * serves as the texture for everything — confetti, infield dust, and the
 * sparkle trail on a launched home-run ball.
 */
export class Effects {
  private dot: DynamicTexture;

  constructor(private scene: Scene) {
    this.dot = new DynamicTexture("fxDot", { width: 64, height: 64 }, scene, false);
    const ctx = this.dot.getContext() as CanvasRenderingContext2D;
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.6, "rgba(255,255,255,0.6)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.clearRect(0, 0, 64, 64);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    this.dot.update();
    this.dot.hasAlpha = true;
  }

  private burst(name: string, emitter: Vector3 | AbstractMesh, configure: (ps: ParticleSystem) => void): ParticleSystem {
    const ps = new ParticleSystem(name, 400, this.scene);
    ps.particleTexture = this.dot;
    ps.emitter = emitter as Vector3;
    ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    // disposeOnStop calls dispose() with disposeTexture defaulting to TRUE, which
    // would destroy the shared dot texture after the first burst. Pin it to false.
    const baseDispose = ps.dispose.bind(ps);
    ps.dispose = (() => baseDispose(false)) as typeof ps.dispose;
    ps.disposeOnStop = true;
    configure(ps);
    ps.start();
    return ps;
  }

  /** Gold-and-cream celebration shower over the diamond (inning won). */
  confetti(position: Vector3): void {
    this.burst("confetti", position.clone(), (ps) => {
      ps.color1 = new Color4(1, 0.82, 0.34, 1);
      ps.color2 = new Color4(0.96, 0.93, 0.85, 1);
      ps.colorDead = new Color4(0.6, 0.4, 0.1, 0);
      ps.minSize = 0.12;
      ps.maxSize = 0.3;
      ps.minLifeTime = 0.9;
      ps.maxLifeTime = 1.8;
      ps.direction1 = new Vector3(-2.5, 5, -2.5);
      ps.direction2 = new Vector3(2.5, 8, 2.5);
      ps.minEmitPower = 1;
      ps.maxEmitPower = 2.2;
      ps.gravity = new Vector3(0, -7, 0);
      ps.manualEmitCount = 180;
      ps.targetStopDuration = 0.4;
    });
  }

  /** Small brown puff where a card slaps down on the infield. */
  dustPuff(position: Vector3): void {
    this.burst("dust", position.clone(), (ps) => {
      ps.color1 = new Color4(0.62, 0.44, 0.28, 0.7);
      ps.color2 = new Color4(0.5, 0.36, 0.22, 0.5);
      ps.colorDead = new Color4(0.4, 0.3, 0.2, 0);
      ps.minSize = 0.15;
      ps.maxSize = 0.4;
      ps.minLifeTime = 0.25;
      ps.maxLifeTime = 0.6;
      ps.direction1 = new Vector3(-1, 0.5, -1);
      ps.direction2 = new Vector3(1, 1.5, 1);
      ps.minEmitPower = 0.5;
      ps.maxEmitPower = 1.2;
      ps.gravity = new Vector3(0, -2, 0);
      ps.manualEmitCount = 24;
      ps.targetStopDuration = 0.2;
    });
  }

  /** Sparkle trail that follows the launched home-run ball. */
  ballTrail(ball: AbstractMesh, durationMs: number): void {
    const ps = this.burst("ballTrail", ball, (p) => {
      p.color1 = new Color4(1, 0.9, 0.5, 0.9);
      p.color2 = new Color4(1, 0.7, 0.2, 0.8);
      p.colorDead = new Color4(0.8, 0.3, 0.05, 0);
      p.minSize = 0.08;
      p.maxSize = 0.2;
      p.minLifeTime = 0.25;
      p.maxLifeTime = 0.55;
      p.direction1 = new Vector3(-0.3, -0.3, -0.3);
      p.direction2 = new Vector3(0.3, 0.3, 0.3);
      p.minEmitPower = 0.1;
      p.maxEmitPower = 0.4;
      p.emitRate = 160;
    });
    setTimeout(() => ps.stop(), durationMs);
  }
}
