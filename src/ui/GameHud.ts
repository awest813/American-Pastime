import { Control, Rectangle, TextBlock, type AdvancedDynamicTexture } from "@babylonjs/gui/2D";
import type { Button } from "@babylonjs/gui/2D";
import type { RunSystem } from "../systems/RunSystem";
import type { ScoreResult } from "../systems/types";
import { UI, bottomCenter, bottomLeft, makeButton, makePanel, makeStack, makeText, topLeft, topRight } from "./kit";

export interface HudCallbacks {
  onPlay: () => void;
  onDiscard: () => void;
  onComboBook: () => void;
}

const truncate = (text: string, max: number): string => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

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
  private playButton: Button;
  private discardButton: Button;
  private popupText: TextBlock;
  private popupGeneration = 0;

  constructor(adt: AdvancedDynamicTexture, callbacks: HudCallbacks) {
    this.root = new Rectangle("hudRoot");
    this.root.width = 1;
    this.root.height = 1;
    this.root.thickness = 0;
    this.root.isPointerBlocker = false;
    adt.addControl(this.root);

    // Top-left pitch card
    const pitchPanel = makePanel("300px", "132px");
    topLeft(pitchPanel);
    pitchPanel.left = "14px";
    pitchPanel.top = "14px";
    this.root.addControl(pitchPanel);
    this.pitchText = makeText("", 17);
    this.pitchText.textWrapping = true;
    this.pitchText.resizeToFit = false;
    this.pitchText.width = "280px";
    this.pitchText.height = "120px";
    this.pitchText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    pitchPanel.addControl(this.pitchText);

    // Boss pitcher rule, styled like a warning card (only on boss innings)
    this.bossPanel = makePanel("300px", "110px");
    topLeft(this.bossPanel);
    this.bossPanel.left = "14px";
    this.bossPanel.top = "158px";
    this.bossPanel.background = "rgba(52, 14, 14, 0.92)";
    this.bossPanel.color = "#8c2f39";
    this.bossPanel.isVisible = false;
    this.root.addControl(this.bossPanel);
    this.bossText = makeText("", 16, UI.red);
    this.bossText.textWrapping = true;
    this.bossText.resizeToFit = false;
    this.bossText.width = "280px";
    this.bossText.height = "98px";
    this.bossText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.bossPanel.addControl(this.bossText);

    // Stadium + equipment, under the pitch card (drops below the boss card when one is up)
    const gearPanel = makePanel("300px", "170px");
    topLeft(gearPanel);
    gearPanel.left = "14px";
    gearPanel.top = "158px";
    this.root.addControl(gearPanel);
    this.gearPanel = gearPanel;
    this.equipmentText = makeText("", 16);
    this.equipmentText.textWrapping = true;
    this.equipmentText.resizeToFit = false;
    this.equipmentText.width = "280px";
    this.equipmentText.height = "156px";
    this.equipmentText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
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
    this.previewLabels.width = "262px";
    this.previewLabels.height = "290px";
    this.previewLabels.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.previewLabels.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.previewLabels.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    columns.addControl(this.previewLabels);
    this.previewValues = makeText("", 16, UI.gold);
    this.previewValues.textWrapping = false;
    this.previewValues.resizeToFit = false;
    this.previewValues.width = "70px";
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

    // Bottom action bar
    const actionStack = makeStack(false);
    bottomCenter(actionStack);
    actionStack.top = "-10px";
    actionStack.height = "64px";
    this.root.addControl(actionStack);
    this.playButton = makeButton("playButton", "PLAY HAND", UI.green, "230px");
    this.playButton.onPointerUpObservable.add(() => callbacks.onPlay());
    actionStack.addControl(this.playButton);
    const spacer = new Rectangle();
    spacer.width = "20px";
    spacer.thickness = 0;
    actionStack.addControl(spacer);
    this.discardButton = makeButton("discardButton", "DISCARD", UI.red, "230px");
    this.discardButton.onPointerUpObservable.add(() => callbacks.onDiscard());
    actionStack.addControl(this.discardButton);

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
  }

  setVisible(visible: boolean): void {
    this.root.isVisible = visible;
  }

  update(run: RunSystem, deckCount: number, selectionCount: number): void {
    const hand = run.pitch.hand === "L" ? "LHP" : "RHP";
    this.pitchText.text = `NOW PITCHING: ${run.pitch.name.toUpperCase()} (${hand})\nDifficulty ${run.pitch.difficulty}\n\n${run.pitch.description}`;

    if (run.boss) {
      const detail = run.boss.id === "umpire" && run.umpireTarget ? ` Today: ${run.umpireTarget}.` : "";
      this.bossText.text = `☠ BOSS: ${run.boss.name.toUpperCase()}\n${run.boss.description}${detail}`;
      this.bossPanel.isVisible = true;
      this.gearPanel.top = "280px";
    } else {
      this.bossPanel.isVisible = false;
      this.gearPanel.top = "158px";
    }

    const gearLines = [`STADIUM: ${run.stadium?.name ?? "—"}`, run.stadium?.description ?? "", "", "EQUIPMENT:"];
    if (run.equipment.length === 0) {
      gearLines.push("  (none yet — win an inning, hit the shop)");
    } else {
      for (const e of run.equipment) gearLines.push(`  · ${e.name}`);
    }
    this.equipmentText.text = gearLines.join("\n");
    this.statusLine.text = `Deck ${deckCount} · $${run.cash} · ${run.rng.seed}`;

    this.previewPanel.isVisible = run.phase === "inning";
    const playLabel = this.playButton.textBlock;
    if (playLabel) playLabel.text = `PLAY HAND · ${run.playsLeft}`;
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
      this.previewLabels.text = "Click cards to build an at-bat.\n\nOrder matters: the pitch and\nyour equipment hit the FIRST\ncard hardest.";
      this.previewValues.text = "";
      this.previewTotal.text = "";
      return;
    }
    this.leadoffText.text = `Leadoff: ${truncate(leadoffName ?? "", 30)}`;
    const labels: string[] = [];
    const values: string[] = [];
    for (const line of result.lines) {
      labels.push(truncate(line.label, 30));
      values.push(line.value);
    }
    if (result.combos.length === 0) {
      labels.push("(no combos detected)");
      values.push("");
    }
    this.previewLabels.text = labels.join("\n");
    this.previewValues.text = values.join("\n");
    this.previewTotal.text = `≈ ${result.runs} RUNS`;
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
      const tick = () => {
        if (generation !== this.popupGeneration) {
          resolve();
          return;
        }
        const elapsed = performance.now() - start;
        const grow = Math.min(1, elapsed / 160);
        this.popupText.scaleX = 0.6 + grow * 0.4;
        this.popupText.scaleY = 0.6 + grow * 0.4;
        if (elapsed > holdMs) {
          this.popupText.alpha = Math.max(0, 1 - (elapsed - holdMs) / 250);
        }
        if (elapsed > holdMs + 260) {
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
