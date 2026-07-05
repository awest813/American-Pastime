import { ComboSystem, type EffectiveCard } from "./ComboSystem";
import type { BattingApproach, BaseState, BossCard, EquipmentCard, PitchCard, PlayerCard, Position, ScoreLine, ScoreResult, Stat, StadiumCard } from "./types";

export interface ScoreContext {
  pitch: PitchCard;
  stadium: StadiumCard | null;
  equipment: EquipmentCard[];
  /** Runs already scored this inning, for behind-the-target effects like Rally Cap. */
  runsSoFar: number;
  target: number;
  outs: number;
  bases: BaseState;
  approach: BattingApproach;
  /** Boss pitcher rules (innings 3/6/9); null on regular innings. */
  boss: BossCard | null;
  umpireTarget: Position | null;
  /** Plays remaining BEFORE this play commits — The Closer punishes the last one. */
  playsLeft: number;
}

const STATS: Stat[] = ["power", "contact", "speed", "discipline", "defense"];

const EMPTY_BASES: BaseState = { first: false, second: false, third: false };
const APPROACH_LABEL: Record<BattingApproach, string> = {
  swing: "Swing Away",
  small_ball: "Small Ball",
  take: "Take Pitch",
};

interface Outcome {
  label: string;
  detail: string;
  bases: number;
  runs: number;
  outs: number;
  basesAfter: BaseState;
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

  private cloneBases(bases: BaseState): BaseState {
    return { first: bases.first, second: bases.second, third: bases.third };
  }

  private baseString(bases: BaseState): string {
    const occupied = [bases.first ? "1B" : "", bases.second ? "2B" : "", bases.third ? "3B" : ""].filter(Boolean);
    return occupied.length > 0 ? occupied.join("+") : "empty";
  }

  private advanceHit(bases: BaseState, batterBases: number): { bases: BaseState; runs: number } {
    if (batterBases <= 0) return { bases: this.cloneBases(bases), runs: 0 };
    const after: BaseState = { ...EMPTY_BASES };
    let runs = 0;
    const advanceRunner = (from: number) => {
      const to = from + batterBases;
      if (to >= 4) runs += 1;
      else if (to === 1) after.first = true;
      else if (to === 2) after.second = true;
      else after.third = true;
    };
    if (bases.third) advanceRunner(3);
    if (bases.second) advanceRunner(2);
    if (bases.first) advanceRunner(1);
    if (batterBases >= 4) runs += 1;
    else if (batterBases === 1) after.first = true;
    else if (batterBases === 2) after.second = true;
    else after.third = true;
    return { bases: after, runs };
  }

  private advanceWalk(bases: BaseState): { bases: BaseState; runs: number } {
    const after = this.cloneBases(bases);
    let runs = 0;
    if (bases.first && bases.second && bases.third) runs += 1;
    if (bases.first && bases.second) after.third = true;
    if (bases.first) after.second = true;
    after.first = true;
    return { bases: after, runs };
  }

  private advanceRunnersOnly(bases: BaseState, steps: number): { bases: BaseState; runs: number } {
    const after: BaseState = { ...EMPTY_BASES };
    let runs = 0;
    const advanceRunner = (from: number) => {
      const to = from + steps;
      if (to >= 4) runs += 1;
      else if (to === 1) after.first = true;
      else if (to === 2) after.second = true;
      else after.third = true;
    };
    if (bases.third) advanceRunner(3);
    if (bases.second) advanceRunner(2);
    if (bases.first) advanceRunner(1);
    return { bases: after, runs };
  }

