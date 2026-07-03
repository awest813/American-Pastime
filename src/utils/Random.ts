/**
 * Deterministic seeded RNG so every run is replayable from its seed
 * (e.g. "SEASON-0420"). Mulberry32 over an FNV-1a hash of the seed string.
 */
export class Random {
  readonly seed: string;
  private state: number;

  constructor(seed?: string) {
    this.seed = seed ?? Random.generateSeed();
    this.state = Random.hash(this.seed);
  }

  static generateSeed(): string {
    const n = Math.floor(Math.random() * 10000);
    return `SEASON-${n.toString().padStart(4, "0")}`;
  }

  private static hash(str: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  /** Uniform float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)];
  }

  /** Fisher-Yates shuffle; returns a new array. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
}
