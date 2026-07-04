import { Button, Control, Rectangle, StackPanel, TextBlock } from "@babylonjs/gui/2D";

/** Shared palette so every panel reads like the same vintage scoreboard. */
export const UI = {
  cream: "#f4ecd8",
  gold: "#ffd257",
  green: "#7fd4a0",
  red: "#e07a6a",
  ink: "#1c1a16",
  panelBg: "rgba(16, 20, 24, 0.88)",
  panelBorder: "#5a5245",
  serif: "Georgia",
  mono: "Courier New",
} as const;

export function makePanel(width: string | number, height: string | number): Rectangle {
  const panel = new Rectangle();
  panel.width = width;
  panel.height = height;
  panel.background = UI.panelBg;
  panel.color = UI.panelBorder;
  panel.thickness = 2;
  panel.cornerRadius = 10;
  return panel;
}

export function makeText(text: string, size: number, color: string = UI.cream): TextBlock {
  const block = new TextBlock();
  block.text = text;
  block.fontSize = size;
  block.color = color;
  block.fontFamily = UI.serif;
  block.resizeToFit = true;
  return block;
}

/** Blend a #rrggbb color toward white; non-hex inputs pass through untouched. */
function brighten(color: string, amount: number): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  const channel = (offset: number) => {
    const value = parseInt(color.slice(offset, offset + 2), 16);
    return Math.round(value + (255 - value) * amount)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}

export function makeButton(name: string, label: string, background: string, width = "220px", height = "52px"): Button {
  const button = Button.CreateSimpleButton(name, label);
  button.width = width;
  button.height = height;
  button.color = UI.ink;
  button.background = background;
  button.cornerRadius = 8;
  button.thickness = 0;
  button.fontFamily = UI.serif;
  button.fontSize = 22;
  button.fontWeight = "bold";
  button.paddingTop = "4px";
  button.paddingBottom = "4px";
  // Hover feedback: brighten toward white, restore the current base on leave.
  // The base lives in metadata so setButtonBackground can restyle live buttons.
  button.metadata = { baseBackground: background };
  button.hoverCursor = "pointer";
  button.pointerEnterAnimation = () => {
    button.background = brighten((button.metadata as { baseBackground: string }).baseBackground, 0.25);
  };
  button.pointerOutAnimation = () => {
    button.background = (button.metadata as { baseBackground: string }).baseBackground;
  };
  return button;
}

/** Restyle a kit button (e.g. toggle state) without breaking hover restore. */
export function setButtonBackground(button: Button, background: string): void {
  button.metadata = { baseBackground: background };
  button.background = background;
}

export function makeStack(vertical = true): StackPanel {
  const stack = new StackPanel();
  stack.isVertical = vertical;
  return stack;
}

export function topLeft(control: Control): void {
  control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  control.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
}

export function topRight(control: Control): void {
  control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  control.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
}

export function bottomCenter(control: Control): void {
  control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  control.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
}

export function bottomLeft(control: Control): void {
  control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  control.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
}