  private buildOutcome(quality: number, discipline: number, ctx: ScoreContext): Outcome {
    if (ctx.approach === "take") {
      const takeQuality = quality * 0.45 + discipline * 0.55;
      if (takeQuality >= 18) {
        const advanced = this.advanceHit(ctx.bases, 1);
        return { label: "Patient Single", detail: "worked the count, then lined it", bases: 1, runs: advanced.runs, outs: 0, basesAfter: advanced.bases };
      }
      if (takeQuality >= 9) {
        const advanced = this.advanceWalk(ctx.bases);
        return { label: "Walk", detail: "ball four", bases: 1, runs: advanced.runs, outs: 0, basesAfter: advanced.bases };
      }
      return { label: "Called Out", detail: "watched a good one", bases: 0, runs: 0, outs: 1, basesAfter: this.cloneBases(ctx.bases) };
    }

    if (ctx.approach === "small_ball") {
      const smallQuality = quality * 0.72;
      if (smallQuality >= 12) {
        const advanced = this.advanceHit(ctx.bases, 2);
        return { label: "Gap Double", detail: "small swing found grass", bases: 2, runs: advanced.runs, outs: 0, basesAfter: advanced.bases };
      }
      if (smallQuality >= 5) {
        const advanced = this.advanceHit(ctx.bases, 1);
        return { label: "Base Hit", detail: "kept the line moving", bases: 1, runs: advanced.runs, outs: 0, basesAfter: advanced.bases };
      }
      if (ctx.bases.first || ctx.bases.second || ctx.bases.third) {
        if (ctx.outs >= 2) {
          return { label: "Two-Out Groundout", detail: "no sacrifice available", bases: 0, runs: 0, outs: 1, basesAfter: this.cloneBases(ctx.bases) };
        }
        const advanced = this.advanceRunnersOnly(ctx.bases, 1);
        return { label: "Productive Out", detail: "moved the runners", bases: 0, runs: advanced.runs, outs: 1, basesAfter: advanced.bases };
      }
      return { label: "Groundout", detail: "good idea, no traffic", bases: 0, runs: 0, outs: 1, basesAfter: this.cloneBases(ctx.bases) };
    }

    if (quality >= 18) {
      const advanced = this.advanceHit(ctx.bases, 4);
      return { label: "Home Run", detail: "cleared the bases", bases: 4, runs: advanced.runs, outs: 0, basesAfter: advanced.bases };
    }
    if (quality >= 12) {
      const advanced = this.advanceHit(ctx.bases, 3);
      return { label: "Triple", detail: "rattled into the corner", bases: 3, runs: advanced.runs, outs: 0, basesAfter: advanced.bases };
    }
    if (quality >= 7) {
      const advanced = this.advanceHit(ctx.bases, 2);
      return { label: "Double", detail: "into the gap", bases: 2, runs: advanced.runs, outs: 0, basesAfter: advanced.bases };
    }
    if (quality >= 3) {
      const advanced = this.advanceHit(ctx.bases, 1);
      return { label: "Single", detail: "clean contact", bases: 1, runs: advanced.runs, outs: 0, basesAfter: advanced.bases };
    }
    return { label: "Strikeout", detail: "swing and miss", bases: 0, runs: 0, outs: 1, basesAfter: this.cloneBases(ctx.bases) };
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
        basesBefore: this.cloneBases(ctx.bases),
        basesAfter: this.cloneBases(ctx.bases),
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
    lines.push({ label: "Bases before", value: this.baseString(ctx.bases) });

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

    if (this.hasEquipment(ctx, "scorekeepers_pencil") && activeCombos.length > 0) {
      quality += activeCombos.length;
      lines.push({ label: "Scorekeeper's Pencil", value: `+${activeCombos.length} quality` });
    }

    lines.push({ label: `vs ${ctx.pitch.name} (difficulty ${difficulty})`, value: `÷${difficulty}` });
    const outcome = this.buildOutcome(quality, sum("discipline"), ctx);
    lines.push({ label: outcome.label, value: outcome.runs > 0 ? `+${outcome.runs} run${outcome.runs === 1 ? "" : "s"}` : outcome.outs > 0 ? `${outcome.outs} out` : "safe" });
    lines.push({ label: "Bases after", value: this.baseString(outcome.basesAfter) });

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
      basesBefore: this.cloneBases(ctx.bases),
      basesAfter: outcome.basesAfter,
      playCost,
      combos: activeCombos,
      lines,
    };
  }
}
