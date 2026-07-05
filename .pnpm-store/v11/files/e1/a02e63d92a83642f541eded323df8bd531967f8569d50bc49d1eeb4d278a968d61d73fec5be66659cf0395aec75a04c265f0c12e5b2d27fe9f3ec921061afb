// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { logDepthDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/logDepthDeclaration.js";
import { clipPlaneVertexDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/clipPlaneVertexDeclaration.js";
import { fogVertexDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/fogVertexDeclaration.js";
import { clipPlaneVertex } from "@babylonjs/core/Shaders/ShadersInclude/clipPlaneVertex.js";
import { logDepthVertex } from "@babylonjs/core/Shaders/ShadersInclude/logDepthVertex.js";
import { fogVertex } from "@babylonjs/core/Shaders/ShadersInclude/fogVertex.js";
const name = "skyVertexShader";
const shader = `precision highp float;attribute vec3 position;
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif
uniform mat4 world;uniform mat4 view;uniform mat4 viewProjection;
#ifdef POINTSIZE
uniform float pointSize;
#endif
varying vec3 vPositionW;
#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif
#include<logDepthDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
gl_Position=viewProjection*world*vec4(position,1.0);vec4 worldPos=world*vec4(position,1.0);vPositionW=vec3(worldPos);
#include<clipPlaneVertex>
#include<logDepthVertex>
#include<fogVertex>
#ifdef VERTEXCOLOR
vColor=color;
#endif
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
const includes = [logDepthDeclaration, clipPlaneVertexDeclaration, fogVertexDeclaration, clipPlaneVertex, logDepthVertex, fogVertex];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStore[inc.name]) {
        ShaderStore.IncludesShadersStore[inc.name] = inc.shader;
    }
}
/** @internal */
export const skyVertexShader = { name, shader };
//# sourceMappingURL=sky.vertex.js.map