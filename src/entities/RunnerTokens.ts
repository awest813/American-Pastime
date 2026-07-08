import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";

import type { RunnerState } from "../systems/types";
import { Tweens } from "../utils/Tweens";

type BaseKey = keyof RunnerState;

/** World positions of the painted bases (derived from the diamond texture). */
const BASE_POS: Record<BaseKey | "home", Vector3> = {
  first: new Vector3(7.03, 0, 0.63),
  second: new Vector3(0, 0, 4.85),
  third: new Vector3(-7.03, 0, 0.63),
  home: new Vector3(0, 0, -6.4),
};

/** Home plate sits below the camera frame, so the waiting batter stands at an
 *  on-deck circle in foul ground, left of the hand fan, where he's visible. */
const ON_DECK = new Vector3(-8.2, 0, -2.4);

const BASE_ORDER: BaseKey[] = ["first", "second", "third"];

interface Token {
  root: TransformNode;
  cap: Mesh;
}

/**
 * Chunky little ballplayers standing on the actual bases — the field shows
 * the game state, not just the HUD. One token per live runner, wearing the
 * cap color of the card that got on. Advances run the base paths, scorers
 * run home and fade, and outs deflate in place.
 */
export class RunnerTokens {
  /** Live tokens keyed by runner id (a card id). */
  private tokens = new Map<string, Token>();
  private batter: Token | null = null;
  private batterId: string | null = null;
  private uniformMat: StandardMaterial;
  private skinMat: StandardMaterial;
  private capMats = new Map<string, StandardMaterial>();
  /** Bumped on every sync so stale animations stop touching reused state. */
  private generation = 0;

  constructor(private scene: Scene, private tweens: Tweens) {
    this.uniformMat = new StandardMaterial("runnerUniform", scene);
    this.uniformMat.diffuseColor = Color3.FromHexString("#f4ecd8");
    this.uniformMat.emissiveColor = new Color3(0.32, 0.3, 0.26); // readable under night lights
    this.uniformMat.specularColor = Color3.Black();
    this.skinMat = new StandardMaterial("runnerSkin", scene);
    this.skinMat.diffuseColor = Color3.FromHexString("#c9996b");
    this.skinMat.emissiveColor = new Color3(0.3, 0.22, 0.15);
    this.skinMat.specularColor = Color3.Black();
  }

  private capMat(color: string): StandardMaterial {
    let mat = this.capMats.get(color);
    if (!mat) {
      mat = new StandardMaterial(`runnerCap-${color}`, this.scene);
      const c = Color3.FromHexString(color);
      mat.diffuseColor = c;
      mat.emissiveColor = c.scale(0.45);
      mat.specularColor = Color3.Black();
      this.capMats.set(color, mat);
      mat.freeze();
    }
    return mat;
  }

  /** Build one chunky player: barrel body, ball head, team cap with a brim. */
  private buildToken(id: string, capColor: string): Token {
    const root = new TransformNode(`runner-${id}`, this.scene);
    const body = MeshBuilder.CreateCylinder(`runnerBody-${id}`, { height: 0.85, diameterTop: 0.5, diameterBottom: 0.64 }, this.scene);
    body.position.y = 0.45;
    body.material = this.uniformMat;
    const head = MeshBuilder.CreateSphere(`runnerHead-${id}`, { diameter: 0.46, segments: 10 }, this.scene);
    head.position.y = 1.06;
    head.material = this.skinMat;
    const cap = MeshBuilder.CreateCylinder(`runnerCap-${id}`, { height: 0.14, diameter: 0.5 }, this.scene);
    cap.position.y = 1.28;
    cap.material = this.capMat(capColor);
    const brim = MeshBuilder.CreateCylinder(`runnerBrim-${id}`, { height: 0.05, diameter: 0.3 }, this.scene);
    brim.position.set(0, 1.22, -0.26); // brim faces home (toward the camera)
    brim.material = this.capMat(capColor);
    for (const mesh of [body, head, cap, brim]) {
      mesh.parent = root;
      mesh.isPickable = false;
      mesh.doNotSyncBoundingInfo = true;
    }
    return { root, cap };
  }

  private disposeToken(token: Token): void {
    token.root.dispose(false, false); // materials are shared — keep them
  }

  private setTokenAlpha(token: Token, alpha: number): void {
    for (const child of token.root.getChildMeshes()) child.visibility = alpha;
  }

  /** Pop-in scale flourish for a token that just appeared. */
  private popIn(token: Token): void {
    token.root.scaling.setAll(0.01);
    void this.tweens.animate(240, (t) => token.root.scaling.setAll(0.01 + t * 0.99));
  }

  /** A little two-hop run between two points along the base path. */
  private runTo(token: Token, from: Vector3, to: Vector3, durationMs = 420): Promise<void> {
    return this.tweens.animate(durationMs, (t) => {
      Vector3.LerpToRef(from, to, t, token.root.position);
      token.root.position.y = Math.abs(Math.sin(t * Math.PI * 3)) * 0.22; // running hops
    });
  }

