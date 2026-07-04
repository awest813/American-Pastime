import { Control, InputText, Rectangle, StackPanel, type AdvancedDynamicTexture, type Button, type TextBlock } from "@babylonjs/gui/2D";
import { UI, makeButton, makeStack, makeText, setButtonBackground } from "./kit";
import { Random } from "../utils/Random";
import { describeAge, type SaveSummary } from "../systems/Save";

export interface MenuCallbacks {
  onStart: (seed: string) => void;
  onContinue: () => void;
  onCollection: () => void;
  onSettings: () => void;
  /** Current resumable save, or null. Re-read on every home-view show. */
  loadSummary: () => SaveSummary | null;
}

const PHASE_LABEL: Record<string, string> = { inning: "at bat", shop: "in the shop" };
const SEED_LABEL_DEFAULT = "run seed — same seed, same season · or paste a run code";

/**
 * The title screen. Two views inside one panel:
 *  - HOME: an optional CONTINUE RUN button (when a save exists), the title
 *    block, PLAY BALL, the seed row, and the secondary menu
 *    (Card Binder / How to Play / Settings).
 *  - HOW TO PLAY: the full rulebook page, back with ESC.
 */
export class MenuPanel {
  private root: Rectangle;
  private homeStack: StackPanel;
  private howToStack: StackPanel;
  private seedInput: InputText;
  private seedInputFocused = false;
  private callbacks: MenuCallbacks;

  private continueButton!: Button;
  private continueSummary!: TextBlock;
  private startButton!: Button;
  private seedLabel!: TextBlock;
  private seedLabelTimer: ReturnType<typeof setTimeout> | null = null;
  /** True while PLAY BALL is armed to erase an existing save (two-step confirm). */
  private confirmingNew = false;
  private confirmTimer: ReturnType<typeof setTimeout> | null = null;
  private hasSave = false;

  constructor(adt: AdvancedDynamicTexture, callbacks: MenuCallbacks) {
    this.callbacks = callbacks;
    this.root = new Rectangle("menuRoot");
    this.root.width = 1;
    this.root.height = 1;
    this.root.background = "rgba(8, 10, 18, 0.82)";
    this.root.thickness = 0;
    adt.addControl(this.root);

    this.homeStack = this.buildHome();
    this.howToStack = this.buildHowTo();
    this.showHome(); // set the initial CONTINUE visibility before the first frame
  }

  // ── HOME view ─────────────────────────────────────────────────────────────

