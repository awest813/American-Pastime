import playersJson from "../content/cards.players.json";
import equipmentJson from "../content/cards.equipment.json";
import stadiumsJson from "../content/cards.stadiums.json";
import pitchesJson from "../content/pitches.json";
import combosJson from "../content/combos.json";
import bossesJson from "../content/bosses.json";
import {
  RARITY_LADDER,
  type BaseRunner,
  type BaseState,
  type BossCard,
  type ComboMeta,
  type CountState,
  type EquipmentCard,
  type PitchCard,
  type PlayerCard,
  type Position,
  type Rarity,
  type RunnerState,
  type ScorecardEntry,
  type StadiumCard,
  type Stat,
} from "./types";
import { Random, type RandomSnapshot } from "../utils/Random";

/**
 * A serializable snapshot of a run. Cards that live in the static content pools
 * (equipment, stadium, pitch, boss) are stored by id; the per-run player deck —
 * which carries upgrades and so cannot be derived from the base roster — is
 * stored in full and is the canonical card list every other reference points at.
 */
/** Season-long bragging numbers for the end screen. */
export interface RunStats {
  totalRuns: number;
  playsMade: number;
  homers: number;
  moonshots: number;
  bestPlayRuns: number;
  bestPlayLabel: string;
  bestPlayInning: number;
  mostCombos: number;
}

const EMPTY_STATS: RunStats = {
  totalRuns: 0,
  playsMade: 0,
  homers: 0,
  moonshots: 0,
  bestPlayRuns: 0,
  bestPlayLabel: "",
  bestPlayInning: 0,
  mostCombos: 0,
};

export interface RunState {
  rng: RandomSnapshot;
  phase: RunPhase;
  inning: number;
  target: number;
  runs: number;
  outs: number;
  bases: BaseState;
  runners?: RunnerState;
  count?: CountState;
  scorecard?: ScorecardEntry[];
  playsLeft: number;
  discardsLeft: number;
  cash: number;
  equipment: string[];
  stadium: string | null;
  pitch: string;
  boss: string | null;
  umpireTarget: Position | null;
  usedBosses: string[];
  shopOffers: string[];
  upgradeCandidates: string[];
  deckCards: PlayerCard[];
  /** Absent on saves from before stats existed; restore() defaults it. */
  stats?: RunStats;
}

/** Price of promoting a card, keyed by the tier it is promoted TO. */
const UPGRADE_COST: Partial<Record<Rarity, number>> = { Starter: 3, AllStar: 5, Legend: 8 };
const STAT_ORDER: Stat[] = ["power", "contact", "speed", "discipline", "defense"];
const EMPTY_RUNNERS: RunnerState = { first: null, second: null, third: null };
const DEFAULT_COUNT: CountState = { balls: 0, strikes: 0 };
const COUNT_POOL: CountState[] = [
  { balls: 0, strikes: 0 },
  { balls: 0, strikes: 0 },
  { balls: 1, strikes: 0 },
  { balls: 1, strikes: 0 },
  { balls: 2, strikes: 0 },
  { balls: 2, strikes: 1 },
  { balls: 3, strikes: 1 },
  { balls: 0, strikes: 1 },
  { balls: 0, strikes: 2 },
  { balls: 1, strikes: 2 },
  { balls: 2, strikes: 2 },
  { balls: 3, strikes: 2 },
];

export const RULES = {
  handSize: 8,
  maxCardsPerPlay: 5,
  playsPerInning: 4,
  outsPerInning: 3,
  discardsPerInning: 3,
  startingCash: 4,
  rewardBase: 3,
  firstTarget: 3,
  targetGrowth: 1.2, // tuned via scripts/simulate.mjs — 1.22's inning-9 target was a wall
  finalInning: 9,
  maxEquipment: 5,
  bossEvery: 3, // innings 3, 6, 9 are boss innings
  bossReward: 2,
} as const;

