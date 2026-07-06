import { ComboSystem, type EffectiveCard } from "./ComboSystem";
import type {
  BaseRunner,
  BattingApproach,
  BaseState,
  BossCard,
  CountState,
  EquipmentCard,
  PitchCard,
  PlayerCard,
  Position,
  RunnerState,
  ScoreLine,
  ScoreResult,
  Stat,
  StadiumCard,
} from "./types";

export interface ScoreContext {
  pitch: PitchCard;
  stadium: StadiumCard | null;
  equipment: EquipmentCard[];
  /** Runs already scored this inning, for behind-the-target effects like Rally Cap. */
  runsSoFar: number;
  target: number;
  outs: number;
  bases: BaseState;
  runners?: RunnerState;
  count?: CountState;
  approach: BattingApproach;
  /** Boss pitcher rules (innings 3/6/9); null on regular innings. */
  boss: BossCard | null;
  umpireTarget: Position | null;
  /** Plays remaining BEFORE this play commits — The Closer punishes the last one. */
  playsLeft: number;
}

const STATS: Stat[] = ["power", "contact", "speed", "discipline", "defense"];

const EMPTY_RUNNERS: RunnerState = { first: null, second: null, third: null };
const DEFAULT_COUNT: CountState = { balls: 0, strikes: 0 };
const APPROACH_LABEL: Record<BattingApproach, string> = {
  swing: "Swing Away",
  small_ball: "Bunt / Small Ball",
  take: "Take Pitch",
  steal: "Steal",
};

interface Outcome {
  label: string;
  detail: string;
  bases: number;
  runs: number;
  outs: number;
  basesAfter: BaseState;
  runnersAfter: RunnerState;
  playByPlay: string[];
}

/**
 * Turns a played set of cards into runs, deterministically.
 *
 * Pipeline (baseball language on top, plain math underneath):
 *   effective stats  = card stats + stadium/equipment tweaks, then pitch modifiers
 *   base score       = total Contact + Power + Speed
 *   flat bonuses     = combos, traits, equipment, pitch specials
 *   runs             = (base + flat) x multipliers / pitch difficulty
 *
 * evaluate() is pure: the preview panel and the confirmed play call the same
 * function with the same inputs, so the projected total is always honest.
 */
export class ScoreSystem {
  constructor(private combos: ComboSystem) {}

  private cloneRunner(runner: BaseRunner | null): BaseRunner | null {
    return runner ? { ...runner } : null;
  }

  private cloneRunners(runners: RunnerState): RunnerState {
    return {
      first: this.cloneRunner(runners.first),
      second: this.cloneRunner(runners.second),
      third: this.cloneRunner(runners.third),
    };
  }

  private runnersFromBases(bases: BaseState): RunnerState {
    return {
      first: bases.first ? { id: "legacy-first", name: "Runner", speed: 5 } : null,
      second: bases.second ? { id: "legacy-second", name: "Runner", speed: 5 } : null,
      third: bases.third ? { id: "legacy-third", name: "Runner", speed: 5 } : null,
    };
  }

  private runnersFor(ctx: ScoreContext): RunnerState {
    return this.cloneRunners(ctx.runners ?? this.runnersFromBases(ctx.bases));
  }

  private cloneCount(count: CountState | undefined): CountState {
    return {
      balls: Math.max(0, Math.min(3, Math.trunc(count?.balls ?? DEFAULT_COUNT.balls))),
      strikes: Math.max(0, Math.min(2, Math.trunc(count?.strikes ?? DEFAULT_COUNT.strikes))),
    };
  }

  private countString(count: CountState): string {
    return `${count.balls}-${count.strikes}`;
  }

  private countPressure(count: CountState): "full" | "hitter" | "pitcher" | "neutral" {
    if (count.balls === 3 && count.strikes === 2) return "full";
    if (count.balls >= 2 && count.balls > count.strikes) return "hitter";
    if (count.strikes >= 2 && count.strikes > count.balls) return "pitcher";
    return "neutral";
  }

