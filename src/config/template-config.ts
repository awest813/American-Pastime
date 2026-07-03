export const templateConfig = {
  features: {
    physics: true, // Havok, used for cosmetic juice (home-run ball launch)
    demoModel: false,
    axesViewer: false,
    pipeline: true,
    gui: false, // playground demo GUI; Cardball builds its own fullscreen UI
  },
  demoModel: {
    animation: {
      enabled: true,
      groupIndex: 1, // 'agree'
    },
  },
  rendering: {
    webgpuFirst: true,
    engine: {
      adaptToDeviceRatio: true,
      antialias: true,
      powerPreference: "high-performance" as const,
      preserveDrawingBuffer: true,
      stencil: true,
      disableWebGL2Support: false,
    },
    pipeline: {
      samples: 4,
      fxaaEnabled: true,
    },
  },
  debug: {
    showFps: true,
    inspectorInDevOnly: true,
  },
} as const;
