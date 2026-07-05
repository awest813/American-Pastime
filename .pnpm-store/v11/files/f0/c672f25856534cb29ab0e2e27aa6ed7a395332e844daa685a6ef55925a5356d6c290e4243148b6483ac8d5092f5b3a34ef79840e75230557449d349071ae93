// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import "@babylonjs/core/ShadersWGSL/ShadersInclude/intersectionFunctions.js";
const name = "atmosphereFunctions";
const shader = `#include<intersectionFunctions>
const MultiScatteringLutSize=vec2f(32.,32.);const MultiScatteringLutDomainInUVSpace=(MultiScatteringLutSize-vec2f(1.))/MultiScatteringLutSize;const MultiScatteringLutHalfTexelSize=vec2f(.5)/MultiScatteringLutSize;const NumAerialPerspectiveLutLayers=32.;const AerialPerspectiveLutSize=vec3f(16.,64.,NumAerialPerspectiveLutLayers);const DiffuseSkyIrradianceLutSize=vec2f(64.,16.);const DiffuseSkyIrradianceLutDomainInUVSpace=(DiffuseSkyIrradianceLutSize-vec2f(1.))/DiffuseSkyIrradianceLutSize;const DiffuseSkyIrradianceLutHalfTexelSize=vec2f(.5)/DiffuseSkyIrradianceLutSize;const SkyViewLutSize=vec2f(128.,128.);const SkyViewLutDomainInUVSpace=(SkyViewLutSize-vec2f(1.))/SkyViewLutSize;const SkyViewLutHalfTexelSize=vec2f(.5)/SkyViewLutSize;const AerialPerspectiveLutKMPerSlice=4.;const AerialPerspectiveLutRangeKM=AerialPerspectiveLutKMPerSlice*NumAerialPerspectiveLutLayers;const TransmittanceLutSize=vec2f(256.,64.);const TransmittanceLutDomainInUVSpace=(TransmittanceLutSize-vec2f(1.))/TransmittanceLutSize;const TransmittanceLutHalfTexelSize=vec2f(.5)/TransmittanceLutSize;const TransmittanceHorizonRange=2.*TransmittanceLutHalfTexelSize.x;const TransmittanceMaxUnoccludedU=1.-.5*TransmittanceHorizonRange;const TransmittanceMinOccludedU=1.+.5*TransmittanceHorizonRange;fn uvToUnit(uv: vec2f,domainInUVSpace: vec2f,halfTexelSize: vec2f)->vec2f {return (uv-halfTexelSize)/domainInUVSpace;}
fn unitToUV(unit: vec2f,domainInUVSpace: vec2f,halfTexelSize: vec2f)->vec2f {return unit*domainInUVSpace+halfTexelSize;}
fn sphereIntersectNearest(rayOrigin: vec3f,rayDirection: vec3f,sphereRadius: f32)->f32 {let result=sphereIntersectFromOrigin(rayOrigin,rayDirection,sphereRadius);let c=dot(rayOrigin,rayOrigin)-sphereRadius*sphereRadius;return select(result.x,result.y,c>=0.);}
fn moveToTopAtmosphere(
cameraPosition: vec3f,
positionRadius: f32,
positionGeocentricNormal: vec3f,
rayDirection: vec3f,
intersectsAtmosphere: ptr<function,bool>,
cameraPositionClampedToTopOfAtmosphere: ptr<function,vec3f>
) {*intersectsAtmosphere=true;*cameraPositionClampedToTopOfAtmosphere=cameraPosition;if (positionRadius>atmosphere.atmosphereRadius) {let tTop=sphereIntersectNearest(cameraPosition,rayDirection,atmosphere.atmosphereRadius);if (tTop>=0.) {let upOffset=-atmosphere.planetRadiusOffset*positionGeocentricNormal;*cameraPositionClampedToTopOfAtmosphere=cameraPosition+rayDirection*tTop+upOffset;} else {*intersectsAtmosphere=false;}}}
fn getSkyViewUVFromParameters(
intersectsGround: bool,
cosHorizonAngleFromZenith: f32,
cosAngleBetweenViewAndZenith: f32,
cosAngleBetweenViewAndLightOnPlane: f32,
uv: ptr<function,vec2f>
) {var unit=vec2f(0.);if (intersectsGround) {var coord=(cosAngleBetweenViewAndZenith+1.)/(cosHorizonAngleFromZenith+1.);coord=sqrtClamped(coord); 
unit.y=.5*coord; } else {var coord=(cosAngleBetweenViewAndZenith-cosHorizonAngleFromZenith)/(1.-cosHorizonAngleFromZenith);coord=sqrtClamped(coord); 
unit.y=.5*coord+.5; }
unit.x=.5-.5*cosAngleBetweenViewAndLightOnPlane;*uv=unitToUV(unit,SkyViewLutDomainInUVSpace,SkyViewLutHalfTexelSize);}
#if USE_SKY_VIEW_LUT && SAMPLE_SKY_VIEW_LUT
fn sampleSkyViewLut(
skyViewLut: texture_2d<f32>,
positionRadius: f32,
geocentricNormal: vec3f,
rayDirection: vec3f,
directionToLight: vec3f,
cosHorizonAngleFromZenith: f32,
cosAngleBetweenViewAndZenith: ptr<function,f32>,
isRayIntersectingGround: ptr<function,bool>
)->vec4f {*cosAngleBetweenViewAndZenith=dot(rayDirection,geocentricNormal);if (positionRadius>atmosphere.atmosphereRadius) {let sinAngleBetweenViewAndNadir=sqrtClamped(1.-*cosAngleBetweenViewAndZenith**cosAngleBetweenViewAndZenith);if (sinAngleBetweenViewAndNadir>atmosphere.sinCameraAtmosphereHorizonAngleFromNadir) {*isRayIntersectingGround=false;return vec4f(0.);}}
let sideVector=normalize(cross(geocentricNormal,rayDirection));let forwardVector=normalize(cross(sideVector,geocentricNormal));let lightOnPlane=normalize(vec2f(dot(directionToLight,forwardVector),dot(directionToLight,sideVector)));let cosAngleBetweenViewAndLightOnPlane=lightOnPlane.x;let rayIntersectionScale=mix(.95,1.,saturate((positionRadius-atmosphere.planetRadius)/atmosphere.atmosphereThickness));*isRayIntersectingGround =
positionRadius>atmosphere.planetRadius &&
(rayIntersectionScale**cosAngleBetweenViewAndZenith)<=cosHorizonAngleFromZenith;var uv: vec2f;getSkyViewUVFromParameters(
*isRayIntersectingGround,
cosHorizonAngleFromZenith,
*cosAngleBetweenViewAndZenith,
cosAngleBetweenViewAndLightOnPlane,
&uv);return textureSampleLevel(skyViewLut,skyViewLutSampler,uv,0.);}
#endif
fn computeRayleighPhase(onePlusCosThetaSq: f32)->f32 {return 0.0596831037*onePlusCosThetaSq;}
fn computeMiePhaseCornetteShanks(cosTheta: f32,onePlusCosThetaSq: f32)->f32 {const g=.8;const gSquared=g*g;const oneMinusGSquared=1.-gSquared;const onePlusGSquared=1.+gSquared;const twoPlusGSquared=2.+gSquared;const twoG=2.*g;const threeOverEightPi=3./(8.*PI);return threeOverEightPi*oneMinusGSquared*onePlusCosThetaSq/(twoPlusGSquared*pow(onePlusGSquared-twoG*cosTheta,1.5));}
fn computeOzoneDensity(normalizedViewHeight: f32)->f32 {const MinOzoneDensity=.135;const OneMinusMinOzoneDensity=1.-MinOzoneDensity;const OzoneStartHeight=.15; 
const PeakOzoneHeight=.25;const MaxOzoneHeight=.6;const InverseRampupDistance=1./(PeakOzoneHeight-OzoneStartHeight);const InverseRampdownDistance=1./(MaxOzoneHeight-PeakOzoneHeight);let lowerAtmosphereDensity=MinOzoneDensity+OneMinusMinOzoneDensity*max(0.,normalizedViewHeight-OzoneStartHeight)*InverseRampupDistance;let sqrtUpperAtmosphereDensity=max(0.,1.-(normalizedViewHeight-PeakOzoneHeight)*InverseRampdownDistance);let upperAtmosphereDensity=sqrtUpperAtmosphereDensity*sqrtUpperAtmosphereDensity;let densityOzone=select(upperAtmosphereDensity,lowerAtmosphereDensity,normalizedViewHeight<PeakOzoneHeight);return densityOzone;}
fn sampleMediumRGB(
viewHeight: f32,
scatteringRayleigh: ptr<function,vec3f>,
scatteringMie: ptr<function,vec3f>,
extinction: ptr<function,vec3f>,
scattering: ptr<function,vec3f>
) {let normalizedViewHeight=saturate(viewHeight*atmosphere.inverseAtmosphereThickness);let densityMie=exp(-83.333*normalizedViewHeight);let densityRayleigh=exp(-12.5*normalizedViewHeight);let densityOzone=computeOzoneDensity(normalizedViewHeight);*scatteringRayleigh=densityRayleigh*atmosphere.peakRayleighScattering;*scatteringMie=densityMie*atmosphere.peakMieScattering;*scattering=*scatteringMie+*scatteringRayleigh;let extinctionRayleigh=*scatteringRayleigh;let extinctionMie=densityMie*atmosphere.peakMieExtinction;let extinctionOzone=densityOzone*atmosphere.peakOzoneAbsorption;*extinction=extinctionRayleigh+extinctionMie+extinctionOzone;}
fn computeTransmittance(rayOriginGlobal: vec3f,rayDirection: vec3f,tMax: f32,sampleCount: f32)->vec3f {var opticalDepth=vec3f(0.);var t=0.;let sampleSegmentWeight=tMax/sampleCount;const sampleSegmentT=.3;for (var s=0.; s<sampleCount; s+=1.) {let newT=sampleSegmentWeight*(s+sampleSegmentT);let dt=newT-t;t=newT;var scatteringRayleigh: vec3f;var scatteringMie: vec3f;var extinction: vec3f;var scattering: vec3f;let samplePositionGlobal=rayOriginGlobal+t*rayDirection;sampleMediumRGB(length(samplePositionGlobal)-atmosphere.planetRadius,&scatteringRayleigh,&scatteringMie,&extinction,&scattering);opticalDepth+=extinction*dt;}
return exp(-opticalDepth);}
#if defined(SAMPLE_TRANSMITTANCE_LUT) || !defined(EXCLUDE_RAY_MARCHING_FUNCTIONS)
fn getTransmittanceUV(radius: f32,cosAngleLightToZenith: f32,distanceToHorizon: ptr<function,f32>)->vec2f {let radiusSquared=radius*radius;let horizonDistance=sqrtClamped(radiusSquared-atmosphere.planetRadiusSquared);*distanceToHorizon=horizonDistance;let cosAngleLightToZenithSquared=cosAngleLightToZenith*cosAngleLightToZenith;let discriminant=radiusSquared*(cosAngleLightToZenithSquared-1.)+atmosphere.atmosphereRadiusSquared;let distanceToAtmosphereEdge=max(0.,-radius*cosAngleLightToZenith+sqrtClamped(discriminant));let minDistanceToAtmosphereEdge=max(0.,atmosphere.atmosphereRadius-radius);let maxDistanceToAtmosphereEdge=horizonDistance+atmosphere.horizonDistanceToAtmosphereEdge;let cosAngleLightToZenithCoordinate=(distanceToAtmosphereEdge-minDistanceToAtmosphereEdge)/max(.000001,maxDistanceToAtmosphereEdge-minDistanceToAtmosphereEdge);let distanceToHorizonCoordinate=horizonDistance/max(.000001,atmosphere.horizonDistanceToAtmosphereEdge);let unit=vec2f(cosAngleLightToZenithCoordinate,distanceToHorizonCoordinate);return unit*TransmittanceLutDomainInUVSpace+TransmittanceLutHalfTexelSize; }
fn sampleTransmittanceLut(transmittanceLut: texture_2d<f32>,positionRadius: f32,cosAngleLightToZenith: f32)->vec4f {var distanceToHorizon=0.;let uv=getTransmittanceUV(positionRadius,cosAngleLightToZenith,&distanceToHorizon);let weight=smoothstep(TransmittanceMinOccludedU,TransmittanceMaxUnoccludedU,uv.x);return weight*textureSampleLevel(transmittanceLut,transmittanceLutSampler,uv,0.);}
#endif
#ifndef EXCLUDE_RAY_MARCHING_FUNCTIONS
#ifndef COMPUTE_MULTI_SCATTERING
fn sampleMultiScatteringLut(multiScatteringLut: texture_2d<f32>,radius: f32,cosAngleLightToZenith: f32)->vec3f {let unit=vec2f(.5+.5*cosAngleLightToZenith,(radius-atmosphere.planetRadius)/atmosphere.atmosphereThickness);let uv=unitToUV(unit,MultiScatteringLutDomainInUVSpace,MultiScatteringLutHalfTexelSize);let multiScattering=textureSampleLevel(multiScatteringLut,multiScatteringLutSampler,uv,0.).rgb;return max(atmosphere.minMultiScattering,multiScattering);}
#endif
const uniformPhase=RECIPROCAL_PI4;fn integrateScatteredRadiance(
isAerialPerspectiveLut: bool,
lightIntensityParam: f32,
transmittanceLut: texture_2d<f32>,
#ifndef COMPUTE_MULTI_SCATTERING
multiScatteringLut: texture_2d<f32>,
multiScatteringIntensityParam: f32,
#endif
rayOriginGlobal: vec3f,
rayDirection: vec3f,
directionToLightParam: vec3f,
tMaxMax: f32,
sampleCount: f32,
distanceToSurface: f32,
transmittance: ptr<function,vec3f>
#if COMPUTE_MULTI_SCATTERING
,multiScattering: ptr<function,vec3f>
#endif
)->vec3f {var radiance=vec3f(0.);*transmittance=vec3f(1.);
#if COMPUTE_MULTI_SCATTERING
*multiScattering=vec3f(0.);
#endif
let tBottom=sphereIntersectNearest(rayOriginGlobal,rayDirection,atmosphere.planetRadius);let tTop=sphereIntersectNearest(rayOriginGlobal,rayDirection,atmosphere.atmosphereRadius);var tMax=0.;if (tBottom<0.) {if (tTop<0.) {return radiance;} else {tMax=tTop;}} else {if (tTop>0.) {if (isAerialPerspectiveLut) {tMax=tTop;} else {tMax=min(tBottom,tTop);}}}
if (distanceToSurface>0. && distanceToSurface<tMax) {tMax=distanceToSurface;}
tMax=min(tMax,tMaxMax);
#ifndef COMPUTE_MULTI_SCATTERING
let cosTheta=dot(rayDirection,directionToLightParam);let onePlusCosThetaSq=1.+cosTheta*cosTheta;let rayleighPhase=computeRayleighPhase(onePlusCosThetaSq);let miePhase=computeMiePhaseCornetteShanks(cosTheta,onePlusCosThetaSq);
#endif
let transmittanceScale=select(1.,atmosphere.aerialPerspectiveTransmittanceScale,isAerialPerspectiveLut);var t=0.;let sampleSegmentWeight=tMax/sampleCount;const sampleSegmentT=.3;for (var s=0.; s<sampleCount; s+=1.) {let newT=sampleSegmentWeight*(s+sampleSegmentT);let dt=newT-t;t=newT;let samplePositionGlobal=rayOriginGlobal+t*rayDirection;let sampleRadiusGlobal=length(samplePositionGlobal);let sampleGeocentricNormal=samplePositionGlobal/sampleRadiusGlobal;let sampleCosAngleLightToZenith=dot(directionToLightParam,sampleGeocentricNormal);var scatteringRayleigh: vec3f;var scatteringMie: vec3f;var extinction: vec3f;var scattering: vec3f;sampleMediumRGB(sampleRadiusGlobal-atmosphere.planetRadius,&scatteringRayleigh,&scatteringMie,&extinction,&scattering);let transmittanceToLight=sampleTransmittanceLut(transmittanceLut,sampleRadiusGlobal,sampleCosAngleLightToZenith).rgb;
#if COMPUTE_MULTI_SCATTERING
let phaseTimesScattering=uniformPhase*scattering;let S=transmittanceToLight*phaseTimesScattering;
#else
let phaseTimesScattering=scatteringMie*miePhase+scatteringRayleigh*rayleighPhase;let multiScatteredRadiance=sampleMultiScatteringLut(multiScatteringLut,sampleRadiusGlobal,sampleCosAngleLightToZenith);let S=transmittanceScale*transmittanceToLight*phaseTimesScattering+multiScatteringIntensityParam*multiScatteredRadiance*scattering;
#endif
let sampleOpticalDepth=extinction*dt;let sampleTransmittanceVal=exp(-sampleOpticalDepth);let clampedExtinction=max(vec3f(.0000001),extinction);let SInt=(S-S*sampleTransmittanceVal)/clampedExtinction;radiance+=*transmittance*SInt;
#if COMPUTE_MULTI_SCATTERING
let MSInt=(scattering-scattering*sampleTransmittanceVal)/clampedExtinction;*multiScattering+=*transmittance*MSInt;
#endif
*transmittance*=sampleTransmittanceVal;}
#if USE_GROUND_ALBEDO
if (tMax==tBottom && tBottom>0.) {let planetPos=rayOriginGlobal+tBottom*rayDirection;let planetPosRadius=length(planetPos);let planetPosGeocentricNormal=planetPos/planetPosRadius;let nDotL=dot(directionToLightParam,planetPosGeocentricNormal);let lightTransmittance=sampleTransmittanceLut(transmittanceLut,planetPosRadius,nDotL).rgb;const diffuseBrdf=RECIPROCAL_PI;radiance+=lightTransmittance**transmittance*atmosphere.groundAlbedo*(nDotL*diffuseBrdf);}
#endif
radiance*=lightIntensityParam;return radiance;}
#endif
fn layerIdxToAerialPerspectiveLayer(layerIdx: f32)->f32 {var layer=(layerIdx+1.)/NumAerialPerspectiveLutLayers;layer*=layer; 
layer*=NumAerialPerspectiveLutLayers;return layer;}
fn toAerialPerspectiveDepth(layer: f32)->f32 {return layer*AerialPerspectiveLutKMPerSlice;}
fn toAerialPerspectiveLayer(distance: f32,aerialPerspectiveLutDistancePerSlice: f32)->f32 {return distance/aerialPerspectiveLutDistancePerSlice;}
fn applyAerialPerspectiveSaturation(aerialPerspective: vec4f)->vec4f {let previousRadiance=getLuminanceUnclamped(aerialPerspective.rgb);let mixed=mix(vec3f(previousRadiance),aerialPerspective.rgb,atmosphere.aerialPerspectiveSaturation);return vec4f(mixed,aerialPerspective.a);}
fn applyAerialPerspectiveIntensity(aerialPerspective: vec4f)->vec4f {var result=aerialPerspective;
#if APPLY_AERIAL_PERSPECTIVE_INTENSITY
if (atmosphere.aerialPerspectiveIntensity==0.) {result=vec4f(0.);} else {let previousAlpha=result.a;result=result/max(.00001,previousAlpha);result=result*pow(previousAlpha,1./atmosphere.aerialPerspectiveIntensity);}
#endif
return result;}
fn applyAerialPerspectiveRadianceBias(aerialPerspective: vec4f)->vec4f {var result=aerialPerspective;
#if APPLY_AERIAL_PERSPECTIVE_RADIANCE_BIAS
let originalRadiance=dot(result.rgb,LuminanceEncodeApprox);let targetRadiance=originalRadiance+atmosphere.aerialPerspectiveRadianceBias;if (originalRadiance>0.) {result=result*max(0.,targetRadiance/originalRadiance);} else {result=max(vec4f(0.),vec4f(atmosphere.aerialPerspectiveRadianceBias));}
result.a=min(result.a,1.);
#endif
return result;}
fn sampleAerialPerspectiveLut(
screenUV: vec2f,
clampToLutRange: bool,
distanceFromCamera: f32,
numAerialPerspectiveLutLayers: f32,
aerialPerspectiveLutKMPerSlice: f32,
aerialPerspectiveLutRangeKM: f32,
aerialPerspective: ptr<function,vec4f>
)->bool {*aerialPerspective=vec4f(0.);
#if USE_AERIAL_PERSPECTIVE_LUT
if (distanceFromCamera>0. &&
(clampToLutRange || distanceFromCamera<aerialPerspectiveLutRangeKM) &&
atmosphere.clampedCameraRadius<=atmosphere.atmosphereRadius) {var layer=toAerialPerspectiveLayer(distanceFromCamera,aerialPerspectiveLutKMPerSlice);let normalizedLayer=sqrt(layer/numAerialPerspectiveLutLayers); 
layer=min(normalizedLayer*numAerialPerspectiveLutLayers,numAerialPerspectiveLutLayers);let weight=min(layer,1.);let layerIdx=max(0.,layer-1.);let floorLayerIdx=floor(layerIdx);let aerialPerspectiveLayer0=textureSampleLevel(aerialPerspectiveLut,aerialPerspectiveLutSampler,screenUV,i32(floorLayerIdx),0.);let aerialPerspectiveLayer1=textureSampleLevel(aerialPerspectiveLut,aerialPerspectiveLutSampler,screenUV,i32(floorLayerIdx+1.),0.);var interpolated=mix(aerialPerspectiveLayer0,aerialPerspectiveLayer1,layerIdx-floorLayerIdx);interpolated=vec4f(interpolated.rgb*atmosphere.atmosphereExposure,interpolated.a);interpolated=applyAerialPerspectiveSaturation(interpolated);interpolated=weight*applyAerialPerspectiveIntensity(interpolated);interpolated=applyAerialPerspectiveRadianceBias(interpolated);*aerialPerspective=interpolated;return true;}
#endif
return false;}
#if RENDER_TRANSMITTANCE
fn getTransmittanceParameters(uv: vec2f,radius: ptr<function,f32>,cosAngleLightToZenith: ptr<function,f32>,distanceToAtmosphereEdge: ptr<function,f32>) {let unit=uvToUnit(uv,TransmittanceLutDomainInUVSpace,TransmittanceLutHalfTexelSize);let distanceToHorizon=unit.y*atmosphere.horizonDistanceToAtmosphereEdge;let distanceToHorizonSquared=distanceToHorizon*distanceToHorizon;*radius=sqrtClamped(distanceToHorizonSquared+atmosphere.planetRadiusSquared);let minDistanceToAtmosphereEdge=atmosphere.atmosphereRadius-*radius;let maxDistanceToAtmosphereEdge=distanceToHorizon+atmosphere.horizonDistanceToAtmosphereEdge;*distanceToAtmosphereEdge=minDistanceToAtmosphereEdge+unit.x*(maxDistanceToAtmosphereEdge-minDistanceToAtmosphereEdge);let distanceToAtmosphereEdgeSquared=*distanceToAtmosphereEdge**distanceToAtmosphereEdge;*cosAngleLightToZenith=select(
(atmosphere.horizonDistanceToAtmosphereEdgeSquared-distanceToAtmosphereEdgeSquared-distanceToHorizonSquared)/(2.**radius**distanceToAtmosphereEdge),
1.,
*distanceToAtmosphereEdge<=0.
);*cosAngleLightToZenith=clamp(*cosAngleLightToZenith,-1.,1.);}
fn renderTransmittance(uv: vec2f)->vec4f {var radius: f32;var cosAngleLightToZenith: f32;var distanceToAtmosphereEdgeAlongAngle: f32;getTransmittanceParameters(uv,&radius,&cosAngleLightToZenith,&distanceToAtmosphereEdgeAlongAngle);let sinAngleLightToZenith=sqrtClamped(1.-cosAngleLightToZenith*cosAngleLightToZenith);let directionToLight=normalize(vec3f(0.,cosAngleLightToZenith,sinAngleLightToZenith));let transmittance=computeTransmittance(vec3f(0.,radius,0.),directionToLight,distanceToAtmosphereEdgeAlongAngle,atmosphere.transmittanceSampleCount);return vec4f(transmittance,avg(transmittance));}
#endif
#if RENDER_MULTI_SCATTERING
fn getSphereSample(azimuth: f32,inclination: f32,sinInclination: ptr<function,f32>)->vec3f {*sinInclination=sin(inclination);return vec3f(*sinInclination*sin(azimuth),cos(inclination),*sinInclination*cos(azimuth));}
fn renderMultiScattering(uv: vec2f,transmittanceLut: texture_2d<f32>)->vec4f {let MultiScatteringAzimuthIterationAngle=TWO_PI/atmosphere.multiScatteringAzimuthSampleCount;let MultiScatteringInclinationIterationAngle=PI/atmosphere.multiScatteringInclinationSampleCount;let MultiScatteringAngleStepProduct=MultiScatteringAzimuthIterationAngle*MultiScatteringInclinationIterationAngle;let unit=uvToUnit(uv,MultiScatteringLutDomainInUVSpace,MultiScatteringLutHalfTexelSize);let cosAngleLightToZenith=2.*unit.x-1.;let sinAngleLightToZenith=sqrtClamped(1.-cosAngleLightToZenith*cosAngleLightToZenith);let directionToLightLocal=normalize(vec3f(0.,cosAngleLightToZenith,sinAngleLightToZenith));let rayOriginRadius=atmosphere.planetRadius+max(unit.y,.001)*atmosphere.atmosphereThickness;let rayOrigin=vec3f(0.,rayOriginRadius,0.);var inscattered=vec3f(0.);var multiScatteringTotal=vec3f(0.);for (var i=.5; i<atmosphere.multiScatteringAzimuthSampleCount; i+=1.) {let azimuth=MultiScatteringAzimuthIterationAngle*i;for (var j=.5; j<atmosphere.multiScatteringInclinationSampleCount; j+=1.) {let inclination=MultiScatteringInclinationIterationAngle*j;var sinInclination: f32;let rayDirection=getSphereSample(azimuth,inclination,&sinInclination);var transmittanceVal: vec3f;var multiScatteringVal: vec3f;let radianceVal=integrateScatteredRadiance(
false,
1.,
transmittanceLut,
rayOrigin,
rayDirection,
directionToLightLocal,
100000000.,
atmosphere.multiScatteringLutSampleCount,
-1.,
&transmittanceVal,
&multiScatteringVal);let weight=RECIPROCAL_PI4*abs(sinInclination)*MultiScatteringAngleStepProduct;multiScatteringTotal+=multiScatteringVal*weight;inscattered+=radianceVal*weight;}}
let multiScatteringResult=inscattered/max(vec3f(.000001),vec3f(1.)-multiScatteringTotal);return vec4f(multiScatteringResult,1.);}
#endif
fn computeCosHorizonAngleFromZenith(radius: f32)->f32 {let sinAngleBetweenHorizonAndNadir=min(1.,atmosphere.planetRadius/radius);let cosHorizonAngleFromNadir=sqrt(1.-sinAngleBetweenHorizonAndNadir*sinAngleBetweenHorizonAndNadir);let cosHorizonAngleFromZenith=-cosHorizonAngleFromNadir;return cosHorizonAngleFromZenith;}
#if RENDER_SKY_VIEW
fn getSkyViewParametersFromUV(
radius: f32,
uv: vec2f,
cosAngleBetweenViewAndZenith: ptr<function,f32>,
cosAngleBetweenViewAndLightOnPlane: ptr<function,f32>
) {let unit=uvToUnit(uv,SkyViewLutDomainInUVSpace,SkyViewLutHalfTexelSize);let cosHorizonAngleFromZenith=computeCosHorizonAngleFromZenith(radius);if (unit.y<.5) {var coord=2.*unit.y; 
coord*=coord; 
*cosAngleBetweenViewAndZenith=mix(-1.,cosHorizonAngleFromZenith,coord); } else {var coord=2.*unit.y-1.; 
coord*=coord; 
*cosAngleBetweenViewAndZenith=mix(cosHorizonAngleFromZenith,1.,coord); }
*cosAngleBetweenViewAndLightOnPlane=1.-2.*unit.x;}
fn renderSkyView(uv: vec2f,transmittanceLut: texture_2d<f32>,multiScatteringLut: texture_2d<f32>)->vec4f {var cosAngleBetweenViewAndZenith: f32;var cosAngleBetweenViewAndLightOnPlane: f32;getSkyViewParametersFromUV(atmosphere.clampedCameraRadius,uv,&cosAngleBetweenViewAndZenith,&cosAngleBetweenViewAndLightOnPlane);let sinAngleBetweenViewAndZenith=sqrtClamped(1.-cosAngleBetweenViewAndZenith*cosAngleBetweenViewAndZenith);let sinAngleBetweenViewAndLightOnPlane=sqrtClamped(1.-cosAngleBetweenViewAndLightOnPlane*cosAngleBetweenViewAndLightOnPlane);let rayDirection =
vec3f(
sinAngleBetweenViewAndZenith*cosAngleBetweenViewAndLightOnPlane,
cosAngleBetweenViewAndZenith,
sinAngleBetweenViewAndZenith*sinAngleBetweenViewAndLightOnPlane);var intersectsAtmosphere=false;var cameraPositionGlobalClampedToTopOfAtmosphere=vec3f(0.);moveToTopAtmosphere(
vec3f(0.,atmosphere.clampedCameraRadius,0.),
atmosphere.clampedCameraRadius,
vec3f(0.,1.,0.),
rayDirection,
&intersectsAtmosphere,
&cameraPositionGlobalClampedToTopOfAtmosphere
);if (!intersectsAtmosphere) {return vec4f(0.);}
var transmittanceVal: vec3f;let radiance=integrateScatteredRadiance(
false,
atmosphere.atmosphereExposure*atmosphere.lightIntensity,
transmittanceLut,
multiScatteringLut,
atmosphere.multiScatteringIntensity,
cameraPositionGlobalClampedToTopOfAtmosphere,
rayDirection,
atmosphere.directionToLightRelativeToCameraGeocentricNormal,
100000000.,
atmosphere.skyViewLutSampleCount,
-1.,
&transmittanceVal
);let transparency=1.-avg(transmittanceVal);return vec4f(radiance,transparency);}
#endif
#if RENDER_CAMERA_VOLUME
fn renderCameraVolume(
positionOnNearPlane: vec3f,
layerIdx: f32,
transmittanceLut: texture_2d<f32>,
multiScatteringLut: texture_2d<f32>
)->vec4f {var result=vec4f(0.);let rayDirection=normalize(positionOnNearPlane);let layer=layerIdxToAerialPerspectiveLayer(layerIdx);let tMax=toAerialPerspectiveDepth(layer);var tMaxMax=tMax;var cameraPositionGlobalClampedToTopOfAtmosphere=atmosphere.clampedCameraPositionGlobal;if (atmosphere.clampedCameraRadius>=atmosphere.atmosphereRadius) {var intersectsAtmosphere=false;moveToTopAtmosphere(
atmosphere.clampedCameraPositionGlobal,
atmosphere.clampedCameraRadius,
atmosphere.cameraGeocentricNormal,
rayDirection,
&intersectsAtmosphere,
&cameraPositionGlobalClampedToTopOfAtmosphere);if (!intersectsAtmosphere) {return result;}
let distanceToAtmosphere=distance(atmosphere.clampedCameraPositionGlobal,cameraPositionGlobalClampedToTopOfAtmosphere);if (tMaxMax<distanceToAtmosphere) {return result;}
tMaxMax=max(0.,tMaxMax-distanceToAtmosphere);}
let sampleCount=min(atmosphere.skyViewLutSampleCount,2.*layer+2.);var transmittance: vec3f;let radiance=integrateScatteredRadiance(
true,
atmosphere.lightIntensity,
transmittanceLut,
multiScatteringLut,
atmosphere.multiScatteringIntensity,
cameraPositionGlobalClampedToTopOfAtmosphere,
rayDirection,
atmosphere.directionToLight,
tMaxMax,
sampleCount,
-1.,
&transmittance);let transparency=1.-avg(transmittance);result=vec4f(radiance,transparency);return result;}
#endif
`;
// Sideeffect
if (!ShaderStore.IncludesShadersStoreWGSL[name]) {
    ShaderStore.IncludesShadersStoreWGSL[name] = shader;
}
/** @internal */
export const atmosphereFunctionsWGSL = { name, shader };
//# sourceMappingURL=atmosphereFunctions.js.map