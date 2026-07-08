import { Control, Rectangle, StackPanel, TextBlock, type AdvancedDynamicTexture, type Button } from "@babylonjs/gui/2D";
import type { RunSystem } from "../systems/RunSystem";
import { RARITY_DISPLAY, type EquipmentCard, type PlayerCard } from "../systems/types";
import { UI, makeButton, makePanel, makeRule, makeStack, makeText, makeTitle } from "./kit";
import { equipmentGlyph } from "./icons";

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

const EQUIPMENT_HINT: Record<string, string> = {
  corked_bat: "+2 Power\n-1 Contact",
  lucky_cleats: "+2 Speed\nto every played card.",
  pine_tar_rag: "First card gets\nx1.5 Contact.",
  old_glove: "Half total Defense\nadds to base score.",
  rally_cap: "+3 base while\nbehind the target.",
  shin_guards: "Ignore pitch\nstat penalties.",
  foam_finger: "Team Chemistry\nneeds only 2.",
  bubblegum: "Rookies get +1\nto every stat.\nSmells like 1987.",
  weighted_donut: "Power Swing bonus\nis doubled.",
  scorekeepers_pencil: "+1 quality for every\ncombo you land.",
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
    this.root.background = UI.overlayBg;
    this.root.thickness = 0;
    adt.addControl(this.root);

    const panel = makePanel("900px", "830px");
    this.root.addControl(panel);

    const stack = makeStack();
    stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    stack.paddingTop = "22px";
    panel.addControl(stack);

    const title = makeTitle("CLUBHOUSE SHOP", 38);
    stack.addControl(title);

    this.cashText = makeText("", 24, UI.green);
    this.cashText.fontFamily = UI.mono;
    stack.addControl(this.cashText);
    const rule = makeRule("620px");
    rule.paddingTop = "4px";
    rule.paddingBottom = "10px";
    stack.addControl(rule);

    this.ownedText = makeText("", 16, UI.muted);
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
    this.upgradeRow.height = "186px";
    this.upgradeRow.paddingTop = "8px";
    stack.addControl(this.upgradeRow);

    const buttonRow = makeStack(false);
    buttonRow.paddingTop = "10px";
    buttonRow.height = "68px";
    stack.addControl(buttonRow);
    this.rerollButton = makeButton("rerollButton", "REROLL  $1", UI.cream, "200px");
    this.rerollButton.onPointerUpObservable.add(() => this.callbacks.onReroll());
    buttonRow.addControl(this.rerollButton);
    const gap = new Rectangle();
    gap.width = "24px";
    gap.thickness = 0;
    buttonRow.addControl(gap);
    const next = makeButton("continueButton", "NEXT INNING", UI.green, "240px");
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
        : `Owned: ${run.equipment.map((e) => `${equipmentGlyph(e.id)} ${e.name}`).join("  ·  ")}`;
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

    const panel = makePanel("266px", "176px");
    panel.background = UI.field;
    panel.paddingLeft = "8px";
    panel.paddingRight = "8px";

    const stack = makeStack();
    stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    stack.paddingTop = "10px";
    panel.addControl(stack);

    const shortName = card.name.length > 24 ? `${card.name.slice(0, 23)}…` : card.name;
    const name = makeText(shortName, 17, UI.cream);
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

    const gainText = makeText(gains || "at the stat cap", 15, UI.muted);
    gainText.paddingBottom = "8px";
    stack.addControl(gainText);

    const affordable = run.cash >= cost;
    const button = makeButton(`upgrade-${card.id}`, `UPGRADE  $${cost}`, affordable ? UI.gold : UI.muted, "180px", "42px");
    button.fontSize = 18;
    button.isEnabled = affordable;
    button.onPointerUpObservable.add(() => this.callbacks.onUpgrade(card));
    stack.addControl(button);

    return panel;
  }

  private makeOfferCard(offer: EquipmentCard, run: RunSystem): Rectangle {
    const card = makePanel("260px", "290px");
    card.background = UI.card;
    card.color = UI.panelBorder;
    card.paddingLeft = "8px";
    card.paddingRight = "8px";

    const icon = makeText(equipmentGlyph(offer.id), 36);
    icon.height = "44px";
    icon.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    icon.top = "12px";
    card.addControl(icon);

    const name = makeText(offer.name, 18, UI.gold);
    name.fontWeight = "bold";
    name.textWrapping = true;
    name.resizeToFit = false;
    name.width = "220px";
    name.height = "52px";
    name.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    name.top = "58px";
    name.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    name.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    card.addControl(name);

    const desc = makeText(EQUIPMENT_HINT[offer.id] ?? offer.description, 16);
    desc.textWrapping = true;
    desc.resizeToFit = false;
    desc.width = "214px";
    desc.height = "104px";
    desc.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    desc.top = "116px";
    desc.lineSpacing = "2px";
    desc.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    desc.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    card.addControl(desc);

    const affordable = run.cash >= offer.price && run.equipment.length < 5;
    const buy = makeButton(`buy-${offer.id}`, `BUY  $${offer.price}`, affordable ? UI.green : UI.muted, "180px", "46px");
    buy.isEnabled = affordable;
    buy.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    buy.top = "-16px";
    buy.onPointerUpObservable.add(() => this.callbacks.onBuy(offer));
    card.addControl(buy);

    return card;
  }

  setVisible(visible: boolean): void {
    this.root.isVisible = visible;
  }
}