  private basesFromRunners(runners: RunnerState): BaseState {
    return { first: Boolean(runners.first), second: Boolean(runners.second), third: Boolean(runners.third) };
  }

  private runnerFromCard(card: PlayerCard): BaseRunner {
    return { id: card.id, name: card.name, speed: card.speed };
  }

  private baseKey(base: 1 | 2 | 3): keyof RunnerState {
    return base === 1 ? "first" : base === 2 ? "second" : "third";
  }

  private baseLabel(base: number): string {
    if (base === 1) return "first";
    if (base === 2) return "second";
    if (base === 3) return "third";
    return "home";
  }

  private compactRunnerName(runner: BaseRunner): string {
    const parts = runner.name.replace(/\s*'[^']+'\s*/g, " ").replace(/\s+/g, " ").trim().split(" ");
    return parts.length > 1 ? parts[parts.length - 1] : parts[0];
  }

  private runnerString(runners: RunnerState): string {
    const occupied = [
      runners.first ? `1B ${this.compactRunnerName(runners.first)}` : "",
      runners.second ? `2B ${this.compactRunnerName(runners.second)}` : "",
      runners.third ? `3B ${this.compactRunnerName(runners.third)}` : "",
    ].filter(Boolean);
    return occupied.length > 0 ? occupied.join("+") : "empty";
  }

  private placeRunner(after: RunnerState, to: number, runner: BaseRunner, playByPlay: string[]): number {
    if (to >= 4) {
      playByPlay.push(`${runner.name} scores`);
      return 1;
    }
    const target = to as 1 | 2 | 3;
    const targetKey = this.baseKey(target);
    if (!after[targetKey]) {
      after[targetKey] = this.cloneRunner(runner);
      return 0;
    }
    for (let fallback = target - 1; fallback >= 1; fallback--) {
      const key = this.baseKey(fallback as 1 | 2 | 3);
      if (!after[key]) {
        after[key] = this.cloneRunner(runner);
        playByPlay.push(`${runner.name} holds at ${this.baseLabel(fallback)}`);
        return 0;
      }
    }
    playByPlay.push(`${runner.name} is forced home`);
    return 1;
  }

  private advanceHit(runners: RunnerState, batter: PlayerCard, batterBases: number): { bases: BaseState; runners: RunnerState; runs: number; playByPlay: string[] } {
    if (batterBases <= 0) {
      const cloned = this.cloneRunners(runners);
      return { bases: this.basesFromRunners(cloned), runners: cloned, runs: 0, playByPlay: [] };
    }
    const after: RunnerState = { ...EMPTY_RUNNERS };
    let runs = 0;
    const playByPlay: string[] = [];
    const advanceRunner = (from: 1 | 2 | 3, runner: BaseRunner) => {
      let to = from + batterBases;
      const extraTo = to + 1;
      if (batterBases < 4 && runner.speed >= 8 && to < 4) {
        const extraOpen = extraTo >= 4 || !after[this.baseKey(extraTo as 1 | 2 | 3)];
        if (extraOpen) {
          to = extraTo;
          playByPlay.push(`${runner.name} takes the extra base`);
        }
      }
      runs += this.placeRunner(after, to, runner, playByPlay);
    };
    if (runners.third) advanceRunner(3, runners.third);
    if (runners.second) advanceRunner(2, runners.second);
    if (runners.first) advanceRunner(1, runners.first);
    const batterRunner = this.runnerFromCard(batter);
    if (batterBases >= 4) {
      playByPlay.unshift(`${batter.name} clears the bases`);
      runs += 1;
    } else {
      runs += this.placeRunner(after, batterBases, batterRunner, playByPlay);
      playByPlay.unshift(`${batter.name} reaches ${this.baseLabel(batterBases)}`);
    }
    return { bases: this.basesFromRunners(after), runners: after, runs, playByPlay };
  }

