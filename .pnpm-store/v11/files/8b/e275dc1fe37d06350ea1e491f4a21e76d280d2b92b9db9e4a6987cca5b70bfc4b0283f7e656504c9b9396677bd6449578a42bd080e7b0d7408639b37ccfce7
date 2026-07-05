// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { atmosphereUboDeclarationWGSL } from "../ShadersWGSL/ShadersInclude/atmosphereUboDeclaration.js";
import { helperFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/helperFunctions.js";
import { intersectionFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/intersectionFunctions.js";
import { atmosphereFunctionsWGSL } from "../ShadersWGSL/ShadersInclude/atmosphereFunctions.js";
const name = "compositeSkyPixelShader";
const shader = `#define SAMPLE_SKY_VIEW_LUT
#if USE_SKY_VIEW_LUT
#define EXCLUDE_RAY_MARCHING_FUNCTIONS
#endif
#include<atmosphereUboDeclaration>
#if USE_SKY_VIEW_LUT
var skyViewLutSampler: sampler;var skyViewLut: texture_2d<f32>;
#else
var transmittanceLutSampler: sampler;var transmittanceLut: texture_2d<f32>;var multiScatteringLutSampler: sampler;var multiScatteringLut: texture_2d<f32>;
#endif
#include<helperFunctions>
#include<atmosphereFunctions>
varying vUV: vec2f;varying positionOnNearPlane: vec3f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=vec4f(0.);let rayDirection=normalize(input.positionOnNearPlane);
#if USE_SKY_VIEW_LUT
var cosAngleBetweenViewAndZenith: f32;var isRayIntersectingGround: bool;var skyColor=sampleSkyViewLut(
skyViewLut,
atmosphere.clampedCameraRadius,
atmosphere.cameraGeocentricNormal,
rayDirection,
atmosphere.directionToLight,
atmosphere.cosCameraHorizonAngleFromZenith,
&cosAngleBetweenViewAndZenith,
&isRayIntersectingGround);
#ifndef APPLY_TRANSMITTANCE_BLENDING
skyColor=vec4f(skyColor.rgb,0.);
#endif
fragmentOutputs.color=skyColor;fragmentOutputs.color=vec4f(fragmentOutputs.color.rgb,select(fragmentOutputs.color.a,1.,isRayIntersectingGround));
#else
var intersectsAtmosphere=false;var cameraPositionGlobalClampedToTopOfAtmosphere=vec3f(0.);moveToTopAtmosphere(
atmosphere.clampedCameraPositionGlobal,
atmosphere.clampedCameraRadius,
atmosphere.cameraGeocentricNormal,
rayDirection,
&intersectsAtmosphere,
&cameraPositionGlobalClampedToTopOfAtmosphere);if (!intersectsAtmosphere) {return fragmentOutputs;}
var transmittance: vec3f;let radiance=integrateScatteredRadiance(
false,
atmosphere.atmosphereExposure*atmosphere.lightIntensity,
transmittanceLut,
multiScatteringLut,
atmosphere.multiScatteringIntensity,
cameraPositionGlobalClampedToTopOfAtmosphere,
rayDirection,
atmosphere.directionToLight,
100000000.,
atmosphere.skyViewLutSampleCount,
-1.,
&transmittance);
#if APPLY_TRANSMITTANCE_BLENDING
let transparency=1.-avg(transmittance);
#else
let transparency=0.;
#endif
fragmentOutputs.color=vec4f(radiance,transparency);
#endif
#if OUTPUT_TO_SRGB
fragmentOutputs.color=toGammaSpace(fragmentOutputs.color);
#endif
}
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
export const compositeSkyPixelShaderWGSL = { name, shader };
//# sourceMappingURL=compositeSky.fragment.js.map