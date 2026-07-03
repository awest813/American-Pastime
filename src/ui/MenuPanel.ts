import { Control, InputText, Rectangle, type AdvancedDynamicTexture } from "@babylonjs/gui/2D";
import { UI, makeButton, makeStack, makeText } from "./kit";
import { Random } from "../utils/Random";

/** Title screen: seed entry + start. */
export class MenuPanel {
  private root: Rectangle;
  private seedInput: InputText;
  private onStart: (seed: string) => void;

  constructor(adt: AdvancedDynamicTexture, onStart: (seed: string) => void, onCollection?: () => void) {
    this.onStart = onStart;
    this.root = new Rectangle("menuRoot");
    this.root.width = 1;
    this.root.height = 1;
    this.root.background = "rgba(8, 10, 18, 0.82)";
    this.root.thickness = 0;
    adt.addControl(this.root);

    const stack = makeStack();
    stack.width = "960px";
    this.root.addControl(stack);

    const title = makeText("CARDBALL CLASSIC", 72, UI.gold);
    title.fontFamily = UI.mono;
    title.fontWeight = "bold";
    title.shadowColor = "black";
    title.shadowOffsetX = 4;
    title.shadowOffsetY = 4;
    stack.addControl(title);

    const subtitle = makeText("a cursed baseball card engine", 26, UI.cream);
    subtitle.paddingBottom = "26px";
    stack.addControl(subtitle);

    const howTo = makeText(
      "Draw 8 cards. Play up to 5 as one at-bat.\nCombos turn cardboard stats into runs.\nBeat the inning target before your 4 plays run out.\nSurvive 9 innings to take the pennant.\n\nIn game:  H combo book · ESC pause · M mute",
      20,
    );
    howTo.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    howTo.paddingBottom = "30px";
    stack.addControl(howTo);

    this.seedInput = new InputText("seedInput", Random.generateSeed());
    this.seedInput.width = "300px";
    this.seedInput.height = "48px";
    this.seedInput.color = UI.ink;
    this.seedInput.background = UI.cream;
    this.seedInput.focusedBackground = "#ffffff";
    this.seedInput.fontFamily = UI.mono;
    this.seedInput.fontSize = 22;
    stack.addControl(this.seedInput);

    const seedLabel = makeText("run seed — same seed, same season", 16, "#9a917f");
    seedLabel.paddingTop = "6px";
    seedLabel.paddingBottom = "24px";
    stack.addControl(seedLabel);

    const startButton = makeButton("startButton", "PLAY BALL", UI.green, "280px", "64px");
    startButton.fontSize = 28;
    startButton.onPointerUpObservable.add(() => this.submit());
    stack.addControl(startButton);

    if (onCollection) {
      const binderButton = makeButton("binderButton", "CARD BINDER", UI.cream, "280px", "52px");
      binderButton.fontSize = 22;
      binderButton.paddingTop = "14px";
      binderButton.onPointerUpObservable.add(() => onCollection());
      stack.addControl(binderButton);
    }
  }

  setVisible(visible: boolean): void {
    this.root.isVisible = visible;
  }

  get visible(): boolean {
    return this.root.isVisible;
  }

  /** Start the run with the current seed (button click or Enter key). */
  submit(): void {
    this.onStart(this.seedInput.text.trim() || Random.generateSeed());
  }

  randomizeSeed(): void {
    this.seedInput.text = Random.generateSeed();
  }
}
