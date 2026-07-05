// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { atmosphereUboDeclarationWGSL } from "../ShadersWGSL/ShadersInclude/atmosphereUboDeclaration.js";
import { helperFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/helperFunctions.js";
import { depthFunctionsWGSL } from "../ShadersWGSL/ShadersInclude/depthFunctions.js";
import { intersectionFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/intersectionFunctions.js";
import { atmosphereFunctionsWGSL } from "../ShadersWGSL/ShadersInclude/atmosphereFunctions.js";
const name = "compositeGlobeAtmospherePixelShader";
const shader = `#define SAMPLE_SKY_VIEW_LUT
#if USE_SKY_VIEW_LUT
#define EXCLUDE_RAY_MARCHING_FUNCTIONS
#endif
#include<atmosphereUboDeclaration>
#if HAS_DEPTH_TEXTURE
var depthTextureSampler: sampler;var depthTexture: texture_2d<f32>;
#endif
#if USE_SKY_VIEW_LUT
var skyViewLutSampler: sampler;var skyViewLut: texture_2d<f32>;
#else
var transmittanceLutSampler: sampler;var transmittanceLut: texture_2d<f32>;var multiScatteringLutSampler: sampler;var multiScatteringLut: texture_2d<f32>;
#endif
#include<helperFunctions>
#include<depthFunctions>
#include<atmosphereFunctions>
varying vUV: vec2f;varying positionOnNearPlane: vec3f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=vec4f(0.);
#if HAS_DEPTH_TEXTURE
let depth=textureSampleLevel(depthTexture,depthTextureSampler,input.vUV,0.).r;
#endif
let rayDirection=normalize(input.positionOnNearPlane);
#if USE_SKY_VIEW_LUT
var cosAngleBetweenViewAndZenith: f32;var isRayIntersectingGround: bool;var skyColor=sampleSkyViewLut(
skyViewLut,
atmosphere.clampedCameraRadius,
atmosphere.cameraGeocentricNormal,
rayDirection,
atmosphere.directionToLight,
atmosphere.cosCameraHorizonAngleFromZenith,
&cosAngleBetweenViewAndZenith,
&isRayIntersectingGround);fragmentOutputs.color=skyColor;if (isRayIntersectingGround) {fragmentOutputs.color =
applyAerialPerspectiveRadianceBias(
applyAerialPerspectiveIntensity(
applyAerialPerspectiveSaturation(fragmentOutputs.color)));
#if HAS_DEPTH_TEXTURE
fragmentOutputs.color=vec4f(fragmentOutputs.color.rgb,select(fragmentOutputs.color.a,1.,depth>=1.));
#endif
}
#else
var intersectsAtmosphere=false;var cameraPositionGlobalClampedToTopOfAtmosphere=vec3f(0.);moveToTopAtmosphere(
atmosphere.clampedCameraPositionGlobal,
atmosphere.clampedCameraRadius,
atmosphere.cameraGeocentricNormal,
rayDirection,
&intersectsAtmosphere,
&cameraPositionGlobalClampedToTopOfAtmosphere);if (!intersectsAtmosphere) {return fragmentOutputs;}
#if HAS_DEPTH_TEXTURE
let distanceFromCamera =
reconstructDistanceFromCamera(
depth,
rayDirection,
atmosphere.cameraForward,
atmosphere.cameraNearPlane);let distanceToSurface=distanceFromCamera/1000.;
#else
let distanceToSurface=0.;
#endif
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
distanceToSurface,
&transmittance);let transparency=1.-avg(transmittance);fragmentOutputs.color=vec4f(radiance,transparency);if (distanceToSurface>0.) {fragmentOutputs.color =
applyAerialPerspectiveRadianceBias(
applyAerialPerspectiveIntensity(
applyAerialPerspectiveSaturation(fragmentOutputs.color)));
#if HAS_DEPTH_TEXTURE
fragmentOutputs.color=vec4f(fragmentOutputs.color.rgb,select(fragmentOutputs.color.a,1.,depth>=1.));
#endif
}
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
const includes = [atmosphereUboDeclarationWGSL, helperFunctionsWGSL, depthFunctionsWGSL, intersectionFunctionsWGSL, atmosphereFunctionsWGSL];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStoreWGSL[inc.name]) {
        ShaderStore.IncludesShadersStoreWGSL[inc.name] = inc.shader;
    }
}
/** @internal */
export const compositeGlobeAtmospherePixelShaderWGSL = { name, shader };
//# sourceMappingURL=compositeGlobeAtmosphere.fragment.js.map