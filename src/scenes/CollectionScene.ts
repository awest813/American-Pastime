import { Control, Rectangle, TextBlock, type AdvancedDynamicTexture, type Button } from "@babylonjs/gui/2D";
import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";

import { Card3D } from "../entities/Card3D";
import type { AudioSystem } from "../systems/AudioSystem";
import type { PlayerCard } from "../systems/types";
import { UI, makeButton, makePanel, makeStack, makeText, bottomCenter } from "../ui/kit";
import { Tweens } from "../utils/Tweens";

const PAGE_SIZE = 10; // 5 columns x 2 rows, a binder page
const COLUMNS = 5;
const TILT = 0.72; // same screen-facing tilt as the hand fan

/**
 * The card binder: every player card laid out on a tilted "page" facing the
 * camera, with cycling filters (team / position / era / rarity / trait),
 * pagination, and click-to-inspect. Opened from the title screen; it is both
 * a dev preview tool and a player-facing collection browser.
 *
 * Card meshes are created once on first open and toggled with setEnabled,
 * so reopening the binder costs nothing.
 */
export class CollectionScene {
  private cards: Card3D[] = [];
  private isOpen = false;
  private page = 0;
  private focused: Card3D | null = null;
  private hovered: Card3D | null = null;

  private filterValues: Record<string, string[]>;
  private filterIndex: Record<string, number> = { team: 0, position: 0, era: 0, rarity: 0, trait: 0 };
  private filterButtons: Record<string, Button> = {};

  private root: Rectangle;
  private countText: TextBlock;
  private pageText: TextBlock;
  private emptyText: TextBlock;

  // Grid basis: cards live on a plane tilted toward the fixed camera.
  private planeUp = new Vector3(0, Math.cos(TILT), Math.sin(TILT));
  private planeOrigin = new Vector3(0, 2.7, -1.1);

  constructor(
    private scene: Scene,
    adt: AdvancedDynamicTexture,
    private tweens: Tweens,
    private audio: AudioSystem,
    private players: PlayerCard[],
    private onClose: () => void,
  ) {
    const unique = (values: string[]) => [...new Set(values)];
    const positionOrder = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"];
    this.filterValues = {
      team: ["ALL", ...unique(players.map((p) => p.team)).sort()],
      position: ["ALL", ...positionOrder.filter((pos) => players.some((p) => p.position === pos))],
      era: ["ALL", ...unique(players.map((p) => p.era))],
      rarity: ["ALL", ...unique(players.map((p) => p.rarity))],
      trait: ["ALL", "WITH", "WITHOUT"],
    };

    this.root = this.buildGui(adt);
    this.bindInput();
  }

  private buildGui(adt: AdvancedDynamicTexture): Rectangle {
    const root = new Rectangle("collectionRoot");
    root.width = 1;
    root.height = 1;
    root.thickness = 0;
    root.isPointerBlocker = false;
    root.isVisible = false;
    adt.addControl(root);

    // Top filter bar
    const bar = makePanel("1240px", "76px");
    bar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    bar.top = "12px";
    root.addControl(bar);
    const barStack = makeStack(false);
    bar.addControl(barStack);

    const title = makeText("CARD BINDER", 24, UI.gold);
    title.fontFamily = UI.mono;
    title.fontWeight = "bold";
    title.paddingRight = "18px";
    barStack.addControl(title);

    for (const key of ["team", "position", "era", "rarity", "trait"]) {
      const button = makeButton(`filter-${key}`, "", UI.cream, key === "team" ? "260px" : "150px", "44px");
      button.fontSize = 16;
      button.onPointerUpObservable.add(() => this.cycleFilter(key));
      button.paddingLeft = "6px";
      barStack.addControl(button);
      this.filterButtons[key] = button;
    }

    this.countText = makeText("", 18, UI.green);
    this.countText.fontFamily = UI.mono;
    this.countText.paddingLeft = "16px";
    barStack.addControl(this.countText);

    // Bottom bar: pagination + back
    const bottomBar = makeStack(false);
    bottomCenter(bottomBar);
    bottomBar.top = "-14px";
    bottomBar.height = "56px";
    root.addControl(bottomBar);

    const prev = makeButton("pagePrev", "◂", UI.cream, "64px", "48px");
    prev.onPointerUpObservable.add(() => this.turnPage(-1));
    bottomBar.addControl(prev);

    this.pageText = makeText("PAGE 1/1", 20);
    this.pageText.fontFamily = UI.mono;
    this.pageText.paddingLeft = "18px";
    this.pageText.paddingRight = "18px";
    bottomBar.addControl(this.pageText);

    const next = makeButton("pageNext", "▸", UI.cream, "64px", "48px");
    next.onPointerUpObservable.add(() => this.turnPage(1));
    bottomBar.addControl(next);

    const gap = new Rectangle();
    gap.width = "40px";
    gap.thickness = 0;
    bottomBar.addControl(gap);

    const back = makeButton("binderBack", "BACK (ESC)", UI.red, "170px", "48px");
    back.onPointerUpObservable.add(() => this.close());
    bottomBar.addControl(back);

    this.emptyText = makeText("No cards match those filters.", 26);
    this.emptyText.isVisible = false;
    root.addControl(this.emptyText);

    const hint = makeText("click a card to inspect · arrows flip pages", 15, "#9a917f");
    bottomCenter(hint);
    hint.top = "-72px";
    root.addControl(hint);

    return root;
  }

