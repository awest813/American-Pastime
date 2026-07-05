'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "renderToStyleElements", {
    enumerable: true,
    get: function() {
        return renderToStyleElements;
    }
});
const _core = require("@griffel/core");
const _react = require("react");
function renderToStyleElements(renderer) {
    const stylesheets = Object.values(renderer.stylesheets).sort((a, b)=>{
        var _a, _b, _c, _d;
        return renderer.compareContainerQueries((_a = a.elementAttributes['data-container']) !== null && _a !== void 0 ? _a : '', (_b = b.elementAttributes['data-container']) !== null && _b !== void 0 ? _b : '') || renderer.compareMediaQueries((_c = a.elementAttributes['media']) !== null && _c !== void 0 ? _c : '', (_d = b.elementAttributes['media']) !== null && _d !== void 0 ? _d : '') || _core.styleBucketOrdering.indexOf(a.bucketName) - _core.styleBucketOrdering.indexOf(b.bucketName) || Number(a.elementAttributes['data-priority']) - Number(b.elementAttributes['data-priority']);
    });
    return stylesheets.map((stylesheet)=>{
        const cssRules = stylesheet.cssRules();
        // don't want to create any empty style elements
        if (!cssRules.length) {
            return null;
        }
        return (0, _react.createElement)('style', {
            key: stylesheet.bucketName,
            // TODO: support "nonce"
            // ...renderer.styleNodeAttributes,
            ...stylesheet.elementAttributes,
            'data-make-styles-rehydration': 'true',
            dangerouslySetInnerHTML: {
                __html: cssRules.join('')
            }
        });
    }).filter(Boolean);
} //# sourceMappingURL=renderToStyleElements.js.map
