import { Control, Ellipse, Rectangle, TextBlock, type AdvancedDynamicTexture, type StackPanel } from "@babylonjs/gui/2D";
import type { Button } from "@babylonjs/gui/2D";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { RULES, type RunSystem } from "../systems/RunSystem";
import type { BattingApproach, ScoreResult } from "../systems/types";
import { UI, bottomCenter, bottomLeft, makeButton, makePanel, makeStack, makeText, setButtonBackground, topLeft, topRight } from "./kit";
import { Tweens } from "../utils/Tweens";

export interface HudCallbacks {
  onPlay: () => void;
  onDiscard: () => void;
  onComboBook: () => void;
  onApproach: (approach: BattingApproach) => void;
}

const truncate = (text: string, max: number): string => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
const APPROACH_LABEL: Record<BattingApproach, string> = {
  swing: "Q: SWING",
  small_ball: "W: SMALL BALL",
  take: "E: TAKE",
};
const PITCH_HINT: Record<string, string> = {
  fastball: "Power up. Contact down.",
  curveball: "Contact up. Power down.",
  changeup: "First card scores half.",
  knuckleball: "Discipline adds to base.",
  sinker: "Speed down. Defense adds.",
};
const STADIUM_HINT: Record<string, string> = {
  short_porch: "Power Swing needs 16 Power.",
  windy_field: "+1 Power to played cards.",
  dome_stadium: "Pitch penalties ignored.",
  muddy_diamond: "+2 Power, -1 Speed.",
  friendly_confines: "+3 base score every play.",
};

/**
 * The in-inning HUD. The 3D scoreboard owns the score itself; the HUD covers
 * everything around it: pitch card, stadium/equipment, action buttons with
 * resource counts, and the live score preview — the exact combos and
 * projected runs for the current selection, before the player commits.
 */
export class GameHud {
  private root: Rectangle;
  private pitchText: TextBlock;
  private bossPanel: Rectangle;
  private bossText: TextBlock;
  private gearPanel: Rectangle;
  private equipmentText: TextBlock;
  private statusLine: TextBlock;
  private previewPanel: Rectangle;
  private previewTitle: TextBlock;
  private leadoffText: TextBlock;
  private previewLabels: TextBlock;
  private previewValues: TextBlock;
  private previewTotal: TextBlock;
  private approachButtons: Record<BattingApproach, Button>;
  private approachStack: StackPanel;
  private actionStack: StackPanel;
  private playButton: Button;
  private discardButton: Button;
  private popupText: TextBlock;
  private popupGeneration = 0;
  /** Numbered badges that mark the batting order of the current selection. */
  private orderBadges: Ellipse[] = [];

