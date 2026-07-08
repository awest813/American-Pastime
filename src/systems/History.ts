/** One finished season, win or lose. Abandoned runs are not recorded. */
export interface RunRecord {
  seed: string;
  victory: boolean;
  inningReached: number;
  totalRuns: number;
  moonshots: number;
  bestPlayLabel: string;
  bestPlayRuns: number;
  endedAt: number;
}

/** All-time counters plus the most recent seasons (newest first). */
export interface HistoryData {
  seasons: number;
  pennants: number;
  bestInning: number;
  mostRunsSeason: number;
  records: RunRecord[];
}

const STORAGE_KEY = "cardball.history.v1";
const MAX_RECORDS = 10;

const EMPTY: HistoryData = { seasons: 0, pennants: 0, bestInning: 0, mostRunsSeason: 0, records: [] };

function sanitizeRecord(raw: unknown): RunRecord | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.seed !== "string") return null;
  return {
    seed: r.seed,
    victory: Boolean(r.victory),
    inningReached: Math.max(1, Math.trunc(Number(r.inningReached) || 1)),
    totalRuns: Math.max(0, Math.trunc(Number(r.totalRuns) || 0)),
    moonshots: Math.max(0, Math.trunc(Number(r.moonshots) || 0)),
    bestPlayLabel: typeof r.bestPlayLabel === "string" ? r.bestPlayLabel : "",
    bestPlayRuns: Math.max(0, Math.trunc(Number(r.bestPlayRuns) || 0)),
    endedAt: Math.max(0, Math.trunc(Number(r.endedAt) || 0)),
  };
}

export function loadHistory(): HistoryData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...EMPTY, records: [] };
    const raw = JSON.parse(stored) as Record<string, unknown>;
    const records = Array.isArray(raw.records)
      ? raw.records.map(sanitizeRecord).filter((r): r is RunRecord => r !== null).slice(0, MAX_RECORDS)
      : [];
    return {
      seasons: Math.max(0, Math.trunc(Number(raw.seasons) || 0)),
      pennants: Math.max(0, Math.trunc(Number(raw.pennants) || 0)),
      bestInning: Math.max(0, Math.trunc(Number(raw.bestInning) || 0)),
      mostRunsSeason: Math.max(0, Math.trunc(Number(raw.mostRunsSeason) || 0)),
      records,
    };
  } catch {
    return { ...EMPTY, records: [] }; // corrupt/blocked storage — a blank book, not a crash
  }
}

/** Fold a finished season into the book and persist it. */
export function recordRun(record: RunRecord): HistoryData {
  const data = loadHistory();
  data.seasons += 1;
  if (record.victory) data.pennants += 1;
  data.bestInning = Math.max(data.bestInning, record.inningReached);
  data.mostRunsSeason = Math.max(data.mostRunsSeason, record.totalRuns);
  data.records = [record, ...data.records].slice(0, MAX_RECORDS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or blocked — the record book just won't persist
  }
  return data;
}
