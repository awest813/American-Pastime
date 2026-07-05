// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { atmosphereUboDeclarationWGSL } from "../ShadersWGSL/ShadersInclude/atmosphereUboDeclaration.js";
import { helperFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/helperFunctions.js";
import { depthFunctionsWGSL } from "../ShadersWGSL/ShadersInclude/depthFunctions.js";
import { intersectionFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/intersectionFunctions.js";
import { atmosphereFunctionsWGSL } from "../ShadersWGSL/ShadersInclude/atmosphereFunctions.js";
const name = "compositeAerialPerspectivePixelShader";
const shader = `#include<atmosphereUboDeclaration>
#if USE_AERIAL_PERSPECTIVE_LUT
var aerialPerspectiveLutSampler: sampler;var aerialPerspectiveLut: texture_2d_array<f32>;
#endif
var depthTextureSampler: sampler;var depthTexture: texture_2d<f32>;var transmittanceLutSampler: sampler;var transmittanceLut: texture_2d<f32>;var multiScatteringLutSampler: sampler;var multiScatteringLut: texture_2d<f32>;
#include<helperFunctions>
#include<depthFunctions>
#include<atmosphereFunctions>
varying vUV: vec2f;varying positionOnNearPlane: vec3f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=vec4f(0.);let depth=textureSampleLevel(depthTexture,depthTextureSampler,input.vUV,0.).r;if (depth>=1.) {discard;}
let rayDirection=normalize(input.positionOnNearPlane);let distanceFromCamera =
reconstructDistanceFromCamera(
depth,
rayDirection,
atmosphere.cameraForward,
atmosphere.cameraNearPlane);let distanceToSurface=distanceFromCamera/1000.;var aerialPerspective=vec4f(0.);if (sampleAerialPerspectiveLut(
input.vUV,
false,
distanceToSurface,
NumAerialPerspectiveLutLayers,
AerialPerspectiveLutKMPerSlice,
AerialPerspectiveLutRangeKM,
&aerialPerspective)) {
#ifndef APPLY_TRANSMITTANCE_BLENDING
aerialPerspective=vec4f(aerialPerspective.rgb,0.);
#endif
fragmentOutputs.color=aerialPerspective;} else {var intersectsAtmosphere=false;var cameraPositionGlobalClampedToTopOfAtmosphere=vec3f(0.);moveToTopAtmosphere(
atmosphere.clampedCameraPositionGlobal,
atmosphere.clampedCameraRadius,
atmosphere.cameraGeocentricNormal,
rayDirection,
&intersectsAtmosphere,
&cameraPositionGlobalClampedToTopOfAtmosphere);if (!intersectsAtmosphere) {fragmentOutputs.color=vec4f(0.);return fragmentOutputs;}
let isAerialPerspectiveLut=atmosphere.clampedCameraRadius<atmosphere.atmosphereRadius;var transmittance: vec3f;let radiance=integrateScatteredRadiance(
isAerialPerspectiveLut,
atmosphere.atmosphereExposure*atmosphere.lightIntensity,
transmittanceLut,
multiScatteringLut,
atmosphere.multiScatteringIntensity,
cameraPositionGlobalClampedToTopOfAtmosphere,
rayDirection,
atmosphere.directionToLight,
100000000.,
atmosphere.skyViewLutSampleCount,
distanceToSurface,
&transmittance);let transparency=1.-avg(transmittance);fragmentOutputs.color =
applyAerialPerspectiveRadianceBias(
applyAerialPerspectiveIntensity(
applyAerialPerspectiveSaturation(vec4f(radiance,transparency))));
#ifndef APPLY_TRANSMITTANCE_BLENDING
fragmentOutputs.color=vec4f(fragmentOutputs.color.rgb,0.);
#endif
}
#if OUTPUT_TO_SRGB
fragmentOutputs.color=toGammaSpace(fragmentOutputs.color);
#endif
}
`;
// Sideeffect
if (!ShaderStore.ShadersStoreWGSL[name]) {
    ShaderStore.ShadersStoreWGSL[name] = shader;
}
const includes = [atmosphereUboDeclarationWGSL, helperFunctionsWGSL, depthFunctionsWGSL, intersectionFunctionsWGSL, atmosphereFunctionsWGSL];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStoreWGSL[inc.name]) {
        ShaderStore.IncludesShadersStoreWGSL[inc.name] = inc.shader;
    }
}
/** @internal */
export const compositeAerialPerspectivePixelShaderWGSL = { name, shader };
//# sourceMappingURL=compositeAerialPerspective.fragment.js.map