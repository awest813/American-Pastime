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

const OUTFIELD_POSITIONS = new Set(["LF", "CF", "RF"]);
const INFIELD_POSITIONS = new Set(["1B", "2B", "3B", "SS"]);

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

    this.drawComboTags(ctx, c, teamColor);

    // Stat rows
    const stats: Array<[string, number]> = [
      ["POWER", c.power],
      ["CONTACT", c.contact],
      ["SPEED", c.speed],
      ["DISCIPLINE", c.discipline],
      ["DEFENSE", c.defense],
    ];
    let y = 262;
    for (const [label, value] of stats) {
      const comboReady = this.statHasComboHook(c, label, value);
      ctx.textAlign = "left";
      ctx.fillStyle = comboReady ? "#8c6d1f" : "#3b352b";
      ctx.font = "bold 28px 'Courier New', monospace";
      ctx.fillText(label, 48, y + 24);
      // Stat pips
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = i < value ? (comboReady && i >= value - 1 ? "#d4a017" : teamColor) : "#d8cfba";
        ctx.fillRect(240 + i * 22, y + 4, 16, 22);
      }
      ctx.textAlign = "right";
      ctx.fillStyle = comboReady ? "#8c6d1f" : "#3b352b";
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

  private comboTags(c: PlayerCard): string[] {
    const tags: string[] = [];
    if (c.contact >= 7) tags.push("CON 7+");
    if (c.power >= 8) tags.push("POWER BAT");
    else if (c.era === "Modern" && c.power >= 6) tags.push("MOD PWR");
    if (c.speed >= 7) tags.push("SPD 7+");
    if (c.discipline >= 7 || c.contact >= 8) tags.push("SETTER");
    if (c.side !== "R") tags.push("L/S BAT");
    if (c.position === "P" || c.position === "C") tags.push("BATTERY");
    else if (OUTFIELD_POSITIONS.has(c.position)) tags.push("OUTFIELD");
    else if (INFIELD_POSITIONS.has(c.position)) tags.push("INFIELD");
    if (c.era === "Vintage") tags.push("VINTAGE");
    return [...new Set(tags)].slice(0, 3);
  }

  private drawComboTags(ctx: CanvasRenderingContext2D, card: PlayerCard, teamColor: string): void {
    const tags = this.comboTags(card);
    if (tags.length === 0) return;

    ctx.font = "bold 17px 'Courier New', monospace";
    const widths = tags.map((tag) => Math.min(136, Math.max(76, ctx.measureText(tag).width + 22)));
    const gap = 8;
    const totalWidth = widths.reduce((sum, width) => sum + width, 0) + gap * (widths.length - 1);
    let x = 256 - totalWidth / 2;

    for (const [i, tag] of tags.entries()) {
      const width = widths[i];
      this.roundRect(ctx, x, 216, width, 30, 10);
      ctx.fillStyle = "#efe3c5";
      ctx.fill();
      ctx.strokeStyle = teamColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#3b352b";
      ctx.textAlign = "center";
      ctx.fillText(tag, x + width / 2, 237);
      x += width + gap;
    }
  }

  private statHasComboHook(card: PlayerCard, label: string, value: number): boolean {
    switch (label) {
      case "POWER":
        return value >= 8 || (card.era === "Modern" && value >= 6);
      case "CONTACT":
        return value >= 7;
      case "SPEED":
        return value >= 7;
      case "DISCIPLINE":
        return value >= 7;
      case "DEFENSE":
        return card.traitId === "iron_glove";
      default:
        return false;
    }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
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
