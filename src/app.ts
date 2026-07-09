import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { AxesViewer } from "@babylonjs/core/Debug/axesViewer";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import "@babylonjs/core/Physics/physicsEngineComponent";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";

import { templateConfig } from "./config/template-config";
import { GameScene } from "./scenes/GameScene";
import { getSceneRuntimeState } from "./playground/scene-runtime";

type GpuNavigator = Navigator & { gpu?: { requestAdapter(): Promise<unknown | null> } };

class App {
  public engine: Engine | WebGPUEngine;
  public scene: Scene;

  private canvas: HTMLCanvasElement;

  constructor() {
    // create the canvas html element and attach it to the webpage
    this.canvas = document.createElement("canvas");
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.id = "renderCanvas";
    document.body.appendChild(this.canvas);

    void this.bootstrap();
  }

  async bootstrap(): Promise<void> {
    try {
      this.engine = await this._createEngine();
      // adaptToDeviceRatio honors full DPR; past 2 the extra pixels cost fill
      // rate (2.25x at DPR 3) with no visible gain on a scene this stylized.
      // hardwareScalingLevel is 1/effectiveDPR, so capping at DPR 2 means 0.5.
      if ((window.devicePixelRatio || 1) > 2) this.engine.setHardwareScalingLevel(0.5);
      this.scene = new Scene(this.engine);

      if (templateConfig.features.physics) {
        await this._setPhysics();
      }

      await GameScene.create(this.scene, this.canvas);

      this._config();
      this._renderer();
      this._dismissBoot();
    } catch (error) {
      // Never leave a first-time player on a black screen: surface a friendly
      // message on the boot cover instead (usually an unsupported browser/GPU).
      console.error("Cardball failed to start.", error);
      this._showBootError();
    }
  }

  /** Fade the loading cover once the first scene is live. */
  private _dismissBoot(): void {
    const boot = document.getElementById("boot");
    if (!boot) return;
    // Let one frame paint the menu before the cover fades off it.
    requestAnimationFrame(() => {
      boot.classList.add("boot-done");
      setTimeout(() => boot.remove(), 600);
    });
  }

  /** Turn the loading cover into an unsupported-browser message. */
  private _showBootError(): void {
    const boot = document.getElementById("boot");
    if (boot) boot.classList.add("boot-error");
    const status = document.getElementById("boot-status");
    if (status) {
      status.textContent =
        "Cardball couldn't start — this browser or device may not support WebGL. Try the latest Chrome, Edge, or Firefox on a desktop.";
    }
  }

  async _createEngine(): Promise<Engine | WebGPUEngine> {
    // ?renderer=webgl escapes a machine whose WebGPU adapter exists but is
    // broken (crashes happen below the app, so we can't auto-detect that);
    // ?renderer=webgpu forces the attempt even with webgpuFirst off.
    const override = new URLSearchParams(window.location.search).get("renderer");
    const preferWebgl = override === "webgl" || (override !== "webgpu" && this._isSafari());
    const tryWebgpu = override === "webgpu" || (!preferWebgl && templateConfig.rendering.webgpuFirst);
    if (tryWebgpu && (await this._webgpuUsable())) {
      const webgpu = new WebGPUEngine(this.canvas, {
        adaptToDeviceRatio: templateConfig.rendering.engine.adaptToDeviceRatio,
        antialias: templateConfig.rendering.engine.antialias,
      });
      try {
        await webgpu.initAsync();
        return webgpu;
      } catch (error) {
        console.warn("WebGPU initialization failed, falling back to WebGL2.", error);
        try {
          webgpu.dispose();
        } catch {
          // a half-initialized engine may not dispose cleanly; WebGL takes over regardless
        }
      }
    }

    return new Engine(this.canvas, true, {
      powerPreference: templateConfig.rendering.engine.powerPreference,
      preserveDrawingBuffer: templateConfig.rendering.engine.preserveDrawingBuffer,
      stencil: templateConfig.rendering.engine.stencil,
      disableWebGL2Support: templateConfig.rendering.engine.disableWebGL2Support,
      adaptToDeviceRatio: templateConfig.rendering.engine.adaptToDeviceRatio,
    });
  }