  private advanceWalk(runners: RunnerState, batter: PlayerCard): { bases: BaseState; runners: RunnerState; runs: number; playByPlay: string[] } {
    const after = this.cloneRunners(runners);
    const playByPlay: string[] = [`${batter.name} takes first`];
    let runs = 0;
    if (runners.first && runners.second && runners.third) {
      runs += 1;
      playByPlay.push(`${runners.third.name} scores on the walk`);
      after.third = null;
    }
    if (runners.first && runners.second) {
      after.third = this.cloneRunner(runners.second);
      after.second = null;
    }
    if (runners.first) {
      after.second = this.cloneRunner(runners.first);
    }
    after.first = this.runnerFromCard(batter);
    return { bases: this.basesFromRunners(after), runners: after, runs, playByPlay };
  }

  private advanceRunnersOnly(runners: RunnerState, steps: number): { bases: BaseState; runners: RunnerState; runs: number; playByPlay: string[] } {
    const after: RunnerState = { ...EMPTY_RUNNERS };
    let runs = 0;
    const playByPlay: string[] = [];
    const advanceRunner = (from: 1 | 2 | 3, runner: BaseRunner) => {
      const to = from + steps;
      runs += this.placeRunner(after, to, runner, playByPlay);
    };
    if (runners.third) advanceRunner(3, runners.third);
    if (runners.second) advanceRunner(2, runners.second);
    if (runners.first) advanceRunner(1, runners.first);
    if (playByPlay.length === 0) playByPlay.push("No runners move");
    return { bases: this.basesFromRunners(after), runners: after, runs, playByPlay };
  }

  private stealCandidate(runners: RunnerState): { from: 1 | 2 | 3; to: 2 | 3 | 4; runner: BaseRunner } | null {
    if (runners.third) return { from: 3, to: 4, runner: runners.third };
    if (runners.second && !runners.third) return { from: 2, to: 3, runner: runners.second };
    if (runners.first && !runners.second) return { from: 1, to: 2, runner: runners.first };
    return null;
  }

  private attemptSteal(cards: PlayerCard[], runners: RunnerState, quality: number, discipline: number, count: CountState): Outcome {
    const candidate = this.stealCandidate(runners);
    if (!candidate) {
      const cloned = this.cloneRunners(runners);
      return {
        label: "No Steal On",
        detail: "no open base to take",
        bases: 0,
        runs: 0,
        outs: 0,
        basesAfter: this.basesFromRunners(cloned),
        runnersAfter: cloned,
        playByPlay: ["No runner has a clean jump"],
      };
    }

    const after = this.cloneRunners(runners);
    const cardSpeed = Math.max(...cards.map((c) => c.speed));
    const avgDiscipline = discipline / Math.max(1, cards.length);
    const countJump = count.balls >= 3 ? 2 : count.strikes >= 2 ? -1 : 0;
    const stealScore = quality + candidate.runner.speed + cardSpeed + avgDiscipline * 0.25 + countJump;
    const threshold = candidate.to === 4 ? 24 : 17;
    after[this.baseKey(candidate.from)] = null;

    if (stealScore >= threshold) {
      let runs = 0;
      const playByPlay =
        candidate.to === 4 ? [`${candidate.runner.name} steals home`] : [`${candidate.runner.name} steals ${this.baseLabel(candidate.to)}`];
      if (candidate.to === 4) {
        runs = 1;
      } else {
        after[this.baseKey(candidate.to)] = this.cloneRunner(candidate.runner);
      }
      return {
        label: candidate.to === 4 ? "Steal Home" : "Stolen Base",
        detail: `${this.countString(count)} count, jump score ${Math.round(stealScore)}`,
        bases: 0,
        runs,
        outs: 0,
        basesAfter: this.basesFromRunners(after),
        runnersAfter: after,
        playByPlay,
      };
    }

    return {
      label: "Caught Stealing",
      detail: `${this.countString(count)} count, jump score ${Math.round(stealScore)}`,
      bases: 0,
      runs: 0,
      outs: 1,
      basesAfter: this.basesFromRunners(after),
      runnersAfter: after,
      playByPlay: [`${candidate.runner.name} is caught stealing ${this.baseLabel(candidate.to)}`],
    };
  }

