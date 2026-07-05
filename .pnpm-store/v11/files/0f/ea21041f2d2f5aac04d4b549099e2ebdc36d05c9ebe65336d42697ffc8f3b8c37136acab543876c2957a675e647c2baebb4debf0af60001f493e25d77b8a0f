'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useOverflowMenu", {
    enumerable: true,
    get: function() {
        return useOverflowMenu;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _react = /*#__PURE__*/ _interop_require_wildcard._(require("react"));
const _reactutilities = require("@fluentui/react-utilities");
const _overflowContext = require("./overflowContext");
const _useOverflowCount = require("./useOverflowCount");
function useOverflowMenu(id) {
    const elementId = (0, _reactutilities.useId)('overflow-menu', id);
    const overflowCount = (0, _useOverflowCount.useOverflowCount)();
    const { registerOverflowMenu, forceUpdateOverflow } = (0, _overflowContext.useOverflowContext)();
    const ref = _react.useRef(null);
    const isOverflowing = overflowCount > 0;
    (0, _reactutilities.useIsomorphicLayoutEffect)(()=>{
        if (ref.current) {
            const unregister = registerOverflowMenu(ref.current);
            if (isOverflowing) {
                forceUpdateOverflow();
            }
            return ()=>{
                unregister();
                forceUpdateOverflow();
            };
        }
    }, [
        registerOverflowMenu,
        forceUpdateOverflow,
        isOverflowing,
        elementId
    ]);
    return {
        ref,
        overflowCount,
        isOverflowing
    };
}
