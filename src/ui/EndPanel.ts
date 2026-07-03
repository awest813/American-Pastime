import { Rectangle, TextBlock, type AdvancedDynamicTexture } from "@babylonjs/gui/2D";
import { UI, makeButton, makeStack, makeText } from "./kit";

export interface EndCallbacks {
  onNewRun: () => void;
  onRetrySeed: () => void;
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
    this.root.background = "rgba(8, 10, 18, 0.85)";
    this.root.thickness = 0;
    adt.addControl(this.root);

    const stack = makeStack();
    stack.width = "640px";
    this.root.addControl(stack);

    this.title = makeText("", 64, UI.gold);
    this.title.fontFamily = UI.mono;
    this.title.fontWeight = "bold";
    this.title.shadowColor = "black";
    this.title.shadowOffsetX = 4;
    this.title.shadowOffsetY = 4;
    stack.addControl(this.title);

    this.detail = makeText("", 24);
    this.detail.paddingTop = "18px";
    this.detail.paddingBottom = "34px";
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
