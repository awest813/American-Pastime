import { Control, Rectangle, type AdvancedDynamicTexture, type StackPanel } from "@babylonjs/gui/2D";
import type { ComboMeta } from "../systems/types";
import { UI, makeButton, makePanel, makeRule, makeStack, makeText, makeTitle } from "./kit";

const COMBO_HINT: Record<string, string> = {
  contact_hit: "Contact 7+ on any card",
  power_swing: "20+ total Power",
  speed_steal: "Speed 7+ plus Discipline 7+ or Contact 8+",
  team_chemistry: "3 same-team cards; 5 doubles it",
  full_outfield: "LF + CF + RF",
  around_the_horn: "1B + 2B + SS + 3B",
  battery: "P + C; cancels pitch penalties",
  lefty_advantage: "Left/switch bats vs RHP",
  veteran_presence: "2+ Vintage cards",
  modern_sluggers: "3+ Modern cards with Power 6+",
};

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
    this.root.background = UI.overlayBg;
    this.root.thickness = 0;
    this.root.isPointerBlocker = true;
    this.root.isVisible = false;
    adt.addControl(this.root);

    const panel = makePanel("980px", "700px");
    this.root.addControl(panel);

    const stack = makeStack();
    stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    stack.paddingTop = "20px";
    panel.addControl(stack);

    const title = makeTitle("THE COMBO BOOK", 34);
    stack.addControl(title);

    const subtitle = makeText("gold +N adds to base · red ×N multiplies quality", 18, UI.green);
    subtitle.fontFamily = UI.mono;
    subtitle.paddingTop = "6px";
    subtitle.paddingBottom = "10px";
    stack.addControl(subtitle);
    const rule = makeRule("700px");
    rule.paddingBottom = "14px";
    stack.addControl(rule);

    const columns = makeStack(false);
    columns.width = "920px";
    columns.height = "400px";
    columns.paddingTop = "4px";
    stack.addControl(columns);

    const midpoint = Math.ceil(combos.length / 2);
    this.addComboColumn(columns, combos.slice(0, midpoint));
    const gap = new Rectangle();
    gap.width = "32px";
    gap.thickness = 0;
    columns.addControl(gap);
    this.addComboColumn(columns, combos.slice(midpoint));

    const footnote = makeText(
      "Click order matters: the pitch and your equipment hit the FIRST card hardest.\nInnings 3, 6 and 9 face a boss pitcher's rule. All-Stars add +2 base, Legends +5.",
      15,
      UI.muted,
    );
    footnote.paddingTop = "10px";
    footnote.paddingBottom = "14px";
    stack.addControl(footnote);

    const close = makeButton("comboBookClose", "CLOSE (H)", UI.cream, "180px", "46px");
    close.onPointerUpObservable.add(() => onClose());
    stack.addControl(close);
  }

  private addComboColumn(parent: StackPanel, combos: ComboMeta[]): void {
    const column = makeStack();
    column.width = "444px";
    column.height = "400px";
    parent.addControl(column);

    for (const combo of combos) {
      const row = new Rectangle();
      row.width = "444px";
      row.height = "76px";
      row.thickness = 0;
      column.addControl(row);

      const label = makeText(`${combo.name} - ${COMBO_HINT[combo.id] ?? combo.description}`, 15);
      label.textWrapping = true;
      label.resizeToFit = false;
      label.width = "330px";
      label.height = "68px";
      label.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      label.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      label.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      row.addControl(label);

      // Same color language as the quality meter: gold adds, red multiplies.
      const reward = makeText(combo.reward, 15, /^x/i.test(combo.reward.trim()) ? UI.red : UI.gold);
      reward.textWrapping = true;
      reward.resizeToFit = false;
      reward.width = "104px";
      reward.height = "68px";
      reward.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      reward.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      reward.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      reward.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      row.addControl(reward);
    }
  }

  get isOpen(): boolean {
    return this.root.isVisible;
  }

  setVisible(visible: boolean): void {
    this.root.isVisible = visible;
  }
}