  private buildHome(): StackPanel {
    const stack = makeStack();
    stack.width = "960px";
    this.root.addControl(stack);

    const title = makeText("CARDBALL CLASSIC", 76, UI.gold);
    title.fontFamily = UI.mono;
    title.fontWeight = "bold";
    title.shadowColor = "black";
    title.shadowOffsetX = 4;
    title.shadowOffsetY = 4;
    stack.addControl(title);

    const subtitle = makeText("a cursed baseball card engine", 26, UI.cream);
    subtitle.paddingBottom = "10px";
    stack.addControl(subtitle);

    const divider = makeText("· · · ⚾ · · ·", 20, "#9a917f");
    divider.paddingBottom = "22px";
    stack.addControl(divider);

    // CONTINUE RUN — the prominent action when a run is in progress. Hidden
    // (with its summary) when there's no save; refreshContinue() toggles it.
    this.continueButton = makeButton("continueButton", "CONTINUE RUN", UI.gold, "340px", "62px");
    this.continueButton.fontSize = 26;
    this.continueButton.onPointerUpObservable.add(() => this.callbacks.onContinue());
    stack.addControl(this.continueButton);
    this.continueSummary = makeText("", 15, "#9a917f");
    this.continueSummary.fontFamily = UI.mono;
    this.continueSummary.paddingTop = "6px";
    this.continueSummary.paddingBottom = "14px";
    stack.addControl(this.continueSummary);

    this.startButton = makeButton("startButton", "PLAY BALL", UI.green, "300px", "68px");
    this.startButton.fontSize = 30;
    this.startButton.onPointerUpObservable.add(() => this.submit());
    stack.addControl(this.startButton);

    // Seed row: input + dice reroll, directly under the start button
    const seedRow = makeStack(false);
    seedRow.height = "58px";
    seedRow.paddingTop = "14px";
    stack.addControl(seedRow);
    this.seedInput = new InputText("seedInput", Random.generateSeed());
    this.seedInput.width = "244px";
    this.seedInput.height = "44px";
    this.seedInput.color = UI.ink;
    this.seedInput.background = UI.cream;
    this.seedInput.focusedBackground = "#ffffff";
    this.seedInput.fontFamily = UI.mono;
    this.seedInput.fontSize = 20;
    // Track focus so global letter hotkeys (M mute…) don't fire while typing a seed
    this.seedInput.onFocusObservable.add(() => (this.seedInputFocused = true));
    this.seedInput.onBlurObservable.add(() => (this.seedInputFocused = false));
    seedRow.addControl(this.seedInput);
    const reroll = makeButton("seedReroll", "⚂", UI.cream, "48px", "44px");
    reroll.fontSize = 24;
    reroll.paddingLeft = "8px";
    reroll.onPointerUpObservable.add(() => this.randomizeSeed());
    seedRow.addControl(reroll);

    this.seedLabel = makeText(SEED_LABEL_DEFAULT, 15, "#9a917f");
    this.seedLabel.paddingTop = "4px";
    this.seedLabel.paddingBottom = "30px";
    stack.addControl(this.seedLabel);

    // Secondary menu row
    const menuRow = makeStack(false);
    menuRow.height = "56px";
    stack.addControl(menuRow);
    const secondary: Array<[string, string, () => void]> = [
      ["binderButton", "CARD BINDER", () => this.callbacks.onCollection()],
      ["howToButton", "HOW TO PLAY", () => this.showHowTo()],
      ["settingsButton", "SETTINGS", () => this.callbacks.onSettings()],
    ];
    for (const [i, [name, label, action]] of secondary.entries()) {
      const button = makeButton(name, label, UI.cream, "196px", "48px");
      button.fontSize = 18;
      if (i > 0) button.paddingLeft = "16px";
      button.onPointerUpObservable.add(action);
      menuRow.addControl(button);
    }

    const hint = makeText("ENTER starts a season · in game: H combo book · ESC pause · M mute", 15, "#9a917f");
    hint.paddingTop = "30px";
    stack.addControl(hint);

    return stack;
  }

  // ── HOW TO PLAY view ──────────────────────────────────────────────────────

  private buildHowTo(): StackPanel {
    const stack = makeStack();
    stack.width = "960px";
    stack.isVisible = false;
    this.root.addControl(stack);

    const title = makeText("HOW TO PLAY", 48, UI.gold);
    title.fontFamily = UI.mono;
    title.fontWeight = "bold";
    title.shadowColor = "black";
    title.shadowOffsetX = 3;
    title.shadowOffsetY = 3;
    title.paddingBottom = "24px";
    stack.addControl(title);

    const rules = makeText(
      [
        "THE AT-BAT — Draw 8 cards, click up to 5 to build one at-bat.",
        "Order matters: the pitch and your equipment hit the FIRST card hardest.",
        "The score preview shows exactly what a selection is worth before you swing.",
        "",
        "THE INNING — Beat the target before your 4 plays run out.",
        "Discards (3 per inning) swap unwanted cards without spending a play.",
        "",
        "THE SEASON — Win an inning, hit the shop: equipment, upgrades, rerolls.",
        "Innings 3, 6, and 9 are boss pitchers with a rule of their own.",
        "Survive all 9 innings to take the pennant.",
        "",
        "SAVING — Your run autosaves; CONTINUE RUN picks it back up.",
        "Pause → COPY RUN CODE snapshots the exact moment as a paste-able code;",
        "drop a code into the seed box here to load it on any machine.",
      ].join("\n"),
      21,
    );
    rules.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    rules.paddingBottom = "26px";
    stack.addControl(rules);

    const keys = makeText("H combo book · ESC pause · M mute · ENTER play from the title", 17, UI.green);
    keys.fontFamily = UI.mono;
    keys.paddingBottom = "30px";
    stack.addControl(keys);

    const back = makeButton("howToBack", "BACK (ESC)", UI.cream, "240px", "52px");
    back.onPointerUpObservable.add(() => this.showHome());
    stack.addControl(back);

    return stack;
  }

