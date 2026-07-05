// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { atmosphereUboDeclarationWGSL } from "../ShadersWGSL/ShadersInclude/atmosphereUboDeclaration.js";
import { helperFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/helperFunctions.js";
import { intersectionFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/intersectionFunctions.js";
import { atmosphereFunctionsWGSL } from "../ShadersWGSL/ShadersInclude/atmosphereFunctions.js";
const name = "multiScatteringPixelShader";
const shader = `#define RENDER_MULTI_SCATTERING
#define COMPUTE_MULTI_SCATTERING
#include<atmosphereUboDeclaration>
var transmittanceLutSampler: sampler;var transmittanceLut: texture_2d<f32>;
#include<helperFunctions>
#include<atmosphereFunctions>
varying vUV: vec2f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=renderMultiScattering(input.vUV,transmittanceLut);}
`;
// Sideeffect
if (!ShaderStore.ShadersStoreWGSL[name]) {
    ShaderStore.ShadersStoreWGSL[name] = shader;
}
const includes = [atmosphereUboDeclarationWGSL, helperFunctionsWGSL, intersectionFunctionsWGSL, atmosphereFunctionsWGSL];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStoreWGSL[inc.name]) {
        ShaderStore.IncludesShadersStoreWGSL[inc.name] = inc.shader;
    }
}
/** @internal */
export const multiScatteringPixelShaderWGSL = { name, shader };
//# sourceMappingURL=multiScattering.fragment.js.map