import { Control, Rectangle, StackPanel, TextBlock, type AdvancedDynamicTexture, type Button } from "@babylonjs/gui/2D";
import type { RunSystem } from "../systems/RunSystem";
import { RARITY_DISPLAY, type EquipmentCard, type PlayerCard } from "../systems/types";
import { UI, makeButton, makePanel, makeStack, makeText } from "./kit";

export interface ShopCallbacks {
  onBuy: (offer: EquipmentCard) => void;
  onUpgrade: (card: PlayerCard) => void;
  onReroll: () => void;
  onContinue: () => void;
}

const STAT_SHORT: Record<string, string> = {
  power: "PWR",
  contact: "CON",
  speed: "SPD",
  discipline: "DIS",
  defense: "DEF",
};

/** Between-innings clubhouse shop: three equipment offers, reroll, continue. */
export class ShopPanel {
  private root: Rectangle;
  private cashText: TextBlock;
  private ownedText: TextBlock;
  private offersRow: StackPanel;
  private upgradeRow: StackPanel;
  private rerollButton: Button;

  constructor(adt: AdvancedDynamicTexture, private callbacks: ShopCallbacks) {
    this.root = new Rectangle("shopRoot");
    this.root.width = 1;
    this.root.height = 1;
    this.root.background = "rgba(8, 10, 18, 0.78)";
    this.root.thickness = 0;
    adt.addControl(this.root);

    const panel = makePanel("880px", "740px");
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
    stack.addControl(this.cashText);

    this.ownedText = makeText("", 16, "#9a917f");
    this.ownedText.textWrapping = true;
    this.ownedText.resizeToFit = false;
    this.ownedText.width = "800px";
    this.ownedText.height = "40px";
    this.ownedText.paddingBottom = "8px";
    stack.addControl(this.ownedText);

    this.offersRow = makeStack(false);
    this.offersRow.height = "300px";
    stack.addControl(this.offersRow);

    const upgradeTitle = makeText("UPGRADE A PLAYER", 22, UI.gold);
    upgradeTitle.fontFamily = UI.mono;
    upgradeTitle.paddingTop = "14px";
    stack.addControl(upgradeTitle);

    this.upgradeRow = makeStack(false);
    this.upgradeRow.height = "170px";
    this.upgradeRow.paddingTop = "8px";
    stack.addControl(this.upgradeRow);

    const buttonRow = makeStack(false);
    buttonRow.paddingTop = "16px";
    buttonRow.height = "78px";
    stack.addControl(buttonRow);
    this.rerollButton = makeButton("rerollButton", "REROLL  $1", UI.cream, "200px");
    this.rerollButton.onPointerUpObservable.add(() => this.callbacks.onReroll());
    buttonRow.addControl(this.rerollButton);
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
    const canReroll = run.cash >= 1;
    this.rerollButton.isEnabled = canReroll;
    this.rerollButton.alpha = canReroll ? 1 : 0.5;
    this.ownedText.text =
      run.equipment.length === 0
        ? "Owned: nothing yet — your first piece of gear changes everything."
        : `Owned: ${run.equipment.map((e) => e.name).join(" · ")}`;
    this.offersRow.clearControls();
    if (run.shopOffers.length === 0) {
      const soldOut = makeText("Sold out. The clubhouse kid shrugs.", 22);
      this.offersRow.addControl(soldOut);
    } else {
      for (const offer of run.shopOffers) {
        this.offersRow.addControl(this.makeOfferCard(offer, run));
      }
    }

    this.upgradeRow.clearControls();
    if (run.upgradeCandidates.length === 0) {
      const done = makeText("The whole roster is legendary. Nothing left to teach.", 18);
      this.upgradeRow.addControl(done);
    } else {
      for (const card of run.upgradeCandidates) {
        this.upgradeRow.addControl(this.makeUpgradeCard(card, run));
      }
    }
  }

  private makeUpgradeCard(card: PlayerCard, run: RunSystem): Rectangle {
    const next = run.nextRarity(card);
    const cost = run.upgradeCost(card) ?? 0;
    const gains = run.upgradeStatTargets(card).map((s) => `+1 ${STAT_SHORT[s]}`).join(" · ");

    const panel = makePanel("266px", "160px");
    panel.background = "#1d2418";
    panel.paddingLeft = "8px";
    panel.paddingRight = "8px";

    const stack = makeStack();
    stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    stack.paddingTop = "10px";
    panel.addControl(stack);

    const name = makeText(card.name, 18, UI.cream);
    name.fontWeight = "bold";
    name.textWrapping = false;
    name.resizeToFit = false;
    name.width = "240px";
    name.height = "24px";
    stack.addControl(name);

    const path = makeText(
      `${card.position} · ${RARITY_DISPLAY[card.rarity]} → ${next ? RARITY_DISPLAY[next] : "—"}`,
      15,
      UI.green,
    );
    stack.addControl(path);

    const gainText = makeText(gains || "at the stat cap", 15, "#9a917f");
    gainText.paddingBottom = "8px";
    stack.addControl(gainText);

    const affordable = run.cash >= cost;
    const button = makeButton(`upgrade-${card.id}`, `UPGRADE  $${cost}`, affordable ? UI.gold : "#777264", "180px", "42px");
    button.fontSize = 18;
    button.isEnabled = affordable;
    button.onPointerUpObservable.add(() => this.callbacks.onUpgrade(card));
    stack.addControl(button);

    return panel;
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
