import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";

/**
 * The tabletop baseball shrine: fixed broadcast-style camera, a card-table
 * surface with a painted diamond, a scoreboard in the back, and stadium
 * light towers for atmosphere. All procedural — GLB props can replace
 * pieces later without touching game logic.
 */
export class TableWorld {
  camera: ArcRotateCamera;
  private scoreboardTexture: DynamicTexture;
  private scoreboardMat: StandardMaterial;
  private lampMat: StandardMaterial;

  constructor(private scene: Scene, canvas: HTMLCanvasElement) {
    scene.clearColor = new Color4(0.05, 0.06, 0.12, 1);

    this.camera = new ArcRotateCamera("tableCamera", -Math.PI / 2, 0.86, 15.5, new Vector3(0, 0.4, 1.4), scene);
    this.camera.attachControl(canvas, true);
    this.camera.lowerRadiusLimit = 13;
    this.camera.upperRadiusLimit = 18;
    this.camera.lowerBetaLimit = 0.7;
    this.camera.upperBetaLimit = 1.0;
    this.camera.lowerAlphaLimit = -Math.PI / 2 - 0.25;
    this.camera.upperAlphaLimit = -Math.PI / 2 + 0.25;
    this.camera.panningSensibility = 0; // keep the table framed

    const ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
    ambient.intensity = 0.75;
    ambient.groundColor = new Color3(0.25, 0.2, 0.3);

    const sun = new DirectionalLight("stadiumLights", new Vector3(-0.3, -1, 0.4), scene);
    sun.intensity = 0.9;

    this.buildTable();
    this.scoreboardTexture = this.buildScoreboard();
    this.buildLightTowers();
  }

  private buildTable(): void {
    const scene = this.scene;
    const ground = MeshBuilder.CreateGround("diamondTable", { width: 24, height: 24 }, scene);
    const tex = new DynamicTexture("diamondTex", { width: 1024, height: 1024 }, scene, false);
    const ctx = tex.getContext() as CanvasRenderingContext2D;

    // Night grass with mow stripes
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#1e5c31" : "#1a5029";
      ctx.fillRect(0, i * 64, 1024, 64);
    }

