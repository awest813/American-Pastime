# Cardball Classic

*a cursed baseball card engine* — Balatro, but baseball cards.

A roguelike score-chasing deckbuilder: draw a hand of vintage baseball cards, play up to five as one at-bat, and let combos (Team Chemistry, Around the Horn, Power Swing…) turn cardboard stats into runs. Beat the inning's run target before your plays run out, spend your winnings in the clubhouse shop, and survive nine innings to take the pennant.

Built on Babylon.js 9 + Havok + Vite 8 + TypeScript, on top of the [BabylonPress bp900 template](https://github.com/eldinor/bp900) (the template's guide lives in `HOWTO.md`; its `templates/` directory is untouched).

## Play

```
npm install
npm run dev        # opens on http://localhost:8088
```

- **Click cards** in your hand to select up to 5. Click order matters — pitch and equipment effects hit the *first* card hardest.
- **PLAY HAND** commits the at-bat; the score preview on the right always shows the exact combos and projected runs before you commit.
- **DISCARD** dumps the selection and redraws (3 per inning).
- Beat the target within 4 plays → collect cash ($3 + $1 per unused play) → shop → next inning. Nine innings wins the run.
- Runs are seeded: the same seed always deals the same season.

## Rules (first prototype tuning)

| Rule | Value |
| --- | --- |
| Hand size | 8 |
| Cards per play | up to 5 |
| Plays / discards per inning | 4 / 3 |
| First target, growth | 15 runs, ×1.35 per inning |
| Deck | 30 player cards, 6 fictional teams |
| Starting cash | $4 |

Scoring, in baseball language:

```
effective stats = card stats + stadium/equipment tweaks, then pitch modifiers
base            = total Contact + Power + Speed
runs            = (base + combo/trait/equipment bonuses) × multipliers ÷ pitch difficulty
```

The ten MVP combos live in `src/systems/ComboSystem.ts`; their names/descriptions in `src/content/combos.json`.

## Dev sugar

| Key | Action |
| --- | --- |
| `F1` | Debug panel (seed, deck, hand, modifiers, cheat buttons) |
| `R` | Restart inning |
| `N` | Win inning |
| `G` | +$10 |
| `D` | Refill hand |
| `P` | Launch a physics baseball |
| `C` | Log score breakdown to console |
| `Shift+Ctrl+Alt+I` | Babylon inspector (dev builds) |

In dev builds the game instance is exposed as `window.__cardball` for console poking and end-to-end tests.

## Architecture

Content in JSON, gameplay in systems, visuals in entities/scenes — add cards without touching logic:

```
src/
  scenes/GameScene.ts      orchestrator: deal → select → preview → play → shop loop
  systems/                 pure, deterministic game logic
    RunSystem.ts           run state, targets, cash, shop
    DeckSystem.ts          draw/discard piles, reshuffle
    ComboSystem.ts         the ten combo detectors
    ScoreSystem.ts         effective stats → runs, with readable breakdown lines
  content/                 cards.players/equipment/stadiums, pitches, combos (JSON)
  entities/                Card3D (painted card meshes), TableWorld, BaseballToken (Havok juice)
  ui/                      Babylon GUI: HUD + score preview, menu, shop, end, debug panels
  utils/                   seeded Random, EventBus, Tweens
```

Physics is cosmetic only (home-run ball launch); scoring is fully deterministic, and `ScoreSystem.evaluate` is pure — the preview and the committed play call the same function, so the projection is always honest.

## Commands

- `npm run dev` — dev server
- `npm run build` — typecheck + production build to `dist/`
- `npm run typecheck` — `tsc --noEmit`
