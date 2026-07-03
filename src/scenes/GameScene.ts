import "@babylonjs/core/Culling/ray"; // side-effect: enables scene.pick for card selection
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D";
import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";

import { BaseballToken } from "../entities/BaseballToken";
import { Card3D } from "../entities/Card3D";
import { TableWorld } from "../entities/TableWorld";
import { ComboSystem } from "../systems/ComboSystem";
import { DeckSystem } from "../systems/DeckSystem";
import { RULES, RunSystem } from "../systems/RunSystem";
import { ScoreSystem, type ScoreContext } from "../systems/ScoreSystem";
import type { PlayerCard, ScoreResult } from "../systems/types";
import { DebugPanel } from "../ui/DebugPanel";
import { EndPanel } from "../ui/EndPanel";
import { GameHud } from "../ui/GameHud";
import { MenuPanel } from "../ui/MenuPanel";
import { ShopPanel } from "../ui/ShopPanel";
import { UI } from "../ui/kit";
import { Tweens, easeOutBack } from "../utils/Tweens";

const HAND_Y = 2.1;
const HAND_Z = -3.7;
const HAND_SPACING = 1.5;
const HAND_TILT = 0.72; // face the fixed broadcast camera
const DECK_SPAWN = new Vector3(-9, 1.5, -4.3);
const DUGOUT = new Vector3(9.5, 0.4, -3.5);

/**
 * The main game orchestrator: owns the 3D world, the run/deck/score systems,
 * and the GUI panels, and drives the inning loop:
 * deal → select → preview → play/discard → win or bust → shop → next inning.
 */
export class GameScene {
  private world: TableWorld;
  private tweens: Tweens;
  private run = new RunSystem();
  private deck: DeckSystem;
  private combos = new ComboSystem();
  private score = new ScoreSystem(this.combos);

  private hud: GameHud;
  private menu: MenuPanel;
  private shop: ShopPanel;
  private end: EndPanel;
  private debug: DebugPanel;

  private hand: Card3D[] = [];
  /** Selection in click order — order matters for "first card" effects. */
  private selection: Card3D[] = [];
  private hovered: Card3D | null = null;
  private busy = false;
  private lastSeed = "";

  private constructor(private scene: Scene, canvas: HTMLCanvasElement, adt: AdvancedDynamicTexture) {
    this.world = new TableWorld(scene, canvas);
    this.tweens = new Tweens(scene);
    this.deck = new DeckSystem(this.run.rng);

    this.hud = new GameHud(adt, {
      onPlay: () => void this.playSelection(),
      onDiscard: () => void this.discardSelection(),
    });
    this.hud.setVisible(false);
    this.shop = new ShopPanel(adt, {
      onBuy: (offer) => {
        if (this.run.buyEquipment(offer)) this.shop.refresh(this.run);
      },
      onReroll: () => {
        if (this.run.rerollShop()) this.shop.refresh(this.run);
      },
      onContinue: () => this.nextInning(),
    });
    this.shop.setVisible(false);
    this.end = new EndPanel(adt, {
      onNewRun: () => this.startRun(),
      onRetrySeed: () => this.startRun(this.lastSeed),
    });
    this.end.setVisible(false);
    this.debug = new DebugPanel(adt, {
      onGiveCash: () => {
        this.run.cash += 10;
        this.refreshHud();
      },
      onWinInning: () => this.cheatWinInning(),
      onRedeal: () => void this.restartInning(),
    });
    this.menu = new MenuPanel(adt, (seed) => this.startRun(seed));

    this.bindPointer();
    this.bindHotkeys();

    if (import.meta.env.DEV) {
      // Dev sugar: poke the game from the console (window.__cardball).
      (window as unknown as Record<string, unknown>).__cardball = this;
    }
  }

  static async create(scene: Scene, canvas: HTMLCanvasElement): Promise<GameScene> {
    if (scene.getEngine().name === "WebGPU") {
      await import("@babylonjs/core/Engines/WebGPU/Extensions/engine.dynamicTexture");
    }
    const adt = AdvancedDynamicTexture.CreateFullscreenUI("gameUI", true, scene);
    adt.idealWidth = 1600;
    return new GameScene(scene, canvas, adt);
  }

  // ── Run flow ────────────────────────────────────────────────────────────

  private startRun(seed?: string): void {
    this.menu.setVisible(false);
    this.end.setVisible(false);
    this.shop.setVisible(false);
    this.run.startRun(seed);
    this.lastSeed = this.run.rng.seed;
    this.deck = new DeckSystem(this.run.rng);
    this.deck.reset(this.run.players);
    this.hud.setVisible(true);
    void this.beginInning();
  }

