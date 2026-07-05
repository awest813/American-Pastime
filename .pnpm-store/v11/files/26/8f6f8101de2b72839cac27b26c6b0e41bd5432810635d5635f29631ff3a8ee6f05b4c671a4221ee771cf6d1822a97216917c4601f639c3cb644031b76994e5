/** This file must only contain pure code and pure imports */
import { __decorate } from "../../../../tslib.es6.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock.js";
import { FrameGraphIblShadowsRendererTask } from "../../../Tasks/Rendering/iblShadowsRendererTask.pure.js";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
/**
 * Block that implements IBL (image-based lighting) shadows using voxel tracing.
 */
export class NodeRenderGraphIblShadowsRendererBlock extends NodeRenderGraphBlock {
    /**
     * Gets the frame graph task associated with this block
     */
    get task() {
        return this._frameGraphTask;
    }
    /**
     * Create a new NodeRenderGraphIblShadowsRendererBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph, scene);
        this.registerInput("depth", NodeRenderGraphBlockConnectionPointTypes.TextureScreenDepth);
        this.registerInput("normal", NodeRenderGraphBlockConnectionPointTypes.TextureWorldNormal);
        this.registerInput("position", NodeRenderGraphBlockConnectionPointTypes.TextureWorldPosition);
        this.registerInput("velocity", NodeRenderGraphBlockConnectionPointTypes.TextureLinearVelocity);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this.registerInput("objects", NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        this._addDependenciesInput();
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this._frameGraphTask = new FrameGraphIblShadowsRendererTask(name, frameGraph);
    }
    // ------ Tracing properties ------
    /** Number of tracing sample directions */
    get sampleDirections() {
        return this._frameGraphTask.sampleDirections;
    }
    set sampleDirections(value) {
        this._frameGraphTask.sampleDirections = value;
    }
    /** Whether traced shadows preserve environment color */
    get coloredShadows() {
        return this._frameGraphTask.coloredShadows;
    }
    set coloredShadows(value) {
        this._frameGraphTask.coloredShadows = value;
    }
    /** Opacity of voxel-traced shadows */
    get voxelShadowOpacity() {
        return this._frameGraphTask.voxelShadowOpacity;
    }
    set voxelShadowOpacity(value) {
        this._frameGraphTask.voxelShadowOpacity = value;
    }
    /** Opacity of screen-space shadows */
    get ssShadowOpacity() {
        return this._frameGraphTask.ssShadowOpacity;
    }
    set ssShadowOpacity(value) {
        this._frameGraphTask.ssShadowOpacity = value;
    }
    /** Number of screen-space shadow samples */
    get ssShadowSampleCount() {
        return this._frameGraphTask.ssShadowSampleCount;
    }
    set ssShadowSampleCount(value) {
        this._frameGraphTask.ssShadowSampleCount = value;
    }
    /** Stride used by screen-space shadow sampling */
    get ssShadowStride() {
        return this._frameGraphTask.ssShadowStride;
    }
    set ssShadowStride(value) {
        this._frameGraphTask.ssShadowStride = value;
    }
    /** Distance scale used by screen-space shadow tracing */
    get ssShadowDistanceScale() {
        return this._frameGraphTask.ssShadowDistanceScale;
    }
    set ssShadowDistanceScale(value) {
        this._frameGraphTask.ssShadowDistanceScale = value;
    }
    /** Thickness scale used by screen-space shadow tracing */
    get ssShadowThicknessScale() {
        return this._frameGraphTask.ssShadowThicknessScale;
    }
    set ssShadowThicknessScale(value) {
        this._frameGraphTask.ssShadowThicknessScale = value;
    }
    /** Voxel tracing normal bias */
    get voxelNormalBias() {
        return this._frameGraphTask.voxelNormalBias;
    }
    set voxelNormalBias(value) {
        this._frameGraphTask.voxelNormalBias = value;
    }
    /** Voxel tracing direction bias */
    get voxelDirectionBias() {
        return this._frameGraphTask.voxelDirectionBias;
    }
    set voxelDirectionBias(value) {
        this._frameGraphTask.voxelDirectionBias = value;
    }
    /** Environment rotation in radians */
    get envRotation() {
        return this._frameGraphTask.envRotation;
    }
    set envRotation(value) {
        this._frameGraphTask.envRotation = value;
    }
    // ------ Accumulation properties ------
    /** Temporal shadow remanence while moving */
    get shadowRemanence() {
        return this._frameGraphTask.shadowRemanence;
    }
    set shadowRemanence(value) {
        this._frameGraphTask.shadowRemanence = value;
    }
    /** Final material shadow opacity */
    get shadowOpacity() {
        return this._frameGraphTask.shadowOpacity;
    }
    set shadowOpacity(value) {
        this._frameGraphTask.shadowOpacity = value;
    }
    // ------ Voxelization properties ------
    /** Voxelization resolution exponent (actual resolution is 2^value) */
    get resolutionExp() {
        return this._frameGraphTask.resolutionExp;
    }
    set resolutionExp(value) {
        this._frameGraphTask.resolutionExp = value;
    }
    /** Voxelization refresh rate (-1: manual, 0: every frame, N: skip N frames) */
    get refreshRate() {
        return this._frameGraphTask.refreshRate;
    }
    set refreshRate(value) {
        this._frameGraphTask.refreshRate = value;
    }
    /** Whether tri-planar voxelization is used */
    get triPlanarVoxelization() {
        return this._frameGraphTask.triPlanarVoxelization;
    }
    set triPlanarVoxelization(value) {
        this._frameGraphTask.triPlanarVoxelization = value;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphIblShadowsRendererBlock";
    }
    /**
     * Gets the depth texture input component
     */
    get depth() {
        return this._inputs[0];
    }
    /**
     * Gets the normal texture input component
     */
    get normal() {
        return this._inputs[1];
    }
    /**
     * Gets the position texture input component
     */
    get position() {
        return this._inputs[2];
    }
    /**
     * Gets the velocity texture input component
     */
    get velocity() {
        return this._inputs[3];
    }
    /**
     * Gets the camera input component
     */
    get camera() {
        return this._inputs[4];
    }
    /**
     * Gets the objects input component
     */
    get objects() {
        return this._inputs[5];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        this.output.value = this._frameGraphTask.outputTexture;
        this._frameGraphTask.depthTexture = this.depth.connectedPoint?.value;
        this._frameGraphTask.normalTexture = this.normal.connectedPoint?.value;
        this._frameGraphTask.positionTexture = this.position.connectedPoint?.value;
        this._frameGraphTask.velocityTexture = this.velocity.connectedPoint?.value;
        this._frameGraphTask.camera = this.camera.connectedPoint?.value;
        this._frameGraphTask.objectList = this.objects.connectedPoint?.value;
    }
    _dumpPropertiesCode() {
        const codes = [];
        codes.push(`${this._codeVariableName}.sampleDirections = ${this.sampleDirections};`);
        codes.push(`${this._codeVariableName}.coloredShadows = ${this.coloredShadows};`);
        codes.push(`${this._codeVariableName}.voxelShadowOpacity = ${this.voxelShadowOpacity};`);
        codes.push(`${this._codeVariableName}.ssShadowOpacity = ${this.ssShadowOpacity};`);
        codes.push(`${this._codeVariableName}.ssShadowSampleCount = ${this.ssShadowSampleCount};`);
        codes.push(`${this._codeVariableName}.ssShadowStride = ${this.ssShadowStride};`);
        codes.push(`${this._codeVariableName}.ssShadowDistanceScale = ${this.ssShadowDistanceScale};`);
        codes.push(`${this._codeVariableName}.ssShadowThicknessScale = ${this.ssShadowThicknessScale};`);
        codes.push(`${this._codeVariableName}.voxelNormalBias = ${this.voxelNormalBias};`);
        codes.push(`${this._codeVariableName}.voxelDirectionBias = ${this.voxelDirectionBias};`);
        codes.push(`${this._codeVariableName}.envRotation = ${this.envRotation};`);
        codes.push(`${this._codeVariableName}.shadowRemanence = ${this.shadowRemanence};`);
        codes.push(`${this._codeVariableName}.shadowOpacity = ${this.shadowOpacity};`);
        codes.push(`${this._codeVariableName}.resolutionExp = ${this.resolutionExp};`);
        codes.push(`${this._codeVariableName}.refreshRate = ${this.refreshRate};`);
        codes.push(`${this._codeVariableName}.triPlanarVoxelization = ${this.triPlanarVoxelization};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.sampleDirections = this.sampleDirections;
        serializationObject.coloredShadows = this.coloredShadows;
        serializationObject.voxelShadowOpacity = this.voxelShadowOpacity;
        serializationObject.ssShadowOpacity = this.ssShadowOpacity;
        serializationObject.ssShadowSampleCount = this.ssShadowSampleCount;
        serializationObject.ssShadowStride = this.ssShadowStride;
        serializationObject.ssShadowDistanceScale = this.ssShadowDistanceScale;
        serializationObject.ssShadowThicknessScale = this.ssShadowThicknessScale;
        serializationObject.voxelNormalBias = this.voxelNormalBias;
        serializationObject.voxelDirectionBias = this.voxelDirectionBias;
        serializationObject.envRotation = this.envRotation;
        serializationObject.shadowRemanence = this.shadowRemanence;
        serializationObject.shadowOpacity = this.shadowOpacity;
        serializationObject.resolutionExp = this.resolutionExp;
        serializationObject.refreshRate = this.refreshRate;
        serializationObject.triPlanarVoxelization = this.triPlanarVoxelization;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.sampleDirections = serializationObject.sampleDirections;
        this.coloredShadows = serializationObject.coloredShadows;
        this.voxelShadowOpacity = serializationObject.voxelShadowOpacity;
        this.ssShadowOpacity = serializationObject.ssShadowOpacity;
        this.ssShadowSampleCount = serializationObject.ssShadowSampleCount;
        this.ssShadowStride = serializationObject.ssShadowStride;
        this.ssShadowDistanceScale = serializationObject.ssShadowDistanceScale;
        this.ssShadowThicknessScale = serializationObject.ssShadowThicknessScale;
        this.voxelNormalBias = serializationObject.voxelNormalBias;
        this.voxelDirectionBias = serializationObject.voxelDirectionBias;
        this.envRotation = serializationObject.envRotation;
        this.shadowRemanence = serializationObject.shadowRemanence;
        this.shadowOpacity = serializationObject.shadowOpacity;
        this.resolutionExp = serializationObject.resolutionExp;
        this.refreshRate = serializationObject.refreshRate;
        this.triPlanarVoxelization = serializationObject.triPlanarVoxelization;
    }
}
__decorate([
    editableInPropertyPage("Sample directions", 2 /* PropertyTypeForEdition.Int */, "TRACING", { min: 1, max: 16 })
], NodeRenderGraphIblShadowsRendererBlock.prototype, "sampleDirections", null);
__decorate([
    editableInPropertyPage("Colored shadows", 0 /* PropertyTypeForEdition.Boolean */, "TRACING")
], NodeRenderGraphIblShadowsRendererBlock.prototype, "coloredShadows", null);
__decorate([
    editableInPropertyPage("Voxel shadow opacity", 1 /* PropertyTypeForEdition.Float */, "TRACING", { min: 0, max: 1 })
], NodeRenderGraphIblShadowsRendererBlock.prototype, "voxelShadowOpacity", null);
__decorate([
    editableInPropertyPage("SS shadow opacity", 1 /* PropertyTypeForEdition.Float */, "TRACING", { min: 0, max: 1 })
], NodeRenderGraphIblShadowsRendererBlock.prototype, "ssShadowOpacity", null);
__decorate([
    editableInPropertyPage("SS sample count", 2 /* PropertyTypeForEdition.Int */, "TRACING", { min: 1, max: 64 })
], NodeRenderGraphIblShadowsRendererBlock.prototype, "ssShadowSampleCount", null);
__decorate([
    editableInPropertyPage("SS stride", 2 /* PropertyTypeForEdition.Int */, "TRACING", { min: 1, max: 32 })
], NodeRenderGraphIblShadowsRendererBlock.prototype, "ssShadowStride", null);
__decorate([
    editableInPropertyPage("SS distance scale", 1 /* PropertyTypeForEdition.Float */, "TRACING", { min: 0 })
], NodeRenderGraphIblShadowsRendererBlock.prototype, "ssShadowDistanceScale", null);
__decorate([
    editableInPropertyPage("SS thickness scale", 1 /* PropertyTypeForEdition.Float */, "TRACING", { min: 0 })
], NodeRenderGraphIblShadowsRendererBlock.prototype, "ssShadowThicknessScale", null);
__decorate([
    editableInPropertyPage("Normal bias", 1 /* PropertyTypeForEdition.Float */, "TRACING", { min: 0 })
], NodeRenderGraphIblShadowsRendererBlock.prototype, "voxelNormalBias", null);
__decorate([
    editableInPropertyPage("Direction bias", 1 /* PropertyTypeForEdition.Float */, "TRACING", { min: 0 })
], NodeRenderGraphIblShadowsRendererBlock.prototype, "voxelDirectionBias", null);
__decorate([
    editableInPropertyPage("Env rotation", 1 /* PropertyTypeForEdition.Float */, "TRACING")
], NodeRenderGraphIblShadowsRendererBlock.prototype, "envRotation", null);
__decorate([
    editableInPropertyPage("Shadow remanence", 1 /* PropertyTypeForEdition.Float */, "ACCUMULATION", { min: 0, max: 1 })
], NodeRenderGraphIblShadowsRendererBlock.prototype, "shadowRemanence", null);
__decorate([
    editableInPropertyPage("Shadow opacity", 1 /* PropertyTypeForEdition.Float */, "ACCUMULATION", { min: 0, max: 1 })
], NodeRenderGraphIblShadowsRendererBlock.prototype, "shadowOpacity", null);
__decorate([
    editableInPropertyPage("Resolution exp", 2 /* PropertyTypeForEdition.Int */, "VOXELIZATION", { min: 1, max: 8 })
], NodeRenderGraphIblShadowsRendererBlock.prototype, "resolutionExp", null);
__decorate([
    editableInPropertyPage("Refresh rate", 2 /* PropertyTypeForEdition.Int */, "VOXELIZATION", { min: -1 })
], NodeRenderGraphIblShadowsRendererBlock.prototype, "refreshRate", null);
__decorate([
    editableInPropertyPage("Tri-planar", 0 /* PropertyTypeForEdition.Boolean */, "VOXELIZATION")
], NodeRenderGraphIblShadowsRendererBlock.prototype, "triPlanarVoxelization", null);
let _Registered = false;
/**
 * Register side effects for iblShadowsRendererBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterIblShadowsRendererBlock() {
    if (_Registered) {
        return;
    }
    _Registered = true;
    RegisterClass("BABYLON.NodeRenderGraphIblShadowsRendererBlock", NodeRenderGraphIblShadowsRendererBlock);
}
//# sourceMappingURL=iblShadowsRendererBlock.pure.js.map