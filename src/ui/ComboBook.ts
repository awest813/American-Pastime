import { Control, Rectangle, type AdvancedDynamicTexture } from "@babylonjs/gui/2D";
import type { ComboMeta } from "../systems/types";
import { UI, makeButton, makePanel, makeStack, makeText } from "./kit";

/**
 * The Combo Book: an in-game reference for the ten scoring combos, the run
 * formula, and the standing rules a new player can't otherwise discover.
 * Toggled with H or the COMBOS button; blocks input underneath while open.
 */
export class ComboBook {
  private root: Rectangle;

  constructor(adt: AdvancedDynamicTexture, combos: ComboMeta[], onClose: () => void) {
    this.root = new Rectangle("comboBookRoot");
    this.root.width = 1;
    this.root.height = 1;
    this.root.background = "rgba(8, 10, 18, 0.8)";
    this.root.thickness = 0;
    this.root.isPointerBlocker = true;
    this.root.isVisible = false;
    adt.addControl(this.root);

    const panel = makePanel("860px", "700px");
    this.root.addControl(panel);

    const stack = makeStack();
    stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    stack.paddingTop = "20px";
    panel.addControl(stack);

    const title = makeText("THE COMBO BOOK", 34, UI.gold);
    title.fontFamily = UI.mono;
    title.fontWeight = "bold";
    stack.addControl(title);

    const subtitle = makeText("runs = (base + bonuses) × multipliers ÷ pitch difficulty", 18, UI.green);
    subtitle.fontFamily = UI.mono;
    subtitle.paddingTop = "6px";
    subtitle.paddingBottom = "16px";
    stack.addControl(subtitle);

    // Two synced columns: combo name + requirement on the left, reward right
    const columns = new Rectangle();
    columns.width = "800px";
    columns.height = "420px";
    columns.thickness = 0;
    stack.addControl(columns);

    const names = combos.map((c) => `${c.name} — ${c.description}`);
    const rewards = combos.map((c) => c.reward);

    const labels = makeText(names.join("\n\n"), 16);
    labels.textWrapping = false;
    labels.resizeToFit = false;
    labels.width = "660px";
    labels.height = "420px";
    labels.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    labels.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    labels.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    columns.addControl(labels);

    const values = makeText(rewards.join("\n\n"), 16, UI.gold);
    values.textWrapping = false;
    values.resizeToFit = false;
    values.width = "130px";
    values.height = "420px";
    values.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    values.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    values.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    columns.addControl(values);

    const footnote = makeText(
      "Click order matters: the pitch and your equipment hit the FIRST card hardest.\nInnings 3, 6 and 9 face a boss pitcher's rule. All-Stars add +2 base, Legends +5.",
      15,
      "#9a917f",
    );
    footnote.paddingTop = "10px";
    footnote.paddingBottom = "14px";
    stack.addControl(footnote);

    const close = makeButton("comboBookClose", "CLOSE (H)", UI.cream, "180px", "46px");
    close.onPointerUpObservable.add(() => onClose());
    stack.addControl(close);
  }

  get isOpen(): boolean {
    return this.root.isVisible;
  }

  setVisible(visible: boolean): void {
    this.root.isVisible = visible;
  }
}
