// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { instancesDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/instancesDeclaration.js";
import { sceneVertexDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/sceneVertexDeclaration.js";
import { sceneUboDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/sceneUboDeclaration.js";
import { logDepthDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/logDepthDeclaration.js";
import { fogVertexDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/fogVertexDeclaration.js";
import { clipPlaneVertexDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/clipPlaneVertexDeclaration.js";
import { instancesVertex } from "@babylonjs/core/Shaders/ShadersInclude/instancesVertex.js";
import { fogVertex } from "@babylonjs/core/Shaders/ShadersInclude/fogVertex.js";
import { clipPlaneVertex } from "@babylonjs/core/Shaders/ShadersInclude/clipPlaneVertex.js";
import { logDepthVertex } from "@babylonjs/core/Shaders/ShadersInclude/logDepthVertex.js";
const name = "gridVertexShader";
const shader = `precision highp float;attribute vec3 position;attribute vec3 normal;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#include<instancesDeclaration>
#include<__decl__sceneVertex>
varying vec3 vPosition;varying vec3 vNormal;
#if defined(HORIZON_FADE) || defined(BELOW_LINE_COLOR) || defined(ORIGIN_MARKER)
varying vec3 vWorldPos;
#endif
#include<logDepthDeclaration>
#include<fogVertexDeclaration>
#ifdef OPACITY
varying vec2 vOpacityUV;uniform mat4 opacityMatrix;uniform vec2 vOpacityInfos;
#endif
#include<clipPlaneVertexDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
#include<instancesVertex>
vec4 worldPos=finalWorld*vec4(position,1.0);
#include<fogVertex>
vec4 cameraSpacePosition=view*worldPos;gl_Position=projection*cameraSpacePosition;
#ifdef OPACITY
#ifndef UV1
vec2 uv=vec2(0.,0.);
#endif
#ifndef UV2
vec2 uv2=vec2(0.,0.);
#endif
if (vOpacityInfos.x==0.)
{vOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));}
else
{vOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));}
#endif 
#include<clipPlaneVertex>
#include<logDepthVertex>
vPosition=position;vNormal=normal;
#if defined(HORIZON_FADE) || defined(BELOW_LINE_COLOR) || defined(ORIGIN_MARKER)
vWorldPos=worldPos.xyz;
#endif
#define CUSTOM_VERTEX_MAIN_END
}`;
// Sideeffect
if (!ShaderStore.ShadersStore[name]) {
    ShaderStore.ShadersStore[name] = shader;
}
const includes = [instancesDeclaration, sceneVertexDeclaration, sceneUboDeclaration, logDepthDeclaration, fogVertexDeclaration, clipPlaneVertexDeclaration, instancesVertex, fogVertex, clipPlaneVertex, logDepthVertex];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStore[inc.name]) {
        ShaderStore.IncludesShadersStore[inc.name] = inc.shader;
    }
}
/** @internal */
export const gridVertexShader = { name, shader };
//# sourceMappingURL=grid.vertex.js.map