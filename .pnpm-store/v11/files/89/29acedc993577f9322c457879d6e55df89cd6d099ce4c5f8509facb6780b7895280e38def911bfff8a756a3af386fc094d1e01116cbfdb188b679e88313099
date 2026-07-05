/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as MatLib from "../triPlanar/index.js";
/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    for (const key in MatLib) {
        GlobalObject.BABYLON[key] = MatLib[key];
    }
}
export * from "../triPlanar/index.js";
//# sourceMappingURL=legacy-triPlanar.js.map