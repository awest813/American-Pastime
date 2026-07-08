import "@babylonjs/core/Culling/ray"; // side-effect: enables scene.pick for card selection
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D";
import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";

import { BaseballToken } from "../entities/BaseballToken";
import { Card3D, TEAM_COLORS } from "../entities/Card3D";
import { CollectionScene } from "./CollectionScene";
import { Effects } from "../entities/Effects";
import { RunnerTokens } from "../entities/RunnerTokens";
import { TableWorld } from "../entities/TableWorld";
import { AudioSystem } from "../systems/AudioSystem";
import { ComboSystem } from "../systems/ComboSystem";
import { DeckSystem } from "../systems/DeckSystem";
import { RULES, RunSystem } from "../systems/RunSystem";
import { ScoreSystem, type ScoreContext } from "../systems/ScoreSystem";
import { recordRun } from "../systems/History";
import { clearSave, createSaveData, decodeRunCode, encodeRunCode, isRunCode, loadSave, persistSave, summarize, type SaveData } from "../systems/Save";
import { SPEED_SCALE, saveSettings, settings } from "../systems/Settings";
import type { BattingApproach, DetectedCombo, PlayerCard, ScoreResult } from "../systems/types";
import { ComboBook } from "../ui/ComboBook";
import { DebugPanel } from "../ui/DebugPanel";
import { EndPanel } from "../ui/EndPanel";
import { GameHud, type ComboSuggestion } from "../ui/GameHud";
import { HistoryPanel } from "../ui/HistoryPanel";
import { MenuPanel } from "../ui/MenuPanel";
import { PausePanel } from "../ui/PausePanel";
import { SettingsPanel } from "../ui/SettingsPanel";
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
  private effects: Effects;
  private runnerTokens: RunnerTokens;
  private audio = new AudioSystem();
  private run = new RunSystem();
  private deck: DeckSystem;
  private combos = new ComboSystem();
  private score = new ScoreSystem(this.combos);

  private hud: GameHud;
  private menu: MenuPanel;
  private shop: ShopPanel;
  private end: EndPanel;
  private debug: DebugPanel;
  private collection: CollectionScene;
  private history: HistoryPanel;
  private comboBook: ComboBook;
  private pause: PausePanel;
  private settingsPanel: SettingsPanel;

  private hand: Card3D[] = [];
  /** Selection in click order — order matters for "first card" effects. */
  private selection: Card3D[] = [];
  private hovered: Card3D | null = null;
  private approach: BattingApproach = "swing";
  private busy = false;
  private lastSeed = "";

  private constructor(private scene: Scene, canvas: HTMLCanvasElement, adt: AdvancedDynamicTexture) {
    this.world = new TableWorld(scene, canvas);
    this.tweens = new Tweens(scene);
    this.effects = new Effects(scene);
    this.runnerTokens = new RunnerTokens(scene, this.tweens);
    this.deck = new DeckSystem(this.run.rng);

    this.hud = new GameHud(adt, {
      onPlay: () => void this.playSelection(),
      onDiscard: () => void this.discardSelection(),
      onComboBook: () => this.toggleComboBook(),
      onApproach: (approach) => this.setApproach(approach),
    });
    this.hud.setVisible(false);
    this.shop = new ShopPanel(adt, {
      onBuy: (offer) => {
        if (this.run.buyEquipment(offer)) {
          this.audio.play("buy");
          this.shop.refresh(this.run);
          this.autosave(); // cash + gear changed
        }
      },
      onUpgrade: (card) => {
        if (this.run.upgradeCard(card)) {
          this.audio.play("win");
          this.shop.refresh(this.run);
          this.autosave(); // deck card promoted
        }
      },
      onReroll: () => {
        if (this.run.rerollShop()) {
          this.audio.play("click");
          this.shop.refresh(this.run);
          this.autosave(); // offers rerolled, cash spent, RNG advanced
        }
      },
      onContinue: () => {
        this.audio.play("click");
        this.nextInning();
      },
    });
    this.shop.setVisible(false);
    this.end = new EndPanel(adt, {
      onNewRun: () => {
        this.audio.play("click");
        this.startRun();
      },
      onRetrySeed: () => {
        this.audio.play("click");
        this.startRun(this.lastSeed);
      },
      onMenu: () => this.quitToMenu(),
    });
    this.end.setVisible(false);
    this.debug = new DebugPanel(adt, scene, {
      onGiveCash: () => {
        this.run.cash += 10;
        this.refreshHud();
      },
      onWinInning: () => this.cheatWinInning(),
      onRedeal: () => void this.restartInning(),
    });
    this.collection = new CollectionScene(scene, adt, this.tweens, this.audio, this.run.players, () => {
      this.menu.setVisible(true);
    });
    this.menu = new MenuPanel(adt, {
      onStart: (seed) => {
        this.audio.play("click"); // also unlocks the AudioContext inside the user gesture
        if (isRunCode(seed)) {
          void this.importRunCode(seed); // a pasted run code resumes instead of reseeding
          return;
        }
        this.startRun(seed);
      },
      onContinue: () => {
        const save = loadSave();
        if (!save) {
          this.menu.refreshContinue(); // save vanished between boot and click
          return;
        }
        this.audio.play("click");
        this.resumeRun(save);
      },
      onCollection: () => {
        this.audio.play("click");
        this.menu.setVisible(false);
        this.collection.open();
      },
      onHistory: () => {
        this.audio.play("click");
        this.history.open();
      },
      onSettings: () => {
        this.audio.play("click");
        this.settingsPanel.setVisible(true);
      },
      loadSummary: () => {
        const save = loadSave();
        return save ? summarize(save) : null;
      },
    });

    // Overlays created last so they render above every other panel
    this.history = new HistoryPanel(adt, () => this.history.setVisible(false));
    this.comboBook = new ComboBook(adt, this.run.comboMeta, () => this.toggleComboBook());
    this.pause = new PausePanel(adt, {
      onResume: () => this.pause.setVisible(false),
      onSettings: () => {
        this.audio.play("click");
        this.settingsPanel.setVisible(true);
      },
      onAbandon: () => this.quitToMenu(),
      getRunCode: () => {
        this.audio.play("click");
        return this.exportRunCode();
      },
    });
    // Settings sit above even the pause screen (it opens from there too)
    this.settingsPanel = new SettingsPanel(adt, this.audio, {
      onClose: () => undefined, // whichever screen was underneath is still there
      onApply: () => this.applySettings(),
    });
    this.applySettings();

    this.bindPointer();
    this.bindHotkeys();

    if (import.meta.env.DEV) {
      // Dev sugar: poke the game from the console (window.__cardball);
      // __cardballSetSpeed(8) fast-forwards all animations for soak tests.
      (window as unknown as Record<string, unknown>).__cardball = this;
      (window as unknown as Record<string, unknown>).__cardballSetSpeed = (s: number) => {
        Tweens.timeScale = s;
      };
    }
  }

  static async create(scene: Scene, canvas: HTMLCanvasElement): Promise<GameScene> {
    if (scene.getEngine().name === "WebGPU") {
      await import("@babylonjs/core/Engines/WebGPU/Extensions/engine.dynamicTexture");
    }
    canvas.addEventListener("contextmenu", (e) => e.preventDefault()); // right-click is a game input
    // We ray-pick manually in our own POINTERMOVE handlers; Babylon's built-in
    // per-move scene pick would duplicate that work for a pickInfo nobody reads.
    scene.skipPointerMovePicking = true;
    const adt = AdvancedDynamicTexture.CreateFullscreenUI("gameUI", true, scene);
    // Scale by whichever axis is tighter so tall panels (combo book, shop)
    // never clip on short/wide windows. Portrait panes need a narrower ideal
    // width so menus remain readable, while desktop keeps the roomy HUD layout.
    const updateGuiScale = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || window.innerWidth;
      const height = rect.height || window.innerHeight;
      adt.idealWidth = height > width * 1.15 ? 1000 : 1600;
    };
    updateGuiScale();
    window.addEventListener("resize", updateGuiScale);
    adt.idealHeight = 900;
    adt.useSmallestIdeal = true;
    return new GameScene(scene, canvas, adt);
  }

  /** Push persisted settings into the live systems they drive. */
  private applySettings(): void {
    Tweens.timeScale = SPEED_SCALE[settings.speed];
    this.audio.applyVolume();
    // Reconcile the crowd bed with the setting, but only run it during a run —
    // never behind the title screen.
    const inRun = this.run.phase === "inning" || this.run.phase === "shop";
    if (settings.ambience && inRun) this.audio.startAmbience();
    else if (!settings.ambience) this.audio.stopAmbience();
  }

  // ── Run flow ────────────────────────────────────────────────────────────

  private startRun(seed?: string): void {
    this.menu.setVisible(false);
    this.end.setVisible(false);
    this.shop.setVisible(false);
    this.clearHand(false); // the old run's cards must not bleed into the fresh deck
    this.approach = "swing";
    this.run.startRun(seed);
    this.lastSeed = this.run.rng.seed;
    this.deck = new DeckSystem(this.run.rng);
    this.deck.reset(this.run.deckCards);
    this.hud.setVisible(true);
    this.audio.startAmbience();
    void this.beginInning();
  }

  /** Persist a resume point. No-op unless the run is in a resumable phase and
   *  settled (never mid-animation, so the saved hand matches the saved piles). */
  private autosave(): void {
    if (this.busy) return;
    if (this.run.phase !== "inning" && this.run.phase !== "shop") return;
    persistSave({
      run: this.run.serialize(),
      deck: this.deck.snapshot(),
      hand: this.hand.map((c) => c.card.id),
      selection: this.selection.map((c) => c.card.id),
      approach: this.approach,
      lastSeed: this.lastSeed,
    });
  }

  /** Snapshot the current run as a shareable code (pause menu button). */
  private exportRunCode(): Promise<string | null> {
    if (this.busy || (this.run.phase !== "inning" && this.run.phase !== "shop")) {
      return Promise.resolve(null);
    }
    return encodeRunCode(
      createSaveData({
        run: this.run.serialize(),
        deck: this.deck.snapshot(),
        hand: this.hand.map((c) => c.card.id),
        selection: this.selection.map((c) => c.card.id),
        approach: this.approach,
        lastSeed: this.lastSeed,
      }),
    );
  }

  /** Resume a run from a pasted code; becomes the autosave so CONTINUE works. */
  private async importRunCode(code: string): Promise<void> {
    const save = await decodeRunCode(code);
    if (!save) {
      this.menu.flashSeedError("that run code didn't check out — paste the whole thing");
      return;
    }
    persistSave(save);
    this.resumeRun(save);
  }

  /** Rebuild a run from a save and drop the player back where they left off. */
  private resumeRun(save: SaveData): void {
    this.menu.setVisible(false);
    this.end.setVisible(false);
    this.shop.setVisible(false);
    this.clearHand(false);
    this.approach = save.approach ?? "swing";

    const deckCards = this.run.restore(save.run);
    if (!deckCards) {
      // Content changed under the save; discard it and stay on the menu.
      clearSave();
      this.menu.refreshContinue();
      this.menu.setVisible(true);
      return;
    }
    this.lastSeed = save.lastSeed;
    this.deck = new DeckSystem(this.run.rng);
    const byId = new Map(deckCards.map((c) => [c.id, c]));
    if (!this.deck.restore(save.deck, byId)) {
      clearSave();
      this.menu.refreshContinue();
      this.menu.setVisible(true);
      return;
    }

    this.hud.setVisible(true);
    this.audio.startAmbience();
    this.updateBoard(this.run.runs);
    this.runnerTokens.set(this.run.runners, this.runnerCapColor);

    if (this.run.phase === "shop") {
      this.shop.refresh(this.run);
      this.shop.setVisible(true);
      this.refreshHud();
      return;
    }

    // Mid-inning: rebuild the hand meshes and the selection highlight, no re-deal.
    const cardById = new Map(deckCards.map((c) => [c.id, c]));
    for (const id of save.hand) {
      const card = cardById.get(id);
      if (!card) continue;
      this.hand.push(new Card3D(this.scene, card));
    }
    this.layoutHand();
    for (const card3d of this.hand) {
      card3d.mesh.position.copyFrom(card3d.homePosition);
      card3d.mesh.rotation.copyFrom(card3d.homeRotation);
      card3d.applyRestPose();
    }
    const handById = new Map(this.hand.map((c) => [c.card.id, c]));
    for (const id of save.selection) {
      const card3d = handById.get(id);
      if (!card3d) continue;
      card3d.setSelected(true);
      this.selection.push(card3d);
    }
    this.layoutHand(); // reflect the raised selection offset
    this.refreshHud();
    this.refreshPreview();
  }

  /** Cap color for a runner token; runner ids are card ids into the run deck. */
  private runnerCapColor = (runnerId: string): string => {
    const card = this.run.deckCards.find((c) => c.id === runnerId);
    return (card && TEAM_COLORS[card.team]) || "#9a917f";
  };

  /** The 3D scoreboard is the primary score display. */
  private updateBoard(runs: number): void {
    const met = runs >= this.run.target;
    const line3 = this.run.boss
      ? `${this.run.pitch.name.toUpperCase()} + ${this.run.boss.name.toUpperCase()}`
      : this.run.pitch.name.toUpperCase();
    this.world.updateScoreboard(
      `${runs} / ${this.run.target}`,
      `INNING ${this.run.inning} · OUTS ${this.run.outs}/${RULES.outsPerInning}`,
      line3,
      met ? "#7fd4a0" : "#ffd257",
    );
  }

  private countUpBoard(from: number, to: number): Promise<void> {
    this.world.flashScoreboard();
    const durationMs = Math.min(900, 250 + (to - from) * 45);
    return this.tweens.animate(durationMs, (t) => this.updateBoard(Math.round(from + (to - from) * t)));
  }

  private async beginInning(): Promise<void> {
    this.clearHand();
    this.runnerTokens.set(this.run.runners, this.runnerCapColor);
    this.refreshHud();
    this.updateBoard(0);
    void this.announceInning();
    await this.refillHand();
    this.refreshPreview();
    // A brand-new player gets one toast over the diamond; the first committed
    // swing (any run, any session) retires it for good.
    if (!settings.tutorialSeen && this.run.inning === 1) this.hud.showTutorial();
    this.autosave(); // fresh hand dealt — a clean checkpoint to resume from
  }

  private async announceInning(): Promise<void> {
    await this.hud.showPopup(`INNING ${this.run.inning} · TARGET ${this.run.target}`, UI.cream, 900);
    if (this.run.inning === 2) {
      this.audio.play("combo", 2);
      await this.hud.showPopup("NEW: E ◉ TAKE · A » STEAL", UI.green, 1100);
    }
    if (this.run.boss) {
      this.audio.play("boss");
      this.world.pulseLights();
      this.world.shakeCamera(0.09, 300);
      await this.hud.showPopup(`☠ ${this.run.boss.name.toUpperCase()} ☠`, UI.red, 1200);
    }
  }

  private nextInning(): void {
    this.shop.setVisible(false);
    this.approach = "swing";
    this.run.nextInning();
    void this.beginInning();
  }

  private async restartInning(): Promise<void> {
    if (this.run.phase !== "inning" || this.busy) return;
    this.run.startInning();
    await this.beginInning();
  }

  private toggleComboBook(): void {
    if (this.pause.isOpen || this.settingsPanel.isOpen || this.run.phase === "menu") return;
    this.audio.play("click");
    this.comboBook.setVisible(!this.comboBook.isOpen);
  }

  /** Abandon path: back to the title screen from pause or the end screen. */
  private quitToMenu(): void {
    this.audio.play("click");
    this.settingsPanel.setVisible(false);
    this.pause.setVisible(false);
    this.comboBook.setVisible(false);
    this.end.setVisible(false);
    this.shop.setVisible(false);
    this.debug.setVisible(false);
    this.hud.setVisible(false);
    this.clearHand(false);
    this.runnerTokens.clear();
    this.audio.stopAmbience();
    this.run.phase = "menu";
    clearSave(); // abandoning ends the run — no resume point
    this.world.updateScoreboard("CARDBALL", "CLASSIC", "");
    this.menu.setVisible(true);
  }

  private endRun(victory: boolean): void {
    this.debug.setVisible(false);
    this.hud.setVisible(false);
    this.clearHand(false); // leftover cards shouldn't linger behind the end panel
    this.runnerTokens.clear();
    clearSave(); // the run is over; nothing left to resume
    // Finished seasons — win or lose — go in the record book. Abandons don't.
    const { broken } = recordRun({
      seed: this.lastSeed,
      victory,
      inningReached: this.run.inning,
      totalRuns: this.run.stats.totalRuns,
      moonshots: this.run.stats.moonshots,
      bestPlayLabel: this.run.stats.bestPlayLabel,
      bestPlayRuns: this.run.stats.bestPlayRuns,
      endedAt: Date.now(),
    });
    if (broken.length > 0) this.audio.play("win"); // records earn the organ fanfare
    // Victory: the crowd roars and keeps murmuring under the pennant screen.
    // Loss: fade the stadium to silence — the season's over.
    if (victory) this.audio.swellAmbience(4);
    else this.audio.stopAmbience();
    this.world.updateScoreboard(
      victory ? "PENNANT WON!" : "SEASON OVER",
      `SEED ${this.lastSeed}`,
      victory ? "9 INNINGS SURVIVED" : `INNING ${this.run.inning}`,
      victory ? "#7fd4a0" : "#e07a6a",
    );
    this.end.show(
      victory,
      victory
        ? `Nine innings survived. The cardboard engine hums.\nSeed ${this.lastSeed} · $${this.run.cash} left over`
        : `Retired in inning ${this.run.inning}: ${this.run.runs} of ${this.run.target} runs.\nSeed ${this.lastSeed}`,
      this.seasonStats(),
      broken,
    );
  }

  /** The bragging block for the end screen: best swing, homers, combo peak. */
  private seasonStats(): string {
    const stats = this.run.stats;
    if (stats.playsMade === 0) return "";
    const best =
      stats.bestPlayLabel === ""
        ? "—"
        : `${stats.bestPlayLabel}${stats.bestPlayRuns > 0 ? ` (+${stats.bestPlayRuns})` : ""} in inning ${stats.bestPlayInning}`;
    return [
      `Best swing: ${best}`,
      `Homers ${stats.homers} · Moonshots ${stats.moonshots} · Deepest combo ${stats.mostCombos}`,
      `${stats.totalRuns} run${stats.totalRuns === 1 ? "" : "s"} across ${stats.playsMade} at-bat${stats.playsMade === 1 ? "" : "s"}`,
    ].join("\n");
  }

  // ── Hand management ─────────────────────────────────────────────────────

  /** Clear the hand meshes; by default the cards go back to the discard pile
   *  so the deck never shrinks across innings. */
  private clearHand(returnToDeck = true): void {
    if (returnToDeck && this.hand.length > 0) {
      this.deck.discard(this.hand.map((c) => c.card));
    }
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
    // Deal with a stagger; new cards fly in from the deck spot with a spin flourish.
    const deals = newCards.map((card3d, i) =>
      this.tweens.delay(i * 90).then(() => {
        this.audio.play("deal");
        const fromY = -Math.PI * 2;
        const toY = card3d.homeRotation.y;
        void this.tweens.animate(320, (t) => {
          card3d.mesh.rotation.y = fromY + (toY - fromY) * t;
        });
        return this.tweens.moveTo(card3d.mesh, card3d.homePosition.clone(), 320, easeOutBack);
      }),
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
      if (this.selection.length >= this.run.maxCardsThisPlay) return;
      card3d.setSelected(true);
      this.selection.push(card3d);
    }
    // Spring the card up (or settle it back) instead of teleporting it.
    const fromY = card3d.mesh.position.y;
    const toY = card3d.homePosition.y + (card3d.selected ? 0.55 : 0);
    void this.tweens.animate(
      170,
      (t) => {
        card3d.mesh.position.y = fromY + (toY - fromY) * t;
      },
      easeOutBack,
    );
    this.audio.play("select");
    this.refreshPreview();
    this.autosave();
  }

  /** Take/Steal unlock in inning 2 — the opener stays swing-and-bunt simple. */
  private approachLocked(approach: BattingApproach): boolean {
    return (approach === "take" || approach === "steal") && this.run.inning < 2;
  }

  private setApproach(approach: BattingApproach): void {
    if (this.busy || this.run.phase !== "inning" || this.approachLocked(approach)) return;
    this.approach = approach;
    this.audio.play("click");
    this.refreshPreview();
    this.autosave();
  }

  // ── Scoring actions ─────────────────────────────────────────────────────

  private scoreContext(): ScoreContext {
    return {
      pitch: this.run.pitch,
      stadium: this.run.stadium,
      equipment: this.run.equipment,
      runsSoFar: this.run.runs,
      target: this.run.target,
      outs: this.run.outs,
      bases: this.run.bases,
      runners: this.run.runners,
      count: this.run.count,
      approach: this.approach,
      boss: this.run.boss,
      umpireTarget: this.run.umpireTarget,
      playsLeft: this.run.playsLeft,
    };
  }

  private previewResult(): ScoreResult | null {
    if (this.selection.length === 0) return null;
    return this.score.evaluate(this.selection.map((c) => c.card), this.scoreContext());
  }

  private comboKey(combo: DetectedCombo): string {
    return `${combo.id}:${combo.kind}:${combo.value}:${combo.detail}`;
  }

  private comboSuggestions(result: ScoreResult | null): ComboSuggestion[] {
    if (this.selection.length >= RULES.maxCardsPerPlay) return [];

    const selectedCards = this.selection.map((c) => c.card);
    const selectedSet = new Set(this.selection);
    const currentCombos = new Set((result?.combos ?? []).map((combo) => this.comboKey(combo)));
    const currentQuality = result?.quality ?? 0;
    const currentRuns = result?.runs ?? 0;
    const ctx = this.scoreContext();

    return this.hand
      .filter((card3d) => !selectedSet.has(card3d))
      .map((card3d) => {
        const next = this.score.evaluate([...selectedCards, card3d.card], ctx);
        const newCombos = next.combos.filter((combo) => !currentCombos.has(this.comboKey(combo)));
        if (newCombos.length === 0) return null;
        const deltaQuality = Math.max(0, next.quality - currentQuality);
        const deltaRuns = Math.max(0, next.runs - currentRuns);
        return {
          cardName: card3d.card.name,
          combos: newCombos.map((combo) => combo.name),
          deltaQuality,
          score: newCombos.length * 1000 + deltaRuns * 100 + deltaQuality,
        };
      })
      .filter((suggestion): suggestion is ComboSuggestion & { score: number } => suggestion !== null)
      .sort((a, b) => b.score - a.score || b.deltaQuality - a.deltaQuality || a.cardName.localeCompare(b.cardName))
      .slice(0, 3)
      .map(({ cardName, combos, deltaQuality }) => ({ cardName, combos, deltaQuality }));
  }

  private scorecardSummary(result: ScoreResult): string {
    const suffix = result.runs > 0 ? ` +${result.runs}R` : result.outs > 0 ? ` ${result.outs} OUT` : " SAFE";
    return `${result.outcome}${suffix}`;
  }

  private scorecardDetail(result: ScoreResult): string {
    const primary = result.playByPlay[0] ?? result.outcome;
    const runnerNote = result.playByPlay.find((line) => /scores|takes|moves|steals|thrown out/i.test(line));
    return runnerNote && runnerNote !== primary ? `${primary} / ${runnerNote}` : primary;
  }

  private recordScorecard(result: ScoreResult): void {
    this.run.recordScorecard({
      inning: this.run.inning,
      count: result.count,
      summary: this.scorecardSummary(result),
      detail: this.scorecardDetail(result),
      runs: result.runs,
      outs: result.outs,
    });
  }

  private async playSelection(): Promise<void> {
    if (this.busy || this.run.phase !== "inning" || this.run.playsLeft <= 0 || this.selection.length === 0) return;
    this.busy = true;
    this.hud.setButtonsEnabled(false, false);
    this.hud.hideTutorial();
    if (!settings.tutorialSeen) {
      settings.tutorialSeen = true;
      saveSettings();
    }

    const played = this.selection;
    const playedCards = played.map((c) => c.card);
    const result = this.score.evaluate(playedCards, this.scoreContext());

    // Cards stride out to the diamond and slap down flat, kicking up dust.
    this.hand = this.hand.filter((c) => !played.includes(c));
    this.selection = [];
    this.hud.setSelectionBadges([]); // badges vanish as the cards leave, before their meshes dispose
    const flights = played.map((card3d, i) => {
      const slot = new Vector3((i - (played.length - 1) / 2) * 1.7, 0.06 + i * 0.005, 1.6);
      return this.tweens.delay(i * 110).then(async () => {
        this.audio.play("deal");
        void this.tweens.animate(300, (t) => {
          card3d.mesh.rotation.x = HAND_TILT + (Math.PI / 2 - HAND_TILT) * t;
        });
        await this.tweens.moveTo(card3d.mesh, slot, 340);
        this.effects.dustPuff(slot.add(new Vector3(0, 0.15, 0)));
        // Each card's base contribution pops off it as it lands, pitch rising.
        const contribution = result.perCard[i];
        if (contribution) {
          this.audio.play("tick", i);
          this.hud.showScorePop(card3d.mesh, `+${contribution.value}`);
        }
      });
    });
    await Promise.all(flights);
    await this.tweens.delay(180); // let the last score pop breathe
    await this.hud.showQualityTally(result.quality);

    const shownCombos = result.combos.slice(0, 4);
    for (const [i, combo] of shownCombos.entries()) {
      this.audio.play("combo", i);
      await this.hud.showComboPopup(combo, i + 1, result.combos.length);
    }
    if (result.combos.length > shownCombos.length) {
      await this.hud.showPopup(`+${result.combos.length - shownCombos.length} MORE COMBO${result.combos.length - shownCombos.length === 1 ? "" : "S"}!`, UI.gold, 650);
    }

    // Sound and spectacle follow what actually happened at the plate: only
    // contact cracks the bat and launches a ball; a whiff gets a mitt thud
    // and a red sting instead of fireworks.
    const bigPlay = result.bases >= 4;
    const walkish = result.outcome === "Walk" || result.outcome === "Ball Four";
    const stealish = result.outcome === "Stolen Base" || result.outcome === "Steal Home";
    const madeContact = (result.bases >= 1 && !walkish) || this.approach === "small_ball";
    if (madeContact) {
      this.audio.play(bigPlay ? "homer" : "crack");
      BaseballToken.launch(this.scene, bigPlay, this.effects);
    } else if (walkish || stealish) {
      this.audio.play("buy"); // a tidy little win, not a fireworks moment
    } else if (result.outs > 0) {
      this.audio.play("out");
      this.hud.flashDanger();
      this.world.shakeCamera(0.05, 200);
    }
    if (bigPlay) {
      this.world.pulseLights();
      this.world.shakeCamera();
      this.audio.swellAmbience(4); // the crowd erupts on a homer
    } else if (result.bases >= 2 || result.runs > 0) {
      this.world.shakeCamera(0.07, 250);
      this.audio.swellAmbience(2.4); // a solid rally gets a rise
    }
    // The little ballplayers act the play out on the diamond while the
    // numbers land: batter legs it out, runners advance, scorers cross home.
    void this.runnerTokens.applyPlay(result.runnersBefore, result.runnersAfter, result.runs > 0, result.bases >= 4, this.runnerCapColor);
    const runsBefore = this.run.runs;
    const popup = result.runs > 0 ? `+${result.runs} RUN${result.runs === 1 ? "" : "S"}!` : result.outs > 0 ? `${result.outcome.toUpperCase()}` : `${result.outcome.toUpperCase()}!`;
    void this.hud.showPopup(popup, result.runs > 0 ? UI.gold : result.outs > 0 ? UI.red : UI.green, 1000);
    if (result.runs > 0) this.audio.play("runs");
    await this.countUpBoard(runsBefore, runsBefore + result.runs);

    this.recordScorecard(result);
    this.run.recordPlayStats(result.outcome, result.runs, result.combos.length);
    this.run.recordPlay(result.runs, result.playCost, result.outs, result.basesAfter, result.runnersAfter);

    await this.tweens.delay(350);
    for (const card3d of played) card3d.dispose();
    this.deck.discard(playedCards);

    this.busy = false;
    this.refreshHud();
    this.refreshPreview();

    if (this.run.inningWon) {
      // Winning on the final available at-bat earns the walk-off call.
      await this.winInning(this.run.playsLeft <= 0);
    } else if (this.run.inningLost) {
      this.run.phase = "gameOver";
      this.audio.play("lose");
      await this.hud.showPopup("RETIRED...", UI.red, 1100);
      this.endRun(false);
    } else {
      await this.refillHand();
      this.autosave(); // play resolved, still batting — checkpoint the new hand
    }
  }

  private async discardSelection(): Promise<void> {
    if (this.busy || this.run.phase !== "inning" || this.run.discardsLeft <= 0 || this.selection.length === 0) return;
    this.busy = true;

    const discarded = this.selection;
    this.hand = this.hand.filter((c) => !discarded.includes(c));
    this.selection = [];
    this.hud.setSelectionBadges([]); // clear before the discarded meshes tumble off and dispose
    await Promise.all(
      discarded.map((card3d, i) =>
        this.tweens.delay(i * 70).then(() => {
          this.audio.play("deal");
          // Tumble end-over-end into the dugout pile
          void this.tweens.animate(300, (t) => {
            card3d.mesh.rotation.z = t * Math.PI * 1.5;
            card3d.mesh.rotation.x = HAND_TILT + t * Math.PI;
          });
          return this.tweens.moveTo(card3d.mesh, DUGOUT.add(new Vector3(0, 0, i * 0.3)), 300);
        }),
      ),
    );
    for (const card3d of discarded) card3d.dispose();
    this.deck.discard(discarded.map((c) => c.card));
    this.run.recordDiscard();

    this.busy = false;
    this.refreshHud();
    this.refreshPreview();
    await this.refillHand();
    this.autosave(); // discard resolved — checkpoint the refreshed hand
  }

  private async winInning(walkOff = false): Promise<void> {
    this.audio.play("win");
    this.audio.swellAmbience(walkOff ? 4 : 3.2); // crowd cheers the inning home
    this.effects.confetti(new Vector3(0, 2.5, 1.5));
    await this.hud.showPopup(walkOff ? "WALK-OFF!" : "INNING WON!", walkOff ? UI.gold : UI.green, walkOff ? 1200 : 1000);
    this.run.finishInning();
    this.runnerTokens.clear(); // the side is retired; the diamond empties
    if (this.run.phase === "victory") {
      this.endRun(true);
    } else {
      this.clearHand();
      this.debug.setVisible(false);
      this.shop.refresh(this.run);
      this.shop.setVisible(true);
      this.refreshHud();
      this.autosave(); // shop is a resume point too (offers/upgrades are rolled)
    }
  }

  private cheatWinInning(): void {
    if (this.run.phase !== "inning" || this.busy) return;
    this.run.runs = this.run.target;
    this.updateBoard(this.run.runs);
    void this.winInning();
  }

  // ── UI refresh ──────────────────────────────────────────────────────────

  private refreshHud(): void {
    this.hud.update(this.run, this.deck.remaining, this.selection.length, this.approach);
    this.debug.refresh(this.run, this.deck.remaining, this.hand.map((c) => c.card.id));
  }

  private refreshPreview(): void {
    const result = this.previewResult();
    this.hud.updatePreview(result, this.selection.length, this.selection[0]?.card.name ?? null, this.comboSuggestions(result));
    this.hud.setSelectionBadges(this.selection.map((c) => c.mesh));
    // The leadoff card steps up to the plate on the field itself.
    const lead = this.selection[0]?.card ?? null;
    this.runnerTokens.setBatter(lead?.id ?? null, lead ? (TEAM_COLORS[lead.team] ?? "#9a917f") : "#9a917f");
    this.refreshHud();
  }

  // ── Input ───────────────────────────────────────────────────────────────

  private cardFromMesh(meshName: string | undefined): Card3D | null {
    if (!meshName) return null;
    return this.hand.find((c) => c.mesh.name === meshName) ?? null;
  }

  private bindPointer(): void {
    this.scene.onPointerObservable.add((info) => {
      if (this.run.phase !== "inning" || this.pause.isOpen || this.comboBook.isOpen || this.settingsPanel.isOpen) return;
      if (info.type === PointerEventTypes.POINTERMOVE) {
        const picked = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) => m.name.startsWith("card-"));
        const card = this.cardFromMesh(picked?.pickedMesh?.name);
        const canvas = this.scene.getEngine().getRenderingCanvas();
        if (canvas) canvas.style.cursor = card && !this.busy ? "pointer" : "default";
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
      // Letter keys belong to the seed box while it's focused, not to hotkeys
      if (this.menu.seedFocused && key.length === 1) return;
      if (key.toLowerCase() === "m") {
        const muted = this.audio.toggleMute();
        this.settingsPanel.refresh(); // keep the SOUND toggle honest if the panel is up
        if (this.run.phase !== "menu" && !this.settingsPanel.isOpen) {
          void this.hud.showPopup(muted ? "MUTED" : "SOUND ON", UI.cream, 450);
        }
        return;
      }
      if (this.run.phase === "menu") {
        if (key === "Escape") {
          if (this.settingsPanel.isOpen) {
            this.settingsPanel.close();
          } else if (this.history.isOpen) {
            this.history.setVisible(false);
          } else if (this.menu.visible && !this.menu.onHome) {
            this.audio.play("click");
            this.menu.showHome();
          }
          return; // the binder owns its own Escape/arrows
        }
        if (key === "Enter" && this.menu.visible && this.menu.onHome && !this.settingsPanel.isOpen) {
          this.menu.submit();
        }
        return;
      }
      if (key.toLowerCase() === "h") {
        this.toggleComboBook();
        return;
      }
      if (key === "Escape") {
        if (this.settingsPanel.isOpen) {
          this.settingsPanel.close();
        } else if (this.comboBook.isOpen) {
          this.comboBook.setVisible(false);
        } else if (this.pause.isOpen) {
          this.pause.setVisible(false);
        } else if ((this.run.phase === "inning" && !this.busy) || this.run.phase === "shop") {
          this.pause.setVisible(true, this.lastSeed);
        }
        return;
      }
      if (this.pause.isOpen || this.comboBook.isOpen || this.settingsPanel.isOpen) return; // overlays swallow gameplay keys

      // ── Player gameplay controls ──
      if (this.run.phase === "inning") {
        if (key.toLowerCase() === "q") {
          this.setApproach("swing");
          return;
        }
        if (key.toLowerCase() === "w") {
          this.setApproach("small_ball");
          return;
        }
        if (key.toLowerCase() === "e") {
          this.setApproach("take");
          return;
        }
        if (key.toLowerCase() === "a") {
          this.setApproach("steal");
          return;
        }
        if (key >= "1" && key <= "8") {
          const card = this.hand[Number(key) - 1];
          if (card) this.toggleSelect(card);
          return;
        }
        if (key === "Enter" || key === " ") {
          info.event.preventDefault(); // Space would otherwise scroll/click
          void this.playSelection();
          return;
        }
        if (key.toLowerCase() === "x") {
          void this.discardSelection();
          return;
        }
      }

      // ── Dev cheats — only while the F1 debug panel is open ──
      if (!this.debug.visible) return;
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
