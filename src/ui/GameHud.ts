import { Control, Ellipse, Rectangle, TextBlock, type AdvancedDynamicTexture, type StackPanel } from "@babylonjs/gui/2D";
import type { Button } from "@babylonjs/gui/2D";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { RULES, type RunSystem } from "../systems/RunSystem";
import type { BaseState, BattingApproach, CountState, DetectedCombo, RunnerState, ScoreLine, ScoreResult, ScorecardEntry } from "../systems/types";
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
  swing: "Q ▲ SWING",
  small_ball: "W ▼ BUNT",
  take: "E ◉ TAKE",
  steal: "A » STEAL",
};
/** Scorebook-style abbreviations for the quality-meter tier ticks. */
const TIER_SHORT: Record<string, string> = {
  Single: "1B",
  Double: "2B",
  Triple: "3B",
  "Home Run": "HR",
  Walk: "BB",
  "Ball Four": "BB",
  "Patient Single": "1B",
  "Sacrifice Bunt": "SAC",
  "Drag Bunt": "1B",
  "Bunt Single": "1B",
  "Gap Double": "2B",
  "Stolen Base": "SB",
  "Steal Home": "HOME",
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
  if (withoutCombos.length <= 7) return withoutCombos;
  return [...withoutCombos.slice(0, 4), ...withoutCombos.slice(-3)];
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
  private baseRunnersText: TextBlock;
  private countText: TextBlock;
  private outsText: TextBlock;
  private scorecardTitle: TextBlock;
  private scorecardText: TextBlock;
  private currentBases: BaseState = { first: false, second: false, third: false };
  private previewBases: BaseState | null = null;
  private currentRunners: RunnerState = { first: null, second: null, third: null };
  private previewRunners: RunnerState | null = null;
  private currentCount: CountState = { balls: 0, strikes: 0 };
  private statusLine: TextBlock;
  private previewPanel: Rectangle;
  private previewTitle: TextBlock;
  private leadoffText: TextBlock;
  private meterPanel: Rectangle;
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

  constructor(private adt: AdvancedDynamicTexture, callbacks: HudCallbacks) {
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

    // Situation panel — a broadcast-style "score bug": bases, runners, count,
    // outs, and the inning scorecard, stacked with no overlaps.
    this.basePanel = makePanel("236px", "258px");
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
      first: this.makeBaseIcon("baseIconFirst", 34, 60),
      second: this.makeBaseIcon("baseIconSecond", 0, 32),
      third: this.makeBaseIcon("baseIconThird", -34, 60),
    };
    this.baseIconLabels = {
      first: this.makeBaseLabel("baseIconFirstLabel", "1B", 34, 63),
      second: this.makeBaseLabel("baseIconSecondLabel", "2B", 0, 35),
      third: this.makeBaseLabel("baseIconThirdLabel", "3B", -34, 63),
    };
    for (const key of ["first", "second", "third"] as const) {
      this.basePanel.addControl(this.baseIcons[key]);
      this.basePanel.addControl(this.baseIconLabels[key]);
    }
    this.baseRunnersText = makeText("", 12, UI.cream);
    this.baseRunnersText.fontFamily = UI.mono;
    this.baseRunnersText.height = "30px";
    this.baseRunnersText.top = "104px";
    this.baseRunnersText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.baseRunnersText.textWrapping = true;
    this.baseRunnersText.isPointerBlocker = false;
    this.basePanel.addControl(this.baseRunnersText);

    this.countText = makeText("", 13, UI.cream);
    this.countText.fontFamily = UI.mono;
    this.countText.fontWeight = "bold";
    this.countText.height = "20px";
    this.countText.left = "14px";
    this.countText.top = "138px";
    this.countText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.countText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.countText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.countText.isPointerBlocker = false;
    this.basePanel.addControl(this.countText);
    this.outsText = makeText("", 13, UI.red);
    this.outsText.fontFamily = UI.mono;
    this.outsText.fontWeight = "bold";
    this.outsText.height = "20px";
    this.outsText.left = "-14px";
    this.outsText.top = "138px";
    this.outsText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.outsText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.outsText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.outsText.isPointerBlocker = false;
    this.basePanel.addControl(this.outsText);

    this.scorecardTitle = makeText("SCORECARD", 12, UI.green);
    this.scorecardTitle.fontFamily = UI.mono;
    this.scorecardTitle.fontWeight = "bold";
    this.scorecardTitle.height = "18px";
    this.scorecardTitle.top = "162px";
    this.scorecardTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.scorecardTitle.isPointerBlocker = false;
    this.basePanel.addControl(this.scorecardTitle);
    this.scorecardText = makeText("", 12, UI.cream);
    this.scorecardText.fontFamily = UI.mono;
    this.scorecardText.width = "212px";
    this.scorecardText.height = "64px";
    this.scorecardText.left = "12px";
    this.scorecardText.top = "184px";
    this.scorecardText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.scorecardText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.scorecardText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.scorecardText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.scorecardText.textWrapping = true;
    this.scorecardText.isPointerBlocker = false;
    this.basePanel.addControl(this.scorecardText);

    // Right-side score preview
    this.previewPanel = makePanel("380px", "552px");
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

    // Quality meter: the run formula in colored chips plus a threshold bar
    // showing which outcome tier the selection reaches. Rebuilt per selection.
    this.meterPanel = new Rectangle("qualityMeter");
    this.meterPanel.width = "356px";
    this.meterPanel.height = "100px";
    this.meterPanel.thickness = 0;
    this.meterPanel.paddingTop = "4px";
    this.meterPanel.isPointerBlocker = false;
    previewStack.addControl(this.meterPanel);

    this.previewComboPanel = makePanel("356px", "120px");
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
    pinTopText(this.previewComboText, "332px", "80px", "12px", "34px");
    this.previewComboPanel.addControl(this.previewComboText);

    // Two synced columns: labels clip left, values align right, lines match 1:1.
    const columns = new Rectangle();
    columns.width = "356px";
    columns.height = "132px";
    columns.thickness = 0;
    previewStack.addControl(columns);
    this.previewLabels = makeText("", 15);
    this.previewLabels.textWrapping = false;
    this.previewLabels.resizeToFit = false;
    this.previewLabels.width = "214px";
    this.previewLabels.height = "132px";
    this.previewLabels.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.previewLabels.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.previewLabels.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    columns.addControl(this.previewLabels);
    this.previewValues = makeText("", 15, UI.gold);
    this.previewValues.textWrapping = false;
    this.previewValues.resizeToFit = false;
    this.previewValues.width = "136px";
    this.previewValues.height = "132px";
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
      swing: makeButton("approachSwing", APPROACH_LABEL.swing, UI.gold, "128px", "38px"),
      small_ball: makeButton("approachSmallBall", APPROACH_LABEL.small_ball, UI.cream, "120px", "38px"),
      take: makeButton("approachTake", APPROACH_LABEL.take, UI.cream, "112px", "38px"),
      steal: makeButton("approachSteal", APPROACH_LABEL.steal, UI.cream, "120px", "38px"),
    };
    for (const approach of ["swing", "small_ball", "take", "steal"] as const) {
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
    icon.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
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
    text.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    text.color = UI.muted;
    text.fontFamily = UI.mono;
    text.fontSize = 13;
    text.fontWeight = "bold";
    text.isPointerBlocker = false;
    return text;
  }

  private compactRunnerName(name: string): string {
    const cleaned = name.replace(/\s*'[^']+'\s*/g, " ").replace(/\s+/g, " ").trim();
    const parts = cleaned.split(" ");
    return parts.length > 1 ? parts[parts.length - 1] : cleaned;
  }

  private runnerSummary(runners: RunnerState): string {
    const labels = [
      runners.first ? `1B ${this.compactRunnerName(runners.first.name)}` : "",
      runners.second ? `2B ${this.compactRunnerName(runners.second.name)}` : "",
      runners.third ? `3B ${this.compactRunnerName(runners.third.name)}` : "",
    ].filter(Boolean);
    return labels.length > 0 ? labels.join(" · ") : "bases empty";
  }

  private countString(count: CountState): string {
    return `${count.balls}-${count.strikes}`;
  }

  private scorecardLine(entry: ScorecardEntry): string {
    const suffix = entry.runs > 0 ? ` +${entry.runs}R` : entry.outs > 0 ? ` ${entry.outs}O` : " SAFE";
    return `${this.countString(entry.count)} ${truncate(entry.detail || entry.summary, 24)}${suffix}`;
  }

  private updateBaseIcons(): void {
    const previewing = this.previewBases !== null;
    const bases = this.previewBases ?? this.currentBases;
    const runners = this.previewRunners ?? this.currentRunners;
    this.baseTitle.text = previewing ? "AFTER PLAY" : "ON BASE";
    this.baseTitle.color = previewing ? UI.gold : UI.green;
    this.baseRunnersText.text = this.runnerSummary(runners);
    this.baseRunnersText.color = previewing ? UI.gold : UI.cream;

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

  /** One colored segment of the quality formula row. */
  private formulaChip(text: string, color: string, size = 17, bold = false): TextBlock {
    const chip = makeText(text, size, color);
    chip.fontFamily = UI.mono;
    if (bold) chip.fontWeight = "bold";
    chip.width = `${Math.max(20, text.length * size * 0.62)}px`;
    chip.height = "26px";
    chip.resizeToFit = true;
    chip.isPointerBlocker = false;
    return chip;
  }

  /**
   * Rebuild the quality meter for the current selection: the formula in
   * color-coded chips (base cream, bonus gold, mult red, difficulty muted)
   * over a threshold bar whose ticks are the approach's outcome ladder.
   */
  private rebuildMeter(result: ScoreResult | null): void {
    this.meterPanel.clearControls();
    if (!result || result.perCard.length === 0) {
      this.meterPanel.isVisible = false;
      return;
    }
    this.meterPanel.isVisible = true;

    // Formula row: (base + bonus) × mult ÷ difficulty = quality
    const formula = makeStack(false);
    formula.height = "28px";
    formula.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    formula.isPointerBlocker = false;
    this.meterPanel.addControl(formula);
    formula.addControl(this.formulaChip(`${Math.round(result.base)}`, UI.cream, 19, true));
    if (result.flatBonus !== 0) {
      formula.addControl(this.formulaChip(` +${Math.round(result.flatBonus)}`, UI.gold, 19, true));
    }
    if (result.multiplier !== 1) {
      formula.addControl(this.formulaChip(` ×${result.multiplier}`, UI.red, 19, true));
    }
    formula.addControl(this.formulaChip(` ÷${result.difficulty}`, UI.muted, 19));
    formula.addControl(this.formulaChip(` = ${result.quality}`, UI.gold, 24, true));
    formula.addControl(this.formulaChip(" QUAL", UI.muted, 13));

    const tiers = result.tiers;
    if (tiers.length === 0) return; // no ladder (e.g. steal with nobody on)

    // Threshold bar: fill to current quality, ticks at each outcome tier.
    const barLeft = 10;
    const barWidth = 336;
    const scale = Math.max(tiers[tiers.length - 1].quality * 1.25, result.quality, 1);
    const reachedIndex = tiers.reduce((idx, tier, i) => (result.quality >= tier.quality ? i : idx), -1);

    const track = new Rectangle("meterTrack");
    track.width = `${barWidth}px`;
    track.height = "12px";
    track.top = "36px";
    track.left = `${barLeft}px`;
    track.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    track.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    track.background = "rgba(244, 236, 216, 0.10)";
    track.color = UI.panelBorder;
    track.thickness = 1;
    track.cornerRadius = 6;
    track.isPointerBlocker = false;
    this.meterPanel.addControl(track);

    const fillWidth = Math.round(barWidth * Math.min(1, result.quality / scale));
    if (fillWidth > 2) {
      const fill = new Rectangle("meterFill");
      fill.width = `${fillWidth}px`;
      fill.height = "12px";
      fill.top = "36px";
      fill.left = `${barLeft}px`;
      fill.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      fill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      fill.background = reachedIndex < 0 ? UI.red : reachedIndex >= tiers.length - 1 ? UI.gold : UI.green;
      fill.thickness = 0;
      fill.cornerRadius = 6;
      fill.isPointerBlocker = false;
      this.meterPanel.addControl(fill);
    }

    for (const [i, tier] of tiers.entries()) {
      const x = barLeft + Math.round(barWidth * Math.min(1, tier.quality / scale));
      const tick = new Rectangle(`meterTick-${i}`);
      tick.width = "2px";
      tick.height = "20px";
      tick.top = "32px";
      tick.left = `${x - 1}px`;
      tick.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      tick.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      tick.background = i <= reachedIndex ? UI.gold : UI.cream;
      tick.alpha = i <= reachedIndex ? 1 : 0.55;
      tick.thickness = 0;
      tick.isPointerBlocker = false;
      this.meterPanel.addControl(tick);

      const label = makeText(TIER_SHORT[tier.label] ?? truncate(tier.label, 4), 12, i <= reachedIndex ? UI.gold : UI.muted);
      label.fontFamily = UI.mono;
      label.fontWeight = "bold";
      label.resizeToFit = false;
      label.textWrapping = false;
      label.width = "44px";
      label.height = "16px";
      label.top = "54px";
      label.left = `${Math.min(x - 12, barLeft + barWidth - 44)}px`;
      label.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      label.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      label.isPointerBlocker = false;
      this.meterPanel.addControl(label);
    }

    // "How far to the next rung" — the tactical read at a glance.
    const next = tiers[reachedIndex + 1];
    const hint = next
      ? `${next.quality - result.quality} more quality → ${next.label.toUpperCase()}`
      : `${tiers[tiers.length - 1].label.toUpperCase()} LOCKED IN`;
    const hintText = makeText(hint, 14, next ? (reachedIndex < 0 ? UI.red : UI.cream) : UI.gold);
    hintText.fontFamily = UI.mono;
    hintText.height = "20px";
    hintText.top = "74px";
    hintText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    hintText.isPointerBlocker = false;
    this.meterPanel.addControl(hintText);
  }

  /** Float a "+N" score pop above a played card as it lands on the diamond. */
  showScorePop(mesh: AbstractMesh, text: string, color: string = UI.gold): void {
    const pop = new TextBlock(`scorePop-${performance.now()}`, text);
    pop.color = color;
    pop.fontFamily = UI.mono;
    pop.fontWeight = "bold";
    pop.fontSize = 30;
    pop.shadowColor = "black";
    pop.shadowOffsetX = 2;
    pop.shadowOffsetY = 2;
    pop.isPointerBlocker = false;
    this.adt.addControl(pop);
    pop.linkWithMesh(mesh);
    const start = performance.now();
    const life = 620 / Tweens.timeScale;
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / life);
      pop.linkOffsetY = -40 - t * 70;
      pop.alpha = t > 0.55 ? Math.max(0, 1 - (t - 0.55) / 0.45) : 1;
      if (t >= 1 || !pop.isVisible) {
        pop.linkWithMesh(null);
        this.adt.removeControl(pop);
        pop.dispose();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }

  /** Count the committed hand's quality up in the big center popup. */
  showQualityTally(quality: number): Promise<void> {
    const generation = ++this.popupGeneration;
    this.popupText.color = UI.gold;
    this.popupText.isVisible = true;
    this.popupText.alpha = 1;
    this.popupText.scaleX = 1;
    this.popupText.scaleY = 1;
    return new Promise((resolve) => {
      const start = performance.now();
      const count = 420 / Tweens.timeScale;
      const hold = 300 / Tweens.timeScale;
      const tick = () => {
        if (generation !== this.popupGeneration) {
          resolve();
          return;
        }
        const elapsed = performance.now() - start;
        const t = Math.min(1, elapsed / count);
        this.popupText.text = `QUALITY ${Math.round(quality * t)}`;
        if (elapsed > count + hold) {
          this.popupText.alpha = Math.max(0, 1 - ((elapsed - count - hold) / 200) * Tweens.timeScale);
        }
        if (elapsed > count + hold + 210 / Tweens.timeScale) {
          this.popupText.isVisible = false;
          resolve();
        } else {
          requestAnimationFrame(tick);
        }
      };
      tick();
    });
  }

  update(run: RunSystem, deckCount: number, selectionCount: number, approach: BattingApproach): void {
    const hand = run.pitch.hand === "L" ? "LHP" : "RHP";
    this.pitchText.text = `⚾ ${run.pitch.name.toUpperCase()} (${hand})\nDifficulty ${run.pitch.difficulty}\n\n${PITCH_HINT[run.pitch.id] ?? run.pitch.description}`;

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
    this.equipmentText.text = `◈ ${run.stadium?.name ?? "-"}\n${stadiumHint}\n\n⚙ GEAR: ${gearText}`;
    this.statusLine.text = `Deck ${deckCount} · $${run.cash} · ${run.rng.seed}`;

    const inningActive = run.phase === "inning";
    this.currentBases = { ...run.bases };
    this.currentCount = { ...run.count };
    this.currentRunners = {
      first: run.runners.first ? { ...run.runners.first } : null,
      second: run.runners.second ? { ...run.runners.second } : null,
      third: run.runners.third ? { ...run.runners.third } : null,
    };
    if (selectionCount === 0) {
      this.previewBases = null;
      this.previewRunners = null;
    }
    this.previewPanel.isVisible = inningActive;
    this.basePanel.isVisible = inningActive;
    this.countText.text = `COUNT ${this.countString(this.currentCount)}`;
    this.outsText.text = `OUTS ${"●".repeat(run.outs)}${"○".repeat(Math.max(0, RULES.outsPerInning - run.outs))}`;
    this.outsText.color = run.outs >= RULES.outsPerInning - 1 ? UI.red : UI.muted;
    this.scorecardTitle.text = `SCORECARD · ${run.runs}/${run.target}`;
    this.scorecardTitle.color = run.inningWon ? UI.gold : UI.green;
    this.scorecardText.text =
      run.scorecard.length > 0
        ? run.scorecard
            .slice(0, 2)
            .map((entry) => this.scorecardLine(entry))
            .join("\n")
        : "Awaiting first pitch.";
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
    this.previewTitle.text = `SCORE PREVIEW · ${this.countString(result?.count ?? this.currentCount)} · ${selectedCount}/5`;
    this.rebuildMeter(selectedCount > 0 ? result : null);
    if (!result || selectedCount === 0) {
      this.previewBases = null;
      this.previewRunners = null;
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
      this.previewLabels.text = "Pick cards to preview.\nQ ▲ Swing — extra bases\nW ▼ Bunt — move runners\nE ◉ Take — draw walks\nA » Steal — send a runner";
      this.previewValues.text = "";
      this.previewTotal.text = "";
      return;
    }
    this.previewBases = { ...result.basesAfter };
    this.previewRunners = {
      first: result.runnersAfter.first ? { ...result.runnersAfter.first } : null,
      second: result.runnersAfter.second ? { ...result.runnersAfter.second } : null,
      third: result.runnersAfter.third ? { ...result.runnersAfter.third } : null,
    };
    this.updateBaseIcons();
    this.previewLabels.width = "214px";
    this.previewLabels.textWrapping = false;
    this.leadoffText.text = result.playByPlay[0] ? truncate(result.playByPlay[0], 42) : `Leadoff: ${truncate(leadoffName ?? "", 30)}`;
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
      values.push(truncate(line.value, 15));
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
