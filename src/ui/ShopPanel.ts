import { Control, Rectangle, StackPanel, TextBlock, type AdvancedDynamicTexture } from "@babylonjs/gui/2D";
import type { RunSystem } from "../systems/RunSystem";
import type { EquipmentCard } from "../systems/types";
import { UI, makeButton, makePanel, makeStack, makeText } from "./kit";

export interface ShopCallbacks {
  onBuy: (offer: EquipmentCard) => void;
  onReroll: () => void;
  onContinue: () => void;
}

/** Between-innings clubhouse shop: three equipment offers, reroll, continue. */
export class ShopPanel {
  private root: Rectangle;
  private cashText: TextBlock;
  private offersRow: StackPanel;

  constructor(adt: AdvancedDynamicTexture, private callbacks: ShopCallbacks) {
    this.root = new Rectangle("shopRoot");
    this.root.width = 1;
    this.root.height = 1;
    this.root.background = "rgba(8, 10, 18, 0.78)";
    this.root.thickness = 0;
    adt.addControl(this.root);

    const panel = makePanel("880px", "560px");
    this.root.addControl(panel);

    const stack = makeStack();
    stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    stack.paddingTop = "22px";
    panel.addControl(stack);

    const title = makeText("CLUBHOUSE SHOP", 40, UI.gold);
    title.fontFamily = UI.mono;
    title.fontWeight = "bold";
    stack.addControl(title);

    this.cashText = makeText("", 24, UI.green);
    this.cashText.fontFamily = UI.mono;
    this.cashText.paddingBottom = "18px";
    stack.addControl(this.cashText);

    this.offersRow = makeStack(false);
    this.offersRow.height = "300px";
    stack.addControl(this.offersRow);

    const buttonRow = makeStack(false);
    buttonRow.paddingTop = "22px";
    buttonRow.height = "84px";
    stack.addControl(buttonRow);
    const reroll = makeButton("rerollButton", "REROLL  $1", UI.cream, "200px");
    reroll.onPointerUpObservable.add(() => this.callbacks.onReroll());
    buttonRow.addControl(reroll);
    const gap = new Rectangle();
    gap.width = "24px";
    gap.thickness = 0;
    buttonRow.addControl(gap);
    const next = makeButton("continueButton", "NEXT INNING ▸", UI.green, "240px");
    next.onPointerUpObservable.add(() => this.callbacks.onContinue());
    buttonRow.addControl(next);
  }

  refresh(run: RunSystem): void {
    this.cashText.text = `CASH: $${run.cash}   ·   EQUIPMENT ${run.equipment.length}/5`;
    this.offersRow.clearControls();
    if (run.shopOffers.length === 0) {
      const soldOut = makeText("Sold out. The clubhouse kid shrugs.", 22);
      this.offersRow.addControl(soldOut);
      return;
    }
    for (const offer of run.shopOffers) {
      this.offersRow.addControl(this.makeOfferCard(offer, run));
    }
  }

  private makeOfferCard(offer: EquipmentCard, run: RunSystem): Rectangle {
    const card = makePanel("260px", "290px");
    card.background = "#241f18";
    card.color = UI.panelBorder;
    card.paddingLeft = "8px";
    card.paddingRight = "8px";

    const stack = makeStack();
    stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    stack.paddingTop = "14px";
    card.addControl(stack);

    const name = makeText(offer.name, 22, UI.gold);
    name.fontWeight = "bold";
    name.textWrapping = true;
    name.resizeToFit = false;
    name.width = "230px";
    name.height = "58px";
    stack.addControl(name);

    const desc = makeText(offer.description, 16);
    desc.textWrapping = true;
    desc.resizeToFit = false;
    desc.width = "230px";
    desc.height = "120px";
    stack.addControl(desc);

    const affordable = run.cash >= offer.price && run.equipment.length < 5;
    const buy = makeButton(`buy-${offer.id}`, `BUY  $${offer.price}`, affordable ? UI.green : "#777264", "180px", "46px");
    buy.isEnabled = affordable;
    buy.onPointerUpObservable.add(() => this.callbacks.onBuy(offer));
    stack.addControl(buy);

    return card;
  }

  setVisible(visible: boolean): void {
    this.root.isVisible = visible;
  }
}
