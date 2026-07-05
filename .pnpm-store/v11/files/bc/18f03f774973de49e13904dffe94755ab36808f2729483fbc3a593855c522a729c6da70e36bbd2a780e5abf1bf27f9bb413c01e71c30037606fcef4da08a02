// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { atmosphereFragmentDeclaration } from "../Shaders/ShadersInclude/atmosphereFragmentDeclaration.js";
import { atmosphereUboDeclaration } from "../Shaders/ShadersInclude/atmosphereUboDeclaration.js";
import { helperFunctions } from "@babylonjs/core/Shaders/ShadersInclude/helperFunctions.js";
import { intersectionFunctions } from "@babylonjs/core/Shaders/ShadersInclude/intersectionFunctions.js";
import { atmosphereFunctions } from "../Shaders/ShadersInclude/atmosphereFunctions.js";
const name = "transmittancePixelShader";
const shader = `#define RENDER_TRANSMITTANCE
#define EXCLUDE_RAY_MARCHING_FUNCTIONS
precision highp float;
#include<__decl__atmosphereFragment>
#include<helperFunctions>
#include<atmosphereFunctions>
varying vec2 uv;void main() {gl_FragColor=renderTransmittance(uv);}`;
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
export const transmittancePixelShader = { name, shader };
//# sourceMappingURL=transmittance.fragment.js.map