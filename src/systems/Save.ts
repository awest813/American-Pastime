import type { DeckSnapshot } from "./DeckSystem";
import type { RunPhase, RunState } from "./RunSystem";

/** The complete on-disk shape of a saved run. */
export interface SaveData {
  version: number;
  run: RunState;
  deck: DeckSnapshot;
  /** Card ids currently in hand, in fan order. */
  hand: string[];
  /** Card ids currently selected, in click order (subset of hand). */
  selection: string[];
  lastSeed: string;
  savedAt: number;
}

/** The one-line digest the title screen shows on the CONTINUE button. */
export interface SaveSummary {
  inning: number;
  seed: string;
  cash: number;
  phase: RunPhase;
}

const STORAGE_KEY = "cardball.save.v1";
const SAVE_VERSION = 1;

/** Only mid-run states are worth resuming; menus and end screens are not. */
function isResumablePhase(phase: RunPhase): boolean {
  return phase === "inning" || phase === "shop";
}

/** Lightweight structural check so a corrupt or foreign blob never reaches the
 *  game restore path. Deep content-id validation happens later in RunSystem. */
function looksValid(data: unknown): data is SaveData {
  if (typeof data !== "object" || data === null) return false;
  const save = data as Partial<SaveData>;
  if (save.version !== SAVE_VERSION) return false;
  if (typeof save.run !== "object" || save.run === null) return false;
  if (typeof save.deck !== "object" || save.deck === null) return false;
  if (!Array.isArray(save.hand) || !Array.isArray(save.selection)) return false;
  if (!Array.isArray(save.run.deckCards) || save.run.deckCards.length === 0) return false;
  if (!isResumablePhase(save.run.phase)) return false;
  return true;
}

/** Read and structurally validate the saved run, or null if none/invalid. */
export function loadSave(): SaveData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (!looksValid(parsed)) {
      clearSave(); // stale/foreign blob — drop it so it never blocks a fresh start
      return null;
    }
    return parsed;
  } catch {
    return null; // unavailable storage / bad JSON — behave as if there's no save
  }
}

export function persistSave(data: Omit<SaveData, "version" | "savedAt">): void {
  try {
    const full: SaveData = { ...data, version: SAVE_VERSION, savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  } catch {
    // storage full or blocked (private mode) — the run simply won't be resumable
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to do; a stale save at worst gets overwritten on the next run
  }
}

export function summarize(save: SaveData): SaveSummary {
  return {
    inning: save.run.inning,
    seed: save.run.rng.seed,
    cash: save.run.cash,
    phase: save.run.phase,
  };
}
