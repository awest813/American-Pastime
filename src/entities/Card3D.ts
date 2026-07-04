import { Color3 } from "@babylonjs/core/Maths/math.color";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { RARITY_DISPLAY, type PlayerCard } from "../systems/types";

const TEAM_COLORS: Record<string, string> = {
  "Louisville Bats": "#8c2f39",
  "Harbor City Herons": "#1d4e89",
  "Desert Rattlers": "#b3541e",
  "Ironville Forgers": "#4a4e69",
  "Bayside Buccaneers": "#146152",
  "Prairie Ghosts": "#6b4e91",
};

export const CARD_WIDTH = 1.5;
export const CARD_HEIGHT = 2.1;

/**
 * A 3D baseball card: a double-sided plane whose face is painted onto a
 * DynamicTexture in a vintage card-stock style. Selection and hover are
 * expressed with position offsets and an outline so the texture never
 * needs repainting.
 */
export class Card3D {
  readonly mesh: Mesh;
  /** Where the card rests in the hand fan; hover/selection offsets are relative to this. */
  homePosition = Vector3.Zero();
  homeRotation = Vector3.Zero();
  selected = false;

  private static nextId = 0;

  constructor(scene: Scene, readonly card: PlayerCard) {
    this.mesh = MeshBuilder.CreatePlane(
      `card-${card.id}-${Card3D.nextId++}`,
      { width: CARD_WIDTH, height: CARD_HEIGHT, sideOrientation: Mesh.DOUBLESIDE },
      scene,
    );
    const tex = new DynamicTexture(`cardTex-${this.mesh.name}`, { width: 512, height: 716 }, scene, true);
    this.paint(tex);
    const mat = new StandardMaterial(`cardMat-${this.mesh.name}`, scene);
    mat.diffuseTexture = tex;
    mat.emissiveColor = new Color3(0.55, 0.55, 0.55); // cards stay readable under stadium lights
    mat.specularColor = new Color3(0.08, 0.08, 0.08);
    mat.backFaceCulling = false;
    mat.freeze(); // texture repaints (upgrades) mutate content, not defines
    this.mesh.material = mat;

    this.mesh.outlineColor = Color3.FromHexString("#ffd257");
    this.mesh.outlineWidth = 0.03;
  }

  private paint(tex: DynamicTexture): void {
    const c = this.card;
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    const teamColor = TEAM_COLORS[c.team] ?? "#333333";
    // Upgraded tiers earn a fancier frame: silver for All-Stars, gold for Legends
    const borderColor = c.rarity === "Legend" ? "#d4a017" : c.rarity === "AllStar" ? "#aeb6c4" : teamColor;

    // Card stock + border
    ctx.fillStyle = borderColor;
    ctx.fillRect(0, 0, 512, 716);
    ctx.fillStyle = "#f4ecd8";
    ctx.fillRect(18, 18, 476, 680);

    // Name banner
    ctx.fillStyle = teamColor;
    ctx.fillRect(18, 18, 476, 88);
    ctx.fillStyle = "#f4ecd8";
    ctx.textAlign = "center";
    const displayName = c.name.length > 24 ? `${c.name.slice(0, 23)}…` : c.name;
    ctx.font = c.name.length > 18 ? "bold 30px Georgia" : "bold 36px Georgia";
    ctx.fillText(displayName, 256, 74);

    // Position / handedness / era chips
    ctx.fillStyle = "#2b2b2b";
    ctx.font = "bold 34px Georgia";
    ctx.textAlign = "left";
    ctx.fillText(c.position, 40, 156);
    ctx.font = "26px Georgia";
    ctx.fillText(`Bats ${c.side}`, 130, 154);
    ctx.textAlign = "right";
    ctx.fillStyle = c.era === "Vintage" ? "#7a5c2e" : "#2e5c7a";
    ctx.fillText(c.era.toUpperCase(), 472, 154);

    // Team line
    ctx.textAlign = "center";
    ctx.fillStyle = "#5a5245";
    ctx.font = "italic 26px Georgia";
    ctx.fillText(c.team, 256, 200);

    // Stat rows
    const stats: Array<[string, number]> = [
      ["POWER", c.power],
      ["CONTACT", c.contact],
      ["SPEED", c.speed],
      ["DISCIPLINE", c.discipline],
      ["DEFENSE", c.defense],
    ];
    let y = 250;
    for (const [label, value] of stats) {
      ctx.textAlign = "left";
      ctx.fillStyle = "#3b352b";
      ctx.font = "bold 28px 'Courier New', monospace";
      ctx.fillText(label, 48, y + 24);
      // Stat pips
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = i < value ? teamColor : "#d8cfba";
        ctx.fillRect(240 + i * 22, y + 4, 16, 22);
      }
      ctx.textAlign = "right";
      ctx.fillStyle = "#3b352b";
      ctx.fillText(String(value), 472, y + 24);
      y += 56;
    }

    // Trait footer
    ctx.fillStyle = "#e6dcc2";
    ctx.fillRect(34, 546, 444, 118);
    ctx.strokeStyle = teamColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(34, 546, 444, 118);
    ctx.fillStyle = "#4a4234";
    ctx.textAlign = "center";
    const rarityName = RARITY_DISPLAY[c.rarity];
    if (c.trait) {
      ctx.font = "italic 24px Georgia";
      this.wrapText(ctx, c.trait, 256, 590, 420, 30);
    } else {
      ctx.font = "italic 26px Georgia";
      ctx.fillText(`${rarityName} · No trait`, 256, 612);
    }

    const stars = c.rarity === "Legend" ? " ★★" : c.rarity === "AllStar" ? " ★" : "";
    ctx.fillStyle = stars ? "#a8842c" : "#8a8171";
    ctx.font = stars ? "bold 22px Georgia" : "20px Georgia";
    ctx.fillText(`— ${rarityName}${stars} —`, 256, 692);

    tex.update();
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ): void {
    const words = text.split(" ");
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = word;
        y += lineHeight;
      } else {
        line = candidate;
      }
    }
    ctx.fillText(line, x, y);
  }

  setSelected(selected: boolean): void {
    this.selected = selected;
    this.mesh.renderOutline = selected;
    this.applyRestPose(false);
  }

  setHovered(hovered: boolean): void {
    if (this.selected) return;
    this.mesh.position.y = this.homePosition.y + (hovered ? 0.3 : 0);
    const pop = hovered ? 1.07 : 1;
    this.mesh.scaling.set(pop, pop, pop);
  }

  /** Snap to the hand pose implied by home position + selection lift. */
  applyRestPose(includeXZ = true): void {
    if (includeXZ) {
      this.mesh.position.x = this.homePosition.x;
      this.mesh.position.z = this.homePosition.z;
    }
    this.mesh.position.y = this.homePosition.y + (this.selected ? 0.55 : 0);
    this.mesh.rotation.copyFrom(this.homeRotation);
    this.mesh.scaling.set(1, 1, 1);
  }

  dispose(): void {
    this.mesh.material?.dispose(false, true);
    this.mesh.dispose();
  }
}
