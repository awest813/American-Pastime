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
no WebGPU adapter exists headlessly, so the app logs one
`WebGPU adapter unavailable; using WebGL2.` info line and runs on WebGL2.

Do NOT try to validate the WebGPU-positive path in this container:
enabling software WebGPU (`--enable-unsafe-webgpu` + Vulkan/SwiftShader)
yields an adapter whose device is immediately lost and the tab crashes at
the Chromium level — an environment limit, not an app bug. `?renderer=webgl`
/ `?renderer=webgpu` force a backend when you need to pin one.

## Drive

All UI is Babylon GUI rendered inside the canvas — there is no DOM to query.
Control `_currentMeasure` values are already in screen/CSS pixels at any
viewport size (the ADT uses idealWidth/idealHeight only to scale fonts and
control sizes) — click the measure center directly, never rescale it. Find
buttons by control name via the dev handle and click with the real mouse:

```js
await page.waitForFunction(() => !!window.__cardball); // GameScene instance (DEV only)
// walk scene.textures.find(t => t.name === "gameUI")._rootContainer recursively,
// match control.name, click center of control._currentMeasure with page.mouse.click
```

Keyboard focus gotcha: `page.keyboard` only reaches the scene after a real
click on the canvas — click a GUI button (e.g. `startButton`) before relying
on Enter/ESC/letter hotkeys.

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
