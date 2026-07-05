import { Control, Rectangle, TextBlock, type AdvancedDynamicTexture } from "@babylonjs/gui/2D";
import type { Scene } from "@babylonjs/core/scene";
import { RULES, type RunSystem } from "../systems/RunSystem";
import { UI, makeButton, makePanel, makeStack, makeText, makeTitle } from "./kit";

export interface DebugCallbacks {
  onGiveCash: () => void;
  onWinInning: () => void;
  onRedeal: () => void;
}

/** F1 dev panel: run state + live perf stats plus cheat buttons for testing. */
export class DebugPanel {
  private root: Rectangle;
  private info: TextBlock;
  private perfText: TextBlock;
  private frameCount = 0;
  private lastDrawTotal = 0;

  constructor(adt: AdvancedDynamicTexture, private scene: Scene, callbacks: DebugCallbacks) {
    this.root = makePanel("330px", "460px");
    this.root.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.root.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.root.left = "14px";
    this.root.top = "462px"; // below the gear panel, even when a boss card pushes it down
    this.root.background = "rgba(30, 12, 12, 0.92)";
    this.root.isVisible = false;
    adt.addControl(this.root);

    // Live perf readout: cheap sampling every ~10 frames, only while open.
    // Runs after the render so the engine's draw counter holds this frame's count.
    this.scene.onAfterRenderObservable.add(() => {
      if (!this.root.isVisible || ++this.frameCount % 10 !== 0) return;
      const engine = this.scene.getEngine();
      // the engine counter is cumulative (nothing resets it); diff across the window
      const drawTotal = (engine as unknown as { _drawCalls?: { current: number } })._drawCalls?.current ?? 0;
      const drawCalls = Math.round((drawTotal - this.lastDrawTotal) / 10);
      this.lastDrawTotal = drawTotal;
      this.perfText.text =
        `${engine.getFps().toFixed(0)} fps · ${drawCalls} draws · ` +
        `${this.scene.getActiveMeshes().length}/${this.scene.meshes.length} meshes · ` +
        `${(engine.getRenderWidth() * engine.getRenderHeight() / 1e6).toFixed(1)}MP`;
    });

    const stack = makeStack();
    stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    stack.paddingTop = "12px";
    this.root.addControl(stack);

    const title = makeTitle("DEBUG", 22);
    title.color = UI.red;
    stack.addControl(title);

    this.perfText = makeText("", 14, UI.gold);
    this.perfText.fontFamily = UI.mono;
    this.perfText.paddingTop = "4px";
    this.perfText.paddingBottom = "6px";
    stack.addControl(this.perfText);

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
      `outs ${run.outs}/${RULES.outsPerInning}  bases ${run.bases.first ? "1" : "-"}${run.bases.second ? "2" : "-"}${run.bases.third ? "3" : "-"}`,
      `at-bats ${run.playsLeft}  discards ${run.discardsLeft}  cash $${run.cash}`,
      `deck: ${deckCount}`,
      `pitch: ${run.pitch.id}  stadium: ${run.stadium?.id ?? "-"}`,
      `boss: ${run.boss?.id ?? "-"}${run.umpireTarget ? ` (${run.umpireTarget})` : ""}`,
      `equipment: ${run.equipment.map((e) => e.id).join(", ") || "-"}`,
      `hand: ${handIds.join(", ")}`,
    ].join("\n");
  }
}