  private buildOutcome(cards: PlayerCard[], quality: number, discipline: number, ctx: ScoreContext, count: CountState): Outcome {
    const runners = this.runnersFor(ctx);
    const batter = cards[0];

    if (ctx.approach === "steal") {
      return this.attemptSteal(cards, runners, quality, discipline, count);
    }

    if (ctx.approach === "take") {
      const takeQuality = quality * 0.45 + discipline * 0.55 + count.balls * 3 - count.strikes * 2;
      if (takeQuality >= 22) {
        const advanced = this.advanceHit(runners, batter, 1);
        return { label: "Patient Single", detail: "worked the count, then lined it", bases: 1, runs: advanced.runs, outs: 0, basesAfter: advanced.bases, runnersAfter: advanced.runners, playByPlay: advanced.playByPlay };
      }
      if (takeQuality >= (count.balls === 3 ? 8 : 10)) {
        const advanced = this.advanceWalk(runners, batter);
        const label = count.balls === 3 ? "Ball Four" : "Walk";
        return { label, detail: "took the close pitch", bases: 1, runs: advanced.runs, outs: 0, basesAfter: advanced.bases, runnersAfter: advanced.runners, playByPlay: advanced.playByPlay };
      }
      const cloned = this.cloneRunners(runners);
      return { label: "Called Out", detail: "watched a good one", bases: 0, runs: 0, outs: 1, basesAfter: this.basesFromRunners(cloned), runnersAfter: cloned, playByPlay: [`${batter.name} takes strike three`] };
    }

    if (ctx.approach === "small_ball") {
      const smallQuality = quality * 0.72 - (count.strikes >= 2 ? 4 : 0);
      const hasTraffic = Boolean(runners.first || runners.second || runners.third);
      if (smallQuality >= 12) {
        const advanced = this.advanceHit(runners, batter, hasTraffic ? 1 : 2);
        return { label: hasTraffic ? "Bunt Single" : "Gap Double", detail: hasTraffic ? "deadens it perfectly" : "small swing found grass", bases: hasTraffic ? 1 : 2, runs: advanced.runs, outs: 0, basesAfter: advanced.bases, runnersAfter: advanced.runners, playByPlay: advanced.playByPlay };
      }
      if (smallQuality >= 5) {
        if (hasTraffic && ctx.outs < 2) {
          const advanced = this.advanceRunnersOnly(runners, 1);
          return { label: "Sacrifice Bunt", detail: "moved the runners", bases: 0, runs: advanced.runs, outs: 1, basesAfter: advanced.bases, runnersAfter: advanced.runners, playByPlay: [`${batter.name} lays down a bunt`, ...advanced.playByPlay] };
        }
        const advanced = this.advanceHit(runners, batter, 1);
        return { label: "Drag Bunt", detail: "beat it out", bases: 1, runs: advanced.runs, outs: 0, basesAfter: advanced.bases, runnersAfter: advanced.runners, playByPlay: advanced.playByPlay };
      }
      if (hasTraffic) {
        if (ctx.outs >= 2) {
          const cloned = this.cloneRunners(runners);
          return { label: "Two-Out Groundout", detail: "no sacrifice available", bases: 0, runs: 0, outs: 1, basesAfter: this.basesFromRunners(cloned), runnersAfter: cloned, playByPlay: [`${batter.name} bunts with two outs`] };
        }
        const advanced = this.advanceRunnersOnly(runners, 1);
        return { label: "Productive Out", detail: "moved the runners", bases: 0, runs: advanced.runs, outs: 1, basesAfter: advanced.bases, runnersAfter: advanced.runners, playByPlay: [`${batter.name} gives himself up`, ...advanced.playByPlay] };
      }
      const cloned = this.cloneRunners(runners);
      return { label: "Bunt Out", detail: "good idea, no traffic", bases: 0, runs: 0, outs: 1, basesAfter: this.basesFromRunners(cloned), runnersAfter: cloned, playByPlay: [`${batter.name} bunts back to the mound`] };
    }

    if (quality >= 18) {
      const advanced = this.advanceHit(runners, batter, 4);
      return { label: "Home Run", detail: "cleared the bases", bases: 4, runs: advanced.runs, outs: 0, basesAfter: advanced.bases, runnersAfter: advanced.runners, playByPlay: advanced.playByPlay };
    }
    if (quality >= 12) {
      const advanced = this.advanceHit(runners, batter, 3);
      return { label: "Triple", detail: "rattled into the corner", bases: 3, runs: advanced.runs, outs: 0, basesAfter: advanced.bases, runnersAfter: advanced.runners, playByPlay: advanced.playByPlay };
    }
    if (quality >= 7) {
      const advanced = this.advanceHit(runners, batter, 2);
      return { label: "Double", detail: "into the gap", bases: 2, runs: advanced.runs, outs: 0, basesAfter: advanced.bases, runnersAfter: advanced.runners, playByPlay: advanced.playByPlay };
    }
    if (quality >= 3) {
      const advanced = this.advanceHit(runners, batter, 1);
      return { label: "Single", detail: "clean contact", bases: 1, runs: advanced.runs, outs: 0, basesAfter: advanced.bases, runnersAfter: advanced.runners, playByPlay: advanced.playByPlay };
    }
    const cloned = this.cloneRunners(runners);
    return { label: "Strikeout", detail: "swing and miss", bases: 0, runs: 0, outs: 1, basesAfter: this.basesFromRunners(cloned), runnersAfter: cloned, playByPlay: [`${batter.name} swings through it`] };
  }