  constructor(adt: AdvancedDynamicTexture, callbacks: HudCallbacks) {
    this.root = new Rectangle("hudRoot");
    this.root.width = 1;
    this.root.height = 1;
    this.root.thickness = 0;
    this.root.isPointerBlocker = false;
    adt.addControl(this.root);

    const pinPanelText = (block: TextBlock, width: string, height: string, top = "10px") => {
      block.textWrapping = true;
      block.resizeToFit = false;
      block.width = width;
      block.height = height;
      block.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      block.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      block.left = "14px";
      block.top = top;
      block.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      block.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    };

    // Top-left pitch card
    const pitchPanel = makePanel("300px", "132px");
    topLeft(pitchPanel);
    pitchPanel.left = "32px";
    pitchPanel.top = "14px";
    this.root.addControl(pitchPanel);
    this.pitchText = makeText("", 17);
    pinPanelText(this.pitchText, "270px", "112px");
    pitchPanel.addControl(this.pitchText);

    // Boss pitcher rule, styled like a warning card (only on boss innings)
    this.bossPanel = makePanel("300px", "110px");
    topLeft(this.bossPanel);
    this.bossPanel.left = "32px";
    this.bossPanel.top = "158px";
    this.bossPanel.background = "rgba(52, 14, 14, 0.92)";
    this.bossPanel.color = "#8c2f39";
    this.bossPanel.isVisible = false;
    this.root.addControl(this.bossPanel);
    this.bossText = makeText("", 16, UI.red);
    pinPanelText(this.bossText, "270px", "90px");
    this.bossPanel.addControl(this.bossText);

    // Stadium + equipment, under the pitch card (drops below the boss card when one is up)
    const gearPanel = makePanel("300px", "170px");
    topLeft(gearPanel);
    gearPanel.left = "32px";
    gearPanel.top = "158px";
    this.root.addControl(gearPanel);
    this.gearPanel = gearPanel;
    this.equipmentText = makeText("", 16);
    pinPanelText(this.equipmentText, "270px", "150px");
    gearPanel.addControl(this.equipmentText);

    // Right-side score preview
    this.previewPanel = makePanel("360px", "430px");
    topRight(this.previewPanel);
    this.previewPanel.left = "-14px";
    this.previewPanel.top = "110px";
    this.root.addControl(this.previewPanel);
    const previewStack = makeStack();
    previewStack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    previewStack.paddingTop = "10px";
    this.previewPanel.addControl(previewStack);
    this.previewTitle = makeText("SCORE PREVIEW", 22, UI.gold);
    this.previewTitle.fontFamily = UI.mono;
    previewStack.addControl(this.previewTitle);
    this.leadoffText = makeText("", 16, UI.green);
    this.leadoffText.paddingTop = "4px";
    previewStack.addControl(this.leadoffText);

    // Two synced columns: labels clip left, values align right, lines match 1:1.
    const columns = new Rectangle();
    columns.width = "336px";
    columns.height = "290px";
    columns.thickness = 0;
    previewStack.addControl(columns);
    this.previewLabels = makeText("", 16);
    this.previewLabels.textWrapping = false;
    this.previewLabels.resizeToFit = false;
    this.previewLabels.width = "224px";
    this.previewLabels.height = "290px";
    this.previewLabels.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.previewLabels.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.previewLabels.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    columns.addControl(this.previewLabels);
    this.previewValues = makeText("", 16, UI.gold);
    this.previewValues.textWrapping = false;
    this.previewValues.resizeToFit = false;
    this.previewValues.width = "108px";
    this.previewValues.height = "290px";
    this.previewValues.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.previewValues.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.previewValues.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    columns.addControl(this.previewValues);

    this.previewTotal = makeText("", 30, UI.green);
    this.previewTotal.fontFamily = UI.mono;
    this.previewTotal.fontWeight = "bold";
    previewStack.addControl(this.previewTotal);

    // Combo reference lives right under the preview it explains
    const comboBookButton = makeButton("comboBookButton", "COMBO BOOK (H)", UI.cream, "200px", "40px");
    comboBookButton.fontSize = 16;
    topRight(comboBookButton);
    comboBookButton.left = "-94px";
    comboBookButton.top = "552px";
    comboBookButton.onPointerUpObservable.add(() => callbacks.onComboBook());
    this.root.addControl(comboBookButton);

    this.approachStack = makeStack(false);
    bottomCenter(this.approachStack);
    this.approachStack.top = "-78px";
    this.approachStack.height = "44px";
    this.root.addControl(this.approachStack);
    this.approachButtons = {
      swing: makeButton("approachSwing", APPROACH_LABEL.swing, UI.gold, "142px", "38px"),
      small_ball: makeButton("approachSmallBall", APPROACH_LABEL.small_ball, UI.cream, "184px", "38px"),
      take: makeButton("approachTake", APPROACH_LABEL.take, UI.cream, "128px", "38px"),
    };
    for (const approach of ["swing", "small_ball", "take"] as const) {
      const button = this.approachButtons[approach];
      button.fontSize = 15;
      button.onPointerUpObservable.add(() => callbacks.onApproach(approach));
      this.approachStack.addControl(button);
    }

    // Bottom action bar
    this.actionStack = makeStack(false);
    bottomCenter(this.actionStack);
    this.actionStack.top = "-10px";
    this.actionStack.height = "64px";
    this.root.addControl(this.actionStack);
    this.playButton = makeButton("playButton", "AT-BAT", UI.green, "230px");
    this.playButton.onPointerUpObservable.add(() => callbacks.onPlay());
    this.actionStack.addControl(this.playButton);
    const spacer = new Rectangle();
    spacer.width = "20px";
    spacer.thickness = 0;
    this.actionStack.addControl(spacer);
    this.discardButton = makeButton("discardButton", "DISCARD", UI.red, "230px");
    this.discardButton.onPointerUpObservable.add(() => callbacks.onDiscard());
    this.actionStack.addControl(this.discardButton);

    this.statusLine = makeText("", 17);
    this.statusLine.fontFamily = UI.mono;
    bottomLeft(this.statusLine);
    this.statusLine.left = "14px";
    this.statusLine.top = "-18px";
    this.root.addControl(this.statusLine);

    // Big center popup for combos / runs
    this.popupText = makeText("", 64, UI.gold);
    this.popupText.fontWeight = "bold";
    this.popupText.shadowColor = "black";
    this.popupText.shadowOffsetX = 3;
    this.popupText.shadowOffsetY = 3;
    this.popupText.top = "-60px";
    this.popupText.isVisible = false;
    this.root.addControl(this.popupText);

    // Batting-order badges: one gold disc per selectable card, added straight
    // to the ADT so linkWithMesh can project them onto the 3D cards.
    for (let i = 0; i < RULES.maxCardsPerPlay; i++) {
      const badge = new Ellipse(`orderBadge-${i}`);
      badge.width = "38px";
      badge.height = "38px";
      badge.background = UI.gold;
      badge.color = UI.ink;
      badge.thickness = 3;
      badge.isVisible = false;
      badge.isPointerBlocker = false;
      const label = new TextBlock(`orderBadgeText-${i}`, `${i + 1}`);
      label.color = UI.ink;
      label.fontFamily = UI.mono;
      label.fontWeight = "bold";
      label.fontSize = 22;
      badge.addControl(label);
      adt.addControl(badge);
      this.orderBadges.push(badge);
    }
  }

