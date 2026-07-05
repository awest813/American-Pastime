import { __decorate } from "@babylonjs/core/tslib.es6.js";
/* eslint-disable @typescript-eslint/naming-convention */
import { serializeAsTexture, serialize, expandToProperty, serializeAsColor3, serializeAsVector3 } from "@babylonjs/core/Misc/decorators.js";
import { SerializationHelper } from "@babylonjs/core/Misc/decorators.serialization.js";
import { Vector4, Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { MaterialDefines } from "@babylonjs/core/Materials/materialDefines.js";
import { PushMaterial } from "@babylonjs/core/Materials/pushMaterial.js";
import { MaterialFlags } from "@babylonjs/core/Materials/materialFlags.js";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { RegisterClass } from "@babylonjs/core/Misc/typeStore.js";
import { BindFogParameters, BindLogDepth, PrepareAttributesForInstances, PrepareDefinesForAttributes, PrepareDefinesForFrameBoundValues, PrepareDefinesForMisc, } from "@babylonjs/core/Materials/materialHelper.functions.js";
import { AddClipPlaneUniforms, BindClipPlane } from "@babylonjs/core/Materials/clipPlaneMaterialHelper.js";
class GridMaterialDefines extends MaterialDefines {
    constructor() {
        super();
        this.CLIPPLANE = false;
        this.CLIPPLANE2 = false;
        this.CLIPPLANE3 = false;
        this.CLIPPLANE4 = false;
        this.CLIPPLANE5 = false;
        this.CLIPPLANE6 = false;
        this.OPACITY = false;
        this.ANTIALIAS = false;
        this.LINES_ONLY = false;
        this.FOG = false;
        this.PREMULTIPLYALPHA = false;
        this.MAX_LINE = false;
        this.UV1 = false;
        this.UV2 = false;
        this.INSTANCES = false;
        this.THIN_INSTANCES = false;
        this.IMAGEPROCESSINGPOSTPROCESS = false;
        this.SKIPFINALCOLORCLAMP = false;
        this.LOGARITHMICDEPTH = false;
        this.MULTI_SCALE = false;
        this.HORIZON_FADE = false;
        this.BELOW_LINE_COLOR = false;
        this.ORIGIN_MARKER = false;
        this.rebuild();
    }
}
/**
 * The grid materials allows you to wrap any shape with a grid.
 * Colors are customizable.
 */
export class GridMaterial extends PushMaterial {
    /**
     * Color of grid lines when the camera is below the surface.
     * When set, lineColor acts as the above-surface color.
     */
    get belowLineColor() {
        return this._belowLineColor;
    }
    set belowLineColor(value) {
        if (this._belowLineColor === value) {
            return;
        }
        this._belowLineColor = value;
        this._markAllSubMeshesAsMiscDirty();
    }
    /**
     * When true, only grid lines are visible — non-grid pixels are discarded.
     * Puts the material in the alpha-blend queue and enables a depth pre-pass so grid lines
     * correctly occlude translucent objects (e.g. Gaussian splats). Set mesh.alphaIndex to a
     * value lower than other transparent objects so the depth pre-pass fires first.
     */
    get linesOnly() {
        return this._linesOnly;
    }
    set linesOnly(value) {
        if (this._linesOnly === value) {
            return;
        }
        this._linesOnly = value;
        this.needDepthPrePass = value;
        this._markAllSubMeshesAsMiscDirty();
    }
    /**
     * constructor
     * @param name The name given to the material in order to identify it afterwards.
     * @param scene The scene the material is used in.
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     */
    constructor(name, scene, forceGLSL = false) {
        super(name, scene, undefined, forceGLSL);
        /**
         * Main color of the grid (e.g. between lines)
         */
        this.mainColor = Color3.Black();
        /**
         * Color of the grid lines.
         */
        this.lineColor = Color3.Teal();
        /**
         * The scale of the grid compared to unit.
         */
        this.gridRatio = 1.0;
        /**
         * Allows setting an offset for the grid lines.
         */
        this.gridOffset = Vector3.Zero();
        /**
         * The frequency of thicker lines.
         */
        this.majorUnitFrequency = 10;
        /**
         * The visibility of minor units in the grid.
         */
        this.minorUnitVisibility = 0.33;
        /**
         * Overall mesh opacity. In linesOnly mode this also scales the maximum line alpha.
         */
        this.opacity = 1.0;
        /**
         * Whether to antialias the grid
         */
        this.antialias = true;
        this._belowLineColor = null;
        /**
         * Enable multi-scale logarithmic grid LOD. Number of octaves is controlled by gridOctaves.
         */
        this.useMultiScale = false;
        /**
         * World-unit spacing of the finest octave. Default 0.001.
         */
        this.minGridSpacing = 0.001;
        /**
         * Number of logarithmic octaves rendered (1–8). Default 4.
         */
        this.gridOctaves = 4;
        /**
         * Enable camera-distance-aware horizon (grazing-angle) fade.
         */
        this.useHorizonFade = false;
        /**
         * Render an ultra-fine crosshair at the world origin.
         */
        this.useOriginMarker = false;
        this._linesOnly = false;
        /**
         * Scales grid line width. Values \> 1 produce thicker lines. Default 1.0.
         */
        this.gridThicknessModifier = 1.0;
        /**
         * Determine RBG output is premultiplied by alpha value.
         */
        this.preMultiplyAlpha = false;
        /**
         * Determines if the max line value will be used instead of the sum wherever grid lines intersect.
         */
        this.useMaxLine = false;
        this._gridControl = new Vector4(this.gridRatio, this.majorUnitFrequency, this.minorUnitVisibility, this.opacity);
        this._viewportSize = new Vector2();
        this._shadersLoaded = false;
    }
    /**
     * @returns whether or not the grid requires alpha blending.
     */
    needAlphaBlending() {
        return this.linesOnly || this.opacity < 1.0 || (this._opacityTexture && this._opacityTexture.isReady());
    }
    needAlphaBlendingForMesh(mesh) {
        return mesh.visibility < 1.0 || this.needAlphaBlending();
    }
    isReadyForSubMesh(mesh, subMesh, useInstances) {
        const drawWrapper = subMesh._drawWrapper;
        if (this.isFrozen) {
            if (drawWrapper.effect && drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
                return true;
            }
        }
        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new GridMaterialDefines();
        }
        const defines = subMesh.materialDefines;
        const scene = this.getScene();
        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }
        if (defines.LINES_ONLY !== this.linesOnly) {
            defines.LINES_ONLY = this.linesOnly;
            defines.markAsUnprocessed();
        }
        if (defines.PREMULTIPLYALPHA != this.preMultiplyAlpha) {
            defines.PREMULTIPLYALPHA = !defines.PREMULTIPLYALPHA;
            defines.markAsUnprocessed();
        }
        if (defines.MAX_LINE !== this.useMaxLine) {
            defines.MAX_LINE = !defines.MAX_LINE;
            defines.markAsUnprocessed();
        }
        if (defines.ANTIALIAS !== this.antialias) {
            defines.ANTIALIAS = this.antialias;
            defines.markAsUnprocessed();
        }
        if (defines.MULTI_SCALE !== this.useMultiScale) {
            defines.MULTI_SCALE = this.useMultiScale;
            defines.markAsUnprocessed();
        }
        if (defines.HORIZON_FADE !== this.useHorizonFade) {
            defines.HORIZON_FADE = this.useHorizonFade;
            defines.markAsUnprocessed();
        }
        const wantsBelowColor = this._belowLineColor !== null;
        if (defines.BELOW_LINE_COLOR !== wantsBelowColor) {
            defines.BELOW_LINE_COLOR = wantsBelowColor;
            defines.markAsUnprocessed();
        }
        if (defines.ORIGIN_MARKER !== this.useOriginMarker) {
            defines.ORIGIN_MARKER = this.useOriginMarker;
            defines.markAsUnprocessed();
        }
        // Textures
        if (defines._areTexturesDirty) {
            defines._needUVs = false;
            if (scene.texturesEnabled) {
                if (this._opacityTexture && MaterialFlags.OpacityTextureEnabled) {
                    if (!this._opacityTexture.isReady()) {
                        return false;
                    }
                    else {
                        defines._needUVs = true;
                        defines.OPACITY = true;
                    }
                }
            }
        }
        PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, false, this.fogEnabled, false, defines, undefined, undefined, undefined, this._isVertexOutputInvariant);
        // Values that need to be evaluated on every frame
        PrepareDefinesForFrameBoundValues(scene, scene.getEngine(), this, defines, !!useInstances);
        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();
            // Attributes
            PrepareDefinesForAttributes(mesh, defines, false, false);
            const attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind];
            if (defines.UV1) {
                attribs.push(VertexBuffer.UVKind);
            }
            if (defines.UV2) {
                attribs.push(VertexBuffer.UV2Kind);
            }
            defines.IMAGEPROCESSINGPOSTPROCESS = scene.imageProcessingConfiguration.applyByPostProcess;
            PrepareAttributesForInstances(attribs, defines);
            const uniforms = [
                "projection",
                "mainColor",
                "lineColor",
                "gridControl",
                "gridOffset",
                "vFogInfos",
                "vFogColor",
                "world",
                "view",
                "opacityMatrix",
                "vOpacityInfos",
                "visibility",
                "logarithmicDepthConstant",
                "gridThicknessModifier",
            ];
            if (defines.MULTI_SCALE) {
                uniforms.push("minGridSpacing", "gridOctaves");
            }
            if (defines.HORIZON_FADE || defines.BELOW_LINE_COLOR || defines.ORIGIN_MARKER) {
                uniforms.push("cameraPosition", "viewportSize");
            }
            if (defines.BELOW_LINE_COLOR) {
                uniforms.push("belowLineColor");
            }
            // Defines
            const join = defines.toString();
            AddClipPlaneUniforms(uniforms);
            subMesh.setEffect(scene.getEngine().createEffect("grid", {
                attributes: attribs,
                uniformsNames: uniforms,
                uniformBuffersNames: ["Scene"],
                samplers: ["opacitySampler"],
                defines: join,
                fallbacks: null,
                onCompiled: this.onCompiled,
                onError: this.onError,
                shaderLanguage: this._shaderLanguage,
                extraInitializationsAsync: this._shadersLoaded
                    ? undefined
                    : async () => {
                        if (this.shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                            await Promise.all([import("./wgsl/grid.vertex.js"), import("./wgsl/grid.fragment.js")]);
                        }
                        else {
                            await Promise.all([import("./grid.vertex.js"), import("./grid.fragment.js")]);
                        }
                        this._shadersLoaded = true;
                    },
            }, scene.getEngine()), defines, this._materialContext);
        }
        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }
        defines._renderId = scene.getRenderId();
        drawWrapper._wasPreviouslyReady = true;
        drawWrapper._wasPreviouslyUsingInstances = !!useInstances;
        return true;
    }
    bindForSubMesh(world, mesh, subMesh) {
        const scene = this.getScene();
        const defines = subMesh.materialDefines;
        if (!defines) {
            return;
        }
        const effect = subMesh.effect;
        if (!effect) {
            return;
        }
        this._activeEffect = effect;
        this._activeEffect.setFloat("visibility", mesh.visibility);
        // Matrices
        if (!defines.INSTANCES || defines.THIN_INSTANCE) {
            this.bindOnlyWorldMatrix(world);
        }
        this.bindView(effect);
        this.bindViewProjection(effect);
        // Uniforms
        if (this._mustRebind(scene, effect, subMesh)) {
            this._activeEffect.setColor3("mainColor", this.mainColor);
            this._activeEffect.setColor3("lineColor", this.lineColor);
            this._activeEffect.setVector3("gridOffset", this.gridOffset);
            this._gridControl.x = this.gridRatio;
            this._gridControl.y = Math.round(this.majorUnitFrequency);
            this._gridControl.z = this.minorUnitVisibility;
            this._gridControl.w = this.opacity;
            this._activeEffect.setVector4("gridControl", this._gridControl);
            this._activeEffect.setFloat("gridThicknessModifier", this.gridThicknessModifier);
            if (defines.BELOW_LINE_COLOR && this._belowLineColor) {
                this._activeEffect.setColor3("belowLineColor", this._belowLineColor);
            }
            if (defines.MULTI_SCALE) {
                this._activeEffect.setFloat("minGridSpacing", this.minGridSpacing);
                this._activeEffect.setFloat("gridOctaves", Math.max(1, Math.min(8, Math.round(this.gridOctaves))));
            }
            if (this._opacityTexture && MaterialFlags.OpacityTextureEnabled) {
                this._activeEffect.setTexture("opacitySampler", this._opacityTexture);
                this._activeEffect.setFloat2("vOpacityInfos", this._opacityTexture.coordinatesIndex, this._opacityTexture.level);
                this._activeEffect.setMatrix("opacityMatrix", this._opacityTexture.getTextureMatrix());
            }
            // Clip plane
            BindClipPlane(effect, this, scene);
            // Log. depth
            if (this._useLogarithmicDepth) {
                BindLogDepth(defines, effect, scene);
            }
        }
        // Fog
        BindFogParameters(scene, mesh, this._activeEffect);
        // Camera uniforms — must be updated every frame
        if (defines.HORIZON_FADE || defines.BELOW_LINE_COLOR || defines.ORIGIN_MARKER) {
            const cam = scene.activeCamera;
            if (cam) {
                this._activeEffect.setVector3("cameraPosition", cam.globalPosition);
                const engine = scene.getEngine();
                this._viewportSize.x = engine.getRenderWidth();
                this._viewportSize.y = engine.getRenderHeight();
                this._activeEffect.setVector2("viewportSize", this._viewportSize);
            }
        }
        this._afterBind(mesh, this._activeEffect, subMesh);
    }
    /**
     * Dispose the material and its associated resources.
     * @param forceDisposeEffect will also dispose the used effect when true
     */
    dispose(forceDisposeEffect) {
        super.dispose(forceDisposeEffect);
    }
    clone(name) {
        return SerializationHelper.Clone(() => new GridMaterial(name, this.getScene()), this);
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.GridMaterial";
        return serializationObject;
    }
    getClassName() {
        return "GridMaterial";
    }
    /**
     * Parse a JSON input to create back a grid material.
     * @param source the JSON data to parse
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a new grid material
     */
    static Parse(source, scene, rootUrl) {
        return SerializationHelper.Parse(() => new GridMaterial(source.name, scene), source, scene, rootUrl);
    }
}
__decorate([
    serializeAsColor3()
], GridMaterial.prototype, "mainColor", void 0);
__decorate([
    serializeAsColor3()
], GridMaterial.prototype, "lineColor", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "gridRatio", void 0);
__decorate([
    serializeAsVector3()
], GridMaterial.prototype, "gridOffset", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "majorUnitFrequency", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "minorUnitVisibility", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "opacity", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "antialias", void 0);
__decorate([
    serializeAsColor3()
], GridMaterial.prototype, "belowLineColor", null);
__decorate([
    serialize()
], GridMaterial.prototype, "useMultiScale", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "minGridSpacing", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "gridOctaves", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "useHorizonFade", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "useOriginMarker", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "linesOnly", null);
__decorate([
    serialize()
], GridMaterial.prototype, "gridThicknessModifier", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "preMultiplyAlpha", void 0);
__decorate([
    serialize()
], GridMaterial.prototype, "useMaxLine", void 0);
__decorate([
    serializeAsTexture("opacityTexture")
], GridMaterial.prototype, "_opacityTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], GridMaterial.prototype, "opacityTexture", void 0);
RegisterClass("BABYLON.GridMaterial", GridMaterial);
//# sourceMappingURL=gridMaterial.js.map