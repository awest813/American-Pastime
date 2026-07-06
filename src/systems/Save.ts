import type { DeckSnapshot } from "./DeckSystem";
import type { RunPhase, RunState } from "./RunSystem";
import type { BattingApproach } from "./types";

/** The complete on-disk shape of a saved run. */
export interface SaveData {
  version: number;
  run: RunState;
  deck: DeckSnapshot;
  /** Card ids currently in hand, in fan order. */
  hand: string[];
  /** Card ids currently selected, in click order (subset of hand). */
  selection: string[];
  /** Current batting approach; optional so older v1 saves resume as Swing. */
  approach?: BattingApproach;
  lastSeed: string;
  savedAt: number;
}

/** The one-line digest the title screen shows on the CONTINUE button. */
export interface SaveSummary {
  inning: number;
  seed: string;
  cash: number;
  phase: RunPhase;
  equipment: number;
  savedAt: number;
}

const STORAGE_KEY = "cardball.save.v1";
const SAVE_VERSION = 1;

/** Only mid-run states are worth resuming; menus and end screens are not. */
function isResumablePhase(phase: RunPhase): boolean {
  return phase === "inning" || phase === "shop";
}

function isBattingApproach(value: unknown): value is BattingApproach {
  return value === "swing" || value === "small_ball" || value === "take" || value === "steal";
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
  if (save.approach !== undefined && !isBattingApproach(save.approach)) return false;
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

/** Stamp a payload with the current version and timestamp. */
export function createSaveData(data: Omit<SaveData, "version" | "savedAt">): SaveData {
  return { ...data, version: SAVE_VERSION, savedAt: Date.now() };
}

export function persistSave(data: Omit<SaveData, "version" | "savedAt">): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createSaveData(data)));
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
    equipment: save.run.equipment.length,
    savedAt: save.savedAt,
  };
}

/** "just now" / "12m ago" / "3h ago" / "2d ago" for the continue summary. */
export function describeAge(savedAt: number): string {
  const minutes = Math.floor((Date.now() - savedAt) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Run codes ────────────────────────────────────────────────────────────────
// A run code is a full SaveData packed into a paste-able string:
//   CB1.<fnv1a checksum of payload>.<payload>
// where payload is deflate-compressed JSON in base64url ("D" marker) or, when
// CompressionStream is unavailable, plain base64url JSON ("J" marker).

const CODE_PREFIX = "CB1.";

export function isRunCode(text: string): boolean {
  return text.trim().startsWith(CODE_PREFIX);
}

function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(text: string): Uint8Array {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function pipeThrough(bytes: Uint8Array, stream: GenericTransformStream): Promise<Uint8Array> {
  const blob = new Blob([bytes as BlobPart]);
  const out = await new Response(blob.stream().pipeThrough(stream)).arrayBuffer();
  return new Uint8Array(out);
}

/** Pack the save into a shareable string. */
export async function encodeRunCode(save: SaveData): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(save));
  let payload: string;
  if (typeof CompressionStream !== "undefined") {
    payload = `D${bytesToBase64Url(await pipeThrough(json, new CompressionStream("deflate")))}`;
  } else {
    payload = `J${bytesToBase64Url(json)}`;
  }
  return `${CODE_PREFIX}${fnv1a(payload)}.${payload}`;
}

/** Unpack and validate a pasted run code; null on any corruption or mismatch. */
export async function decodeRunCode(code: string): Promise<SaveData | null> {
  try {
    const trimmed = code.trim();
    if (!trimmed.startsWith(CODE_PREFIX)) return null;
    const rest = trimmed.slice(CODE_PREFIX.length);
    const dot = rest.indexOf(".");
    if (dot < 0) return null;
    const checksum = rest.slice(0, dot);
    const payload = rest.slice(dot + 1);
    if (fnv1a(payload) !== checksum) return null; // truncated or mangled paste
    const marker = payload[0];
    const bytes = base64UrlToBytes(payload.slice(1));
    let json: string;
    if (marker === "D") {
      json = new TextDecoder().decode(await pipeThrough(bytes, new DecompressionStream("deflate")));
    } else if (marker === "J") {
      json = new TextDecoder().decode(bytes);
    } else {
      return null;
    }
    const parsed: unknown = JSON.parse(json);
    return looksValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
