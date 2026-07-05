# Cardball Classic

*a cursed baseball card engine* — Balatro, but baseball cards.

A roguelike baseball-card deckbuilder: draw a hand of vintage baseball cards, pick an approach, play up to five as one at-bat, and let combos (Team Chemistry, Around the Horn, Power Swing…) turn cardboard stats into contact quality. Singles, doubles, walks, outs, and homers move runners around the bases. Beat the inning's run target before three outs or four at-bats, spend your winnings in the clubhouse shop, and survive nine innings to take the pennant.

Built on Babylon.js 9 + Havok + Vite 8 + TypeScript, on top of the [BabylonPress bp900 template](https://github.com/eldinor/bp900) (the template's guide lives in `HOWTO.md`; its `templates/` directory is untouched).

## Play

```
npm install
npm run dev        # opens on http://localhost:8088
```

- **Click cards** in your hand to select up to 5. Click order matters — pitch and equipment effects hit the *first* card hardest (the preview names your leadoff).
- **Enter** on the title screen starts a run with the current seed.
- **H** opens the Combo Book (all ten combos + the run formula), **ESC** pauses (resume or abandon to the menu), **M** mutes.
- Choose an **approach** before the at-bat: **Swing** (`Q`) chases extra bases, **Small Ball** (`W`) moves runners safely before two outs, and **Take** (`E`) leans on Discipline for walks.
- **AT-BAT** commits the hand; the score preview on the right shows the exact combos, expected outcome, runs, outs, and bases before you commit.
- **DISCARD** dumps the selection and redraws (3 per inning).
- Beat the target before 3 outs or 4 at-bats → collect cash ($3 + $1 per unused at-bat) → shop → next inning. Nine innings wins the run.
- **Card upgrades**: each shop visit offers 3 deck cards for promotion up the `Rookie → Starter → All-Star → Legend` ladder ($3/$5/$8). Each tier adds +1 to the card's two best upgradeable stats; All-Stars add +2 base when played and Legends +5 ("Star power" in the preview). Upgraded cards get silver/gold frames and ★s. Upgrades are per-run copies — the base collection in the binder never changes.
- **Innings 3, 6, and 9 are boss innings**: a rival pitcher's rule (The Closer, The Junkballer, The Ace, The Lefty Specialist, The Groundball Goblin, The Umpire) stacks on top of the normal pitch. Boss rules are shown on a red card in the HUD and factored into the score preview; winning pays a +$2 bounty. Each boss appears at most once per run.
- Runs are seeded: the same seed always deals the same season.
- **CARD BINDER** on the title screen browses every card in 3D with team / position / era / rarity / trait filters (right-click a filter to cycle backward), page flipping (arrow keys), and click-to-inspect. It doubles as the dev card-preview tool.
- The 3D scoreboard behind the diamond is the score display — it counts up as runs land and goes green when the target is met.

## Rules (first prototype tuning)

| Rule | Value |
| --- | --- |
| Hand size | 8 |
| Cards per play | up to 5 |
| At-bats / outs / discards per inning | 4 / 3 / 3 |
| First target, growth | 3 runs, ×1.22 per inning |
| Deck | 30 player cards, 6 fictional teams |
| Starting cash | $4 |

Scoring, in baseball language:

```
effective stats = card stats + stadium/equipment tweaks, then pitch modifiers
base            = total Contact + Power + Speed
quality         = (base + combo/trait/equipment bonuses) × multipliers ÷ pitch difficulty
outcome         = approach + quality + current bases → runs / outs / new bases
```

The ten MVP combos live in `src/systems/ComboSystem.ts`; their names/descriptions in `src/content/combos.json`. Boss pitcher rules live in `src/content/bosses.json` with their effects in `ScoreSystem` — all deterministic, so the preview stays honest even on boss innings.

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
  scenes/CollectionScene.ts  the card binder: filterable, pageable 3D card browser
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

All juice is asset-free: sound stingers are synthesized with WebAudio (`systems/AudioSystem.ts` — bat crack, combo dings, organ fanfare, strikeout womp), and particles (confetti, infield dust, home-run sparkle trail in `entities/Effects.ts`) share one procedurally drawn dot texture. Big plays shake the camera, surge the stadium lights, and flash the scoreboard; the run counter ticks up instead of snapping.

## Commands

- `npm run dev` — dev server
- `npm run build` — typecheck + production build to `dist/`
- `npm run typecheck` — `tsc --noEmit`
