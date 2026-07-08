import { ComboSystem } from "../systems/ComboSystem";
import { DeckSystem } from "../systems/DeckSystem";
import { RULES, RunSystem } from "../systems/RunSystem";
import { ScoreSystem, type ScoreContext } from "../systems/ScoreSystem";
import type { BattingApproach, PlayerCard, ScoreResult } from "../systems/types";

/**
 * Headless balance harness: a greedy bot plays full seeded runs through the
 * real RunSystem/DeckSystem/ScoreSystem (no UI), so target curves and the
 * economy can be tuned against measured outcomes instead of vibes.
 *
 * Run it with: node scripts/simulate.mjs [seedCount]
 */

const cps = (c: PlayerCard): number => c.contact + c.power + c.speed;

/** All subsets of the hand with 1..maxSize cards. */
function subsets(hand: PlayerCard[], maxSize: number): PlayerCard[][] {
  const out: PlayerCard[][] = [];
  const n = hand.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    const size = popcount(mask);
    if (size > maxSize) continue;
    const cards: PlayerCard[] = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) cards.push(hand[i]);
    out.push(cards);
  }
  return out;
}

const popcount = (x: number): number => {
  let count = 0;
  while (x) {
    x &= x - 1;
    count++;
  }
  return count;
};

interface Candidate {
  cards: PlayerCard[];
  approach: BattingApproach;
  result: ScoreResult;
  value: number;
}

interface InningLog {
  inning: number;
  target: number;
  runs: number;
  won: boolean;
  boss: string | null;
  playsUsed: number;
  discardsUsed: number;
}

export interface RunLog {
  seed: string;
  victory: boolean;
  lossInning: number | null;
  innings: InningLog[];
  finalCash: number;
  upgradesBought: number;
  gear: string[];
}

/** Gear ranked by measured value (see the ablation mode); the bot buys down this list. */
const EQUIP_PRIORITY = [
  "old_glove",
  "bubblegum",
  "lucky_cleats",
  "shin_guards",
  "pine_tar_rag",
  "rally_cap",
  "corked_bat",
  "scorekeepers_pencil",
  "weighted_donut",
  "foam_finger",
];

class Bot {
  private run = new RunSystem();
  private deck: DeckSystem;
  private score = new ScoreSystem(new ComboSystem());
  private hand: PlayerCard[] = [];
  private upgradesBought = 0;

  constructor(private seed: string, private gearPriority: string[] = EQUIP_PRIORITY) {
    this.run.startRun(seed);
    this.deck = new DeckSystem(this.run.rng);
    this.deck.reset(this.run.deckCards);
  }

  private ctx(approach: BattingApproach): ScoreContext {
    return {
      pitch: this.run.pitch,
      stadium: this.run.stadium,
      equipment: this.run.equipment,
      runsSoFar: this.run.runs,
      target: this.run.target,
      outs: this.run.outs,
      bases: this.run.bases,
      runners: this.run.runners,
      count: this.run.count,
      approach,
      boss: this.run.boss,
      umpireTarget: this.run.umpireTarget,
      playsLeft: this.run.playsLeft,
    };
  }

  private refill(): void {
    const need = RULES.handSize - this.hand.length;
    if (need > 0) this.hand.push(...this.deck.draw(need));
  }

  /** Same greedy calculus a decent player runs: runs now beat runners later,
   *  a clinch beats everything, and outs get expensive as they stack up. */
  private valueOf(result: ScoreResult): number {
    const winsInning = this.run.runs + result.runs >= this.run.target;
    let value = result.runs * 100 + (winsInning ? 5000 : 0);
    const outsAfter = this.run.outs + result.outs;
    value -= result.outs * (outsAfter >= RULES.outsPerInning ? 700 : 90);
    const after = result.basesAfter;
    value += (after.first ? 6 : 0) + (after.second ? 12 : 0) + (after.third ? 20 : 0);
    value += Math.min(result.quality, 30) * 0.5;
    value -= (result.playCost - 1) * 60;
    return value;
  }

  /** Order matters only through first-card effects; put the right card first. */
  private orderFor(cards: PlayerCard[]): PlayerCard[] {
    const sorted = [...cards];
    if (this.run.pitch.special === "changeup") {
      sorted.sort((a, b) => cps(a) - cps(b)); // sacrifice the weakest to the halving
    } else if (this.run.equipment.some((e) => e.effect === "pine_tar_rag")) {
      sorted.sort((a, b) => b.contact - a.contact); // tar the best contact bat
    } else {
      sorted.sort((a, b) => cps(b) - cps(a));
    }
    return sorted;
  }

