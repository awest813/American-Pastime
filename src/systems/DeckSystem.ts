import type { PlayerCard } from "./types";
import type { Random } from "../utils/Random";

/** Serializable pile ordering; cards are stored by id and rehydrated on load. */
export interface DeckSnapshot {
  draw: string[];
  discard: string[];
}

/**
 * Draw pile + discard pile. When the draw pile runs dry the discards are
 * reshuffled back in, so a 30-card deck supports a whole inning of plays.
 */
export class DeckSystem {
  private drawPile: PlayerCard[] = [];
  private discardPile: PlayerCard[] = [];

  constructor(private rng: Random) {}

  /** Exact pile ordering, by card id, for save/resume. */
  snapshot(): DeckSnapshot {
    return { draw: this.drawPile.map((c) => c.id), discard: this.discardPile.map((c) => c.id) };
  }

  /** Restore pile ordering from a snapshot, resolving ids against the run's deck.
   *  @returns false if any saved id is missing (content changed under the save). */
  restore(snap: DeckSnapshot, byId: Map<string, PlayerCard>): boolean {
    const resolve = (ids: string[]): PlayerCard[] | null => {
      const cards: PlayerCard[] = [];
      for (const id of ids) {
        const card = byId.get(id);
        if (!card) return null;
        cards.push(card);
      }
      return cards;
    };
    const draw = resolve(snap.draw);
    const discard = resolve(snap.discard);
    if (!draw || !discard) return false;
    this.drawPile = draw;
    this.discardPile = discard;
    return true;
  }

  reset(cards: PlayerCard[]): void {
    this.drawPile = this.rng.shuffle(cards);
    this.discardPile = [];
  }

  get remaining(): number {
    return this.drawPile.length;
  }

  draw(count: number): PlayerCard[] {
    const drawn: PlayerCard[] = [];
    for (let i = 0; i < count; i++) {
      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) break;
        this.drawPile = this.rng.shuffle(this.discardPile);
        this.discardPile = [];
      }
      drawn.push(this.drawPile.pop()!);
    }
    return drawn;
  }

  discard(cards: PlayerCard[]): void {
    this.discardPile.push(...cards);
  }
}
