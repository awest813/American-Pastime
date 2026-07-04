---
name: verify
description: Build, launch, and drive Cardball Classic (Babylon.js game) headlessly to verify UI/gameplay changes with screenshots.
---

# Verifying Cardball Classic

## Launch

```bash
npm ci                                  # once per container
npm run dev -- --port 5199 --strictPort # vite; ignore the xdg-open ENOENT error
```

Headless Chromium (pre-installed at /opt/pw-browsers) + global Playwright
(`/opt/node22/lib/node_modules/playwright`) work. Launch with
`args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"]`;
WebGPU init fails headlessly and the app falls back to WebGL2 — the two
`BJS ... WebGPU creation/initialization` console errors are expected noise.

## Drive

All UI is Babylon GUI rendered inside the canvas — there is no DOM to query.
Use a 1600x900 viewport: the fullscreen ADT has `idealWidth = 1600`, so GUI
measure coordinates equal page coordinates. Find buttons by control name via
the dev handle and click with the real mouse:

```js
await page.waitForFunction(() => !!window.__cardball); // GameScene instance (DEV only)
// walk scene.textures.find(t => t.name === "gameUI")._rootContainer recursively,
// match control.name, click center of control._currentMeasure with page.mouse.click
```

Useful control names: `startButton`, `seedInput`, `seedReroll`, `binderButton`,
`howToButton`, `settingsButton`, `pauseResume`, `pauseSettings`, `pauseAbandon`,
`volumeUp/volumeDown/muteToggle/shakeToggle/speedToggle/settingsBack`,
`playButton`, `discardButton`, `comboBookButton`.

Hotkeys: Enter starts a season from the title, ESC pauses/backs out,
H combo book, M mute, F1 debug panel. Settings persist in localStorage under
`cardball.settings.v1`. `window.__cardballSetSpeed(8)` fast-forwards tweens
for soak tests.

## Flows worth driving

- Title → How to Play → ESC back → Settings (toggle everything) → ESC.
- Enter → in-inning HUD → ESC pause → SETTINGS over pause → M while open.
- Reload and reopen settings to confirm persistence.
