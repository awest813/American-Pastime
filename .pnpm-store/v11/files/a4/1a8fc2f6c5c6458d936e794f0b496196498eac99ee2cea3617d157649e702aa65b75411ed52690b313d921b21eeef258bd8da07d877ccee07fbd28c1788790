// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { logDepthDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/logDepthDeclaration.js";
import { clipPlaneVertexDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/clipPlaneVertexDeclaration.js";
import { fogVertexDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/fogVertexDeclaration.js";
import { clipPlaneVertexWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/clipPlaneVertex.js";
import { logDepthVertexWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/logDepthVertex.js";
import { fogVertexWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/fogVertex.js";
const name = "skyVertexShader";
const shader = `attribute position: vec3f;
#ifdef VERTEXCOLOR
attribute color: vec4f;
#endif
uniform world: mat4x4f;uniform view: mat4x4f;uniform viewProjection: mat4x4f;
#ifdef POINTSIZE
uniform pointSize: f32;
#endif
varying vPositionW: vec3f;
#ifdef VERTEXCOLOR
varying vColor: vec4f;
#endif
#include<logDepthDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.position=uniforms.viewProjection*uniforms.world* vec4f(vertexInputs.position,1.0);var worldPos: vec4f=uniforms.world* vec4f(vertexInputs.position,1.0);vertexOutputs.vPositionW= worldPos.xyz;
#include<clipPlaneVertex>
#include<logDepthVertex>
#include<fogVertex>
#ifdef VERTEXCOLOR
vertexOutputs.vColor=vertexInputs.color;
#endif
#define CUSTOM_VERTEX_MAIN_END
}
`;
// Sideeffect
if (!ShaderStore.ShadersStoreWGSL[name]) {
    ShaderStore.ShadersStoreWGSL[name] = shader;
}
const includes = [logDepthDeclarationWGSL, clipPlaneVertexDeclarationWGSL, fogVertexDeclarationWGSL, clipPlaneVertexWGSL, logDepthVertexWGSL, fogVertexWGSL];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStoreWGSL[inc.name]) {
        ShaderStore.IncludesShadersStoreWGSL[inc.name] = inc.shader;
    }
}
/** @internal */
export const skyVertexShaderWGSL = { name, shader };
//# sourceMappingURL=sky.vertex.js.map