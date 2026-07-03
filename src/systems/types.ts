export type Position = "P" | "C" | "1B" | "2B" | "3B" | "SS" | "LF" | "CF" | "RF" | "DH";
export type Side = "L" | "R" | "S";
export type Era = "Vintage" | "Modern";
export type Rarity = "Rookie" | "Starter" | "AllStar" | "Legend";
export type Stat = "power" | "contact" | "speed" | "discipline" | "defense";

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
  runs: number;
  combos: DetectedCombo[];
  lines: ScoreLine[];
}
