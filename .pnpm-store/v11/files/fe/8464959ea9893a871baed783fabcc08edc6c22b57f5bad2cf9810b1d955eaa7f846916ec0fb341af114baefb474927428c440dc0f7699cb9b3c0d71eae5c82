// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { atmosphereFragmentDeclaration } from "../Shaders/ShadersInclude/atmosphereFragmentDeclaration.js";
import { atmosphereUboDeclaration } from "../Shaders/ShadersInclude/atmosphereUboDeclaration.js";
import { helperFunctions } from "@babylonjs/core/Shaders/ShadersInclude/helperFunctions.js";
import { intersectionFunctions } from "@babylonjs/core/Shaders/ShadersInclude/intersectionFunctions.js";
import { atmosphereFunctions } from "../Shaders/ShadersInclude/atmosphereFunctions.js";
import { importanceSampling } from "@babylonjs/core/Shaders/ShadersInclude/importanceSampling.js";
import { pbrBRDFFunctions } from "@babylonjs/core/Shaders/ShadersInclude/pbrBRDFFunctions.js";
import { hdrFilteringFunctions } from "@babylonjs/core/Shaders/ShadersInclude/hdrFilteringFunctions.js";
const name = "diffuseSkyIrradiancePixelShader";
const shader = `precision highp float;
#include<__decl__atmosphereFragment>
uniform sampler2D transmittanceLut;uniform sampler2D multiScatteringLut;
#include<helperFunctions>
#include<atmosphereFunctions>
vec3 integrateForIrradiance(vec3 directionToLight,vec3 rayDirection,vec3 rayOrigin) {vec3 transmittance;vec3 radiance=integrateScatteredRadiance(
false,
1.,
transmittanceLut,
multiScatteringLut,
multiScatteringIntensity,
rayOrigin,
rayDirection.xzy,
directionToLight.xzy,
100000000.,
diffuseSkyIrradianceLutSampleCount,
-1.,
transmittance);return radiance;}
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
varying vec2 uv;void main() {vec2 unit=uvToUnit(uv,DiffuseSkyIrradianceLutDomainInUVSpace,DiffuseSkyIrradianceLutHalfTexelSize);float cosLightInclination=2.*unit.x-1.;float sinLightInclination=sqrtClamped(1.-cosLightInclination*cosLightInclination);vec3 directionToLight=normalize(vec3(0.,cosLightInclination,sinLightInclination));float radius=max(planetRadiusWithOffset,unit.y*atmosphereThickness+planetRadius);vec3 swappedDirectionToLight=vec3(directionToLight.x,directionToLight.z,directionToLight.y); 
vec3 irradiance=PI*irradiance(
swappedDirectionToLight,
vec2(radius,0.),
1.,
vec3(1.),
vec3(1.));float averageIrradiance=getLuminanceUnclamped(irradiance);vec3 newIrradiance=mix(irradiance,vec3(averageIrradiance),diffuseSkyIrradianceDesaturationFactor);float newIrradianceScale=getLuminanceUnclamped(newIrradiance);float rescaling=averageIrradiance/max(0.000001,newIrradianceScale);irradiance=newIrradiance*rescaling;gl_FragColor=vec4(irradiance,1.);}`;
// Sideeffect
if (!ShaderStore.ShadersStore[name]) {
    ShaderStore.ShadersStore[name] = shader;
}
const includes = [atmosphereFragmentDeclaration, atmosphereUboDeclaration, helperFunctions, intersectionFunctions, atmosphereFunctions, importanceSampling, pbrBRDFFunctions, hdrFilteringFunctions];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStore[inc.name]) {
        ShaderStore.IncludesShadersStore[inc.name] = inc.shader;
    }
}
/** @internal */
export const diffuseSkyIrradiancePixelShader = { name, shader };
//# sourceMappingURL=diffuseSkyIrradiance.fragment.js.map