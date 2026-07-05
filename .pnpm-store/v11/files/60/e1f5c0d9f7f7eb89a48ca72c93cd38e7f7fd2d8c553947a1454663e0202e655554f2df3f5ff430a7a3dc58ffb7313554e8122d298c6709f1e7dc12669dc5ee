import { __decorate } from "../../tslib.es6.js";
import { serialize } from "../../Misc/decorators.js";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager.js";
import { KeyboardEventTypes } from "../../Events/keyboardEvents.js";
import { Vector3 } from "../../Maths/math.vector.pure.js";
import { Tools } from "../../Misc/tools.pure.js";
/**
 * Manage the keyboard inputs to control the movement of a free camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class FreeCameraKeyboardMoveInput {
    constructor() {
        /**
         * Gets or Set the list of keyboard keys used to control the forward move of the camera.
         */
        this.keysUp = [38];
        /**
         * Gets or Set the list of keyboard keys used to control the upward move of the camera.
         */
        this.keysUpward = [33];
        /**
         * Gets or Set the list of keyboard keys used to control the backward move of the camera.
         */
        this.keysDown = [40];
        /**
         * Gets or Set the list of keyboard keys used to control the downward move of the camera.
         */
        this.keysDownward = [34];
        /**
         * Gets or Set the list of keyboard keys used to control the left strafe move of the camera.
         */
        this.keysLeft = [37];
        /**
         * Gets or Set the list of keyboard keys used to control the right strafe move of the camera.
         */
        this.keysRight = [39];
        /**
         * Defines the pointer angular sensibility  along the X and Y axis or how fast is the camera rotating.
         */
        this.rotationSpeed = 0.5;
        /**
         * Gets or Set the list of keyboard keys used to control the left rotation move of the camera.
         */
        this.keysRotateLeft = [];
        /**
         * Gets or Set the list of keyboard keys used to control the right rotation move of the camera.
         */
        this.keysRotateRight = [];
        /**
         * Gets or Set the list of keyboard keys used to control the up rotation move of the camera.
         */
        this.keysRotateUp = [];
        /**
         * Gets or Set the list of keyboard keys used to control the down rotation move of the camera.
         */
        this.keysRotateDown = [];
        this._keys = new Array();
    }
    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    attachControl(noPreventDefault) {
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        if (this._onCanvasBlurObserver) {
            return;
        }
        this._scene = this.camera.getScene();
        this._engine = this._scene.getEngine();
        this._onCanvasBlurObserver = this._engine.onCanvasBlurObservable.add(() => {
            this._keys.length = 0;
        });
        this._onKeyboardObserver = this._scene.onKeyboardObservable.add((info) => {
            const evt = info.event;
            if (!evt.metaKey) {
                if (info.type === KeyboardEventTypes.KEYDOWN) {
                    if (this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        this.keysRight.indexOf(evt.keyCode) !== -1 ||
                        this.keysUpward.indexOf(evt.keyCode) !== -1 ||
                        this.keysDownward.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotateLeft.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotateRight.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotateUp.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotateDown.indexOf(evt.keyCode) !== -1) {
                        const index = this._keys.indexOf(evt.keyCode);
                        if (index === -1) {
                            this._keys.push(evt.keyCode);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                }
                else {
                    if (this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        this.keysRight.indexOf(evt.keyCode) !== -1 ||
                        this.keysUpward.indexOf(evt.keyCode) !== -1 ||
                        this.keysDownward.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotateLeft.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotateRight.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotateUp.indexOf(evt.keyCode) !== -1 ||
                        this.keysRotateDown.indexOf(evt.keyCode) !== -1) {
                        const index = this._keys.indexOf(evt.keyCode);
                        if (index >= 0) {
                            this._keys.splice(index, 1);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                }
            }
        });
    }
    /**
     * Detach the current controls from the specified dom element.
     */
    detachControl() {
        if (this._scene) {
            if (this._onKeyboardObserver) {
                this._scene.onKeyboardObservable.remove(this._onKeyboardObserver);
            }
            if (this._onCanvasBlurObserver) {
                this._engine.onCanvasBlurObservable.remove(this._onCanvasBlurObserver);
            }
            this._onKeyboardObserver = null;
            this._onCanvasBlurObserver = null;
        }
        this._keys.length = 0;
    }
    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    checkInputs() {
        if (this._onKeyboardObserver) {
            const camera = this.camera;
            // Movement keys are gated on the keyboard→translate mapping and rotation keys on
            // keyboard→rotate. Removing the corresponding entry disables that family of keys.
            // An entry's optional `sensitivity` acts as a gain (default 1) over the legacy scaling.
            const input = camera.movement.input;
            const translateEntry = input.getEntry("keyboard", "translate");
            const rotateEntry = input.getEntry("keyboard", "rotate");
            const rotateGain = rotateEntry?.sensitivity ?? 1;
            // Movement keys are accumulated into a single local direction and applied once below, so that
            // holding two directions at once (e.g. forward + left) moves along a normalized diagonal at the
            // same speed as a single direction, instead of the ~1.41x boost (sqrt(2)) that results from
            // applying each movement key independently. Rotation keys act on separate angular axes and are
            // applied directly as before.
            const localDirection = camera._localDirection.copyFromFloats(0, 0, 0);
            // Keyboard
            for (let index = 0; index < this._keys.length; index++) {
                const keyCode = this._keys[index];
                if (this.keysLeft.indexOf(keyCode) !== -1) {
                    localDirection.x -= 1;
                }
                else if (this.keysUp.indexOf(keyCode) !== -1) {
                    localDirection.z += 1;
                }
                else if (this.keysRight.indexOf(keyCode) !== -1) {
                    localDirection.x += 1;
                }
                else if (this.keysDown.indexOf(keyCode) !== -1) {
                    localDirection.z -= 1;
                }
                else if (this.keysUpward.indexOf(keyCode) !== -1) {
                    localDirection.y += 1;
                }
                else if (this.keysDownward.indexOf(keyCode) !== -1) {
                    localDirection.y -= 1;
                }
                else if (this.keysRotateLeft.indexOf(keyCode) !== -1) {
                    if (rotateEntry) {
                        camera.cameraRotation.y -= this._getLocalRotation() * rotateGain;
                    }
                }
                else if (this.keysRotateRight.indexOf(keyCode) !== -1) {
                    if (rotateEntry) {
                        camera.cameraRotation.y += this._getLocalRotation() * rotateGain;
                    }
                }
                else if (this.keysRotateUp.indexOf(keyCode) !== -1) {
                    if (rotateEntry) {
                        camera.cameraRotation.x -= this._getLocalRotation() * rotateGain;
                    }
                }
                else if (this.keysRotateDown.indexOf(keyCode) !== -1) {
                    if (rotateEntry) {
                        camera.cameraRotation.x += this._getLocalRotation() * rotateGain;
                    }
                }
            }
            // Apply a single, normalized movement once all keys for this frame have been accumulated.
            // Translation is suppressed when the keyboard→translate mapping is removed.
            if (translateEntry && (localDirection.x !== 0 || localDirection.y !== 0 || localDirection.z !== 0)) {
                const speed = camera._computeLocalCameraSpeed() * (translateEntry.sensitivity ?? 1);
                // Normalize so a diagonal isn't faster than an axis-aligned move, then scale to the per-frame speed.
                localDirection.normalize().scaleInPlace(speed);
                if (camera.getScene().useRightHandedSystem) {
                    localDirection.z *= -1;
                }
                camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);
                Vector3.TransformNormalToRef(localDirection, camera._cameraTransformMatrix, camera._transformedDirection);
                camera.cameraDirection.addInPlace(camera._transformedDirection);
            }
        }
    }
    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    getClassName() {
        return "FreeCameraKeyboardMoveInput";
    }
    /** @internal */
    _onLostFocus() {
        this._keys.length = 0;
    }
    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    getSimpleName() {
        return "keyboard";
    }
    _getLocalRotation() {
        const handednessMultiplier = this.camera._calculateHandednessMultiplier();
        const rotation = ((this.rotationSpeed * this._engine.getDeltaTime()) / 1000) * handednessMultiplier;
        return rotation;
    }
}
__decorate([
    serialize()
], FreeCameraKeyboardMoveInput.prototype, "keysUp", void 0);
__decorate([
    serialize()
], FreeCameraKeyboardMoveInput.prototype, "keysUpward", void 0);
__decorate([
    serialize()
], FreeCameraKeyboardMoveInput.prototype, "keysDown", void 0);
__decorate([
    serialize()
], FreeCameraKeyboardMoveInput.prototype, "keysDownward", void 0);
__decorate([
    serialize()
], FreeCameraKeyboardMoveInput.prototype, "keysLeft", void 0);
__decorate([
    serialize()
], FreeCameraKeyboardMoveInput.prototype, "keysRight", void 0);
__decorate([
    serialize()
], FreeCameraKeyboardMoveInput.prototype, "rotationSpeed", void 0);
__decorate([
    serialize()
], FreeCameraKeyboardMoveInput.prototype, "keysRotateLeft", void 0);
__decorate([
    serialize()
], FreeCameraKeyboardMoveInput.prototype, "keysRotateRight", void 0);
__decorate([
    serialize()
], FreeCameraKeyboardMoveInput.prototype, "keysRotateUp", void 0);
__decorate([
    serialize()
], FreeCameraKeyboardMoveInput.prototype, "keysRotateDown", void 0);
CameraInputTypes["FreeCameraKeyboardMoveInput"] = FreeCameraKeyboardMoveInput;
//# sourceMappingURL=freeCameraKeyboardMoveInput.js.map