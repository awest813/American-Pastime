'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useOverflowSnapshot", {
    enumerable: true,
    get: function() {
        return useOverflowSnapshot;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _react = /*#__PURE__*/ _interop_require_wildcard._(require("react"));
const _reactutilities = require("@fluentui/react-utilities");
const _overflowContext = require("./overflowContext");
function useOverflowSnapshot(selector) {
    const { getSnapshot, subscribe } = (0, _overflowContext.useOverflowContext)();
    const select = (0, _reactutilities.useEventCallback)(selector);
    const [selected, setSelected] = _react.useState(()=>selector(getSnapshot()));
    (0, _reactutilities.useIsomorphicLayoutEffect)(()=>{
        const checkForUpdates = ()=>setSelected(select(getSnapshot()));
        checkForUpdates();
        return subscribe(checkForUpdates);
    }, [
        subscribe,
        getSnapshot,
        select
    ]);
    return selected;
}
