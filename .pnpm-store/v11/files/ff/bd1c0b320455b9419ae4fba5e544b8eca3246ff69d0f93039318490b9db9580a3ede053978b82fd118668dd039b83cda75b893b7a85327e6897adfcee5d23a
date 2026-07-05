import { type Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { type Nullable } from "@babylonjs/core/types.js";
import { type BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture.js";
import { PushMaterial } from "@babylonjs/core/Materials/pushMaterial.js";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh.js";
import { type SubMesh } from "@babylonjs/core/Meshes/subMesh.js";
import { type Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { type Scene } from "@babylonjs/core/scene.js";
/**
 * The grid materials allows you to wrap any shape with a grid.
 * Colors are customizable.
 */
export declare class GridMaterial extends PushMaterial {
    /**
     * Main color of the grid (e.g. between lines)
     */
    mainColor: Color3;
    /**
     * Color of the grid lines.
     */
    lineColor: Color3;
    /**
     * The scale of the grid compared to unit.
     */
    gridRatio: number;
    /**
     * Allows setting an offset for the grid lines.
     */
    gridOffset: Vector3;
    /**
     * The frequency of thicker lines.
     */
    majorUnitFrequency: number;
    /**
     * The visibility of minor units in the grid.
     */
    minorUnitVisibility: number;
    /**
     * Overall mesh opacity. In linesOnly mode this also scales the maximum line alpha.
     */
    opacity: number;
    /**
     * Whether to antialias the grid
     */
    antialias: boolean;
    /**
     * Color of grid lines when the camera is below the surface.
     * When set, lineColor acts as the above-surface color.
     */
    get belowLineColor(): Nullable<Color3>;
    set belowLineColor(value: Nullable<Color3>);
    private _belowLineColor;
    /**
     * Enable multi-scale logarithmic grid LOD. Number of octaves is controlled by gridOctaves.
     */
    useMultiScale: boolean;
    /**
     * World-unit spacing of the finest octave. Default 0.001.
     */
    minGridSpacing: number;
    /**
     * Number of logarithmic octaves rendered (1–8). Default 4.
     */
    gridOctaves: number;
    /**
     * Enable camera-distance-aware horizon (grazing-angle) fade.
     */
    useHorizonFade: boolean;
    /**
     * Render an ultra-fine crosshair at the world origin.
     */
    useOriginMarker: boolean;
    /**
     * When true, only grid lines are visible — non-grid pixels are discarded.
     * Puts the material in the alpha-blend queue and enables a depth pre-pass so grid lines
     * correctly occlude translucent objects (e.g. Gaussian splats). Set mesh.alphaIndex to a
     * value lower than other transparent objects so the depth pre-pass fires first.
     */
    get linesOnly(): boolean;
    set linesOnly(value: boolean);
    private _linesOnly;
    /**
     * Scales grid line width. Values \> 1 produce thicker lines. Default 1.0.
     */
    gridThicknessModifier: number;
    /**
     * Determine RBG output is premultiplied by alpha value.
     */
    preMultiplyAlpha: boolean;
    /**
     * Determines if the max line value will be used instead of the sum wherever grid lines intersect.
     */
    useMaxLine: boolean;
    private _opacityTexture;
    /**
     * Texture to define opacity of the grid
     */
    opacityTexture: BaseTexture;
    private _gridControl;
    private _viewportSize;
    /**
     * constructor
     * @param name The name given to the material in order to identify it afterwards.
     * @param scene The scene the material is used in.
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     */
    constructor(name: string, scene?: Scene, forceGLSL?: boolean);
    private _shadersLoaded;
    /**
     * @returns whether or not the grid requires alpha blending.
     */
    needAlphaBlending(): boolean;
    needAlphaBlendingForMesh(mesh: AbstractMesh): boolean;
    isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
    bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
    /**
     * Dispose the material and its associated resources.
     * @param forceDisposeEffect will also dispose the used effect when true
     */
    dispose(forceDisposeEffect?: boolean): void;
    clone(name: string): GridMaterial;
    serialize(): any;
    getClassName(): string;
    /**
     * Parse a JSON input to create back a grid material.
     * @param source the JSON data to parse
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a new grid material
     */
    static Parse(source: any, scene: Scene, rootUrl: string): GridMaterial;
}