  // ── View state ────────────────────────────────────────────────────────────

  /** True when the home view (with the start button) is showing. */
  get onHome(): boolean {
    return this.homeStack.isVisible;
  }

  /** True while the seed InputText has keyboard focus. */
  get seedFocused(): boolean {
    return this.visible && this.seedInputFocused;
  }

  showHome(): void {
    this.homeStack.isVisible = true;
    this.howToStack.isVisible = false;
    this.refreshContinue();
  }

  showHowTo(): void {
    this.homeStack.isVisible = false;
    this.howToStack.isVisible = true;
  }

  /** Re-read the save slot and show/hide CONTINUE accordingly. Also resets the
   *  PLAY BALL confirm, since the save state may have changed underneath it. */
  refreshContinue(): void {
    const summary = this.callbacks.loadSummary();
    this.hasSave = summary !== null;
    this.continueButton.isVisible = this.hasSave;
    this.continueSummary.isVisible = this.hasSave;
    if (summary) {
      const where = PHASE_LABEL[summary.phase] ?? summary.phase;
      const parts = [summary.seed, `inning ${summary.inning}`, where, `$${summary.cash}`];
      if (summary.equipment > 0) parts.push(`${summary.equipment} gear`);
      parts.push(describeAge(summary.savedAt));
      this.continueSummary.text = parts.join(" · ");
    }
    this.resetConfirm();
  }

  /** Briefly flag a bad run-code paste on the seed label, then restore it. */
  flashSeedError(message: string): void {
    if (this.seedLabelTimer !== null) clearTimeout(this.seedLabelTimer);
    this.seedLabel.text = message;
    this.seedLabel.color = UI.red;
    this.seedLabelTimer = setTimeout(() => {
      this.seedLabel.text = SEED_LABEL_DEFAULT;
      this.seedLabel.color = "#9a917f";
      this.seedLabelTimer = null;
    }, 4000);
  }

  private resetConfirm(): void {
    if (this.confirmTimer !== null) {
      clearTimeout(this.confirmTimer);
      this.confirmTimer = null;
    }
    this.confirmingNew = false;
    const label = this.startButton.textBlock;
    if (label) label.text = "PLAY BALL";
    setButtonBackground(this.startButton, UI.green);
  }

  setVisible(visible: boolean): void {
    if (visible) this.showHome();
    else this.resetConfirm();
    this.root.isVisible = visible;
  }

  get visible(): boolean {
    return this.root.isVisible;
  }

  /** Start a fresh run. When a save exists, the first press arms a confirm
   *  (PLAY BALL would erase the run in progress); a second press within a few
   *  seconds actually starts. Without a save it starts immediately. */
  submit(): void {
    if (this.hasSave && !this.confirmingNew) {
      this.confirmingNew = true;
      const label = this.startButton.textBlock;
      if (label) label.text = "ERASE RUN & START?";
      setButtonBackground(this.startButton, UI.red);
      this.confirmTimer = setTimeout(() => this.resetConfirm(), 3500);
      return;
    }
    this.resetConfirm();
    this.callbacks.onStart(this.seedInput.text.trim() || Random.generateSeed());
  }

  randomizeSeed(): void {
    this.seedInput.text = Random.generateSeed();
  }
}
