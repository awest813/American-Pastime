export type Position = "P" | "C" | "1B" | "2B" | "3B" | "SS" | "LF" | "CF" | "RF" | "DH";
export type Side = "L" | "R" | "S";
export type Era = "Vintage" | "Modern";
export type Rarity = "Rookie" | "Starter" | "AllStar" | "Legend";

export const RARITY_LADDER: Rarity[] = ["Rookie", "Starter", "AllStar", "Legend"];
export const RARITY_DISPLAY: Record<Rarity, string> = {
  Rookie: "Rookie",
  Starter: "Starter",
  AllStar: "All-Star",
  Legend: "Legend",
};
export type Stat = "power" | "contact" | "speed" | "discipline" | "defense";
export type BattingApproach = "swing" | "small_ball" | "take" | "steal";

export interface BaseState {
  first: boolean;
  second: boolean;
  third: boolean;
}

export interface BaseRunner {
  id: string;
  name: string;
  speed: number;
}

export interface RunnerState {
  first: BaseRunner | null;
  second: BaseRunner | null;
  third: BaseRunner | null;
}

export interface CountState {
  balls: number;
  strikes: number;
}

export interface ScorecardEntry {
  inning: number;
  count: CountState;
  summary: string;
  detail: string;
  runs: number;
  outs: number;
}

export interface PlayerCard {
  id: string;
  name: string;
  team: string;
  position: Position;
  side: Side;
  era: Era;
  rarity: Rarity;
  power: number;
  contact: number;
  speed: number;
  discipline: number;
  defense: number;
  trait?: string;
  traitId?: string;
}

export interface EquipmentCard {
  id: string;
  name: string;
  price: number;
  description: string;
  effect: string;
}

export interface StadiumCard {
  id: string;
  name: string;
  description: string;
  effect: string;
}

export interface PitchCard {
  id: string;
  name: string;
  hand: Side;
  difficulty: number;
  description: string;
  statMods: Partial<Record<Stat, number>>;
  special?: string;
}

export interface BossCard {
  id: string;
  name: string;
  description: string;
}

export interface ComboMeta {
  id: string;
  name: string;
  description: string;
  reward: string;
}

/** A combo detected in the currently selected/played cards. */
export interface DetectedCombo {
  id: string;
  name: string;
  kind: "flat" | "mult";
  value: number;
  detail: string;
}

export interface ScoreLine {
  label: string;
  value: string;
}

export interface ScoreResult {
  base: number;
  flatBonus: number;
  multiplier: number;
  difficulty: number;
  /** Contact quality before base-runner conversion; higher means harder contact. */
  quality: number;
  runs: number;
  outs: number;
  bases: number;
  outcome: string;
  basesBefore: BaseState;
  basesAfter: BaseState;
  runnersBefore: RunnerState;
  runnersAfter: RunnerState;
  count: CountState;
  playByPlay: string[];
  /** Plays consumed by committing this hand (2 vs The Ace with a big bat). */
  playCost: number;
  combos: DetectedCombo[];
  lines: ScoreLine[];
}
