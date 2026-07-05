'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    OverflowContext: function() {
        return OverflowContext;
    },
    OverflowProvider: function() {
        return OverflowProvider;
    },
    useOverflowContext: function() {
        return useOverflowContext;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _priorityoverflow = require("@fluentui/priority-overflow");
const _react = /*#__PURE__*/ _interop_require_wildcard._(require("react"));
const OverflowContext = /*#__PURE__*/ _react.createContext(undefined);
const OverflowProvider = OverflowContext.Provider;
const noop = ()=>{
/* noop */ };
const overflowContextDefaultValue = {
    hasOverflow: false,
    itemVisibility: {},
    groupVisibility: {},
    registerItem: ()=>noop,
    updateOverflow: noop,
    forceUpdateOverflow: noop,
    registerOverflowMenu: ()=>noop,
    registerDivider: ()=>noop,
    getSnapshot: ()=>_priorityoverflow.EMPTY_SNAPSHOT,
    subscribe: ()=>noop
};
function useOverflowContext(selector) {
    var _React_useContext;
    const context = (_React_useContext = _react.useContext(OverflowContext)) !== null && _React_useContext !== void 0 ? _React_useContext : overflowContextDefaultValue;
    return selector ? selector(context) : context;
}
