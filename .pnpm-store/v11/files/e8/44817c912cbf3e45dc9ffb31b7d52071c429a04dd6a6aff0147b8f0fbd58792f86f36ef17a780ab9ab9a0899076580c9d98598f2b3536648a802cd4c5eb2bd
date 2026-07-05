/** This file must only contain pure code and pure imports */
import { __decorate } from "../../../../tslib.es6.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { FrameGraphFilterTask } from "../../../Tasks/PostProcesses/filterTask.js";
import { ThinFilterPostProcess } from "../../../../PostProcesses/thinFilterPostProcess.js";
import { Matrix } from "../../../../Maths/math.vector.pure.js";
import { NodeRenderGraphBaseWithPropertiesPostProcessBlock } from "./baseWithPropertiesPostProcessBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * Block that implements the kernel filter post process
 */
export class NodeRenderGraphFilterPostProcessBlock extends NodeRenderGraphBaseWithPropertiesPostProcessBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphFilterPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph, scene);
        this._finalizeInputOutputRegistering();
        this._frameGraphTask = new FrameGraphFilterTask(this.name, frameGraph, new ThinFilterPostProcess(name, scene.getEngine()));
    }
    /** The matrix to be applied to the image */
    get kernelMatrix() {
        return this._frameGraphTask.postProcess.kernelMatrix;
    }
    set kernelMatrix(value) {
        this._frameGraphTask.postProcess.kernelMatrix = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphFilterPostProcessBlock";
    }
    _dumpPropertiesCode() {
        const codes = [];
        codes.push(`${this._codeVariableName}.kernelMatrix = ${this.kernelMatrix};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.kernelMatrix = this.kernelMatrix.asArray();
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.kernelMatrix = Matrix.FromArray(serializationObject.kernelMatrix);
    }
}
__decorate([
    editableInPropertyPage("Matrix", 12 /* PropertyTypeForEdition.Matrix */, "PROPERTIES")
], NodeRenderGraphFilterPostProcessBlock.prototype, "kernelMatrix", null);
let _Registered = false;
/**
 * Register side effects for filterPostProcessBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFilterPostProcessBlock() {
    if (_Registered) {
        return;
    }
    _Registered = true;
    RegisterClass("BABYLON.NodeRenderGraphFilterPostProcessBlock", NodeRenderGraphFilterPostProcessBlock);
}
//# sourceMappingURL=filterPostProcessBlock.pure.js.map