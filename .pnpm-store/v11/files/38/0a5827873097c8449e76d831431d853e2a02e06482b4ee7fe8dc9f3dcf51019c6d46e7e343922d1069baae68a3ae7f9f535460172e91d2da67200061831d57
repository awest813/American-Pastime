import { type Nullable } from "@babylonjs/core/types.js";
import { type Matrix } from "@babylonjs/core/Maths/math.vector.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { type BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture.js";
import { type IShadowLight } from "@babylonjs/core/Lights/shadowLight.js";
import { PushMaterial } from "@babylonjs/core/Materials/pushMaterial.js";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh.js";
import { type SubMesh } from "@babylonjs/core/Meshes/subMesh.js";
import { type Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { Scene } from "@babylonjs/core/scene.js";
export declare class ShadowOnlyMaterial extends PushMaterial {
    private _activeLight;
    private _needAlphaBlending;
    private _shadersLoaded;
    /**
     * Instantiates a ShadowOnly Material in the given scene
     * @param name The friendly name of the material
     * @param scene The scene to add the material to
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     */
    constructor(name: string, scene?: Scene, forceGLSL?: boolean);
    shadowColor: Color3;
    needAlphaBlending(): boolean;
    needAlphaTesting(): boolean;
    getAlphaTestTexture(): Nullable<BaseTexture>;
    get activeLight(): IShadowLight;
    set activeLight(light: IShadowLight);
    private _getFirstShadowLightForMesh;
    isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
    bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
    clone(name: string): ShadowOnlyMaterial;
    serialize(): any;
    getClassName(): string;
    static Parse(source: any, scene: Scene, rootUrl: string): ShadowOnlyMaterial;
}
