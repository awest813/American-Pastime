// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { bonesDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/bonesDeclaration.js";
import { bakedVertexAnimationDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/bakedVertexAnimationDeclaration.js";
import { instancesDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/instancesDeclaration.js";
import { clipPlaneVertexDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/clipPlaneVertexDeclaration.js";
import { logDepthDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/logDepthDeclaration.js";
import { fogVertexDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/fogVertexDeclaration.js";
import { instancesVertexWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/instancesVertex.js";
import { bonesVertexWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/bonesVertex.js";
import { bakedVertexAnimationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/bakedVertexAnimation.js";
import { clipPlaneVertexWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/clipPlaneVertex.js";
import { logDepthVertexWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/logDepthVertex.js";
import { fogVertexWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/fogVertex.js";
import { vertexColorMixingWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/vertexColorMixing.js";
const name = "fireVertexShader";
const shader = `attribute position: vec3f;
#ifdef UV1
attribute uv: vec2f;
#endif
#ifdef UV2
attribute uv2: vec2f;
#endif
#ifdef VERTEXCOLOR
attribute color: vec4f;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>
uniform view: mat4x4f;uniform viewProjection: mat4x4f;
#ifdef DIFFUSE
varying vDiffuseUV: vec2f;
#endif
#ifdef POINTSIZE
uniform pointSize: f32;
#endif
varying vPositionW: vec3f;
#ifdef VERTEXCOLOR
varying vColor: vec4f;
#endif
#include<clipPlaneVertexDeclaration>
#include<logDepthDeclaration>
#include<fogVertexDeclaration>
uniform time: f32;uniform speed: f32;
#ifdef DIFFUSE
varying vDistortionCoords1: vec2f;varying vDistortionCoords2: vec2f;varying vDistortionCoords3: vec2f;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
#ifdef VERTEXCOLOR
var colorUpdated: vec4f=vertexInputs.color;
#endif
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld* vec4f(vertexInputs.position,1.0);vertexOutputs.position=uniforms.viewProjection*worldPos;vertexOutputs.vPositionW= worldPos.xyz;
#ifdef DIFFUSE
vertexOutputs.vDiffuseUV=vec2f(vertexInputs.uv.x,vertexInputs.uv.y-0.2);
#endif
#include<clipPlaneVertex>
#include<logDepthVertex>
#include<fogVertex>
#include<vertexColorMixing>
#ifdef DIFFUSE
var layerSpeed: vec3f= vec3f(-0.2,-0.52,-0.1)*uniforms.speed;vertexOutputs.vDistortionCoords1=vec2f(vertexInputs.uv.x,vertexInputs.uv.y+layerSpeed.x*uniforms.time/1000.0);vertexOutputs.vDistortionCoords2=vec2f(vertexInputs.uv.x,vertexInputs.uv.y+layerSpeed.y*uniforms.time/1000.0);vertexOutputs.vDistortionCoords3=vec2f(vertexInputs.uv.x,vertexInputs.uv.y+layerSpeed.z*uniforms.time/1000.0);
#endif
#define CUSTOM_VERTEX_MAIN_END
}
`;
// Sideeffect
if (!ShaderStore.ShadersStoreWGSL[name]) {
    ShaderStore.ShadersStoreWGSL[name] = shader;
}
const includes = [bonesDeclarationWGSL, bakedVertexAnimationDeclarationWGSL, instancesDeclarationWGSL, clipPlaneVertexDeclarationWGSL, logDepthDeclarationWGSL, fogVertexDeclarationWGSL, instancesVertexWGSL, bonesVertexWGSL, bakedVertexAnimationWGSL, clipPlaneVertexWGSL, logDepthVertexWGSL, fogVertexWGSL, vertexColorMixingWGSL];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStoreWGSL[inc.name]) {
        ShaderStore.IncludesShadersStoreWGSL[inc.name] = inc.shader;
    }
}
/** @internal */
export const fireVertexShaderWGSL = { name, shader };
//# sourceMappingURL=fire.vertex.js.map