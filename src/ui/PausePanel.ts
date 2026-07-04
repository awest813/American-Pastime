import { Rectangle, TextBlock, type AdvancedDynamicTexture } from "@babylonjs/gui/2D";
import { UI, makeButton, makeStack, makeText } from "./kit";

export interface PauseCallbacks {
  onResume: () => void;
  onSettings: () => void;
  onAbandon: () => void;
}

/** ESC pause: resume or abandon the run back to the title screen. */
export class PausePanel {
  private root: Rectangle;
  private seedText: TextBlock;

  constructor(adt: AdvancedDynamicTexture, callbacks: PauseCallbacks) {
    this.root = new Rectangle("pauseRoot");
    this.root.width = 1;
    this.root.height = 1;
    this.root.background = "rgba(8, 10, 18, 0.82)";
    this.root.thickness = 0;
    this.root.isPointerBlocker = true;
    this.root.isVisible = false;
    adt.addControl(this.root);

    const stack = makeStack();
    stack.width = "760px";
    this.root.addControl(stack);

    const title = makeText("SEVENTH-INNING STRETCH", 42, UI.gold);
    title.fontFamily = UI.mono;
    title.fontWeight = "bold";
    title.shadowColor = "black";
    title.shadowOffsetX = 3;
    title.shadowOffsetY = 3;
    stack.addControl(title);

    this.seedText = makeText("", 18, "#9a917f");
    this.seedText.fontFamily = UI.mono;
    this.seedText.paddingTop = "10px";
    this.seedText.paddingBottom = "30px";
    stack.addControl(this.seedText);

    const resume = makeButton("pauseResume", "RESUME (ESC)", UI.green, "300px", "58px");
    resume.onPointerUpObservable.add(() => callbacks.onResume());
    stack.addControl(resume);

    const settings = makeButton("pauseSettings", "SETTINGS", UI.cream, "300px", "52px");
    settings.paddingTop = "14px";
    settings.onPointerUpObservable.add(() => callbacks.onSettings());
    stack.addControl(settings);

    const abandon = makeButton("pauseAbandon", "ABANDON RUN", UI.red, "300px", "52px");
    abandon.paddingTop = "14px";
    abandon.onPointerUpObservable.add(() => callbacks.onAbandon());
    stack.addControl(abandon);

    const hint = makeText("H combo book · M mute · seed replays the same season", 15, "#9a917f");
    hint.paddingTop = "22px";
    stack.addControl(hint);
  }

  get isOpen(): boolean {
    return this.root.isVisible;
  }

  setVisible(visible: boolean, seed = ""): void {
    if (visible) this.seedText.text = `SEED ${seed}`;
    this.root.isVisible = visible;
  }
}
