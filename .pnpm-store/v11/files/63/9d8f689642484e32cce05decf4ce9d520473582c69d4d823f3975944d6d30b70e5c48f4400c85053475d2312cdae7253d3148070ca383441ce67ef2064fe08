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
    useMenuButtonBase_unstable: function() {
        return useMenuButtonBase_unstable;
    },
    useMenuButton_unstable: function() {
        return useMenuButton_unstable;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _react = /*#__PURE__*/ _interop_require_wildcard._(require("react"));
const _reacticons = require("@fluentui/react-icons");
const _reactutilities = require("@fluentui/react-utilities");
const _ButtonContext = require("../../contexts/ButtonContext");
const _index = require("../Button/index");
const useMenuButtonBase_unstable = (props, ref)=>{
    const { menuIcon, ...buttonProps } = props;
    const buttonState = (0, _index.useButtonBase_unstable)(buttonProps, ref);
    return {
        ...buttonState,
        iconOnly: Boolean(!props.children),
        // Slots definition
        components: {
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            ...buttonState.components,
            menuIcon: 'span'
        },
        root: {
            ...buttonState.root,
            // force aria-expanded to be a boolean, not a string
            'aria-expanded': props['aria-expanded'] ? props['aria-expanded'] === 'true' || props['aria-expanded'] === true : false
        },
        menuIcon: _reactutilities.slot.optional(menuIcon, {
            elementType: 'span'
        })
    };
};
const useMenuButton_unstable = (props, ref)=>{
    const { size: contextSize } = (0, _ButtonContext.useButtonContext)();
    const { appearance = 'secondary', menuIcon, shape = 'rounded', size = contextSize !== null && contextSize !== void 0 ? contextSize : 'medium', ...baseProps } = props;
    const baseState = useMenuButtonBase_unstable(baseProps, ref);
    return {
        ...baseState,
        menuIcon: _reactutilities.slot.optional(menuIcon, {
            defaultProps: {
                children: /*#__PURE__*/ _react.createElement(_reacticons.ChevronDownRegular, null)
            },
            renderByDefault: true,
            elementType: 'span'
        }),
        appearance,
        shape,
        size
    };
};
