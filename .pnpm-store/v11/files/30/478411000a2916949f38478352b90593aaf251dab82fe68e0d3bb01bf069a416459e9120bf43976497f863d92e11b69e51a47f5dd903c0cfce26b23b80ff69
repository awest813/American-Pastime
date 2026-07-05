// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { bonesDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/bonesDeclaration.js";
import { bakedVertexAnimationDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/bakedVertexAnimationDeclaration.js";
import { instancesDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/instancesDeclaration.js";
import { clipPlaneVertexDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/clipPlaneVertexDeclaration.js";
import { logDepthDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/logDepthDeclaration.js";
import { fogVertexDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/fogVertexDeclaration.js";
import { lightFragmentDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/lightFragmentDeclaration.js";
import { lightUboDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/lightUboDeclaration.js";
import { instancesVertex } from "@babylonjs/core/Shaders/ShadersInclude/instancesVertex.js";
import { bonesVertex } from "@babylonjs/core/Shaders/ShadersInclude/bonesVertex.js";
import { bakedVertexAnimation } from "@babylonjs/core/Shaders/ShadersInclude/bakedVertexAnimation.js";
import { clipPlaneVertex } from "@babylonjs/core/Shaders/ShadersInclude/clipPlaneVertex.js";
import { logDepthVertex } from "@babylonjs/core/Shaders/ShadersInclude/logDepthVertex.js";
import { fogVertex } from "@babylonjs/core/Shaders/ShadersInclude/fogVertex.js";
import { shadowsVertex } from "@babylonjs/core/Shaders/ShadersInclude/shadowsVertex.js";
import { vertexColorMixing } from "@babylonjs/core/Shaders/ShadersInclude/vertexColorMixing.js";
const name = "simpleVertexShader";
const shader = `precision highp float;attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>
uniform mat4 view;uniform mat4 viewProjection;
#ifdef DIFFUSE
varying vec2 vDiffuseUV;uniform mat4 diffuseMatrix;uniform vec2 vDiffuseInfos;
#endif
#ifdef POINTSIZE
uniform float pointSize;
#endif
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif
#include<clipPlaneVertexDeclaration>
#include<logDepthDeclaration>
#include<fogVertexDeclaration>
#include<__decl__lightFragment>[0..maxSimultaneousLights]
#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH>0
varying float vViewDepth;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
#ifdef VERTEXCOLOR
vec4 colorUpdated=color;
#endif
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(position,1.0);gl_Position=viewProjection*worldPos;vPositionW=vec3(worldPos);
#ifdef NORMAL
vNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));
#endif
#ifndef UV1
vec2 uv=vec2(0.,0.);
#endif
#ifndef UV2
vec2 uv2=vec2(0.,0.);
#endif
#ifdef DIFFUSE
if (vDiffuseInfos.x==0.)
{vDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));}
else
{vDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));}
#endif
#include<clipPlaneVertex>
#include<logDepthVertex>
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]
#include<vertexColorMixing>
#if defined(POINTSIZE) && !defined(WEBGPU)
gl_PointSize=pointSize;
#endif
#define CUSTOM_VERTEX_MAIN_END
}
`;
// Sideeffect
if (!ShaderStore.ShadersStore[name]) {
    ShaderStore.ShadersStore[name] = shader;
}
const includes = [bonesDeclaration, bakedVertexAnimationDeclaration, instancesDeclaration, clipPlaneVertexDeclaration, logDepthDeclaration, fogVertexDeclaration, lightFragmentDeclaration, lightUboDeclaration, instancesVertex, bonesVertex, bakedVertexAnimation, clipPlaneVertex, logDepthVertex, fogVertex, shadowsVertex, vertexColorMixing];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStore[inc.name]) {
        ShaderStore.IncludesShadersStore[inc.name] = inc.shader;
    }
}
/** @internal */
export const simpleVertexShader = { name, shader };
//# sourceMappingURL=simple.vertex.js.map