  /** True only when the browser can actually hand over a WebGPU adapter.
   *  navigator.gpu existing is not enough (headless/blocklisted GPUs expose it
   *  with no adapter), and constructing WebGPUEngine anyway makes Babylon log
   *  fatal errors before we can fall back. */
  async _webgpuUsable(): Promise<boolean> {
    try {
      const gpu = (navigator as GpuNavigator).gpu;
      if (gpu && (await gpu.requestAdapter()) !== null) {
        return true;
      }
      console.info("WebGPU adapter unavailable; using WebGL2.");
      return false;
    } catch {
      console.info("WebGPU support probe failed; using WebGL2.");
      return false;
    }
  }

  /** Safari/WebKit can expose WebGPU while still being the least predictable
   *  path for Babylon. Default it to WebGL2; ?renderer=webgpu still opts in. */
  private _isSafari(): boolean {
    const ua = navigator.userAgent;
    return /Safari/i.test(ua) && !/(Chrome|Chromium|CriOS|FxiOS|Edg|EdgiOS|OPR|Opera)/i.test(ua);
  }

  async _setPhysics(): Promise<void> {
    const gravity = new Vector3(0, -9.81, 0);
    const { default: HavokPhysics } = await import("@babylonjs/havok");
    const hk = await HavokPhysics();
    const plugin = new HavokPlugin(true, hk);
    if (!this.scene.enablePhysics(gravity, plugin)) {
      throw new Error("Failed to initialize the Havok physics engine.");
    }
    // Physics only serves the ~3s cosmetic ball launch; don't step the WASM
    // engine every frame while nothing is simulating. BaseballToken flips
    // this on around each live ball.
    this.scene.physicsEnabled = false;
  }

  private lastFpsUpdate = 0;

  _fps(): void {
    // Writing to the DOM every frame forces layout work 60x/sec; 2 Hz reads the same.
    const now = performance.now();
    if (now - this.lastFpsUpdate < 500) return;
    this.lastFpsUpdate = now;

    const dom = document.getElementById("display-fps");
    if (dom) {
      dom.innerHTML = `${this.engine.getFps().toFixed()} fps`;
    } else {
      const div = document.createElement("div");
      div.id = "display-fps";
      div.innerHTML = "0";
      document.body.appendChild(div);
    }
  }

  async _bindEvent(): Promise<void> {
    // Imports and hide/show the Inspector
    // Works only in DEV mode to reduce the size of the PRODUCTION build
    // Comment IF statement to work in both modes
    if (templateConfig.debug.inspectorInDevOnly && import.meta.env.DEV) {
      await Promise.all([import("@babylonjs/core/Debug/debugLayer"), import("@babylonjs/inspector")]);

      window.addEventListener("keydown", (ev) => {
        // Shift+Ctrl+Alt+I
        if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key.toLowerCase() === "i") {
          if (this.scene.debugLayer.isVisible()) {
            this.scene.debugLayer.hide();
          } else {
            this.scene.debugLayer.show();
          }
        }
      });
    } // End of IF statement

    // resize window
    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    window.addEventListener("beforeunload", () => {
      this.scene.dispose();
      this.engine.dispose();
    });
  }

  // Auxiliary Class Configuration
  _config(): void {
    if (templateConfig.features.axesViewer) {
      const axesViewer = new AxesViewer(this.scene, 2);
      getSceneRuntimeState(this.scene).axesViewer = axesViewer;
    }

    // Inspector and other stuff
    void this._bindEvent();
  }

  _renderer(): void {
    // The fps read-out is a dev aid; import.meta.env.DEV folds to false in the
    // shipped build, so this call (and the counter) drop out entirely.
    const showFps = import.meta.env.DEV && templateConfig.debug.showFps;
    this.engine.runRenderLoop(() => {
      if (showFps) this._fps();
      this.scene.render();
    });
  }
}

new App();