export type RunPhase = "menu" | "inning" | "shop" | "gameOver" | "victory";

/**
 * Holds all run-level state: seed, inning, cash, targets, owned equipment,
 * the stadium, and the pitch being faced. Pure state + transitions; the
 * GameScene decides when to call them.
 */
export class RunSystem {
  readonly players: PlayerCard[] = playersJson as PlayerCard[];
  readonly equipmentPool: EquipmentCard[] = equipmentJson as EquipmentCard[];
  readonly stadiums: StadiumCard[] = stadiumsJson as StadiumCard[];
  readonly pitches: PitchCard[] = pitchesJson as PitchCard[];
  readonly comboMeta: ComboMeta[] = combosJson as ComboMeta[];
  readonly bosses: BossCard[] = bossesJson as BossCard[];

  rng: Random = new Random();
  phase: RunPhase = "menu";

  inning = 1;
  target: number = RULES.firstTarget;
  runs = 0;
  outs = 0;
  bases: BaseState = { first: false, second: false, third: false };
  runners: RunnerState = { ...EMPTY_RUNNERS };
  count: CountState = { ...DEFAULT_COUNT };
  scorecard: ScorecardEntry[] = [];
  playsLeft: number = RULES.playsPerInning;
  discardsLeft: number = RULES.discardsPerInning;
  cash: number = RULES.startingCash;
  equipment: EquipmentCard[] = [];
  stadium: StadiumCard | null = null;
  pitch: PitchCard = this.pitches[0];
  boss: BossCard | null = null;
  /** The position The Umpire is ringing up this inning. */
  umpireTarget: Position | null = null;
  private usedBosses = new Set<string>();

  /** Shop offers for the current visit. */
  shopOffers: EquipmentCard[] = [];
  /** Deck cards offered for promotion this shop visit. */
  upgradeCandidates: PlayerCard[] = [];
  /** Per-run copies of the player cards, so upgrades never touch the base collection. */
  deckCards: PlayerCard[] = [];
  /** Season-long numbers for the end screen. */
  stats: RunStats = { ...EMPTY_STATS };

  startRun(seed?: string): void {
    this.rng = new Random(seed);
    this.inning = 1;
    this.cash = RULES.startingCash;
    this.equipment = [];
    this.stats = { ...EMPTY_STATS };
    this.usedBosses.clear();
    this.deckCards = this.players.map((p) => ({ ...p }));
    this.stadium = this.rng.pick(this.stadiums);
    this.phase = "inning";
    this.startInning();
  }

  startInning(): void {
    this.target = Math.round(RULES.firstTarget * Math.pow(RULES.targetGrowth, this.inning - 1));
    this.runs = 0;
    this.outs = 0;
    this.bases = { first: false, second: false, third: false };
    this.runners = { ...EMPTY_RUNNERS };
    this.scorecard = [];
    this.playsLeft = RULES.playsPerInning;
    this.discardsLeft = RULES.discardsPerInning;
    this.pitch = this.rng.pick(this.pitches);
    this.count = this.rollCount();
    this.boss = this.inning % RULES.bossEvery === 0 ? this.pickBoss() : null;
    this.umpireTarget = null;
    if (this.boss?.id === "umpire") {
      const positions = [...new Set(this.players.map((p) => p.position))];
      this.umpireTarget = this.rng.pick(positions);
    }
    this.phase = "inning";
  }

  /** Each boss appears once per run until the roster is exhausted. */
  private pickBoss(): BossCard {
    let available = this.bosses.filter((b) => !this.usedBosses.has(b.id));
    if (available.length === 0) {
      this.usedBosses.clear();
      available = this.bosses;
    }
    const boss = this.rng.pick(available);
    this.usedBosses.add(boss.id);
    return boss;
  }

