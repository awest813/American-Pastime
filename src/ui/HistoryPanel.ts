import { Control, Rectangle, type AdvancedDynamicTexture, type StackPanel, type TextBlock } from "@babylonjs/gui/2D";
import { loadHistory, type RunRecord } from "../systems/History";
import { UI, makeButton, makePanel, makeRule, makeStack, makeText, makeTitle } from "./kit";

/**
 * The Record Book: all-time counters and the last few seasons, win or lose.
 * Opened from the title screen; rebuilt from storage on every open so it
 * always reflects the freshest season.
 */
export class HistoryPanel {
  private root: Rectangle;
  private headline: TextBlock;
  private rows: StackPanel;

  constructor(adt: AdvancedDynamicTexture, onClose: () => void) {
    this.root = new Rectangle("historyRoot");
    this.root.width = 1;
    this.root.height = 1;
    this.root.background = UI.overlayBg;
    this.root.thickness = 0;
    this.root.isPointerBlocker = true;
    this.root.isVisible = false;
    adt.addControl(this.root);

    const panel = makePanel("760px", "640px");
    this.root.addControl(panel);

    const stack = makeStack();
    stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    stack.paddingTop = "24px";
    panel.addControl(stack);

    stack.addControl(makeTitle("THE RECORD BOOK", 34));

    this.headline = makeText("", 17, UI.green);
    this.headline.fontFamily = UI.mono;
    this.headline.paddingTop = "8px";
    this.headline.paddingBottom = "10px";
    stack.addControl(this.headline);
    const rule = makeRule("620px");
    rule.paddingBottom = "12px";
    stack.addControl(rule);

    this.rows = makeStack();
    this.rows.width = "700px";
    this.rows.height = "380px";
    stack.addControl(this.rows);

    const close = makeButton("historyClose", "CLOSE (ESC)", UI.cream, "200px", "48px");
    close.paddingTop = "12px";
    close.onPointerUpObservable.add(() => onClose());
    stack.addControl(close);
  }

  private recordLine(record: RunRecord): string {
    const mark = record.victory ? "★ PENNANT" : `✗ inning ${record.inningReached}`;
    const best =
      record.bestPlayLabel === ""
        ? "—"
        : `${record.bestPlayLabel}${record.bestPlayRuns > 0 ? ` +${record.bestPlayRuns}` : ""}`;
    return `${mark.padEnd(12)} ${record.seed.padEnd(14)} ${String(record.totalRuns).padStart(3)} runs   best: ${best}`;
  }

  /** Load fresh history and show the overlay. */
  open(): void {
    const data = loadHistory();
    const rate = data.seasons > 0 ? ` (${Math.round((data.pennants / data.seasons) * 100)}%)` : "";
    this.headline.text =
      data.seasons === 0
        ? "No seasons on record yet."
        : `Seasons ${data.seasons} · Pennants ${data.pennants}${rate} · Furthest inning ${data.bestInning} · Best season ${data.mostRunsSeason} runs`;

    this.rows.clearControls();
    if (data.records.length === 0) {
      const empty = makeText("Finish a season — win or lose — and it goes in the book.", 18, UI.muted);
      empty.paddingTop = "24px";
      this.rows.addControl(empty);
    } else {
      for (const record of data.records) {
        const line = makeText(this.recordLine(record), 15, record.victory ? UI.gold : UI.cream);
        line.fontFamily = UI.mono;
        line.height = "34px";
        line.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.rows.addControl(line);
      }
    }
    this.root.isVisible = true;
  }

  get isOpen(): boolean {
    return this.root.isVisible;
  }

  setVisible(visible: boolean): void {
    this.root.isVisible = visible;
  }
}
