'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useOverflowContextValues_unstable", {
    enumerable: true,
    get: function() {
        return useOverflowContextValues_unstable;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _react = /*#__PURE__*/ _interop_require_wildcard._(require("react"));
const useOverflowContextValues_unstable = (state)=>{
    const { registerItem, registerDivider, registerOverflowMenu, updateOverflow, forceUpdateOverflow, containerRef, getSnapshot, subscribe } = state;
    const overflow = _react.useMemo(()=>({
            groupVisibility: {},
            itemVisibility: {},
            hasOverflow: false,
            registerItem,
            registerDivider,
            registerOverflowMenu,
            updateOverflow,
            forceUpdateOverflow,
            containerRef,
            getSnapshot,
            subscribe
        }), [
        registerItem,
        registerDivider,
        registerOverflowMenu,
        updateOverflow,
        forceUpdateOverflow,
        containerRef,
        getSnapshot,
        subscribe
    ]);
    return {
        overflow
    };
};