  private cloneRunner(runner: BaseRunner | null | undefined, fallbackId: string): BaseRunner | null {
    if (!runner) return null;
    return {
      id: runner.id || fallbackId,
      name: runner.name || "Runner",
      speed: typeof runner.speed === "number" ? runner.speed : 5,
    };
  }

  private cloneRunners(runners: RunnerState | undefined, bases: BaseState): RunnerState {
    return {
      first: bases.first ? this.cloneRunner(runners?.first, "legacy-first") ?? { id: "legacy-first", name: "Runner", speed: 5 } : null,
      second: bases.second ? this.cloneRunner(runners?.second, "legacy-second") ?? { id: "legacy-second", name: "Runner", speed: 5 } : null,
      third: bases.third ? this.cloneRunner(runners?.third, "legacy-third") ?? { id: "legacy-third", name: "Runner", speed: 5 } : null,
    };
  }

  private cloneCount(count: CountState | undefined): CountState {
    return {
      balls: Math.max(0, Math.min(3, Math.trunc(count?.balls ?? DEFAULT_COUNT.balls))),
      strikes: Math.max(0, Math.min(2, Math.trunc(count?.strikes ?? DEFAULT_COUNT.strikes))),
    };
  }

  private cloneScorecardEntry(entry: ScorecardEntry | undefined, fallbackInning = this.inning): ScorecardEntry | null {
    if (!entry) return null;
    const summary = typeof entry.summary === "string" && entry.summary.length > 0 ? entry.summary : "At-bat";
    const detail = typeof entry.detail === "string" && entry.detail.length > 0 ? entry.detail : summary;
    return {
      inning: Math.max(1, Math.trunc(entry.inning || fallbackInning)),
      count: this.cloneCount(entry.count),
      summary,
      detail,
      runs: Math.max(0, Math.trunc(entry.runs || 0)),
      outs: Math.max(0, Math.trunc(entry.outs || 0)),
    };
  }

  private cloneScorecard(entries: ScorecardEntry[] | undefined): ScorecardEntry[] {
    if (!Array.isArray(entries)) return [];
    return entries
      .map((entry) => this.cloneScorecardEntry(entry))
      .filter((entry): entry is ScorecardEntry => entry !== null)
      .slice(0, 5);
  }

  private rollCount(): CountState {
    return this.cloneCount(this.rng.pick(COUNT_POOL));
  }

  recordScorecard(entry: ScorecardEntry): void {
    const normalized = this.cloneScorecardEntry(entry);
    if (!normalized) return;
    this.scorecard = [normalized, ...this.scorecard].slice(0, 5);
  }

  recordPlay(runsScored: number, playCost = 1, outsMade = 0, bases: BaseState = this.bases, runners?: RunnerState): void {
    this.runs += runsScored;
    this.outs = Math.min(RULES.outsPerInning, this.outs + outsMade);
    this.bases = { ...bases };
    this.runners = this.cloneRunners(runners, this.bases);
    this.playsLeft = Math.max(0, this.playsLeft - playCost);
    if (!this.inningWon && !this.inningLost) this.count = this.rollCount();
  }

  recordDiscard(): void {
    this.discardsLeft -= 1;
  }

  /** Fold a resolved play into the season-long stats (called alongside recordPlay). */
  recordPlayStats(outcome: string, runs: number, combos: number): void {
    this.stats.playsMade += 1;
    this.stats.totalRuns += runs;
    if (outcome === "Home Run" || outcome === "Moonshot") this.stats.homers += 1;
    if (outcome === "Moonshot") this.stats.moonshots += 1;
    if (runs > this.stats.bestPlayRuns || this.stats.bestPlayLabel === "") {
      this.stats.bestPlayRuns = runs;
      this.stats.bestPlayLabel = outcome;
      this.stats.bestPlayInning = this.inning;
    }
    this.stats.mostCombos = Math.max(this.stats.mostCombos, combos);
  }

