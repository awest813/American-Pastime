import playersJson from "../content/cards.players.json";
import equipmentJson from "../content/cards.equipment.json";
import stadiumsJson from "../content/cards.stadiums.json";
import pitchesJson from "../content/pitches.json";
import combosJson from "../content/combos.json";
import bossesJson from "../content/bosses.json";
import { RARITY_LADDER, type BossCard, type ComboMeta, type EquipmentCard, type PitchCard, type PlayerCard, type Position, type Rarity, type StadiumCard, type Stat } from "./types";
import { Random } from "../utils/Random";

/** Price of promoting a card, keyed by the tier it is promoted TO. */
const UPGRADE_COST: Partial<Record<Rarity, number>> = { Starter: 3, AllStar: 5, Legend: 8 };
const STAT_ORDER: Stat[] = ["power", "contact", "speed", "discipline", "defense"];

export const RULES = {
  handSize: 8,
  maxCardsPerPlay: 5,
  playsPerInning: 4,
  discardsPerInning: 3,
  startingCash: 4,
  rewardBase: 3,
  firstTarget: 15,
  targetGrowth: 1.37, // soak-tuned: optimal play wins ~40%, weak builds die around inning 8
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

  startRun(seed?: string): void {
    this.rng = new Random(seed);
    this.inning = 1;
    this.cash = RULES.startingCash;
    this.equipment = [];
    this.usedBosses.clear();
    this.deckCards = this.players.map((p) => ({ ...p }));
    this.stadium = this.rng.pick(this.stadiums);
    this.phase = "inning";
    this.startInning();
  }

  startInning(): void {
    this.target = Math.round(RULES.firstTarget * Math.pow(RULES.targetGrowth, this.inning - 1));
    this.runs = 0;
    this.playsLeft = RULES.playsPerInning;
    this.discardsLeft = RULES.discardsPerInning;
    this.pitch = this.rng.pick(this.pitches);
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

  recordPlay(runsScored: number, playCost = 1): void {
    this.runs += runsScored;
    this.playsLeft = Math.max(0, this.playsLeft - playCost);
  }

  recordDiscard(): void {
    this.discardsLeft -= 1;
  }

  get inningWon(): boolean {
    return this.runs >= this.target;
  }

  get inningLost(): boolean {
    return this.playsLeft <= 0 && this.runs < this.target;
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
}
