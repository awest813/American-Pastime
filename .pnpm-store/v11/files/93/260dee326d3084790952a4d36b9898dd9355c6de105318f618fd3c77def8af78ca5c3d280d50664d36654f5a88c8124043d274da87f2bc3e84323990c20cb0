import { type Nullable } from "@babylonjs/core/types.js";
import { type Matrix } from "@babylonjs/core/Maths/math.vector.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { type BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture.js";
import { PushMaterial } from "@babylonjs/core/Materials/pushMaterial.js";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh.js";
import { type SubMesh } from "@babylonjs/core/Meshes/subMesh.js";
import { type Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { Scene } from "@babylonjs/core/scene.js";
import { type IAnimatable } from "@babylonjs/core/Animations/animatable.interface.js";
export declare class CellMaterial extends PushMaterial {
    private _diffuseTexture;
    diffuseTexture: BaseTexture;
    diffuseColor: Color3;
    _computeHighLevel: boolean;
    computeHighLevel: boolean;
    private _disableLighting;
    disableLighting: boolean;
    private _maxSimultaneousLights;
    maxSimultaneousLights: number;
    private _shadersLoaded;
    /**
     * Instantiates a Cell Material in the given scene
     * @param name The friendly name of the material
     * @param scene The scene to add the material to
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     */
    constructor(name: string, scene?: Scene, forceGLSL?: boolean);
    needAlphaBlending(): boolean;
    needAlphaTesting(): boolean;
    getAlphaTestTexture(): Nullable<BaseTexture>;
    isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
    bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
    getAnimatables(): IAnimatable[];
    getActiveTextures(): BaseTexture[];
    hasTexture(texture: BaseTexture): boolean;
    dispose(forceDisposeEffect?: boolean): void;
    getClassName(): string;
    clone(name: string): CellMaterial;
    serialize(): any;
    static Parse(source: any, scene: Scene, rootUrl: string): CellMaterial;
}
