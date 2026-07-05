// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
const name = "depthFunctions";
const shader = `fn reconstructDistanceFromCameraPlane(depth: f32,cameraNearPlane: f32)->f32 {return cameraNearPlane/(1.-depth);}
fn sampleDistanceFromCameraPlane(depthTex: texture_2d<f32>,depthSampler: sampler,uv: vec2f,cameraNearPlane: f32)->f32 {let depth=textureSampleLevel(depthTex,depthSampler,uv,0.).r;return select(reconstructDistanceFromCameraPlane(depth,cameraNearPlane),0.,depth>=1.);}
fn reconstructDistanceFromCamera(depth: f32,cameraRayDirection: vec3f,cameraForward: vec3f,cameraNearPlane: f32)->f32 {let distanceFromCameraPlane=reconstructDistanceFromCameraPlane(depth,cameraNearPlane);return distanceFromCameraPlane/max(.00001,dot(cameraForward,cameraRayDirection));}
fn reconstructDistanceFromCameraWithTexture(
depthTex: texture_2d<f32>,
depthSampler: sampler,
uv: vec2f,
cameraRayDirection: vec3f,
cameraForward: vec3f,
cameraNearPlane: f32)->f32 {let depth=textureSampleLevel(depthTex,depthSampler,uv,0.).r;return select(reconstructDistanceFromCamera(depth,cameraRayDirection,cameraForward,cameraNearPlane),0.,depth>=1.);}
`;
// Sideeffect
if (!ShaderStore.IncludesShadersStoreWGSL[name]) {
    ShaderStore.IncludesShadersStoreWGSL[name] = shader;
}
/** @internal */
export const depthFunctionsWGSL = { name, shader };
//# sourceMappingURL=depthFunctions.js.map