'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useTooltip_unstable", {
    enumerable: true,
    get: function() {
        return useTooltip_unstable;
    }
});
const _useTooltipBase = require("./useTooltipBase");
const useTooltip_unstable = (props)=>{
    'use no memo'; // justified: compiler would optimize useTooltip_unstable — manual opt-out to preserve runtime behavior
    const { appearance = 'normal', ...baseProps } = props;
    const state = (0, _useTooltipBase.useTooltipBase_unstable)(baseProps);
    return {
        appearance,
        ...state
    };
};