  private async beginInning(): Promise<void> {
    this.clearHand();
    this.refreshHud();
    this.world.updateScoreboard(`INNING ${this.run.inning}`, `0 / ${this.run.target}`, this.run.pitch.name.toUpperCase());
    await this.refillHand();
    this.refreshPreview();
  }

  private nextInning(): void {
    this.shop.setVisible(false);
    this.run.nextInning();
    void this.beginInning();
  }

  private async restartInning(): Promise<void> {
    if (this.run.phase !== "inning" || this.busy) return;
    this.run.startInning();
    await this.beginInning();
  }

  private endRun(victory: boolean): void {
    this.hud.setVisible(false);
    this.end.show(
      victory,
      victory
        ? `Nine innings survived. The cardboard engine hums.\nSeed ${this.lastSeed} · $${this.run.cash} left over`
        : `Struck out in inning ${this.run.inning}: ${this.run.runs} of ${this.run.target} runs.\nSeed ${this.lastSeed}`,
    );
  }

  // ── Hand management ─────────────────────────────────────────────────────

  private clearHand(): void {
    for (const card of this.hand) card.dispose();
    this.hand = [];
    this.selection = [];
    this.hovered = null;
  }

  private async refillHand(): Promise<void> {
    const need = RULES.handSize - this.hand.length;
    if (need <= 0) return;
    const drawn = this.deck.draw(need);
    const newCards = drawn.map((card) => {
      const card3d = new Card3D(this.scene, card);
      card3d.mesh.position.copyFrom(DECK_SPAWN);
      card3d.mesh.rotation.set(HAND_TILT, 0, 0);
      return card3d;
    });
    this.hand.push(...newCards);
    this.layoutHand();
    // Deal with a stagger; new cards fly in from the deck spot.
    const deals = newCards.map((card3d, i) =>
      this.tweens
        .delay(i * 90)
        .then(() => this.tweens.moveTo(card3d.mesh, card3d.homePosition.clone(), 320, easeOutBack)),
    );
    await Promise.all(deals);
    for (const card of this.hand) card.applyRestPose();
    this.refreshHud();
  }

  /** Recompute the hand fan; existing cards glide to their new slots. */
  private layoutHand(): void {
    const n = this.hand.length;
    this.hand.forEach((card3d, i) => {
      const x = (i - (n - 1) / 2) * HAND_SPACING;
      card3d.homePosition = new Vector3(x, HAND_Y, HAND_Z - Math.abs(x) * 0.08);
      card3d.homeRotation = new Vector3(HAND_TILT, x * 0.02, 0);
      void this.tweens.moveTo(card3d.mesh, card3d.homePosition.add(new Vector3(0, card3d.selected ? 0.55 : 0, 0)), 220);
      card3d.mesh.rotation.copyFrom(card3d.homeRotation);
    });
  }

  private toggleSelect(card3d: Card3D): void {
    if (this.busy || this.run.phase !== "inning") return;
    if (card3d.selected) {
      card3d.setSelected(false);
      this.selection = this.selection.filter((c) => c !== card3d);
    } else {
      if (this.selection.length >= RULES.maxCardsPerPlay) return;
      card3d.setSelected(true);
      this.selection.push(card3d);
    }
    this.refreshPreview();
  }

  // ── Scoring actions ─────────────────────────────────────────────────────

  private scoreContext(): ScoreContext {
    return {
      pitch: this.run.pitch,
      stadium: this.run.stadium,
      equipment: this.run.equipment,
      runsSoFar: this.run.runs,
      target: this.run.target,
    };
  }

  private previewResult(): ScoreResult | null {
    if (this.selection.length === 0) return null;
    return this.score.evaluate(this.selection.map((c) => c.card), this.scoreContext());
  }

  private async playSelection(): Promise<void> {
    if (this.busy || this.run.phase !== "inning" || this.run.playsLeft <= 0 || this.selection.length === 0) return;
    this.busy = true;
    this.hud.setButtonsEnabled(false, false);

    const played = this.selection;
    const playedCards = played.map((c) => c.card);
    const result = this.score.evaluate(playedCards, this.scoreContext());

    // Cards stride out to the diamond and lie flat.
    this.hand = this.hand.filter((c) => !played.includes(c));
    this.selection = [];
    const flights = played.map((card3d, i) => {
      const slot = new Vector3((i - (played.length - 1) / 2) * 1.7, 0.06 + i * 0.005, 1.6);
      return this.tweens.delay(i * 110).then(async () => {
        void this.tweens.animate(300, (t) => {
          card3d.mesh.rotation.x = HAND_TILT + (Math.PI / 2 - HAND_TILT) * t;
        });
        await this.tweens.moveTo(card3d.mesh, slot, 340);
      });
    });
    await Promise.all(flights);

    for (const combo of result.combos.slice(0, 3)) {
      await this.hud.showPopup(`${combo.name.toUpperCase()}!`, UI.cream, 620);
    }
    BaseballToken.launch(this.scene, result.runs >= 14);
    await this.hud.showPopup(`+${result.runs} RUNS!`, UI.gold, 1000);

    this.run.recordPlay(result.runs);
    this.world.updateScoreboard(
      `INNING ${this.run.inning}`,
      `${this.run.runs} / ${this.run.target}`,
      this.run.pitch.name.toUpperCase(),
    );

    await this.tweens.delay(350);
    for (const card3d of played) card3d.dispose();
    this.deck.discard(playedCards);

    this.busy = false;
    this.refreshHud();
    this.refreshPreview();

    if (this.run.inningWon) {
      await this.winInning();
    } else if (this.run.inningLost) {
      this.run.phase = "gameOver";
      await this.hud.showPopup("STRUCK OUT…", UI.red, 1100);
      this.endRun(false);
    } else {
      await this.refillHand();
    }
  }

