// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { sceneUboDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/sceneUboDeclaration.js";
import { helperFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/helperFunctions.js";
import { lightUboDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/lightUboDeclaration.js";
import { lightsFragmentFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/lightsFragmentFunctions.js";
import { shadowsFragmentFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/shadowsFragmentFunctions.js";
import { clipPlaneFragmentDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/clipPlaneFragmentDeclaration.js";
import { logDepthDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/logDepthDeclaration.js";
import { fogFragmentDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/fogFragmentDeclaration.js";
import { clipPlaneFragmentWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/clipPlaneFragment.js";
import { lightFragmentWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/lightFragment.js";
import { logDepthFragmentWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/logDepthFragment.js";
import { fogFragmentWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/fogFragment.js";
const name = "shadowOnlyPixelShader";
const shader = `#include<sceneUboDeclaration>
uniform alpha: f32;uniform shadowColor: vec3f;varying vPositionW: vec3f;
#ifdef NORMAL
varying vNormalW: vec3f;
#endif
#include<helperFunctions>
#include<lightUboDeclaration>[0..maxSimultaneousLights]
#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH>0
varying vViewDepth: f32;
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
var viewDirectionW: vec3f=normalize(scene.vEyePosition.xyz-fragmentInputs.vPositionW);
#ifdef NORMAL
var normalW: vec3f=normalize(fragmentInputs.vNormalW);
#else
var normalW: vec3f= vec3f(1.0,1.0,1.0);
#endif
var diffuseBase: vec3f= vec3f(0.,0.,0.);var info: lightingInfo;var shadow: f32=1.;var glossiness: f32=0.;var aggShadow: f32=0.;var numLights: f32=0.;
#include<lightFragment>[0..1]
var color: vec4f= vec4f(uniforms.shadowColor,(1.0-clamp(shadow,0.,1.))*uniforms.alpha);
#include<logDepthFragment>
#include<fogFragment>
fragmentOutputs.color=color;
#define CUSTOM_FRAGMENT_MAIN_END
}
`;
// Sideeffect
if (!ShaderStore.ShadersStoreWGSL[name]) {
    ShaderStore.ShadersStoreWGSL[name] = shader;
}
const includes = [sceneUboDeclarationWGSL, helperFunctionsWGSL, lightUboDeclarationWGSL, lightsFragmentFunctionsWGSL, shadowsFragmentFunctionsWGSL, clipPlaneFragmentDeclarationWGSL, logDepthDeclarationWGSL, fogFragmentDeclarationWGSL, clipPlaneFragmentWGSL, lightFragmentWGSL, logDepthFragmentWGSL, fogFragmentWGSL];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStoreWGSL[inc.name]) {
        ShaderStore.IncludesShadersStoreWGSL[inc.name] = inc.shader;
    }
}
/** @internal */
export const shadowOnlyPixelShaderWGSL = { name, shader };
//# sourceMappingURL=shadowOnly.fragment.js.map