  /** Cards allowed in one play; The Crafty Vet squeezes the window to 3. */
  get maxCardsThisPlay(): number {
    return this.boss?.id === "crafty_vet" ? 3 : RULES.maxCardsPerPlay;
  }

  get inningWon(): boolean {
    return this.runs >= this.target;
  }

  get inningLost(): boolean {
    return (this.outs >= RULES.outsPerInning || this.playsLeft <= 0) && this.runs < this.target;
  }

  /** Called after winning an inning; pays out (boss innings pay a bounty) and rolls the shop. */
  finishInning(): void {
    this.cash += RULES.rewardBase + this.playsLeft + (this.boss ? RULES.bossReward : 0);
    if (this.inning >= RULES.finalInning) {
      this.phase = "victory";
    } else {
      this.rollShop();
      this.phase = "shop";
    }
  }

  rollShop(): void {
    const owned = new Set(this.equipment.map((e) => e.id));
    const available = this.equipmentPool.filter((e) => !owned.has(e.id));
    this.shopOffers = this.rng.shuffle(available).slice(0, 3);
    const upgradable = this.deckCards.filter((c) => c.rarity !== "Legend");
    this.upgradeCandidates = this.rng.shuffle(upgradable).slice(0, 3);
  }

  nextRarity(card: PlayerCard): Rarity | null {
    const index = RARITY_LADDER.indexOf(card.rarity);
    return index >= 0 && index < RARITY_LADDER.length - 1 ? RARITY_LADDER[index + 1] : null;
  }

  upgradeCost(card: PlayerCard): number | null {
    const next = this.nextRarity(card);
    return next ? (UPGRADE_COST[next] ?? null) : null;
  }

  /** The two best stats that can still grow (capped at 9), highest first. */
  upgradeStatTargets(card: PlayerCard): Stat[] {
    return STAT_ORDER.filter((s) => card[s] < 9)
      .sort((a, b) => card[b] - card[a])
      .slice(0, 2);
  }

  /** Promote a deck card one tier: +1 to its two best upgradeable stats. */
  upgradeCard(card: PlayerCard): boolean {
    const next = this.nextRarity(card);
    const cost = this.upgradeCost(card);
    if (!next || cost === null || this.cash < cost) return false;
    this.cash -= cost;
    for (const stat of this.upgradeStatTargets(card)) {
      card[stat] += 1;
    }
    card.rarity = next;
    this.upgradeCandidates = this.upgradeCandidates.filter((c) => c !== card);
    return true;
  }

  buyEquipment(offer: EquipmentCard): boolean {
    if (this.cash < offer.price || this.equipment.length >= RULES.maxEquipment) {
      return false;
    }
    this.cash -= offer.price;
    this.equipment.push(offer);
    this.shopOffers = this.shopOffers.filter((o) => o.id !== offer.id);
    return true;
  }

  rerollShop(): boolean {
    if (this.cash < 1) return false;
    this.cash -= 1;
    this.rollShop();
    return true;
  }

  nextInning(): void {
    this.inning += 1;
    this.startInning();
  }

  // ── Save / resume ─────────────────────────────────────────────────────────

  /** Snapshot every run-level field, including the RNG position and the
   *  upgraded per-run deck, so the run can be resumed byte-for-byte later. */
  serialize(): RunState {
    return {
      rng: this.rng.snapshot(),
      phase: this.phase,
      inning: this.inning,
      target: this.target,
      runs: this.runs,
      outs: this.outs,
      bases: { ...this.bases },
      runners: this.cloneRunners(this.runners, this.bases),
      count: this.cloneCount(this.count),
      scorecard: this.cloneScorecard(this.scorecard),
      playsLeft: this.playsLeft,
      discardsLeft: this.discardsLeft,
      cash: this.cash,
      equipment: this.equipment.map((e) => e.id),
      stadium: this.stadium?.id ?? null,
      pitch: this.pitch.id,
      boss: this.boss?.id ?? null,
      umpireTarget: this.umpireTarget,
      usedBosses: [...this.usedBosses],
      shopOffers: this.shopOffers.map((o) => o.id),
      upgradeCandidates: this.upgradeCandidates.map((c) => c.id),
      deckCards: this.deckCards.map((c) => ({ ...c })),
      stats: { ...this.stats },
    };
  }

