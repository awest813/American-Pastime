// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { atmosphereFragmentDeclaration } from "../Shaders/ShadersInclude/atmosphereFragmentDeclaration.js";
import { atmosphereUboDeclaration } from "../Shaders/ShadersInclude/atmosphereUboDeclaration.js";
import { helperFunctions } from "@babylonjs/core/Shaders/ShadersInclude/helperFunctions.js";
import { intersectionFunctions } from "@babylonjs/core/Shaders/ShadersInclude/intersectionFunctions.js";
import { atmosphereFunctions } from "../Shaders/ShadersInclude/atmosphereFunctions.js";
const name = "multiScatteringPixelShader";
const shader = `#define RENDER_MULTI_SCATTERING
#define COMPUTE_MULTI_SCATTERING
precision highp float;
#include<__decl__atmosphereFragment>
uniform sampler2D transmittanceLut;
#include<helperFunctions>
#include<atmosphereFunctions>
varying vec2 uv;void main() {gl_FragColor=renderMultiScattering(uv,transmittanceLut);}`;
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
export const multiScatteringPixelShader = { name, shader };
//# sourceMappingURL=multiScattering.fragment.js.map