    // Infield dirt diamond (home plate toward the bottom of the texture)
    const cx = 512;
    const cy = 620;
    const r = 300;
    ctx.fillStyle = "#8a5a33";
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.55); // home
    ctx.lineTo(cx + r, cy - r * 0.45); // first
    ctx.lineTo(cx, cy - r * 1.05); // second
    ctx.lineTo(cx - r, cy - r * 0.45); // third
    ctx.closePath();
    ctx.fill();

    // Inner grass
    ctx.fillStyle = "#20613a";
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.3);
    ctx.lineTo(cx + r * 0.62, cy - r * 0.4);
    ctx.lineTo(cx, cy - r * 0.85);
    ctx.lineTo(cx - r * 0.62, cy - r * 0.4);
    ctx.closePath();
    ctx.fill();

    // Base paths
    ctx.strokeStyle = "#e8e0ce";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.55);
    ctx.lineTo(cx + r, cy - r * 0.45);
    ctx.lineTo(cx, cy - r * 1.05);
    ctx.lineTo(cx - r, cy - r * 0.45);
    ctx.closePath();
    ctx.stroke();

    // Bases + mound + plate
    const base = (x: number, y: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = "#f4efe2";
      ctx.fillRect(-16, -16, 32, 32);
      ctx.restore();
    };
    base(cx + r, cy - r * 0.45);
    base(cx, cy - r * 1.05);
    base(cx - r, cy - r * 0.45);
    ctx.fillStyle = "#9c6b3f";
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.25, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4efe2";
    ctx.fillRect(cx - 14, cy + r * 0.55 - 14, 28, 28);

    tex.update();

    const mat = new StandardMaterial("diamondMat", scene);
    mat.diffuseTexture = tex;
    mat.specularColor = new Color3(0.05, 0.05, 0.05);
    ground.material = mat;

    // Felt table skirt under the field
    const skirt = MeshBuilder.CreateGround("tableSkirt", { width: 40, height: 40 }, scene);
    skirt.position.y = -0.02;
    const skirtMat = new StandardMaterial("skirtMat", scene);
    skirtMat.diffuseColor = new Color3(0.12, 0.09, 0.07);
    skirtMat.specularColor = Color3.Black();
    skirt.material = skirtMat;
  }

  private buildScoreboard(): DynamicTexture {
    const scene = this.scene;
    // Low enough that all three text rows stay on-screen under the fixed camera
    const board = MeshBuilder.CreateBox("scoreboard", { width: 9, height: 3.4, depth: 0.35 }, scene);
    board.position = new Vector3(0, 2.65, 10.8);

    const tex = new DynamicTexture("scoreboardTex", { width: 1024, height: 384 }, scene, false);
    const mat = new StandardMaterial("scoreboardMat", scene);
    mat.diffuseTexture = tex;
    mat.emissiveColor = new Color3(0.85, 0.85, 0.85); // glows like a night-game board
    mat.specularColor = Color3.Black();
    board.material = mat;
    this.scoreboardMat = mat;

    const postMat = new StandardMaterial("postMat", scene);
    postMat.diffuseColor = new Color3(0.15, 0.15, 0.18);
    for (const x of [-3.5, 3.5]) {
      const post = MeshBuilder.CreateCylinder("scoreboardPost", { height: 3.6, diameter: 0.28 }, scene);
      post.position = new Vector3(x, 1.8, 10.8);
      post.material = postMat;
    }

    this.scoreboardTexture = tex;
    this.updateScoreboard("CARDBALL", "CLASSIC", "");
    return tex;
  }

  /** Shrink the font until the text fits the board face. */
  private fitLine(ctx: CanvasRenderingContext2D, text: string, baseSize: number, y: number): void {
    let size = baseSize;
    do {
      ctx.font = `bold ${size}px 'Courier New', monospace`;
      size -= 4;
    } while (size > 26 && ctx.measureText(text).width > 960);
    ctx.fillText(text, 512, y);
  }

  /** The 3D board is the primary score display; line1 is the big number row. */
  updateScoreboard(line1: string, line2: string, line3: string, line1Color = "#ffd257"): void {
    const ctx = this.scoreboardTexture.getContext() as CanvasRenderingContext2D;
    ctx.fillStyle = "#101418";
    ctx.fillRect(0, 0, 1024, 384);
    ctx.strokeStyle = "#3a4048";
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 1012, 372);
    ctx.textAlign = "center";
    ctx.fillStyle = line1Color;
    this.fitLine(ctx, line1, 110, 150);
    ctx.fillStyle = "#f4efe2";
    this.fitLine(ctx, line2, 56, 250);
    ctx.fillStyle = "#7fd4a0";
    this.fitLine(ctx, line3, 54, 335);
    this.scoreboardTexture.update();
  }

  /** Drive a 0→1→0 pulse over the render loop; peak lands at t=0.5. */
  private pulse(durationMs: number, apply: (intensity: number) => void): void {
    const start = performance.now();
    const observer = this.scene.onBeforeRenderObservable.add(() => {
      const t = Math.min(1, (performance.now() - start) / durationMs);
      apply(Math.sin(t * Math.PI));
      if (t >= 1) this.scene.onBeforeRenderObservable.remove(observer);
    });
  }

  /** Scoreboard glows hot for a beat when the score changes. */
  flashScoreboard(): void {
    this.pulse(500, (k) => {
      const glow = 0.85 + k * 0.9;
      this.scoreboardMat.emissiveColor.set(glow, glow, glow * 0.85);
    });
  }

  /** Stadium lights surge on big plays. */
  pulseLights(): void {
    this.pulse(700, (k) => {
      this.lampMat.emissiveColor.set(1 + k * 1.2, 0.95 + k * 1.1, 0.75 + k * 0.7);
    });
  }

  /** Quick decaying camera shake; magnitude is world units at the target. */
  shakeCamera(magnitude = 0.14, durationMs = 380): void {
    const base = this.camera.target.clone();
    const start = performance.now();
    const observer = this.scene.onBeforeRenderObservable.add(() => {
      const t = Math.min(1, (performance.now() - start) / durationMs);
      const decay = (1 - t) * magnitude;
      this.camera.target.set(
        base.x + (Math.random() - 0.5) * decay,
        base.y + (Math.random() - 0.5) * decay,
        base.z + (Math.random() - 0.5) * decay,
      );
      if (t >= 1) {
        this.camera.target.copyFrom(base);
        this.scene.onBeforeRenderObservable.remove(observer);
      }
    });
  }

  private buildLightTowers(): void {
    const scene = this.scene;
    const poleMat = new StandardMaterial("poleMat", scene);
    poleMat.diffuseColor = new Color3(0.2, 0.2, 0.24);
    const lampMat = new StandardMaterial("lampMat", scene);
    lampMat.emissiveColor = new Color3(1, 0.95, 0.75);
    this.lampMat = lampMat;

    for (const [x, z] of [[-10, 8], [10, 8]] as const) {
      const pole = MeshBuilder.CreateCylinder("towerPole", { height: 7, diameter: 0.3 }, scene);
      pole.position = new Vector3(x, 3.5, z);
      pole.material = poleMat;
      const lamp = MeshBuilder.CreateBox("towerLamp", { width: 1.8, height: 0.9, depth: 0.3 }, scene);
      lamp.position = new Vector3(x, 7.2, z);
      lamp.material = lampMat;
    }
  }
}
