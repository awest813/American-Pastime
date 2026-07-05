import { Control, InputText, Rectangle, TextBlock, type AdvancedDynamicTexture } from "@babylonjs/gui/2D";
import { UI, makeButton, makePanel, makeRule, makeStack, makeText, makeTitle } from "./kit";

export interface PauseCallbacks {
  onResume: () => void;
  onSettings: () => void;
  onAbandon: () => void;
  /** Snapshot the current run as a shareable code; null if nothing to export. */
  getRunCode: () => Promise<string | null>;
}

/** ESC pause: resume, tweak settings, export a run code, or abandon the run. */
export class PausePanel {
  private root: Rectangle;
  private seedText: TextBlock;
  private codeInput: InputText;
  private codeStatus: TextBlock;

  constructor(adt: AdvancedDynamicTexture, callbacks: PauseCallbacks) {
    this.root = new Rectangle("pauseRoot");
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
    stack.width = "680px";
    stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    stack.paddingTop = "30px";
    panel.addControl(stack);

    const title = makeTitle("SEVENTH-INNING STRETCH", 38);
    stack.addControl(title);

    this.seedText = makeText("", 18, UI.muted);
    this.seedText.fontFamily = UI.mono;
    this.seedText.paddingTop = "10px";
    this.seedText.paddingBottom = "14px";
    stack.addControl(this.seedText);
    const rule = makeRule("460px");
    rule.paddingBottom = "22px";
    stack.addControl(rule);

    const resume = makeButton("pauseResume", "RESUME (ESC)", UI.green, "300px", "58px");
    resume.onPointerUpObservable.add(() => callbacks.onResume());
    stack.addControl(resume);

    const settings = makeButton("pauseSettings", "SETTINGS", UI.cream, "300px", "52px");
    settings.paddingTop = "14px";
    settings.onPointerUpObservable.add(() => callbacks.onSettings());
    stack.addControl(settings);

    const runCode = makeButton("pauseRunCode", "COPY RUN CODE", UI.cream, "300px", "52px");
    runCode.paddingTop = "14px";
    runCode.onPointerUpObservable.add(() => void this.exportCode(callbacks.getRunCode));
    stack.addControl(runCode);

    const abandon = makeButton("pauseAbandon", "ABANDON RUN", UI.red, "300px", "52px");
    abandon.paddingTop = "14px";
    abandon.onPointerUpObservable.add(() => callbacks.onAbandon());
    stack.addControl(abandon);

    // Run-code row: hidden until exported; the box is a manual-copy fallback
    // for browsers that block the clipboard API.
    this.codeInput = new InputText("pauseCodeBox", "");
    this.codeInput.width = "640px";
    this.codeInput.height = "38px";
    this.codeInput.color = UI.ink;
    this.codeInput.background = UI.cream;
    this.codeInput.focusedBackground = "#ffffff";
    this.codeInput.fontFamily = UI.mono;
    this.codeInput.fontSize = 13;
    this.codeInput.paddingTop = "16px";
    this.codeInput.isVisible = false;
    stack.addControl(this.codeInput);
    this.codeStatus = makeText("", 15, UI.green);
    this.codeStatus.fontFamily = UI.mono;
    this.codeStatus.paddingTop = "6px";
    stack.addControl(this.codeStatus);

    const hint = makeText("seed replays the same season", 15, UI.muted);
    hint.paddingTop = "18px";
    stack.addControl(hint);
  }

  /** Fetch the code, surface it in the box, and try the clipboard. */
  private async exportCode(getRunCode: () => Promise<string | null>): Promise<void> {
    const code = await getRunCode();
    if (!code) {
      this.codeStatus.text = "nothing to export right now";
      this.codeStatus.color = UI.red;
      return;
    }
    this.codeInput.text = code;
    this.codeInput.isVisible = true;
    try {
      await navigator.clipboard.writeText(code);
      this.codeStatus.text = "copied! paste it into the seed box on the title screen";
      this.codeStatus.color = UI.green;
    } catch {
      this.codeStatus.text = "clipboard blocked — copy it from the box above";
      this.codeStatus.color = UI.gold;
    }
  }

  get isOpen(): boolean {
    return this.root.isVisible;
  }

  setVisible(visible: boolean, seed = ""): void {
    if (visible) {
      this.seedText.text = `SEED ${seed}`;
    } else {
      // Reset the export row so the next pause starts clean
      this.codeInput.isVisible = false;
      this.codeInput.text = "";
      this.codeStatus.text = "";
    }
    this.root.isVisible = visible;
  }
}
