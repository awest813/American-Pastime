import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Observer } from "@babylonjs/core/Misc/observable";
import type { Scene } from "@babylonjs/core/scene";

import { Tweens } from "../utils/Tweens";
import { buildPlayer, makeShadowMaterial, type PlayerMaterials } from "./PlayerToken";

interface Spot {
  pos: [number, number];
  /** Which way the fielder faces (rotation.y); most face home. */
  facing?: number;
  outfield?: boolean;
  crouch?: boolean;
}

/**
 * The rival defense: nine fielders at their positions. Ambient, not
 * interactive — they give the diamond life. Placed to frame the infield and
 * dot the outfield grass without overlapping the base runners on the bags.
 * Positions in world XZ (home is -Z toward the camera, second base +Z).
 */
const SPOTS: Record<string, Spot> = {
  pitcher: { pos: [0, -1.2] },
  catcher: { pos: [0.5, -6.2], crouch: true },
  first: { pos: [5.4, 1.9] },
  second: { pos: [2.9, 3.3] },
  short: { pos: [-2.9, 3.3] },
  third: { pos: [-5.4, 1.9] },
  left: { pos: [-6.4, 7.8], outfield: true },
  center: { pos: [0, 9.4], outfield: true },
  right: { pos: [6.4, 7.8], outfield: true },
};

interface Fielder {
  root: TransformNode;
  baseY: number;
  phase: number;
  outfield: boolean;
}

/**
 * Nine ambient rival fielders (charcoal road jersey, red cap, leather glove)
 * that stand the defense, breathe with a staggered idle bob, tip forward when
 * the pitch is delivered, and turn to watch a home run sail out.
 */
export class FielderTokens {
  private fielders: Fielder[] = [];
  private uniformMat: StandardMaterial;
  private skinMat: StandardMaterial;
  private capMat: StandardMaterial;
  private gloveMat: StandardMaterial;
  private shadowMat: StandardMaterial;
  private idle: Observer<Scene> | null = null;

  constructor(private scene: Scene, private tweens: Tweens) {
    this.uniformMat = this.solid("fielderUniform", "#3a4152", 0.28);
    this.skinMat = this.solid("fielderSkin", "#c9996b", 0.34);
    this.capMat = this.solid("fielderCap", "#8c2f39", 0.42);
    this.gloveMat = this.solid("fielderGlove", "#6b4a2f", 0.3);
    this.shadowMat = makeShadowMaterial(scene);
  }

  private solid(name: string, hex: string, emissive: number): StandardMaterial {
    const mat = new StandardMaterial(name, this.scene);
    const c = Color3.FromHexString(hex);
    mat.diffuseColor = c;
    mat.emissiveColor = c.scale(emissive);
    mat.specularColor = Color3.Black();
    mat.freeze();
    return mat;
  }

  /** Stand the defense. Idempotent — clears any prior nine first. */
  spawn(): void {
    this.clear();
    const mats: PlayerMaterials = {
      uniform: this.uniformMat,
      skin: this.skinMat,
      cap: this.capMat,
      shadow: this.shadowMat,
      glove: this.gloveMat,
    };
    let i = 0;
    for (const [name, spot] of Object.entries(SPOTS)) {
      const root = buildPlayer(this.scene, `fielder-${name}`, mats, true);
      root.position.set(spot.pos[0], 0, spot.pos[1]);
      const scale = spot.crouch ? 0.78 : 0.92; // catcher hunkers down
      root.scaling.setAll(scale);
      root.rotation.y = spot.facing ?? 0;
      this.fielders.push({ root, baseY: 0, phase: i * 0.7, outfield: Boolean(spot.outfield) });
      i++;
    }

    // One shared idle bob; staggered phase keeps the defense from breathing
    // in lockstep. Only touches position.y, so reaction tweens (rotation)
    // compose cleanly on top.
    const start = performance.now();
    this.idle = this.scene.onBeforeRenderObservable.add(() => {
      const t = (performance.now() - start) / 1000;
      for (const f of this.fielders) {
        f.root.position.y = f.baseY + Math.abs(Math.sin(t * 1.5 + f.phase)) * 0.035;
      }
    });
  }

  /** The pitcher tips forward as the pitch is delivered (on play commit). */
  pitch(): void {
    const pitcher = this.fielders[0];
    if (!pitcher) return;
    void this.tweens.animate(320, (t) => {
      pitcher.root.rotation.x = Math.sin(t * Math.PI) * 0.45; // rock forward and back
    });
  }

  /** Outfielders spin to watch a home run clear the fence. */
  bigPlay(): void {
    for (const f of this.fielders) {
      if (!f.outfield) continue;
      void this.tweens.animate(900, (t) => {
        f.root.rotation.y = Math.sin(t * Math.PI) * Math.PI * 0.9; // turn, then back
      });
    }
  }

  /** Strike the defense (inning won, menu, end of run). */
  clear(): void {
    if (this.idle) {
      this.scene.onBeforeRenderObservable.remove(this.idle);
      this.idle = null;
    }
    for (const f of this.fielders) f.root.dispose(false, false);
    this.fielders = [];
  }
}
