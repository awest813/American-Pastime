// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { atmosphereUboDeclarationWGSL } from "../ShadersWGSL/ShadersInclude/atmosphereUboDeclaration.js";
import { helperFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/helperFunctions.js";
import { intersectionFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/intersectionFunctions.js";
import { atmosphereFunctionsWGSL } from "../ShadersWGSL/ShadersInclude/atmosphereFunctions.js";
import { importanceSamplingWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/importanceSampling.js";
import { pbrBRDFFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/pbrBRDFFunctions.js";
import { hdrFilteringFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/hdrFilteringFunctions.js";
const name = "diffuseSkyIrradiancePixelShader";
const shader = `#include<atmosphereUboDeclaration>
var transmittanceLutSampler: sampler;var transmittanceLut: texture_2d<f32>;var multiScatteringLutSampler: sampler;var multiScatteringLut: texture_2d<f32>;
#include<helperFunctions>
#include<atmosphereFunctions>
fn integrateForIrradiance(directionToLightParam: vec3f,rayDirection: vec3f,rayOrigin: vec3f)->vec3f {var transmittance: vec3f;let radiance=integrateScatteredRadiance(
false,
1.,
transmittanceLut,
multiScatteringLut,
atmosphere.multiScatteringIntensity,
rayOrigin,
rayDirection.xzy,
directionToLightParam.xzy,
100000000.,
atmosphere.diffuseSkyIrradianceLutSampleCount,
-1.,
&transmittance);return radiance;}
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
varying vUV: vec2f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {let unit=uvToUnit(input.vUV,DiffuseSkyIrradianceLutDomainInUVSpace,DiffuseSkyIrradianceLutHalfTexelSize);let cosLightInclination=2.*unit.x-1.;let sinLightInclination=sqrtClamped(1.-cosLightInclination*cosLightInclination);let directionToLight=normalize(vec3f(0.,cosLightInclination,sinLightInclination));let radius=max(atmosphere.planetRadiusWithOffset,unit.y*atmosphere.atmosphereThickness+atmosphere.planetRadius);let swappedDirectionToLight=vec3f(directionToLight.x,directionToLight.z,directionToLight.y); 
var irradianceResult=PI*irradiance(
swappedDirectionToLight,
vec2f(radius,0.),
1.,
vec3f(1.),
vec3f(1.));let averageIrradiance=getLuminanceUnclamped(irradianceResult);let newIrradiance=mix(irradianceResult,vec3f(averageIrradiance),atmosphere.diffuseSkyIrradianceDesaturationFactor);let newIrradianceScale=getLuminanceUnclamped(newIrradiance);let rescaling=averageIrradiance/max(0.000001,newIrradianceScale);irradianceResult=newIrradiance*rescaling;fragmentOutputs.color=vec4f(irradianceResult,1.);}
`;
// Sideeffect
if (!ShaderStore.ShadersStoreWGSL[name]) {
    ShaderStore.ShadersStoreWGSL[name] = shader;
}
const includes = [atmosphereUboDeclarationWGSL, helperFunctionsWGSL, intersectionFunctionsWGSL, atmosphereFunctionsWGSL, importanceSamplingWGSL, pbrBRDFFunctionsWGSL, hdrFilteringFunctionsWGSL];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStoreWGSL[inc.name]) {
        ShaderStore.IncludesShadersStoreWGSL[inc.name] = inc.shader;
    }
}
/** @internal */
export const diffuseSkyIrradiancePixelShaderWGSL = { name, shader };
//# sourceMappingURL=diffuseSkyIrradiance.fragment.js.map