  private hasEquipment(ctx: ScoreContext, effect: string): boolean {
    return ctx.equipment.some((e) => e.effect === effect);
  }

  private buildEffectiveCards(cards: PlayerCard[], ctx: ScoreContext, shielded: boolean): EffectiveCard[] {
    const corked = this.hasEquipment(ctx, "corked_bat");
    const cleats = this.hasEquipment(ctx, "lucky_cleats");
    const pineTar = this.hasEquipment(ctx, "pine_tar_rag");
    const bubblegum = this.hasEquipment(ctx, "bubblegum");
    const stadium = ctx.stadium?.effect;

    return cards.map((card, index) => {
      const stats: Record<Stat, number> = {
        power: card.power,
        contact: card.contact,
        speed: card.speed,
        discipline: card.discipline,
        defense: card.defense,
      };

      if (stadium === "windy_field") stats.power += 1;
      if (stadium === "muddy_diamond") {
        stats.power += 2;
        stats.speed -= 1;
      }
      if (corked) {
        stats.power += 2;
        stats.contact -= 1;
      }
      if (cleats) stats.speed += 2;
      if (bubblegum && card.rarity === "Rookie") {
        for (const s of STATS) stats[s] += 1;
      }
      if (pineTar && index === 0) stats.contact *= 1.5;

      // Boss pitcher stat pressure (not a pitch penalty, so shields don't help)
      if (ctx.boss?.id === "lefty_specialist" && card.side === "L") stats.contact -= 3;
      if (ctx.boss?.id === "groundball_goblin") stats.speed *= 0.5;

      // Pitch stat modifiers; a shield (Battery, Shin Guards, Dome) cancels penalties but keeps boosts.
      for (const s of STATS) {
        const mod = ctx.pitch.statMods[s];
        if (mod !== undefined && (mod >= 1 || !shielded)) {
          stats[s] *= mod;
        }
      }
      if (ctx.pitch.special === "changeup" && index === 0 && !shielded) {
        for (const s of STATS) stats[s] *= 0.5;
      }

      // The Umpire rings up one position: those cards contribute nothing.
      if (ctx.boss?.id === "umpire" && card.position === ctx.umpireTarget) {
        for (const s of STATS) stats[s] = 0;
      }

      for (const s of STATS) stats[s] = Math.max(0, stats[s]);
      return { card, stats };
    });
  }

