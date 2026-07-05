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
    useOverflowStyles: function() {
        return useOverflowStyles;
    },
    useOverflowStyles_unstable: function() {
        return useOverflowStyles_unstable;
    }
});
const _react = require("@griffel/react");
const _reactutilities = require("@fluentui/react-utilities");
const useOverflowStyles = /*#__PURE__*/ (0, _react.__styles)({
    overflowMenu: {
        Brvla84: "fyfkpbf"
    },
    overflowingItems: {
        zb22lx: "f10570jf"
    }
}, {
    d: [
        ".fyfkpbf [data-overflow-menu]{flex-shrink:0;}",
        ".f10570jf [data-overflowing]{display:none;}"
    ]
});
const useOverflowStyles_unstable = (state)=>{
    const styles = useOverflowStyles();
    const child = (0, _reactutilities.getTriggerChild)(state.children);
    // eslint-disable-next-line react-hooks/immutability
    state.className = (0, _react.mergeClasses)('fui-Overflow', styles.overflowMenu, styles.overflowingItems, child === null || child === void 0 ? void 0 : child.props.className);
    return state;
};
