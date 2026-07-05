/** This file must only contain pure code and pure imports */
import { AbstractEngine } from "../../Engines/abstractEngine.pure.js";
let _Registered = false;
/**
 * Register side effects for abstractEngineLoadFile.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterAbstractEngineLoadFile() {
    if (_Registered) {
        return;
    }
    _Registered = true;
    AbstractEngine.prototype._loadFileAsync = async function (url, offlineProvider, useArrayBuffer) {
        return await new Promise((resolve, reject) => {
            this._loadFile(url, (data) => {
                resolve(data);
            }, undefined, offlineProvider, useArrayBuffer, (request, exception) => {
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                reject(exception);
            });
        });
    };
}
//# sourceMappingURL=abstractEngine.loadFile.pure.js.map