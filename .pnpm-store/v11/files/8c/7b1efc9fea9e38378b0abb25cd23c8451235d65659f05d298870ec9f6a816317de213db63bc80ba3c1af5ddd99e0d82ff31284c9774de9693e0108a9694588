// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { bonesDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/bonesDeclaration.js";
import { bakedVertexAnimationDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/bakedVertexAnimationDeclaration.js";
import { instancesDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/instancesDeclaration.js";
import { sceneUboDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/sceneUboDeclaration.js";
import { clipPlaneVertexDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/clipPlaneVertexDeclaration.js";
import { logDepthDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/logDepthDeclaration.js";
import { fogVertexDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/fogVertexDeclaration.js";
import { lightVxFragmentDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/lightVxFragmentDeclaration.js";
import { lightVxUboDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/lightVxUboDeclaration.js";
import { instancesVertexWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/instancesVertex.js";
import { bonesVertexWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/bonesVertex.js";
import { bakedVertexAnimationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/bakedVertexAnimation.js";
import { clipPlaneVertexWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/clipPlaneVertex.js";
import { logDepthVertexWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/logDepthVertex.js";
import { fogVertexWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/fogVertex.js";
import { shadowsVertexWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/shadowsVertex.js";
const name = "shadowOnlyVertexShader";
const shader = `attribute position: vec3f;
#ifdef NORMAL
attribute normal: vec3f;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>
#include<sceneUboDeclaration>
#ifdef POINTSIZE
uniform pointSize: f32;
#endif
varying vPositionW: vec3f;
#ifdef NORMAL
varying vNormalW: vec3f;
#endif
#ifdef VERTEXCOLOR
varying vColor: vec4f;
#endif
#include<clipPlaneVertexDeclaration>
#include<logDepthDeclaration>
#include<fogVertexDeclaration>
#include<__decl__lightVxFragment>[0..maxSimultaneousLights]
#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH>0
varying vViewDepth: f32;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld* vec4f(vertexInputs.position,1.0);vertexOutputs.position=scene.viewProjection*worldPos;vertexOutputs.vPositionW= worldPos.xyz;
#ifdef NORMAL
vertexOutputs.vNormalW=normalize(( finalWorld* vec4f(vertexInputs.normal,0.0)).xyz);
#endif
#include<clipPlaneVertex>
#include<logDepthVertex>
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]
#define CUSTOM_VERTEX_MAIN_END
}
`;
// Sideeffect
if (!ShaderStore.ShadersStoreWGSL[name]) {
    ShaderStore.ShadersStoreWGSL[name] = shader;
}
const includes = [bonesDeclarationWGSL, bakedVertexAnimationDeclarationWGSL, instancesDeclarationWGSL, sceneUboDeclarationWGSL, clipPlaneVertexDeclarationWGSL, logDepthDeclarationWGSL, fogVertexDeclarationWGSL, lightVxFragmentDeclarationWGSL, lightVxUboDeclarationWGSL, instancesVertexWGSL, bonesVertexWGSL, bakedVertexAnimationWGSL, clipPlaneVertexWGSL, logDepthVertexWGSL, fogVertexWGSL, shadowsVertexWGSL];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStoreWGSL[inc.name]) {
        ShaderStore.IncludesShadersStoreWGSL[inc.name] = inc.shader;
    }
}
/** @internal */
export const shadowOnlyVertexShaderWGSL = { name, shader };
//# sourceMappingURL=shadowOnly.vertex.js.map