  /** Show the on-deck batter at home plate (null hides). Card id keys the token. */
  setBatter(id: string | null, capColor: string): void {
    if (id === this.batterId) return;
    if (this.batter) {
      this.disposeToken(this.batter);
      this.batter = null;
    }
    this.batterId = id;
    if (id === null) return;
    const token = this.buildToken(`batter-${id}`, capColor);
    token.root.position.copyFrom(ON_DECK);
    this.popIn(token);
    this.batter = token;
  }

  /** Snap tokens to a runner state with no animation (inning start, resume). */
  set(runners: RunnerState, capColorOf: (runnerId: string) => string): void {
    this.generation++;
    for (const token of this.tokens.values()) this.disposeToken(token);
    this.tokens.clear();
    for (const key of BASE_ORDER) {
      const runner = runners[key];
      if (!runner) continue;
      const token = this.buildToken(runner.id, capColorOf(runner.id));
      token.root.position.copyFrom(BASE_POS[key]);
      this.tokens.set(runner.id, token);
    }
  }

  /**
   * Animate a resolved play: the batter legs it out from home, existing
   * runners advance along the paths, vanished runners either round for home
   * (when the play scored) or deflate where they stood (outs, pickoffs).
   */
  async applyPlay(
    before: RunnerState,
    after: RunnerState,
    scored: boolean,
    batterRounds: boolean,
    capColorOf: (runnerId: string) => string,
  ): Promise<void> {
    const generation = ++this.generation;
    const baseOf = (state: RunnerState, id: string): BaseKey | null =>
      BASE_ORDER.find((key) => state[key]?.id === id) ?? null;

    const moves: Promise<void>[] = [];

    // Runners still standing: advance base to base.
    for (const key of BASE_ORDER) {
      const runner = after[key];
      if (!runner) continue;
      const token = this.tokens.get(runner.id);
      if (token) {
        const fromKey = baseOf(before, runner.id);
        const from = fromKey ? BASE_POS[fromKey] : token.root.position.clone();
        if (fromKey !== key) moves.push(this.runTo(token, from.clone(), BASE_POS[key]));
      } else {
        // New arrival — the batter (or a restored save). Reuse the on-deck token
        // so he sprints from where he was standing; others break from home.
        const reusingBatter = this.batter !== null && this.batterId === runner.id;
        const arriving = reusingBatter ? this.batter! : this.buildToken(runner.id, capColorOf(runner.id));
        if (reusingBatter) {
          this.batter = null;
          this.batterId = null;
        } else {
          arriving.root.position.copyFrom(BASE_POS.home);
        }
        this.tokens.set(runner.id, arriving);
        moves.push(this.runTo(arriving, arriving.root.position.clone(), BASE_POS[key], 520));
      }
    }

    // Vanished runners: score home or deflate.
    for (const key of BASE_ORDER) {
      const runner = before[key];
      if (!runner || baseOf(after, runner.id)) continue;
      const token = this.tokens.get(runner.id);
      if (!token) continue;
      this.tokens.delete(runner.id);
      if (scored) {
        moves.push(
          this.runTo(token, BASE_POS[key].clone(), BASE_POS.home.clone(), 560).then(async () => {
            if (generation !== this.generation) return;
            await this.tweens.animate(180, (t) => this.setTokenAlpha(token, 1 - t));
            this.disposeToken(token);
          }),
        );
      } else {
        moves.push(
          this.tweens
            .animate(260, (t) => {
              token.root.scaling.setAll(1 - t * 0.99);
              this.setTokenAlpha(token, 1 - t);
            })
            .then(() => this.disposeToken(token)),
        );
      }
    }

    // The batter token, when he isn't standing on a base afterwards: a homer
    // gets the full trot around the horn; an out leaves the plate quietly.
    if (this.batter) {
      const leaving = this.batter;
      this.batter = null;
      this.batterId = null;
      if (batterRounds) {
        moves.push(
          (async () => {
            await this.runTo(leaving, leaving.root.position.clone(), BASE_POS.first.clone(), 300);
            await this.runTo(leaving, BASE_POS.first.clone(), BASE_POS.second.clone(), 300);
            await this.runTo(leaving, BASE_POS.second.clone(), BASE_POS.third.clone(), 300);
            await this.runTo(leaving, BASE_POS.third.clone(), BASE_POS.home.clone(), 300);
            if (generation === this.generation) {
              await this.tweens.animate(180, (t) => this.setTokenAlpha(leaving, 1 - t));
            }
            this.disposeToken(leaving);
          })(),
        );
      } else {
        moves.push(
          this.tweens.animate(220, (t) => this.setTokenAlpha(leaving, 1 - t)).then(() => this.disposeToken(leaving)),
        );
      }
    }

    await Promise.all(moves);
  }

  /** Remove everything (menu, end of run). */
  clear(): void {
    this.generation++;
    for (const token of this.tokens.values()) this.disposeToken(token);
    this.tokens.clear();
    if (this.batter) {
      this.disposeToken(this.batter);
      this.batter = null;
      this.batterId = null;
    }
  }
}
