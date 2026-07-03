import type { PlayerCard } from "./types";
import type { Random } from "../utils/Random";

/**
 * Draw pile + discard pile. When the draw pile runs dry the discards are
 * reshuffled back in, so a 30-card deck supports a whole inning of plays.
 */
export class DeckSystem {
  private drawPile: PlayerCard[] = [];
  private discardPile: PlayerCard[] = [];

  constructor(private rng: Random) {}

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
