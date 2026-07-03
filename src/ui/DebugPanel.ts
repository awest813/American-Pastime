import { Control, Rectangle, TextBlock, type AdvancedDynamicTexture } from "@babylonjs/gui/2D";
import type { RunSystem } from "../systems/RunSystem";
import { UI, makeButton, makePanel, makeStack, makeText } from "./kit";

export interface DebugCallbacks {
  onGiveCash: () => void;
  onWinInning: () => void;
  onRedeal: () => void;
}

/** F1 dev panel: run state at a glance plus cheat buttons for fast testing. */
export class DebugPanel {
  private root: Rectangle;
  private info: TextBlock;

  constructor(adt: AdvancedDynamicTexture, callbacks: DebugCallbacks) {
    this.root = makePanel("330px", "420px");
    this.root.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.root.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.root.left = "14px";
    this.root.top = "342px"; // below the stadium/equipment panel
    this.root.background = "rgba(30, 12, 12, 0.92)";
    this.root.isVisible = false;
    adt.addControl(this.root);

    const stack = makeStack();
    stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    stack.paddingTop = "12px";
    this.root.addControl(stack);

    const title = makeText("DEBUG (F1)", 22, UI.red);
    title.fontFamily = UI.mono;
    stack.addControl(title);

    this.info = makeText("", 15);
    this.info.textWrapping = true;
    this.info.resizeToFit = false;
    this.info.width = "300px";
    this.info.height = "210px";
    this.info.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    stack.addControl(this.info);

    const cash = makeButton("dbgCash", "+$10  (G)", UI.cream, "260px", "40px");
    cash.onPointerUpObservable.add(() => callbacks.onGiveCash());
    stack.addControl(cash);
    const win = makeButton("dbgWin", "WIN INNING  (N)", UI.cream, "260px", "40px");
    win.onPointerUpObservable.add(() => callbacks.onWinInning());
    stack.addControl(win);
    const redeal = makeButton("dbgRedeal", "RESTART INNING  (R)", UI.cream, "260px", "40px");
    redeal.onPointerUpObservable.add(() => callbacks.onRedeal());
    stack.addControl(redeal);
  }

  toggle(): void {
    this.root.isVisible = !this.root.isVisible;
  }

  get visible(): boolean {
    return this.root.isVisible;
  }

  refresh(run: RunSystem, deckCount: number, handIds: string[]): void {
    if (!this.root.isVisible) return;
    this.info.text = [
      `seed: ${run.rng.seed}`,
      `phase: ${run.phase}`,
      `inning ${run.inning}  target ${run.target}  runs ${run.runs}`,
      `plays ${run.playsLeft}  discards ${run.discardsLeft}  cash $${run.cash}`,
      `deck: ${deckCount}`,
      `pitch: ${run.pitch.id}  stadium: ${run.stadium?.id ?? "-"}`,
      `equipment: ${run.equipment.map((e) => e.id).join(", ") || "-"}`,
      `hand: ${handIds.join(", ")}`,
    ].join("\n");
  }
}