  private async discardSelection(): Promise<void> {
    if (this.busy || this.run.phase !== "inning" || this.run.discardsLeft <= 0 || this.selection.length === 0) return;
    this.busy = true;

    const discarded = this.selection;
    this.hand = this.hand.filter((c) => !discarded.includes(c));
    this.selection = [];
    await Promise.all(
      discarded.map((card3d, i) =>
        this.tweens.delay(i * 70).then(() => this.tweens.moveTo(card3d.mesh, DUGOUT.add(new Vector3(0, 0, i * 0.3)), 300)),
      ),
    );
    for (const card3d of discarded) card3d.dispose();
    this.deck.discard(discarded.map((c) => c.card));
    this.run.recordDiscard();

    this.busy = false;
    this.refreshHud();
    this.refreshPreview();
    await this.refillHand();
  }

  private async winInning(): Promise<void> {
    await this.hud.showPopup("INNING WON!", UI.green, 1000);
    this.run.finishInning();
    if (this.run.phase === "victory") {
      this.endRun(true);
    } else {
      this.clearHand();
      this.shop.refresh(this.run);
      this.shop.setVisible(true);
      this.refreshHud();
    }
  }

  private cheatWinInning(): void {
    if (this.run.phase !== "inning" || this.busy) return;
    this.run.runs = this.run.target;
    void this.winInning();
  }

  // ── UI refresh ──────────────────────────────────────────────────────────

  private refreshHud(): void {
    this.hud.update(this.run, this.deck.remaining);
    this.debug.refresh(this.run, this.deck.remaining, this.hand.map((c) => c.card.id));
  }

  private refreshPreview(): void {
    this.hud.updatePreview(this.previewResult(), this.selection.length);
    this.debug.refresh(this.run, this.deck.remaining, this.hand.map((c) => c.card.id));
  }

  // ── Input ───────────────────────────────────────────────────────────────

  private cardFromMesh(meshName: string | undefined): Card3D | null {
    if (!meshName) return null;
    return this.hand.find((c) => c.mesh.name === meshName) ?? null;
  }

  private bindPointer(): void {
    this.scene.onPointerObservable.add((info) => {
      if (this.run.phase !== "inning") return;
      if (info.type === PointerEventTypes.POINTERMOVE) {
        const picked = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) => m.name.startsWith("card-"));
        const card = this.cardFromMesh(picked?.pickedMesh?.name);
        if (card !== this.hovered) {
          if (!this.busy) {
            this.hovered?.setHovered(false);
            card?.setHovered(true);
          }
          this.hovered = card;
        }
      } else if (info.type === PointerEventTypes.POINTERTAP) {
        const picked = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) => m.name.startsWith("card-"));
        const card = this.cardFromMesh(picked?.pickedMesh?.name);
        if (card) this.toggleSelect(card);
      }
    });
  }

  private bindHotkeys(): void {
    this.scene.onKeyboardObservable.add((info) => {
      if (info.type !== KeyboardEventTypes.KEYDOWN) return;
      const key = info.event.key;
      if (key === "F1") {
        info.event.preventDefault();
        this.debug.toggle();
        this.refreshHud();
        return;
      }
      if (this.run.phase === "menu") return;
      switch (key.toLowerCase()) {
        case "r":
          void this.restartInning();
          break;
        case "n":
          this.cheatWinInning();
          break;
        case "g":
          this.run.cash += 10;
          this.refreshHud();
          break;
        case "d":
          if (this.run.phase === "inning" && !this.busy) void this.refillHand();
          break;
        case "p":
          BaseballToken.launch(this.scene, true);
          break;
        case "c":
          console.table(this.previewResult()?.lines ?? []);
          break;
      }
    });
  }
}