  setVisible(visible: boolean): void {
    this.root.isVisible = visible;
    if (!visible) this.setSelectionBadges([]);
  }

  /** Pin numbered badges to the selected cards in click order; hide the rest.
   *  Called on every selection change. */
  setSelectionBadges(meshes: AbstractMesh[]): void {
    this.orderBadges.forEach((badge, i) => {
      if (i < meshes.length) {
        badge.linkWithMesh(meshes[i]);
        badge.linkOffsetY = "-96px"; // ride above the raised card
        badge.isVisible = true;
      } else {
        badge.linkWithMesh(null);
        badge.isVisible = false;
      }
    });
  }

  update(run: RunSystem, deckCount: number, selectionCount: number, approach: BattingApproach): void {
    const hand = run.pitch.hand === "L" ? "LHP" : "RHP";
    this.pitchText.text = `PITCH: ${run.pitch.name.toUpperCase()} (${hand})\nDifficulty ${run.pitch.difficulty}\n\n${PITCH_HINT[run.pitch.id] ?? run.pitch.description}`;

    if (run.boss) {
      const detail = run.boss.id === "umpire" && run.umpireTarget ? ` Today: ${run.umpireTarget}.` : "";
      this.bossText.text = `☠ BOSS: ${run.boss.name.toUpperCase()}\n${run.boss.description}${detail}`;
      this.bossPanel.isVisible = true;
      this.gearPanel.top = "280px";
    } else {
      this.bossPanel.isVisible = false;
      this.gearPanel.top = "158px";
    }

    const gearLines = [`STADIUM: ${run.stadium?.name ?? "-"}`, run.stadium ? (STADIUM_HINT[run.stadium.id] ?? run.stadium.description) : "", "", "EQUIPMENT:"];
    if (run.equipment.length === 0) {
      gearLines.push("  (none yet)");
    } else {
      for (const e of run.equipment) gearLines.push(`  · ${e.name}`);
    }
    this.equipmentText.text = gearLines.join("\n");
    const bases = [run.bases.first ? "1B" : "", run.bases.second ? "2B" : "", run.bases.third ? "3B" : ""].filter(Boolean).join("+") || "empty";
    this.statusLine.text = `Outs ${run.outs}/${RULES.outsPerInning} · Bases ${bases} · Deck ${deckCount} · $${run.cash} · ${run.rng.seed}`;

    const inningActive = run.phase === "inning";
    this.previewPanel.isVisible = inningActive;
    this.approachStack.isVisible = inningActive;
    this.actionStack.isVisible = inningActive;
    for (const key of Object.keys(this.approachButtons) as BattingApproach[]) {
      const button = this.approachButtons[key];
      setButtonBackground(button, key === approach ? UI.gold : UI.cream);
      if (button.textBlock) button.textBlock.text = APPROACH_LABEL[key];
    }
    const playLabel = this.playButton.textBlock;
    if (playLabel) playLabel.text = `AT-BAT · ${run.playsLeft}`;
    const discardLabel = this.discardButton.textBlock;
    if (discardLabel) discardLabel.text = `DISCARD · ${run.discardsLeft}`;
    this.setButtonsEnabled(
      run.phase === "inning" && run.playsLeft > 0 && selectionCount > 0,
      run.phase === "inning" && run.discardsLeft > 0 && selectionCount > 0,
    );
  }

