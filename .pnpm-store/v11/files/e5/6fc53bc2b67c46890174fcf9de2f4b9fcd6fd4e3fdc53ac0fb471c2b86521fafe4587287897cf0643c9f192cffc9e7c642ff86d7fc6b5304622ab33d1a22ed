// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { helperFunctions } from "@babylonjs/core/Shaders/ShadersInclude/helperFunctions.js";
import { lightFragmentDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/lightFragmentDeclaration.js";
import { lightUboDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/lightUboDeclaration.js";
import { lightsFragmentFunctions } from "@babylonjs/core/Shaders/ShadersInclude/lightsFragmentFunctions.js";
import { shadowsFragmentFunctions } from "@babylonjs/core/Shaders/ShadersInclude/shadowsFragmentFunctions.js";
import { clipPlaneFragmentDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/clipPlaneFragmentDeclaration.js";
import { logDepthDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/logDepthDeclaration.js";
import { fogFragmentDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/fogFragmentDeclaration.js";
import { clipPlaneFragment } from "@babylonjs/core/Shaders/ShadersInclude/clipPlaneFragment.js";
import { depthPrePass } from "@babylonjs/core/Shaders/ShadersInclude/depthPrePass.js";
import { lightFragment } from "@babylonjs/core/Shaders/ShadersInclude/lightFragment.js";
import { logDepthFragment } from "@babylonjs/core/Shaders/ShadersInclude/logDepthFragment.js";
import { fogFragment } from "@babylonjs/core/Shaders/ShadersInclude/fogFragment.js";
import { imageProcessingCompatibility } from "@babylonjs/core/Shaders/ShadersInclude/imageProcessingCompatibility.js";
const name = "simplePixelShader";
const shader = `precision highp float;uniform vec4 vEyePosition;uniform vec4 vDiffuseColor;varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif
#include<helperFunctions>
#include<__decl__lightFragment>[0..maxSimultaneousLights]
#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#ifdef DIFFUSE
varying vec2 vDiffuseUV;uniform sampler2D diffuseSampler;uniform vec2 vDiffuseInfos;
#endif
#include<clipPlaneFragmentDeclaration>
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
#if defined(CLUSTLIGHT_BATCH) && CLUSTLIGHT_BATCH>0
varying float vViewDepth;
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
vec3 viewDirectionW=normalize(vEyePosition.xyz-vPositionW);vec4 baseColor=vec4(1.,1.,1.,1.);vec3 diffuseColor=vDiffuseColor.rgb;float alpha=vDiffuseColor.a;
#ifdef DIFFUSE
baseColor=texture2D(diffuseSampler,vDiffuseUV);
#ifdef ALPHATEST
if (baseColor.a<0.4)
discard;
#endif
#include<depthPrePass>
baseColor.rgb*=vDiffuseInfos.y;
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
baseColor.rgb*=vColor.rgb;
#endif
#ifdef NORMAL
vec3 normalW=normalize(vNormalW);
#else
vec3 normalW=vec3(1.0,1.0,1.0);
#endif
vec3 diffuseBase=vec3(0.,0.,0.);lightingInfo info;float shadow=1.;float glossiness=0.;float aggShadow=0.;float numLights=0.;
#ifdef SPECULARTERM
vec3 specularBase=vec3(0.,0.,0.);
#endif 
#include<lightFragment>[0..maxSimultaneousLights]
#if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
alpha*=vColor.a;
#endif
vec3 finalDiffuse=clamp(diffuseBase*diffuseColor,0.0,1.0)*baseColor.rgb;vec4 color=vec4(finalDiffuse,alpha);
#include<logDepthFragment>
#include<fogFragment>
gl_FragColor=color;
#include<imageProcessingCompatibility>
#define CUSTOM_FRAGMENT_MAIN_END
}`;
// Sideeffect
if (!ShaderStore.ShadersStore[name]) {
    ShaderStore.ShadersStore[name] = shader;
}
const includes = [helperFunctions, lightFragmentDeclaration, lightUboDeclaration, lightsFragmentFunctions, shadowsFragmentFunctions, clipPlaneFragmentDeclaration, logDepthDeclaration, fogFragmentDeclaration, clipPlaneFragment, depthPrePass, lightFragment, logDepthFragment, fogFragment, imageProcessingCompatibility];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStore[inc.name]) {
        ShaderStore.IncludesShadersStore[inc.name] = inc.shader;
    }
}
/** @internal */
export const simplePixelShader = { name, shader };
//# sourceMappingURL=simple.fragment.js.map