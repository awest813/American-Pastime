// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { bonesDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/bonesDeclaration.js";
import { bakedVertexAnimationDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/bakedVertexAnimationDeclaration.js";
import { instancesDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/instancesDeclaration.js";
import { sceneVertexDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/sceneVertexDeclaration.js";
import { sceneUboDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/sceneUboDeclaration.js";
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
const name = "shadowOnlyVertexShader";
const shader = `precision highp float;attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>
#include<__decl__sceneVertex>
#ifdef POINTSIZE
uniform float pointSize;
#endif
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#ifdef VERTEXCOLOR
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
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(position,1.0);gl_Position=viewProjection*worldPos;vPositionW=vec3(worldPos);
#ifdef NORMAL
vNormalW=normalize(vec3(finalWorld*vec4(normal,0.0)));
#endif
#include<clipPlaneVertex>
#include<logDepthVertex>
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]
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
const includes = [bonesDeclaration, bakedVertexAnimationDeclaration, instancesDeclaration, sceneVertexDeclaration, sceneUboDeclaration, clipPlaneVertexDeclaration, logDepthDeclaration, fogVertexDeclaration, lightFragmentDeclaration, lightUboDeclaration, instancesVertex, bonesVertex, bakedVertexAnimation, clipPlaneVertex, logDepthVertex, fogVertex, shadowsVertex];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStore[inc.name]) {
        ShaderStore.IncludesShadersStore[inc.name] = inc.shader;
    }
}
/** @internal */
export const shadowOnlyVertexShader = { name, shader };
//# sourceMappingURL=shadowOnly.vertex.js.map