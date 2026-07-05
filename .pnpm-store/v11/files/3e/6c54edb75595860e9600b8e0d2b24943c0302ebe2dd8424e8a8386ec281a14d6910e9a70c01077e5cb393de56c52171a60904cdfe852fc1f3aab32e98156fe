// Do not edit.
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore.js";
import { atmosphereFragmentDeclaration } from "../Shaders/ShadersInclude/atmosphereFragmentDeclaration.js";
import { atmosphereUboDeclaration } from "../Shaders/ShadersInclude/atmosphereUboDeclaration.js";
import { helperFunctions } from "@babylonjs/core/Shaders/ShadersInclude/helperFunctions.js";
import { intersectionFunctions } from "@babylonjs/core/Shaders/ShadersInclude/intersectionFunctions.js";
import { atmosphereFunctions } from "../Shaders/ShadersInclude/atmosphereFunctions.js";
const name = "skyViewPixelShader";
const shader = `#define RENDER_SKY_VIEW
precision highp float;precision highp sampler2D;
#include<__decl__atmosphereFragment>
uniform sampler2D transmittanceLut;uniform sampler2D multiScatteringLut;
#include<helperFunctions>
#include<atmosphereFunctions>
varying vec2 uv;void main() {gl_FragColor=renderSkyView(uv,transmittanceLut,multiScatteringLut);}`;
// Sideeffect
if (!ShaderStore.ShadersStore[name]) {
    ShaderStore.ShadersStore[name] = shader;
}
const includes = [atmosphereFragmentDeclaration, atmosphereUboDeclaration, helperFunctions, intersectionFunctions, atmosphereFunctions];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStore[inc.name]) {
        ShaderStore.IncludesShadersStore[inc.name] = inc.shader;
    }
}
/** @internal */
export const skyViewPixelShader = { name, shader };
//# sourceMappingURL=skyView.fragment.js.map