  open(): void {
    if (this.cards.length === 0) {
      this.cards = this.players.map((p) => {
        const card = new Card3D(this.scene, p);
        card.mesh.setEnabled(false);
        return card;
      });
    }
    this.isOpen = true;
    this.page = 0;
    this.root.isVisible = true;
    this.refresh();
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.focused = null;
    this.hovered = null;
    this.root.isVisible = false;
    for (const card of this.cards) card.mesh.setEnabled(false);
    this.audio.play("click");
    this.onClose();
  }

  private cycleFilter(key: string): void {
    const values = this.filterValues[key];
    this.filterIndex[key] = (this.filterIndex[key] + 1) % values.length;
    this.page = 0;
    this.audio.play("click");
    this.refresh();
  }

  private filtered(): PlayerCard[] {
    const pick = (key: string) => this.filterValues[key][this.filterIndex[key]];
    const [team, position, era, rarity, trait] = [pick("team"), pick("position"), pick("era"), pick("rarity"), pick("trait")];
    return this.players.filter((p) => {
      if (team !== "ALL" && p.team !== team) return false;
      if (position !== "ALL" && p.position !== position) return false;
      if (era !== "ALL" && p.era !== era) return false;
      if (rarity !== "ALL" && p.rarity !== rarity) return false;
      if (trait === "WITH" && !p.trait) return false;
      if (trait === "WITHOUT" && p.trait) return false;
      return true;
    });
  }

  private turnPage(direction: number): void {
    const pageCount = Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE));
    const next = this.page + direction;
    if (next < 0 || next >= pageCount) return;
    this.page = next;
    this.audio.play("deal");
    this.refresh();
  }

  private slotPosition(index: number): Vector3 {
    const col = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    const dx = (col - (COLUMNS - 1) / 2) * 1.78;
    const dy = (0.5 - row) * 2.4;
    return this.planeOrigin.add(new Vector3(dx, 0, 0)).add(this.planeUp.scale(dy));
  }

  private refresh(): void {
    const matches = this.filtered();
    const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
    this.page = Math.min(this.page, pageCount - 1);
    const visible = matches.slice(this.page * PAGE_SIZE, (this.page + 1) * PAGE_SIZE);
    const visibleIds = new Set(visible.map((p) => p.id));

    this.focused = null;
    this.hovered = null;
    let slot = 0;
    for (const card of this.cards) {
      card.setSelected(false);
      if (!visibleIds.has(card.card.id)) {
        card.mesh.setEnabled(false);
        continue;
      }
      const target = this.slotPosition(slot);
      card.homePosition = target;
      card.homeRotation = new Vector3(TILT, 0, 0);
      card.mesh.setEnabled(true);
      card.applyRestPose();
      // Little pop-in, staggered across the page
      card.mesh.scaling.setAll(0.5);
      const delay = slot * 26;
      void this.tweens.delay(delay).then(() =>
        this.tweens.animate(180, (t) => card.mesh.scaling.setAll(0.5 + 0.5 * t)),
      );
      slot++;
    }

    for (const key of Object.keys(this.filterButtons)) {
      const label = this.filterButtons[key].textBlock;
      if (label) label.text = `${key.toUpperCase()}: ${this.filterValues[key][this.filterIndex[key]]}`;
    }
    this.countText.text = `${matches.length} CARD${matches.length === 1 ? "" : "S"}`;
    this.pageText.text = `PAGE ${this.page + 1}/${pageCount}`;
    this.emptyText.isVisible = matches.length === 0;
  }

  private setFocus(card: Card3D | null): void {
    if (this.focused === card) card = null; // clicking the focused card puts it back
    if (this.focused) {
      const previous = this.focused;
      previous.applyRestPose();
      void this.tweens.animate(160, (t) => previous.mesh.scaling.setAll(1.6 - 0.6 * t));
    }
    this.focused = card;
    if (card) {
      this.audio.play("select");
      // Pull the card off the page toward the camera, front and center.
      const normal = new Vector3(0, Math.sin(TILT), -Math.cos(TILT));
      const target = this.planeOrigin.add(normal.scale(3.2)).add(this.planeUp.scale(-0.4));
      void this.tweens.moveTo(card.mesh, target, 200);
      void this.tweens.animate(200, (t) => card.mesh.scaling.setAll(1 + 0.6 * t));
    }
  }

  private cardFromPick(): Card3D | null {
    const picked = this.scene.pick(
      this.scene.pointerX,
      this.scene.pointerY,
      (m) => m.isEnabled() && m.name.startsWith("card-"),
    );
    const name = picked?.pickedMesh?.name;
    if (!name) return null;
    return this.cards.find((c) => c.mesh.name === name) ?? null;
  }

  private bindInput(): void {
    this.scene.onPointerObservable.add((info) => {
      if (!this.isOpen) return;
      if (info.type === PointerEventTypes.POINTERTAP) {
        this.setFocus(this.cardFromPick());
      } else if (info.type === PointerEventTypes.POINTERMOVE) {
        const card = this.cardFromPick();
        if (card !== this.hovered) {
          if (this.hovered !== this.focused) this.hovered?.setHovered(false);
          if (card !== this.focused) card?.setHovered(true);
          this.hovered = card;
        }
      }
    });

    this.scene.onKeyboardObservable.add((info) => {
      if (!this.isOpen || info.type !== KeyboardEventTypes.KEYDOWN) return;
      switch (info.event.key) {
        case "Escape":
          this.close();
          break;
        case "ArrowLeft":
          this.turnPage(-1);
          break;
        case "ArrowRight":
          this.turnPage(1);
          break;
      }
    });
  }
}
