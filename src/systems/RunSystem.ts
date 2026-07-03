import playersJson from "../content/cards.players.json";
import equipmentJson from "../content/cards.equipment.json";
import stadiumsJson from "../content/cards.stadiums.json";
import pitchesJson from "../content/pitches.json";
import combosJson from "../content/combos.json";
import type { ComboMeta, EquipmentCard, PitchCard, PlayerCard, StadiumCard } from "./types";
import { Random } from "../utils/Random";

export const RULES = {
  handSize: 8,
  maxCardsPerPlay: 5,
  playsPerInning: 4,
  discardsPerInning: 3,
  startingCash: 4,
  rewardBase: 3,
  firstTarget: 15,
  targetGrowth: 1.35,
  finalInning: 9,
  maxEquipment: 5,
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

  /** Shop offers for the current visit. */
  shopOffers: EquipmentCard[] = [];

  startRun(seed?: string): void {
    this.rng = new Random(seed);
    this.inning = 1;
    this.cash = RULES.startingCash;
    this.equipment = [];
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
    this.phase = "inning";
  }

  recordPlay(runsScored: number): void {
    this.runs += runsScored;
    this.playsLeft -= 1;
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

  /** Called after winning an inning; pays out and rolls the shop. */
  finishInning(): void {
    this.cash += RULES.rewardBase + this.playsLeft;
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
