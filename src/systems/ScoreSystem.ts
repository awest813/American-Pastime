import { ComboSystem, type EffectiveCard } from "./ComboSystem";
import type { EquipmentCard, PitchCard, PlayerCard, ScoreLine, ScoreResult, Stat, StadiumCard } from "./types";

export interface ScoreContext {
  pitch: PitchCard;
  stadium: StadiumCard | null;
  equipment: EquipmentCard[];
  /** Runs already scored this inning, for behind-the-target effects like Rally Cap. */
  runsSoFar: number;
  target: number;
}

const STATS: Stat[] = ["power", "contact", "speed", "discipline", "defense"];

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

      for (const s of STATS) stats[s] = Math.max(0, stats[s]);
      return { card, stats };
    });
  }

  evaluate(cards: PlayerCard[], ctx: ScoreContext): ScoreResult {
    const lines: ScoreLine[] = [];
    if (cards.length === 0) {
      return { base: 0, flatBonus: 0, multiplier: 1, difficulty: ctx.pitch.difficulty, runs: 0, combos: [], lines };
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

    let flat = 0;
    let multiplier = 1;

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

    for (const combo of detected) {
      if (combo.kind === "flat") {
        flat += combo.value;
        lines.push({ label: `${combo.name} (${combo.detail})`, value: `+${combo.value}` });
      } else {
        multiplier *= combo.value;
        lines.push({ label: `${combo.name} (${combo.detail})`, value: `x${combo.value}` });
      }
    }

    // Card traits
    const powerSwing = detected.some((c) => c.id === "power_swing");
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

    const difficulty = ctx.pitch.difficulty;
    let runs = Math.max(1, Math.round(((base + flat) * multiplier) / difficulty));

    if (this.hasEquipment(ctx, "scorekeepers_pencil") && detected.length > 0) {
      runs += detected.length;
      lines.push({ label: "Scorekeeper's Pencil", value: `+${detected.length} runs` });
    }

    lines.push({ label: `vs ${ctx.pitch.name} (difficulty ${difficulty})`, value: `÷${difficulty}` });

    return { base, flatBonus: flat, multiplier, difficulty, runs, combos: detected, lines };
  }
}
