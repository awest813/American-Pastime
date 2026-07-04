export type GameSpeed = "normal" | "fast" | "turbo";

export interface SettingsData {
  /** Master volume 0..1, applied on top of the stinger mix. */
  volume: number;
  muted: boolean;
  /** Looping crowd-murmur bed under the stingers during a run. */
  ambience: boolean;
  screenShake: boolean;
  /** Animation speed preset; maps to Tweens.timeScale. */
  speed: GameSpeed;
}

export const SPEED_SCALE: Record<GameSpeed, number> = {
  normal: 1,
  fast: 1.6,
  turbo: 2.4,
};

export const SPEED_ORDER: GameSpeed[] = ["normal", "fast", "turbo"];

const STORAGE_KEY = "cardball.settings.v1";

const DEFAULTS: SettingsData = {
  volume: 0.7,
  muted: false,
  ambience: true,
  screenShake: true,
  speed: "normal",
};

function sanitize(raw: unknown): SettingsData {
  const data = { ...DEFAULTS };
  if (typeof raw !== "object" || raw === null) return data;
  const record = raw as Record<string, unknown>;
  if (typeof record.volume === "number" && Number.isFinite(record.volume)) {
    data.volume = Math.min(1, Math.max(0, record.volume));
  }
  if (typeof record.muted === "boolean") data.muted = record.muted;
  if (typeof record.ambience === "boolean") data.ambience = record.ambience;
  if (typeof record.screenShake === "boolean") data.screenShake = record.screenShake;
  if (record.speed === "normal" || record.speed === "fast" || record.speed === "turbo") {
    data.speed = record.speed;
  }
  return data;
}

function load(): SettingsData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULTS };
    return sanitize(JSON.parse(stored));
  } catch {
    return { ...DEFAULTS }; // private browsing / corrupt JSON — defaults, not a crash
  }
}

/** The one live settings object; mutate fields then call saveSettings(). */
export const settings: SettingsData = load();

export function saveSettings(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // storage may be unavailable; settings still apply for this session
  }
}

/** Put every option back to factory defaults (and persist that). */
export function resetSettings(): void {
  Object.assign(settings, DEFAULTS);
  saveSettings();
}
