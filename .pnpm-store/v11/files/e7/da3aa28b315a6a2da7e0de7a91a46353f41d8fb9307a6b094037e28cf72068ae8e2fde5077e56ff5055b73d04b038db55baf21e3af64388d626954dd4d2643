// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { helperFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/helperFunctions.js";
import { lightUboDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/lightUboDeclaration.js";
import { logDepthDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/logDepthDeclaration.js";
import { lightsFragmentFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/lightsFragmentFunctions.js";
import { shadowsFragmentFunctionsWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/shadowsFragmentFunctions.js";
import { fogFragmentDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/fogFragmentDeclaration.js";
import { clipPlaneFragmentDeclarationWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/clipPlaneFragmentDeclaration.js";
import { clipPlaneFragmentWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/clipPlaneFragment.js";
import { depthPrePassWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/depthPrePass.js";
import { lightFragmentWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/lightFragment.js";
import { logDepthFragmentWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/logDepthFragment.js";
import { fogFragmentWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/fogFragment.js";
import { imageProcessingCompatibilityWGSL } from "@babylonjs/core/ShadersWGSL/ShadersInclude/imageProcessingCompatibility.js";
const name = "furPixelShader";
const shader = `uniform vEyePosition: vec4f;uniform vDiffuseColor: vec4f;uniform furColor: vec4f;uniform furLength: f32;varying vPositionW: vec3f;varying vfur_length: f32;
#ifdef NORMAL
varying vNormalW: vec3f;
#endif
#ifdef VERTEXCOLOR
varying vColor: vec4f;
#endif
#include<helperFunctions>
#include<lightUboDeclaration>[0..maxSimultaneousLights]
#ifdef DIFFUSE
varying vDiffuseUV: vec2f;var diffuseSamplerSampler: sampler;var diffuseSampler: texture_2d<f32>;uniform vDiffuseInfos: vec2f;
#endif
#ifdef HIGHLEVEL
uniform furOffset: f32;uniform furOcclusion: f32;var furTextureSampler: sampler;var furTexture: texture_2d<f32>;varying vFurUV: vec2f;
#endif
#include<logDepthDeclaration>
#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#include<fogFragmentDeclaration>
#include<clipPlaneFragmentDeclaration>
fn Rand(rv: vec3f)->f32 {var x: f32=dot(rv, vec3f(12.9898,78.233,24.65487));return fract(sin(x)*43758.5453);}
#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH>0
varying vViewDepth: f32;
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
var viewDirectionW: vec3f=normalize(uniforms.vEyePosition.xyz-fragmentInputs.vPositionW);var baseColor: vec4f=uniforms.furColor;var diffuseColor: vec3f=uniforms.vDiffuseColor.rgb;var alpha: f32=uniforms.vDiffuseColor.a;
#ifdef DIFFUSE
baseColor=baseColor*textureSample(diffuseSampler,diffuseSamplerSampler,fragmentInputs.vDiffuseUV);
#ifdef ALPHATEST
if (baseColor.a<0.4) {discard;}
#endif
#include<depthPrePass>
baseColor=vec4f(baseColor.rgb*uniforms.vDiffuseInfos.y,baseColor.a);
#endif
#ifdef VERTEXCOLOR
baseColor=vec4f(baseColor.rgb*fragmentInputs.vColor.rgb,baseColor.a);
#endif
#ifdef NORMAL
var normalW: vec3f=normalize(fragmentInputs.vNormalW);
#else
var normalW: vec3f= vec3f(1.0,1.0,1.0);
#endif
#ifdef HIGHLEVEL
var furTextureColor: vec4f=textureSample(furTexture,furTextureSampler, vec2f(fragmentInputs.vFurUV.x,fragmentInputs.vFurUV.y));if (furTextureColor.a<=0.0 || furTextureColor.g<uniforms.furOffset) {discard;}
var occlusion: f32=mix(0.0,furTextureColor.b*1.2,uniforms.furOffset);baseColor= vec4f(baseColor.xyz*max(occlusion,uniforms.furOcclusion),1.1-uniforms.furOffset);
#endif
var diffuseBase: vec3f= vec3f(0.,0.,0.);var info: lightingInfo;var shadow: f32=1.;var glossiness: f32=0.;var aggShadow: f32=0.;var numLights: f32=0.;
#ifdef SPECULARTERM
var specularBase: vec3f= vec3f(0.,0.,0.);
#endif
#include<lightFragment>[0..maxSimultaneousLights]
#if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
alpha*=fragmentInputs.vColor.a;
#endif
var finalDiffuse: vec3f=clamp(diffuseBase.rgb*baseColor.rgb,vec3f(0.0),vec3f(1.0));
#ifdef HIGHLEVEL
var color: vec4f= vec4f(finalDiffuse,alpha);
#else
var rr: f32=fragmentInputs.vfur_length/uniforms.furLength*0.5;var color: vec4f= vec4f(finalDiffuse*(0.5+rr),alpha);
#endif
#include<logDepthFragment>
#include<fogFragment>
fragmentOutputs.color=color;
#include<imageProcessingCompatibility>
#define CUSTOM_FRAGMENT_MAIN_END
}
`;
// Sideeffect
if (!ShaderStore.ShadersStoreWGSL[name]) {
    ShaderStore.ShadersStoreWGSL[name] = shader;
}
const includes = [helperFunctionsWGSL, lightUboDeclarationWGSL, logDepthDeclarationWGSL, lightsFragmentFunctionsWGSL, shadowsFragmentFunctionsWGSL, fogFragmentDeclarationWGSL, clipPlaneFragmentDeclarationWGSL, clipPlaneFragmentWGSL, depthPrePassWGSL, lightFragmentWGSL, logDepthFragmentWGSL, fogFragmentWGSL, imageProcessingCompatibilityWGSL];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStoreWGSL[inc.name]) {
        ShaderStore.IncludesShadersStoreWGSL[inc.name] = inc.shader;
    }
}
/** @internal */
export const furPixelShaderWGSL = { name, shader };
//# sourceMappingURL=fur.fragment.js.map