  private bestCandidate(): Candidate {
    const approaches: BattingApproach[] =
      this.run.inning >= 2 ? ["swing", "small_ball", "take", "steal"] : ["swing", "small_ball"];
    let best: Candidate | null = null;
    for (const subset of subsets(this.hand, this.run.maxCardsThisPlay)) {
      const ordered = this.orderFor(subset);
      for (const approach of approaches) {
        const result = this.score.evaluate(ordered, this.ctx(approach));
        const value = this.valueOf(result);
        if (!best || value > best.value) {
          best = { cards: ordered, approach, result, value };
        }
      }
    }
    return best!;
  }

  private playInning(): InningLog {
    this.refill();
    let playsUsed = 0;
    let discardsUsed = 0;

    while (!this.run.inningWon && !this.run.inningLost) {
      const best = this.bestCandidate();

      // A dud hand (an out with no runs) is worth a mulligan while we can.
      const dud = best.result.runs === 0 && best.result.outs > 0;
      if (dud && this.run.discardsLeft > 0 && this.hand.length > 4) {
        const junk = [...this.hand].sort((a, b) => cps(a) - cps(b)).slice(0, 4);
        this.hand = this.hand.filter((c) => !junk.includes(c));
        this.deck.discard(junk);
        this.run.recordDiscard();
        discardsUsed++;
        this.refill();
        continue;
      }

      this.hand = this.hand.filter((c) => !best.cards.includes(c));
      this.deck.discard(best.cards);
      this.run.recordPlay(
        best.result.runs,
        best.result.playCost,
        best.result.outs,
        best.result.basesAfter,
        best.result.runnersAfter,
      );
      playsUsed += best.result.playCost;
      this.refill();
    }

    const log: InningLog = {
      inning: this.run.inning,
      target: this.run.target,
      runs: this.run.runs,
      won: this.run.inningWon,
      boss: this.run.boss?.id ?? null,
      playsUsed,
      discardsUsed,
    };

    // Mirror GameScene.clearHand: the hand returns to the discard pile.
    this.deck.discard(this.hand);
    this.hand = [];
    return log;
  }

  private shop(): void {
    // Upgrades compound across the whole run, so they come first…
    let bought = true;
    while (bought) {
      bought = false;
      const candidates = this.run.upgradeCandidates
        .filter((c) => (this.run.upgradeCost(c) ?? Infinity) <= this.run.cash)
        .sort((a, b) => cps(b) - cps(a));
      if (candidates.length > 0 && this.run.upgradeCard(candidates[0])) {
        this.upgradesBought++;
        bought = true;
      }
    }
    // …then gear, best expected value first.
    for (const effect of this.gearPriority) {
      const offer = this.run.shopOffers.find((o) => o.effect === effect);
      if (offer && this.run.cash >= offer.price) this.run.buyEquipment(offer);
    }
  }

  play(): RunLog {
    const innings: InningLog[] = [];
    let lossInning: number | null = null;

    for (;;) {
      const log = this.playInning();
      innings.push(log);
      if (!log.won) {
        lossInning = log.inning;
        break;
      }
      this.run.finishInning();
      if (this.run.phase === "victory") break;
      this.shop();
      this.run.nextInning();
    }

    return {
      seed: this.seed,
      victory: this.run.phase === "victory",
      lossInning,
      innings,
      finalCash: this.run.cash,
      upgradesBought: this.upgradesBought,
      gear: this.run.equipment.map((e) => e.id),
    };
  }
}

const pct = (n: number, d: number): string => (d === 0 ? "  —" : `${((n / d) * 100).toFixed(0)}%`.padStart(4));

/** Win rate over a fixed seed set with a given gear-buying policy. Same seeds
 *  across configs, so deltas are paired comparisons, not noise. */
function winRateWith(seedCount: number, gearPriority: string[]): { winRate: number; avgLossInning: number } {
  let wins = 0;
  let lossSum = 0;
  let losses = 0;
  for (let i = 0; i < seedCount; i++) {
    const log = new Bot(`SIM-${String(i).padStart(4, "0")}`, gearPriority).play();
    if (log.victory) wins++;
    else {
      lossSum += log.lossInning ?? 0;
      losses++;
    }
  }
  return { winRate: wins / seedCount, avgLossInning: losses > 0 ? lossSum / losses : RULES.finalInning };
}

