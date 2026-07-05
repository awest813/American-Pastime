import { Control, Rectangle, TextBlock, type AdvancedDynamicTexture } from "@babylonjs/gui/2D";
import { UI, makeButton, makePanel, makeRule, makeStack, makeText, makeTitle } from "./kit";

export interface EndCallbacks {
  onNewRun: () => void;
  onRetrySeed: () => void;
  onMenu: () => void;
}

/** Shared game-over / championship screen. */
export class EndPanel {
  private root: Rectangle;
  private title: TextBlock;
  private detail: TextBlock;

  constructor(adt: AdvancedDynamicTexture, callbacks: EndCallbacks) {
    this.root = new Rectangle("endRoot");
    this.root.width = 1;
    this.root.height = 1;
    this.root.background = UI.overlayBg;
    this.root.thickness = 0;
    adt.addControl(this.root);

    const panel = makePanel("720px", "440px");
    this.root.addControl(panel);

    const stack = makeStack();
    stack.width = "640px";
    stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    stack.paddingTop = "36px";
    panel.addControl(stack);

    this.title = makeTitle("", 58);
    this.title.shadowColor = "black";
    this.title.shadowOffsetX = 4;
    this.title.shadowOffsetY = 4;
    stack.addControl(this.title);
    const rule = makeRule("420px");
    rule.paddingTop = "8px";
    rule.paddingBottom = "16px";
    stack.addControl(rule);

    this.detail = makeText("", 24);
    this.detail.paddingBottom = "28px";
    stack.addControl(this.detail);

    const row = makeStack(false);
    row.height = "72px";
    stack.addControl(row);
    const newRun = makeButton("newRunButton", "NEW SEASON", UI.green, "240px", "60px");
    newRun.onPointerUpObservable.add(() => callbacks.onNewRun());
    row.addControl(newRun);
    const gap = new Rectangle();
    gap.width = "24px";
    gap.thickness = 0;
    row.addControl(gap);
    const retry = makeButton("retryButton", "RETRY SEED", UI.cream, "240px", "60px");
    retry.onPointerUpObservable.add(() => callbacks.onRetrySeed());
    row.addControl(retry);

    const menu = makeButton("endMenuButton", "BACK TO MENU", UI.muted, "240px", "48px");
    menu.paddingTop = "16px";
    menu.onPointerUpObservable.add(() => callbacks.onMenu());
    stack.addControl(menu);
  }

  show(victory: boolean, detail: string): void {
    this.title.text = victory ? "PENNANT WON!" : "SEASON OVER";
    this.title.color = victory ? UI.gold : UI.red;
    this.detail.text = detail;
    this.root.isVisible = true;
  }

  setVisible(visible: boolean): void {
    this.root.isVisible = visible;
  }
}
