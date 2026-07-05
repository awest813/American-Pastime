/** This file must only contain pure code and pure imports */
import { __decorate } from "../tslib.es6.js";
import { Texture } from "../Materials/Textures/texture.pure.js";
import { PostProcess } from "./postProcess.pure.js";
import { serialize } from "../Misc/decorators.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
import { RegisterClass } from "../Misc/typeStore.js";
/**
 * Post process which applies a refraction texture
 * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses#refraction
 */
export class RefractionPostProcess extends PostProcess {
    /**
     * Gets or sets the refraction texture
     * Please note that you are responsible for disposing the texture if you set it manually
     */
    get refractionTexture() {
        return this._refTexture;
    }
    set refractionTexture(value) {
        if (this._refTexture && this._ownRefractionTexture) {
            this._refTexture.dispose();
        }
        this._refTexture = value;
        this._ownRefractionTexture = false;
    }
    /**
     * Gets a string identifying the name of the class
     * @returns "RefractionPostProcess" string
     */
    getClassName() {
        return "RefractionPostProcess";
    }
    /**
     * Initializes the RefractionPostProcess
     * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses#refraction
     * @param name The name of the effect.
     * @param refractionTextureUrl Url of the refraction texture to use
     * @param color the base color of the refraction (used to taint the rendering)
     * @param depth simulated refraction depth
     * @param colorLevel the coefficient of the base color (0 to remove base color tainting)
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     */
    constructor(name, refractionTextureUrl, color, depth, colorLevel, options, camera, samplingMode, engine, reusable) {
        super(name, "refraction", ["baseColor", "depth", "colorLevel"], ["refractionSampler"], options, camera, samplingMode, engine, reusable);
        this._ownRefractionTexture = true;
        this.color = color;
        this.depth = depth;
        this.colorLevel = colorLevel;
        this.refractionTextureUrl = refractionTextureUrl;
        this.onActivateObservable.add((cam) => {
            this._refTexture = this._refTexture || new Texture(refractionTextureUrl, cam.getScene());
        });
        this.onApplyObservable.add((effect) => {
            effect.setColor3("baseColor", this.color);
            effect.setFloat("depth", this.depth);
            effect.setFloat("colorLevel", this.colorLevel);
            effect.setTexture("refractionSampler", this._refTexture);
        });
    }
    // Methods
    /**
     * Disposes of the post process
     * @param camera Camera to dispose post process on
     */
    dispose(camera) {
        if (this._refTexture && this._ownRefractionTexture) {
            this._refTexture.dispose();
            this._refTexture = null;
        }
        super.dispose(camera);
    }
    /**
     * @internal
     */
    static _Parse(parsedPostProcess, targetCamera, scene, rootUrl) {
        return SerializationHelper.Parse(() => {
            return new RefractionPostProcess(parsedPostProcess.name, parsedPostProcess.refractionTextureUrl, parsedPostProcess.color, parsedPostProcess.depth, parsedPostProcess.colorLevel, parsedPostProcess.options, targetCamera, parsedPostProcess.renderTargetSamplingMode, scene.getEngine(), parsedPostProcess.reusable);
        }, parsedPostProcess, scene, rootUrl);
    }
}
__decorate([
    serialize()
], RefractionPostProcess.prototype, "color", void 0);
__decorate([
    serialize()
], RefractionPostProcess.prototype, "depth", void 0);
__decorate([
    serialize()
], RefractionPostProcess.prototype, "colorLevel", void 0);
__decorate([
    serialize()
], RefractionPostProcess.prototype, "refractionTextureUrl", void 0);
let _Registered = false;
/**
 * Register side effects for refractionPostProcess.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterRefractionPostProcess() {
    if (_Registered) {
        return;
    }
    _Registered = true;
    RegisterClass("BABYLON.RefractionPostProcess", RefractionPostProcess);
}
//# sourceMappingURL=refractionPostProcess.pure.js.map