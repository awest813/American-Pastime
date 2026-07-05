/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as MatLib from "../index.js";
/**
 * Legacy support, defining window.BABYLON.GridMaterial... (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    GlobalObject.BABYLON = GlobalObject.BABYLON || {};
    for (const mat in MatLib) {
        GlobalObject.BABYLON[mat] = MatLib[mat];
    }
    GlobalObject.MATERIALS = MatLib;
}
export * from "../index.js";
//# sourceMappingURL=legacy.js.map