/**
 * Gear ablation: measure each item's marginal value by soloing it (only that
 * item is ever bought) and banning it (everything else available). Paired
 * seeds keep the comparison honest despite the modest sample.
 */
export function ablation(seedCount = 150): void {
  console.log(`\n=== Gear ablation · ${seedCount} paired seeds per config ===`);
  const baseline = winRateWith(seedCount, EQUIP_PRIORITY);
  const none = winRateWith(seedCount, []);
  console.log(`baseline (all gear buyable): ${(baseline.winRate * 100).toFixed(1)}%   ·   no gear at all: ${(none.winRate * 100).toFixed(1)}%\n`);
  console.log("item                  solo win%   ban win%   solo-vs-none   ban-vs-baseline");
  for (const effect of EQUIP_PRIORITY) {
    const solo = winRateWith(seedCount, [effect]);
    const ban = winRateWith(
      seedCount,
      EQUIP_PRIORITY.filter((e) => e !== effect),
    );
    const soloLift = (solo.winRate - none.winRate) * 100;
    const banDrop = (ban.winRate - baseline.winRate) * 100;
    console.log(
      `${effect.padEnd(22)}${(solo.winRate * 100).toFixed(1).padStart(8)}%${(ban.winRate * 100).toFixed(1).padStart(10)}%` +
        `${(soloLift >= 0 ? "+" : "") + soloLift.toFixed(1).padStart(6)}%${(banDrop >= 0 ? "+" : "") + banDrop.toFixed(1).padStart(10)}%`,
    );
  }
}

export function main(seedCount = 200): void {
  const logs: RunLog[] = [];
  const started = Date.now();
  for (let i = 0; i < seedCount; i++) {
    logs.push(new Bot(`SIM-${String(i).padStart(4, "0")}`).play());
  }
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  const wins = logs.filter((l) => l.victory).length;
  console.log(`\n=== Cardball balance sim · ${seedCount} seeds · ${elapsed}s ===`);
  console.log(`Pennants won: ${wins}/${seedCount} (${((wins / seedCount) * 100).toFixed(1)}%)\n`);

  console.log("inning  reached  cleared  clear%   avg runs  avg target  max runs  boss-losses");
  for (let inning = 1; inning <= RULES.finalInning; inning++) {
    const reached = logs.flatMap((l) => l.innings.filter((i) => i.inning === inning));
    if (reached.length === 0) break;
    const cleared = reached.filter((i) => i.won);
    const bossLosses = reached.filter((i) => !i.won && i.boss).length;
    const avgRuns = reached.reduce((s, i) => s + i.runs, 0) / reached.length;
    const avgTarget = reached.reduce((s, i) => s + i.target, 0) / reached.length;
    const maxRuns = Math.max(...reached.map((i) => i.runs));
    console.log(
      `${String(inning).padStart(6)}  ${String(reached.length).padStart(7)}  ${String(cleared.length).padStart(7)}  ` +
        `${pct(cleared.length, reached.length)}   ${avgRuns.toFixed(2).padStart(8)}  ${avgTarget.toFixed(1).padStart(10)}  ` +
        `${String(maxRuns).padStart(8)}  ${String(bossLosses).padStart(11)}`,
    );
  }

  const lossHist = new Map<number, number>();
  for (const l of logs) if (l.lossInning !== null) lossHist.set(l.lossInning, (lossHist.get(l.lossInning) ?? 0) + 1);
  console.log(`\nLosses by inning: ${[...lossHist.entries()].sort((a, b) => a[0] - b[0]).map(([i, n]) => `${i}:${n}`).join("  ") || "none"}`);

  const finishers = logs.filter((l) => l.victory);
  if (finishers.length > 0) {
    console.log(`Winners' avg leftover cash: $${(finishers.reduce((s, l) => s + l.finalCash, 0) / finishers.length).toFixed(1)}`);
    console.log(`Winners' avg upgrades bought: ${(finishers.reduce((s, l) => s + l.upgradesBought, 0) / finishers.length).toFixed(1)}`);
  }
  const gearCounts = new Map<string, number>();
  for (const l of logs) for (const g of l.gear) gearCounts.set(g, (gearCounts.get(g) ?? 0) + 1);
  console.log(`Gear owned at run end: ${[...gearCounts.entries()].sort((a, b) => b[1] - a[1]).map(([g, n]) => `${g}:${n}`).join("  ")}`);
  const avgUpgrades = logs.reduce((s, l) => s + l.upgradesBought, 0) / logs.length;
  console.log(`Avg upgrades bought (all runs): ${avgUpgrades.toFixed(1)}`);
}
