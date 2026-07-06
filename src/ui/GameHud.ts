import { Control, Ellipse, Rectangle, TextBlock, type AdvancedDynamicTexture, type StackPanel } from "@babylonjs/gui/2D";
import type { Button } from "@babylonjs/gui/2D";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { RULES, type RunSystem } from "../systems/RunSystem";
import type { BaseState, BattingApproach, DetectedCombo, ScoreLine, ScoreResult } from "../systems/types";
import { UI, bottomCenter, bottomLeft, makeButton, makePanel, makeStack, makeText, setButtonBackground, topLeft, topRight } from "./kit";
import { Tweens } from "../utils/Tweens";

export interface HudCallbacks {
  onPlay: () => void;
  onDiscard: () => void;
  onComboBook: () => void;
  onApproach: (approach: BattingApproach) => void;
}

export interface ComboSuggestion {
  cardName: string;
  combos: string[];
  deltaQuality: number;
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
const COMBO_SHORT: Record<string, string> = {
  "Contact Hit": "Contact",
  "Power Swing": "Power",
  "Speed Steal": "Speed",
  "Team Chemistry": "Team",
  "Full Outfield": "Outfield",
  "Around the Horn": "Infield",
  Battery: "Battery",
  "Lefty Advantage": "Lefty",
  "Veteran Presence": "Veteran",
  "Modern Sluggers": "Modern",
};
const comboReward = (combo: DetectedCombo): string => (combo.kind === "flat" ? `+${combo.value} base` : `x${combo.value}`);

const compactPreviewLines = (result: ScoreResult): ScoreLine[] => {
  const comboLines = new Set(result.combos.map((combo) => combo.name));
  const withoutCombos = result.lines.filter((line) => ![...comboLines].some((name) => line.label.startsWith(name)));
  if (withoutCombos.length <= 8) return withoutCombos;
  return [...withoutCombos.slice(0, 5), ...withoutCombos.slice(-3)];
};

const compactCardName = (name: string): string => {
  const cleaned = name.replace(/\s*'[^']+'\s*/g, " ").replace(/\s+/g, " ").trim();
  const parts = cleaned.split(" ");
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : cleaned;
};

const formatSuggestion = (suggestion: ComboSuggestion, selectedCount: number): string => {
  const prefix = selectedCount === 0 ? "" : "+ ";
  const name = truncate(compactCardName(suggestion.cardName), 13);
  const comboList = suggestion.combos
    .slice(0, 2)
    .map((combo) => COMBO_SHORT[combo] ?? combo)
    .join("+");
  const extra = suggestion.combos.length > 2 ? ` +${suggestion.combos.length - 2}` : "";
  const lift = suggestion.deltaQuality > 0 ? ` +${suggestion.deltaQuality}q` : "";
  return `${prefix}${name}: ${truncate(comboList + extra, 18)}${lift}`;
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
  private basePanel: Rectangle;
  private baseTitle: TextBlock;
  private baseIcons: Record<keyof BaseState, Rectangle>;
  private baseIconLabels: Record<keyof BaseState, TextBlock>;
  private currentBases: BaseState = { first: false, second: false, third: false };
  private previewBases: BaseState | null = null;
  private statusLine: TextBlock;
  private previewPanel: Rectangle;
  private previewTitle: TextBlock;
  private leadoffText: TextBlock;
  private previewComboPanel: Rectangle;
  private previewComboTitle: TextBlock;
  private previewComboText: TextBlock;
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
  private comboPopupPanel: Rectangle;
  private comboPopupEyebrow: TextBlock;
  private comboPopupTitle: TextBlock;
  private comboPopupDetail: TextBlock;
  private comboPopupGeneration = 0;
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
    const pinTopText = (block: TextBlock, width: string, height: string, left: string, top: string) => {
      block.textWrapping = true;
      block.resizeToFit = false;
      block.width = width;
      block.height = height;
      block.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      block.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      block.left = left;
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
    const gearPanel = makePanel("300px", "190px");
    topLeft(gearPanel);
    gearPanel.left = "32px";
    gearPanel.top = "158px";
    this.root.addControl(gearPanel);
    this.gearPanel = gearPanel;
    this.equipmentText = makeText("", 16);
    pinPanelText(this.equipmentText, "270px", "170px");
    gearPanel.addControl(this.equipmentText);

    this.basePanel = makePanel("160px", "92px");
    this.basePanel.background = "rgba(16, 20, 24, 0.74)";
    this.basePanel.thickness = 1;
    this.basePanel.isPointerBlocker = false;
    this.basePanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.basePanel.top = "190px";
    this.root.addControl(this.basePanel);
    this.baseTitle = makeText("ON BASE", 13, UI.green);
    this.baseTitle.fontFamily = UI.mono;
    this.baseTitle.fontWeight = "bold";
    this.baseTitle.height = "20px";
    this.baseTitle.top = "8px";
    this.baseTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.baseTitle.isPointerBlocker = false;
    this.basePanel.addControl(this.baseTitle);
    this.baseIcons = {
      first: this.makeBaseIcon("baseIconFirst", 34, 18),
      second: this.makeBaseIcon("baseIconSecond", 0, -10),
      third: this.makeBaseIcon("baseIconThird", -34, 18),
    };
    this.baseIconLabels = {
      first: this.makeBaseLabel("baseIconFirstLabel", "1B", 34, 18),
      second: this.makeBaseLabel("baseIconSecondLabel", "2B", 0, -10),
      third: this.makeBaseLabel("baseIconThirdLabel", "3B", -34, 18),
    };
    for (const key of ["first", "second", "third"] as const) {
      this.basePanel.addControl(this.baseIcons[key]);
      this.basePanel.addControl(this.baseIconLabels[key]);
    }

    // Right-side score preview
    this.previewPanel = makePanel("380px", "500px");
    topRight(this.previewPanel);
    this.previewPanel.left = "-14px";
    this.previewPanel.top = "82px";
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

    this.previewComboPanel = makePanel("356px", "132px");
    this.previewComboPanel.background = "rgba(30, 40, 32, 0.78)";
    this.previewComboPanel.thickness = 1;
    this.previewComboPanel.paddingTop = "6px";
    previewStack.addControl(this.previewComboPanel);
    this.previewComboTitle = makeText("", 15, UI.green);
    this.previewComboTitle.fontFamily = UI.mono;
    this.previewComboTitle.fontWeight = "bold";
    pinTopText(this.previewComboTitle, "332px", "22px", "12px", "8px");
    this.previewComboPanel.addControl(this.previewComboTitle);
    this.previewComboText = makeText("", 14, UI.cream);
    this.previewComboText.lineSpacing = "2px";
    pinTopText(this.previewComboText, "332px", "92px", "12px", "34px");
    this.previewComboPanel.addControl(this.previewComboText);

    // Two synced columns: labels clip left, values align right, lines match 1:1.
    const columns = new Rectangle();
    columns.width = "356px";
    columns.height = "158px";
    columns.thickness = 0;
    previewStack.addControl(columns);
    this.previewLabels = makeText("", 15);
    this.previewLabels.textWrapping = false;
    this.previewLabels.resizeToFit = false;
    this.previewLabels.width = "214px";
    this.previewLabels.height = "158px";
    this.previewLabels.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.previewLabels.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.previewLabels.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    columns.addControl(this.previewLabels);
    this.previewValues = makeText("", 15, UI.gold);
    this.previewValues.textWrapping = false;
    this.previewValues.resizeToFit = false;
    this.previewValues.width = "136px";
    this.previewValues.height = "158px";
    this.previewValues.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.previewValues.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.previewValues.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    columns.addControl(this.previewValues);

    this.previewTotal = makeText("", 30, UI.green);
    this.previewTotal.fontFamily = UI.mono;
    this.previewTotal.fontWeight = "bold";
    this.previewTotal.paddingTop = "6px";
    previewStack.addControl(this.previewTotal);

    // Combo reference lives inside the preview panel so it never covers hand cards.
    const comboBookButton = makeButton("comboBookButton", "COMBO BOOK (H)", UI.cream, "190px", "38px");
    comboBookButton.fontSize = 15;
    comboBookButton.paddingTop = "8px";
    comboBookButton.onPointerUpObservable.add(() => callbacks.onComboBook());
    previewStack.addControl(comboBookButton);

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

    this.comboPopupPanel = makePanel("560px", "126px");
    this.comboPopupPanel.background = "rgba(16, 20, 24, 0.96)";
    this.comboPopupPanel.color = UI.gold;
    this.comboPopupPanel.thickness = 2;
    this.comboPopupPanel.top = "-178px";
    this.comboPopupPanel.isVisible = false;
    this.root.addControl(this.comboPopupPanel);
    const comboPopupStack = makeStack();
    comboPopupStack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    comboPopupStack.paddingTop = "10px";
    this.comboPopupPanel.addControl(comboPopupStack);
    this.comboPopupEyebrow = makeText("", 16, UI.green);
    this.comboPopupEyebrow.fontFamily = UI.mono;
    comboPopupStack.addControl(this.comboPopupEyebrow);
    this.comboPopupTitle = makeText("", 34, UI.gold);
    this.comboPopupTitle.fontFamily = UI.mono;
    this.comboPopupTitle.fontWeight = "bold";
    comboPopupStack.addControl(this.comboPopupTitle);
    this.comboPopupDetail = makeText("", 18, UI.cream);
    this.comboPopupDetail.paddingTop = "4px";
    comboPopupStack.addControl(this.comboPopupDetail);

    // Big center popup for inning / final outcome beats
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

  private makeBaseIcon(name: string, left: number, top: number): Rectangle {
    const icon = new Rectangle(name);
    icon.width = "30px";
    icon.height = "30px";
    icon.left = `${left}px`;
    icon.top = `${top}px`;
    icon.rotation = Math.PI / 4;
    icon.background = "rgba(244, 236, 216, 0.12)";
    icon.color = UI.muted;
    icon.thickness = 2;
    icon.isPointerBlocker = false;
    return icon;
  }

  private makeBaseLabel(name: string, label: string, left: number, top: number): TextBlock {
    const text = new TextBlock(name, label);
    text.width = "34px";
    text.height = "24px";
    text.left = `${left}px`;
    text.top = `${top}px`;
    text.color = UI.muted;
    text.fontFamily = UI.mono;
    text.fontSize = 13;
    text.fontWeight = "bold";
    text.isPointerBlocker = false;
    return text;
  }

  private updateBaseIcons(): void {
    const previewing = this.previewBases !== null;
    const bases = this.previewBases ?? this.currentBases;
    this.baseTitle.text = previewing ? "AFTER PLAY" : "ON BASE";
    this.baseTitle.color = previewing ? UI.gold : UI.green;

    for (const key of ["first", "second", "third"] as const) {
      const occupied = bases[key];
      const newlyOccupied = previewing && occupied && !this.currentBases[key];
      const vacated = previewing && !occupied && this.currentBases[key];
      this.baseIcons[key].background = occupied ? (newlyOccupied ? UI.green : UI.gold) : vacated ? "rgba(224, 122, 106, 0.22)" : "rgba(244, 236, 216, 0.12)";
      this.baseIcons[key].color = occupied ? UI.cream : vacated ? UI.red : UI.muted;
      this.baseIcons[key].alpha = occupied || vacated ? 1 : 0.72;
      this.baseIconLabels[key].color = occupied ? UI.ink : vacated ? UI.red : UI.muted;
      this.baseIconLabels[key].alpha = occupied || vacated ? 1 : 0.82;
    }
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

    const stadiumHint = run.stadium ? (STADIUM_HINT[run.stadium.id] ?? run.stadium.description) : "";
    const gearText =
      run.equipment.length === 0
        ? "none yet"
        : run.equipment
            .map((e) => truncate(e.name, 18))
            .join(" · ");
    this.equipmentText.text = `STADIUM: ${run.stadium?.name ?? "-"}\n${stadiumHint}\n\nGEAR: ${gearText}`;
    this.statusLine.text = `Outs ${run.outs}/${RULES.outsPerInning} · Deck ${deckCount} · $${run.cash} · ${run.rng.seed}`;

    const inningActive = run.phase === "inning";
    this.currentBases = { ...run.bases };
    if (selectionCount === 0) this.previewBases = null;
    this.previewPanel.isVisible = inningActive;
    this.basePanel.isVisible = inningActive;
    this.approachStack.isVisible = inningActive;
    this.actionStack.isVisible = inningActive;
    this.updateBaseIcons();
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

  updatePreview(result: ScoreResult | null, selectedCount: number, leadoffName: string | null, suggestions: ComboSuggestion[]): void {
    this.previewTitle.text = `SCORE PREVIEW · ${selectedCount}/5`;
    if (!result || selectedCount === 0) {
      this.previewBases = null;
      this.updateBaseIcons();
      this.leadoffText.text = "";
      this.previewComboTitle.text = suggestions.length > 0 ? "COMBO HUB · STARTERS" : "COMBO HUB";
      this.previewComboText.color = suggestions.length > 0 ? UI.gold : UI.muted;
      this.previewComboText.text =
        suggestions.length > 0
          ? suggestions
              .slice(0, 3)
              .map((suggestion) => formatSuggestion(suggestion, selectedCount))
              .join("\n")
          : "Build stat spikes, team sets, or position groups.";
      this.previewLabels.width = "336px";
      this.previewLabels.textWrapping = true;
      this.previewLabels.text = "Pick cards to preview.\n\nQ Swing: bases\nW Small Ball: runners\nE Take: walks";
      this.previewValues.text = "";
      this.previewTotal.text = "";
      return;
    }
    this.previewBases = { ...result.basesAfter };
    this.updateBaseIcons();
    this.previewLabels.width = "214px";
    this.previewLabels.textWrapping = false;
    this.leadoffText.text = `Leadoff: ${truncate(leadoffName ?? "", 30)}`;
    const labels: string[] = [];
    const values: string[] = [];
    this.previewComboTitle.text = result.combos.length > 0 ? `COMBO HUB · ${result.combos.length}` : "COMBO HUB · 0";
    this.previewComboText.color = result.combos.length > 0 || suggestions.length > 0 ? UI.gold : UI.muted;
    if (result.combos.length === 0) {
      this.previewComboText.text =
        suggestions.length > 0
          ? suggestions
              .slice(0, 3)
              .map((suggestion) => formatSuggestion(suggestion, selectedCount))
              .join("\n")
          : "No combo yet. Add a matching team, position chain, or stat spike.";
    } else {
      const shown =
        result.combos.length === 1
          ? [`${result.combos[0].name}  ${comboReward(result.combos[0])}`, `  ${truncate(result.combos[0].detail, 34)}`]
          : result.combos.slice(0, 3).map((combo) => `${combo.name}  ${comboReward(combo)}`);
      if (result.combos.length > 3) shown.push(`+${result.combos.length - 3} more combo${result.combos.length - 3 === 1 ? "" : "s"}`);
      if (suggestions.length > 0 && shown.length < 4) shown.push(formatSuggestion(suggestions[0], selectedCount));
      this.previewComboText.text = shown.join("\n");
    }
    for (const line of compactPreviewLines(result)) {
      labels.push(truncate(line.label, 24));
      values.push(line.value);
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

  showComboPopup(combo: DetectedCombo, index: number, total: number): Promise<void> {
    const generation = ++this.comboPopupGeneration;
    this.comboPopupEyebrow.text = total > 1 ? `COMBO ${index}/${total}` : "COMBO HIT";
    this.comboPopupTitle.text = `${combo.name.toUpperCase()} · ${comboReward(combo).toUpperCase()}`;
    this.comboPopupDetail.text = truncate(combo.detail, 56);
    this.comboPopupPanel.isVisible = true;
    this.comboPopupPanel.alpha = 1;
    this.comboPopupPanel.scaleX = 0.92;
    this.comboPopupPanel.scaleY = 0.92;
    return new Promise((resolve) => {
      const start = performance.now();
      const hold = 640 / Tweens.timeScale;
      const tick = () => {
        if (generation !== this.comboPopupGeneration) {
          resolve();
          return;
        }
        const elapsed = performance.now() - start;
        const grow = Math.min(1, (elapsed / 150) * Tweens.timeScale);
        this.comboPopupPanel.scaleX = 0.92 + grow * 0.08;
        this.comboPopupPanel.scaleY = 0.92 + grow * 0.08;
        if (elapsed > hold) {
          this.comboPopupPanel.alpha = Math.max(0, 1 - ((elapsed - hold) / 220) * Tweens.timeScale);
        }
        if (elapsed > hold + 230 / Tweens.timeScale) {
          this.comboPopupPanel.isVisible = false;
          resolve();
        } else {
          requestAnimationFrame(tick);
        }
      };
      tick();
    });
  }
}