  evaluate(cards: PlayerCard[], ctx: ScoreContext): ScoreResult {
    const lines: ScoreLine[] = [];
    const runnersBefore = this.runnersFor(ctx);
    const count = this.cloneCount(ctx.count);
    if (cards.length === 0) {
      return {
        base: 0,
        flatBonus: 0,
        multiplier: 1,
        difficulty: ctx.pitch.difficulty,
        quality: 0,
        runs: 0,
        outs: 0,
        bases: 0,
        outcome: "No Swing",
        basesBefore: this.basesFromRunners(runnersBefore),
        basesAfter: this.basesFromRunners(runnersBefore),
        runnersBefore,
        runnersAfter: this.cloneRunners(runnersBefore),
        count,
        playByPlay: [],
        playCost: 1,
        combos: [],
        lines,
      };
    }

    const shielded =
      this.combos.hasBattery(cards) ||
      this.hasEquipment(ctx, "shin_guards") ||
      ctx.stadium?.effect === "dome_stadium";

    const effCards = this.buildEffectiveCards(cards, ctx, shielded);
    const detected = this.combos.detect(effCards, {
      pitch: ctx.pitch,
      stadium: ctx.stadium,
      equipment: ctx.equipment,
    });

    const sum = (stat: Stat) => effCards.reduce((total, c) => total + c.stats[stat], 0);
    const base = sum("contact") + sum("power") + sum("speed");
    lines.push({ label: "Base (Contact + Power + Speed)", value: `${Math.round(base)}` });
    lines.push({ label: "Approach", value: APPROACH_LABEL[ctx.approach] });
    lines.push({ label: "Count", value: this.countString(count) });
    lines.push({ label: "Runners before", value: this.runnerString(runnersBefore) });

    let flat = 0;
    let multiplier = 1;

    // Umpire ejections, called out loud so the zeros aren't mysterious
    if (ctx.boss?.id === "umpire") {
      for (const eff of effCards) {
        if (eff.card.position === ctx.umpireTarget) {
          lines.push({ label: `Umpire rings up ${eff.card.name}`, value: "OUT" });
        }
      }
    }

    // Pitch specials that reward a stat outside the base three.
    if (ctx.pitch.special === "knuckleball") {
      const bonus = sum("discipline");
      flat += bonus;
      lines.push({ label: "Knuckleball: patience pays", value: `+${Math.round(bonus)}` });
    }
    if (ctx.pitch.special === "sinker") {
      const bonus = sum("defense") / 2;
      flat += bonus;
      lines.push({ label: "Sinker: grounders gobbled", value: `+${Math.round(bonus)}` });
    }

    // The Junkballer eats the first combo of every play
    const ignoredCombo = ctx.boss?.id === "junkballer" && detected.length > 0 ? detected[0] : null;
    const activeCombos = ignoredCombo ? detected.slice(1) : detected;

    if (ignoredCombo) {
      lines.push({ label: `Junkballer eats ${ignoredCombo.name}`, value: "✗" });
    }
    for (const combo of activeCombos) {
      if (combo.kind === "flat") {
        flat += combo.value;
        lines.push({ label: `${combo.name} (${combo.detail})`, value: `+${combo.value}` });
      } else {
        multiplier *= combo.value;
        lines.push({ label: `${combo.name} (${combo.detail})`, value: `x${combo.value}` });
      }
    }

    // Card traits
    const powerSwing = activeCombos.some((c) => c.id === "power_swing");
    for (const eff of effCards) {
      switch (eff.card.traitId) {
        case "moonshot":
          if (powerSwing) {
            flat += 4;
            lines.push({ label: `${eff.card.name}: Moonshot`, value: "+4" });
          }
          break;
        case "table_setter": {
          const other = effCards.find((o) => o !== eff && o.stats.speed >= 7);
          if (other) {
            flat += 2;
            lines.push({ label: `${eff.card.name}: Table Setter`, value: "+2" });
          }
          break;
        }
        case "iron_glove": {
          const bonus = eff.stats.defense;
          flat += bonus;
          lines.push({ label: `${eff.card.name}: Iron Glove`, value: `+${Math.round(bonus)}` });
          break;
        }
      }
    }

    // Star power: upgraded cards carry themselves (umpired-out cards don't count)
    const starBonus = effCards.reduce((total, eff) => {
      if (ctx.boss?.id === "umpire" && eff.card.position === ctx.umpireTarget) return total;
      return total + (eff.card.rarity === "AllStar" ? 2 : eff.card.rarity === "Legend" ? 5 : 0);
    }, 0);
    if (starBonus > 0) {
      flat += starBonus;
      lines.push({ label: "Star power", value: `+${starBonus}` });
    }

    // Equipment flat bonuses
    if (this.hasEquipment(ctx, "old_glove")) {
      const bonus = sum("defense") / 2;
      flat += bonus;
      lines.push({ label: "Old Glove", value: `+${Math.round(bonus)}` });
    }
    if (this.hasEquipment(ctx, "rally_cap") && ctx.runsSoFar < ctx.target) {
      flat += 3;
      lines.push({ label: "Rally Cap (behind the target)", value: "+3" });
    }
    if (ctx.stadium?.effect === "friendly_confines") {
      flat += 3;
      lines.push({ label: "The Friendly Confines", value: "+3" });
    }
    if (shielded && Object.values(ctx.pitch.statMods).some((m) => m < 1)) {
      lines.push({ label: "Pitch penalties cancelled", value: "shield" });
    }

    // Remaining boss rules
    if (ctx.boss?.id === "groundball_goblin") {
      const bonus = sum("defense") / 2;
      flat += bonus;
      lines.push({ label: "Goblin: grounders gobbled", value: `+${Math.round(bonus)}` });
    }
    if (ctx.boss?.id === "closer" && ctx.playsLeft === 1) {
      if (powerSwing) {
        lines.push({ label: "The Closer: beaten deep", value: "safe" });
      } else {
        multiplier *= 0.5;
        lines.push({ label: "The Closer slams the door", value: "x0.5" });
      }
    }
    let playCost = 1;
    if (ctx.boss?.id === "ace" && cards.some((c) => c.power >= 7)) {
      playCost = 2;
      lines.push({ label: "The Ace: Power 7+ swing", value: "2 plays" });
    }

    const difficulty = ctx.pitch.difficulty;
    let quality = Math.max(0, Math.round(((base + flat) * multiplier) / difficulty));

    const pressure = this.countPressure(count);
    if (pressure === "hitter") {
      quality += 2;
      lines.push({ label: "Hitter's count", value: "+2 quality" });
    } else if (pressure === "pitcher") {
      quality = Math.max(0, quality - 2);
      lines.push({ label: "Pitcher's count", value: "-2 quality" });
    } else if (pressure === "full") {
      const bonus = Math.round(sum("discipline") / 6);
      quality += bonus;
      lines.push({ label: "Full count nerves", value: bonus > 0 ? `+${bonus} quality` : "even" });
    }

    if (this.hasEquipment(ctx, "scorekeepers_pencil") && activeCombos.length > 0) {
      quality += activeCombos.length;
      lines.push({ label: "Scorekeeper's Pencil", value: `+${activeCombos.length} quality` });
    }

    lines.push({ label: `vs ${ctx.pitch.name} (difficulty ${difficulty})`, value: `÷${difficulty}` });
    const outcome = this.buildOutcome(cards, quality, sum("discipline"), ctx, count);
    lines.push({ label: outcome.label, value: outcome.runs > 0 ? `+${outcome.runs} run${outcome.runs === 1 ? "" : "s"}` : outcome.outs > 0 ? `${outcome.outs} out` : "safe" });
    if (outcome.playByPlay[0]) {
      lines.push({ label: "Play call", value: outcome.playByPlay[0] });
    }
    lines.push({ label: "Runners after", value: this.runnerString(outcome.runnersAfter) });

    return {
      base,
      flatBonus: flat,
      multiplier,
      difficulty,
      quality,
      runs: outcome.runs,
      outs: outcome.outs,
      bases: outcome.bases,
      outcome: outcome.label,
      basesBefore: this.basesFromRunners(runnersBefore),
      basesAfter: outcome.basesAfter,
      runnersBefore,
      runnersAfter: outcome.runnersAfter,
      count,
      playByPlay: outcome.playByPlay,
      playCost,
      combos: activeCombos,
      lines,
    };
  }
}