  /** Rebuild run state from a snapshot. References into the static content
   *  pools are re-resolved by id; if a required one is missing (the content
   *  changed under an old save) the whole restore fails so the caller can
   *  discard the save rather than resume a corrupt run.
   *  @returns the restored per-run deck (for the DeckSystem/hand), or null on failure. */
  restore(state: RunState): PlayerCard[] | null {
    const pitch = this.pitches.find((p) => p.id === state.pitch);
    if (!pitch) return null;
    const stadium = state.stadium ? this.stadiums.find((s) => s.id === state.stadium) : null;
    if (state.stadium && !stadium) return null;
    const boss = state.boss ? this.bosses.find((b) => b.id === state.boss) : null;
    if (state.boss && !boss) return null;

    const equipment: EquipmentCard[] = [];
    for (const id of state.equipment) {
      const gear = this.equipmentPool.find((e) => e.id === id);
      if (!gear) return null;
      equipment.push(gear);
    }
    const shopOffers: EquipmentCard[] = [];
    for (const id of state.shopOffers) {
      const gear = this.equipmentPool.find((e) => e.id === id);
      if (!gear) return null;
      shopOffers.push(gear);
    }

    // The saved deck is canonical (carries upgrades); everything else keys into it.
    this.deckCards = state.deckCards.map((c) => ({ ...c }));
    const deckById = new Map(this.deckCards.map((c) => [c.id, c]));
    const upgradeCandidates: PlayerCard[] = [];
    for (const id of state.upgradeCandidates) {
      const card = deckById.get(id);
      if (!card) return null;
      upgradeCandidates.push(card);
    }

    this.rng = Random.restore(state.rng);
    this.phase = state.phase;
    this.inning = state.inning;
    this.target = state.target;
    this.runs = state.runs;
    this.outs = typeof state.outs === "number" ? state.outs : 0;
    this.bases = {
      first: Boolean(state.bases?.first),
      second: Boolean(state.bases?.second),
      third: Boolean(state.bases?.third),
    };
    this.runners = this.cloneRunners(state.runners, this.bases);
    this.count = this.cloneCount(state.count);
    this.scorecard = this.cloneScorecard(state.scorecard);
    this.playsLeft = state.playsLeft;
    this.discardsLeft = state.discardsLeft;
    this.cash = state.cash;
    this.equipment = equipment;
    this.stadium = stadium ?? null;
    this.pitch = pitch;
    this.boss = boss ?? null;
    this.umpireTarget = state.umpireTarget;
    this.usedBosses = new Set(state.usedBosses);
    this.shopOffers = shopOffers;
    this.upgradeCandidates = upgradeCandidates;
    const savedStats = state.stats;
    this.stats = {
      totalRuns: Math.max(0, Math.trunc(savedStats?.totalRuns ?? 0)),
      playsMade: Math.max(0, Math.trunc(savedStats?.playsMade ?? 0)),
      homers: Math.max(0, Math.trunc(savedStats?.homers ?? 0)),
      moonshots: Math.max(0, Math.trunc(savedStats?.moonshots ?? 0)),
      bestPlayRuns: Math.max(0, Math.trunc(savedStats?.bestPlayRuns ?? 0)),
      bestPlayLabel: typeof savedStats?.bestPlayLabel === "string" ? savedStats.bestPlayLabel : "",
      bestPlayInning: Math.max(0, Math.trunc(savedStats?.bestPlayInning ?? 0)),
      mostCombos: Math.max(0, Math.trunc(savedStats?.mostCombos ?? 0)),
    };
    return this.deckCards;
  }
}
