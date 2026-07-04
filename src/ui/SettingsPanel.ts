import { Control, Rectangle, TextBlock, type AdvancedDynamicTexture, type Button, type StackPanel } from "@babylonjs/gui/2D";
import type { AudioSystem } from "../systems/AudioSystem";
import { SPEED_ORDER, saveSettings, settings, type GameSpeed } from "../systems/Settings";
import { UI, makeButton, makePanel, makeStack, makeText, setButtonBackground } from "./kit";

export interface SettingsCallbacks {
  onClose: () => void;
  /** Fired after any setting changes so the scene can re-apply (speed, volume). */
  onApply: () => void;
}

const VOLUME_STEP = 0.1;
const SPEED_LABELS: Record<GameSpeed, string> = {
  normal: "NORMAL",
  fast: "FAST ×1.6",
  turbo: "TURBO ×2.4",
};

/**
 * The clubhouse settings overlay, opened from the title menu or the pause
 * screen. Renders above every other panel; all changes persist immediately
 * via localStorage and apply live through the onApply callback.
 */
export class SettingsPanel {
  private root: Rectangle;
  private volumeMeter: TextBlock;
  private muteButton: Button;
  private shakeButton: Button;
  private speedButton: Button;
  private callbacks: SettingsCallbacks;

  constructor(adt: AdvancedDynamicTexture, private audio: AudioSystem, callbacks: SettingsCallbacks) {
    this.callbacks = callbacks;
    this.root = new Rectangle("settingsRoot");
    this.root.width = 1;
    this.root.height = 1;
    this.root.background = "rgba(8, 10, 18, 0.82)";
    this.root.thickness = 0;
    this.root.isPointerBlocker = true;
    this.root.isVisible = false;
    adt.addControl(this.root);

    const panel = makePanel("620px", "560px");
    this.root.addControl(panel);

    const stack = makeStack();
    stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    stack.paddingTop = "26px";
    panel.addControl(stack);

    const title = makeText("CLUBHOUSE SETTINGS", 38, UI.gold);
    title.fontFamily = UI.mono;
    title.fontWeight = "bold";
    title.shadowColor = "black";
    title.shadowOffsetX = 3;
    title.shadowOffsetY = 3;
    stack.addControl(title);

    const subtitle = makeText("saved between seasons", 16, "#9a917f");
    subtitle.paddingTop = "4px";
    subtitle.paddingBottom = "26px";
    stack.addControl(subtitle);

    // ── Volume row: [−] meter [+] ──
    const volumeRow = this.makeRow(stack, "CROWD VOLUME");
    const minus = makeButton("volumeDown", "−", UI.cream, "52px", "44px");
    minus.fontSize = 26;
    minus.onPointerUpObservable.add(() => this.nudgeVolume(-VOLUME_STEP));
    volumeRow.addControl(minus);
    this.volumeMeter = makeText("", 20, UI.gold);
    this.volumeMeter.fontFamily = UI.mono;
    this.volumeMeter.resizeToFit = false;
    this.volumeMeter.width = "170px";
    this.volumeMeter.height = "44px";
    this.volumeMeter.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    volumeRow.addControl(this.volumeMeter);
    const plus = makeButton("volumeUp", "+", UI.cream, "52px", "44px");
    plus.fontSize = 26;
    plus.onPointerUpObservable.add(() => this.nudgeVolume(VOLUME_STEP));
    volumeRow.addControl(plus);

    // ── Toggle rows ──
    this.muteButton = this.makeToggleButton(this.makeRow(stack, "SOUND"), "muteToggle", () => {
      this.audio.toggleMute(); // persists + reapplies gain itself
      this.changed(false);
    });

    this.shakeButton = this.makeToggleButton(this.makeRow(stack, "SCREEN SHAKE"), "shakeToggle", () => {
      settings.screenShake = !settings.screenShake;
      this.changed();
    });

    this.speedButton = this.makeToggleButton(this.makeRow(stack, "GAME SPEED"), "speedToggle", () => {
      const next = (SPEED_ORDER.indexOf(settings.speed) + 1) % SPEED_ORDER.length;
      settings.speed = SPEED_ORDER[next];
      this.changed();
    });

    const hint = makeText("M toggles sound anywhere · speed affects animations only", 15, "#9a917f");
    hint.paddingTop = "18px";
    hint.paddingBottom = "16px";
    stack.addControl(hint);

    const back = makeButton("settingsBack", "BACK (ESC)", UI.green, "260px", "56px");
    back.paddingTop = "8px";
    back.onPointerUpObservable.add(() => this.close());
    stack.addControl(back);
  }

  /** A label-left / control-right row inside the settings card. */
  private makeRow(stack: StackPanel, label: string): StackPanel {
    const row = new Rectangle();
    row.width = "540px";
    row.height = "62px";
    row.thickness = 0;
    stack.addControl(row);

    const text = makeText(label, 22);
    text.fontFamily = UI.mono;
    text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    text.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    text.paddingLeft = "8px";
    row.addControl(text);

    const controls = makeStack(false);
    controls.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    controls.height = "52px";
    row.addControl(controls);
    return controls;
  }

  private makeToggleButton(controls: StackPanel, name: string, onToggle: () => void): Button {
    const button = makeButton(name, "", UI.green, "180px", "44px");
    button.fontSize = 18;
    button.onPointerUpObservable.add(onToggle);
    controls.addControl(button);
    return button;
  }

  private nudgeVolume(delta: number): void {
    settings.volume = Math.min(1, Math.max(0, Math.round((settings.volume + delta) * 10) / 10));
    this.changed(); // click doubles as a volume preview
  }

  /** Persist, re-apply to live systems, refresh labels, and confirm audibly. */
  private changed(playClick = true): void {
    saveSettings();
    this.callbacks.onApply();
    this.refresh();
    if (playClick) this.audio.play("click");
  }

  get isOpen(): boolean {
    return this.root.isVisible;
  }

  setVisible(visible: boolean): void {
    if (visible) this.refresh();
    this.root.isVisible = visible;
  }

  close(): void {
    if (!this.isOpen) return;
    this.audio.play("click");
    this.root.isVisible = false;
    this.callbacks.onClose();
  }

  /** Sync every label with the settings store (also called on M-key mute). */
  refresh(): void {
    const steps = Math.round(settings.volume * 10);
    this.volumeMeter.text = `${"▮".repeat(steps)}${"▯".repeat(10 - steps)}`;
    this.volumeMeter.color = settings.muted ? "#9a917f" : UI.gold;

    this.setToggle(this.muteButton, !settings.muted, settings.muted ? "MUTED" : "ON");
    this.setToggle(this.shakeButton, settings.screenShake, settings.screenShake ? "ON" : "OFF");
    this.setToggle(this.speedButton, true, SPEED_LABELS[settings.speed]);
  }

  private setToggle(button: Button, active: boolean, label: string): void {
    const text = button.textBlock;
    if (text) text.text = label;
    setButtonBackground(button, active ? UI.green : "#9a917f");
  }
}
