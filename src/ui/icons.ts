/**
 * Shared glyphs so the same item reads the same everywhere (shop cards, the
 * HUD gear list). Emoji render through the canvas font stack, which every
 * target platform ships with; the fallback covers content added later.
 */
export const EQUIPMENT_GLYPH: Record<string, string> = {
  corked_bat: "🏏",
  lucky_cleats: "👟",
  pine_tar_rag: "🧴",
  old_glove: "🧤",
  rally_cap: "🧢",
  shin_guards: "🛡",
  foam_finger: "☝",
  bubblegum: "🍬",
  weighted_donut: "🍩",
  scorekeepers_pencil: "✏",
};

export const equipmentGlyph = (id: string): string => EQUIPMENT_GLYPH[id] ?? "🎒";