  updatePreview(result: ScoreResult | null, selectedCount: number, leadoffName: string | null): void {
    this.previewTitle.text = `SCORE PREVIEW · ${selectedCount}/5`;
    if (!result || selectedCount === 0) {
      this.leadoffText.text = "";
      this.previewLabels.width = "316px";
      this.previewLabels.textWrapping = true;
      this.previewLabels.text = "Pick cards to preview.\n\nQ Swing: bases\nW Small Ball: runners\nE Take: walks";
      this.previewValues.text = "";
      this.previewTotal.text = "";
      return;
    }
    this.previewLabels.width = "224px";
    this.previewLabels.textWrapping = false;
    this.leadoffText.text = `Leadoff: ${truncate(leadoffName ?? "", 30)}`;
    const labels: string[] = [];
    const values: string[] = [];
    for (const line of result.lines) {
      labels.push(truncate(line.label, 26));
      values.push(line.value);
    }
    if (result.combos.length === 0) {
      labels.push("(no combos detected)");
      values.push("");
    }
    this.previewLabels.text = labels.join("\n");
    this.previewValues.text = values.join("\n");
    const runText = result.runs > 0 ? `+${result.runs} RUN${result.runs === 1 ? "" : "S"}` : result.outs > 0 ? `${result.outs} OUT` : "SAFE";
    this.previewTotal.color = result.runs > 0 ? UI.gold : result.outs > 0 ? UI.red : UI.green;
    this.previewTotal.text = `${result.outcome.toUpperCase()} · ${runText}`;
  }

  setButtonsEnabled(play: boolean, discard: boolean): void {
    this.playButton.isEnabled = play;
    this.playButton.alpha = play ? 1 : 0.4;
    this.discardButton.isEnabled = discard;
    this.discardButton.alpha = discard ? 1 : 0.4;
  }

  /** Slam a big combo/run announcement onto the screen, then fade it. */
  showPopup(text: string, color: string = UI.gold, holdMs = 850): Promise<void> {
    const generation = ++this.popupGeneration; // a newer popup takes over the shared TextBlock
    this.popupText.text = text;
    this.popupText.color = color;
    this.popupText.isVisible = true;
    this.popupText.alpha = 1;
    return new Promise((resolve) => {
      const start = performance.now();
      const hold = holdMs / Tweens.timeScale;
      const tick = () => {
        if (generation !== this.popupGeneration) {
          resolve();
          return;
        }
        const elapsed = performance.now() - start;
        const grow = Math.min(1, (elapsed / 160) * Tweens.timeScale);
        this.popupText.scaleX = 0.6 + grow * 0.4;
        this.popupText.scaleY = 0.6 + grow * 0.4;
        if (elapsed > hold) {
          this.popupText.alpha = Math.max(0, 1 - ((elapsed - hold) / 250) * Tweens.timeScale);
        }
        if (elapsed > hold + 260 / Tweens.timeScale) {
          this.popupText.isVisible = false;
          resolve();
        } else {
          requestAnimationFrame(tick);
        }
      };
      tick();
    });
  }
}
