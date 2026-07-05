// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { bonesDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/bonesDeclaration.js";
import { bakedVertexAnimationDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/bakedVertexAnimationDeclaration.js";
import { instancesDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/instancesDeclaration.js";
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
import { vertexColorMixingWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/vertexColorMixing.js";
const name = "simpleVertexShader";
const shader = `attribute position: vec3f;
#ifdef NORMAL
attribute normal: vec3f;
#endif
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
varying vDiffuseUV: vec2f;uniform diffuseMatrix: mat4x4f;uniform vDiffuseInfos: vec2f;
#endif
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
#ifdef VERTEXCOLOR
var colorUpdated: vec4f=vertexInputs.color;
#endif
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld* vec4f(vertexInputs.position,1.0);vertexOutputs.position=uniforms.viewProjection*worldPos;vertexOutputs.vPositionW= worldPos.xyz;
#ifdef NORMAL
vertexOutputs.vNormalW=normalize(( finalWorld* vec4f(vertexInputs.normal,0.0)).xyz);
#endif
#ifndef UV1
var uv: vec2f= vec2f(0.,0.);
#else
var uv: vec2f=vertexInputs.uv;
#endif
#ifndef UV2
var uv2: vec2f= vec2f(0.,0.);
#else
var uv2: vec2f=vertexInputs.uv2;
#endif
#ifdef DIFFUSE
if (uniforms.vDiffuseInfos.x==0.)
{vertexOutputs.vDiffuseUV=(uniforms.diffuseMatrix* vec4f(uv,1.0,0.0)).xy;}
else
{vertexOutputs.vDiffuseUV=(uniforms.diffuseMatrix* vec4f(uv2,1.0,0.0)).xy;}
#endif
#include<clipPlaneVertex>
#include<logDepthVertex>
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]
#include<vertexColorMixing>
#define CUSTOM_VERTEX_MAIN_END
}
`;
// Sideeffect
if (!ShaderStore.ShadersStoreWGSL[name]) {
    ShaderStore.ShadersStoreWGSL[name] = shader;
}
const includes = [bonesDeclarationWGSL, bakedVertexAnimationDeclarationWGSL, instancesDeclarationWGSL, clipPlaneVertexDeclarationWGSL, logDepthDeclarationWGSL, fogVertexDeclarationWGSL, lightVxFragmentDeclarationWGSL, lightVxUboDeclarationWGSL, instancesVertexWGSL, bonesVertexWGSL, bakedVertexAnimationWGSL, clipPlaneVertexWGSL, logDepthVertexWGSL, fogVertexWGSL, shadowsVertexWGSL, vertexColorMixingWGSL];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStoreWGSL[inc.name]) {
        ShaderStore.IncludesShadersStoreWGSL[inc.name] = inc.shader;
    }
}
/** @internal */
export const simpleVertexShaderWGSL = { name, shader };
//# sourceMappingURL=simple.vertex.js.map