import type { DetectedCombo, EquipmentCard, PitchCard, PlayerCard, Stat, StadiumCard } from "./types";

/** A played card with its stats after stadium/equipment/pitch adjustments. */
export interface EffectiveCard {
  card: PlayerCard;
  stats: Record<Stat, number>;
}

export interface ComboContext {
  pitch: PitchCard;
  stadium: StadiumCard | null;
  equipment: EquipmentCard[];
}

const hasEquipment = (ctx: ComboContext, effect: string): boolean =>
  ctx.equipment.some((e) => e.effect === effect);

/**
 * Detects the ten MVP combos in a set of played cards.
 * Pure and deterministic: the same cards + context always yield the same combos,
 * which is what lets the score preview promise exactly what the play will pay.
 */
export class ComboSystem {
  detect(cards: EffectiveCard[], ctx: ComboContext): DetectedCombo[] {
    const combos: DetectedCombo[] = [];
    if (cards.length === 0) {
      return combos;
    }

    const positions = new Set(cards.map((c) => c.card.position));

    // Contact Hit: any card with Contact 7+
    const contactStars = cards.filter((c) => c.stats.contact >= 7);
    if (contactStars.length > 0) {
      combos.push({
        id: "contact_hit",
        name: "Contact Hit",
        kind: "flat",
        value: 4,
        detail: `${contactStars[0].card.name} squares one up`,
      });
    }

    // Power Swing: total Power over threshold (Short Porch lowers it, Donut doubles the payout)
    const totalPower = cards.reduce((sum, c) => sum + c.stats.power, 0);
    const powerThreshold = ctx.stadium?.effect === "short_porch" ? 16 : 20;
    if (totalPower >= powerThreshold) {
      const value = hasEquipment(ctx, "weighted_donut") ? 16 : 8;
      combos.push({
        id: "power_swing",
        name: "Power Swing",
        kind: "flat",
        value,
        detail: `${Math.round(totalPower)} total Power`,
      });
    }

    // Speed Steal: a burner alongside someone who gets on base
    const burner = cards.find((c) => c.stats.speed >= 7);
    if (burner) {
      const enabler = cards.find((c) => c !== burner && (c.stats.discipline >= 7 || c.stats.contact >= 8));
      if (enabler) {
        combos.push({
          id: "speed_steal",
          name: "Speed Steal",
          kind: "flat",
          value: 5,
          detail: `${burner.card.name} swipes a bag`,
        });
      }
    }

    // Team Chemistry: same-team cards multiply
    const teamCounts = new Map<string, number>();
    for (const c of cards) {
      teamCounts.set(c.card.team, (teamCounts.get(c.card.team) ?? 0) + 1);
    }
    let bestTeam = "";
    let bestCount = 0;
    for (const [team, count] of teamCounts) {
      if (count > bestCount) {
        bestTeam = team;
        bestCount = count;
      }
    }
    const chemistryNeed = hasEquipment(ctx, "foam_finger") ? 2 : 3;
    if (bestCount >= 5) {
      combos.push({ id: "team_chemistry", name: "Team Chemistry", kind: "mult", value: 2, detail: `${bestCount}x ${bestTeam}` });
    } else if (bestCount >= chemistryNeed) {
      combos.push({ id: "team_chemistry", name: "Team Chemistry", kind: "mult", value: 1.5, detail: `${bestCount}x ${bestTeam}` });
    }

    // Full Outfield: LF + CF + RF
    if (positions.has("LF") && positions.has("CF") && positions.has("RF")) {
      combos.push({ id: "full_outfield", name: "Full Outfield", kind: "flat", value: 6, detail: "LF + CF + RF" });
    }

    // Around the Horn: the whole infield
    if (positions.has("1B") && positions.has("2B") && positions.has("SS") && positions.has("3B")) {
      combos.push({ id: "around_the_horn", name: "Around the Horn", kind: "mult", value: 2, detail: "1B + 2B + SS + 3B" });
    }

    // Battery: P + C (also shields against pitch penalties, handled by ScoreSystem)
    if (positions.has("P") && positions.has("C")) {
      combos.push({ id: "battery", name: "Battery", kind: "flat", value: 4, detail: "pitch penalties cancelled" });
    }

    // Lefty Advantage: lefty/switch batters vs a right-handed pitch
    if (ctx.pitch.hand === "R") {
      const lefties = cards.filter((c) => c.card.side !== "R");
      if (lefties.length > 0) {
        combos.push({
          id: "lefty_advantage",
          name: "Lefty Advantage",
          kind: "flat",
          value: lefties.length * 2,
          detail: `${lefties.length} lefty bat${lefties.length > 1 ? "s" : ""} vs RHP`,
        });
      }
    }

    // Veteran Presence: 2+ Vintage cards add their Discipline
    const vintage = cards.filter((c) => c.card.era === "Vintage");
    if (vintage.length >= 2) {
      const discipline = Math.round(vintage.reduce((sum, c) => sum + c.stats.discipline, 0));
      combos.push({
        id: "veteran_presence",
        name: "Veteran Presence",
        kind: "flat",
        value: discipline,
        detail: `${vintage.length} vets, ${discipline} Discipline`,
      });
    }

    // Modern Sluggers: 3+ Modern cards with Power 6+
    const sluggers = cards.filter((c) => c.card.era === "Modern" && c.stats.power >= 6);
    if (sluggers.length >= 3) {
      combos.push({ id: "modern_sluggers", name: "Modern Sluggers", kind: "mult", value: 1.5, detail: `${sluggers.length} modern mashers` });
    }

    // Journeymen: five clubs, one lineup — the anti-Chemistry build
    if (cards.length >= 5 && teamCounts.size === cards.length) {
      combos.push({ id: "journeymen", name: "Journeymen", kind: "mult", value: 1.25, detail: `${cards.length} clubs, one lineup` });
    }

    // Eagle Eyes: a genuinely disciplined lineup, not just an average one
    const totalDiscipline = cards.reduce((sum, c) => sum + c.stats.discipline, 0);
    if (totalDiscipline >= 30) {
      combos.push({ id: "eagle_eyes", name: "Eagle Eyes", kind: "flat", value: 6, detail: `${Math.round(totalDiscipline)} total Discipline` });
    }

    // Rookie Rally: the kids take over — every card a Rookie, 3+ of them.
    // Upgrading a rookie breaks the rally; that's the tension.
    const rookies = cards.filter((c) => c.card.rarity === "Rookie");
    if (rookies.length >= 3 && rookies.length === cards.length) {
      combos.push({ id: "rookie_rally", name: "Rookie Rally", kind: "mult", value: 1.5, detail: `${rookies.length} rookies, nobody else` });
    }

    return combos;
  }

  /** Battery is position-only, so it can be checked before pitch mods are applied. */
  hasBattery(cards: PlayerCard[]): boolean {
    const positions = new Set(cards.map((c) => c.position));
    return positions.has("P") && positions.has("C");
  }
}
