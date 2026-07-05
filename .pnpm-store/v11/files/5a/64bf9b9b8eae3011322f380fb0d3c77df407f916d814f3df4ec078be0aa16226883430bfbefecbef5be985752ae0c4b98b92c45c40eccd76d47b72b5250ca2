// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { atmosphereFragmentDeclaration } from "../Shaders/ShadersInclude/atmosphereFragmentDeclaration.js";
import { atmosphereUboDeclaration } from "../Shaders/ShadersInclude/atmosphereUboDeclaration.js";
import { helperFunctions } from "@babylonjs/core/Shaders/ShadersInclude/helperFunctions.js";
import { intersectionFunctions } from "@babylonjs/core/Shaders/ShadersInclude/intersectionFunctions.js";
import { atmosphereFunctions } from "../Shaders/ShadersInclude/atmosphereFunctions.js";
const name = "aerialPerspectivePixelShader";
const shader = `#define RENDER_CAMERA_VOLUME
precision highp float;
#include<__decl__atmosphereFragment>
uniform sampler2D transmittanceLut;uniform sampler2D multiScatteringLut;
#include<helperFunctions>
#include<atmosphereFunctions>
varying vec3 positionOnNearPlane;uniform float layerIdx;void main() {gl_FragColor=renderCameraVolume(
positionOnNearPlane,
layerIdx,
transmittanceLut,
multiScatteringLut
);}`;
// Sideeffect
if (!ShaderStore.ShadersStore[name]) {
    ShaderStore.ShadersStore[name] = shader;
}
const includes = [atmosphereFragmentDeclaration, atmosphereUboDeclaration, helperFunctions, intersectionFunctions, atmosphereFunctions];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStore[inc.name]) {
        ShaderStore.IncludesShadersStore[inc.name] = inc.shader;
    }
}
/** @internal */
export const aerialPerspectivePixelShader = { name, shader };
//# sourceMappingURL=aerialPerspective.fragment.js.map