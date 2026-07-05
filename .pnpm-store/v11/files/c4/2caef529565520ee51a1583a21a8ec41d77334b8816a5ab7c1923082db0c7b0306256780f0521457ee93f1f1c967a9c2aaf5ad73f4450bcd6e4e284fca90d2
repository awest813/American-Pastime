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
    useInputBase_unstable: function() {
        return useInputBase_unstable;
    },
    useInput_unstable: function() {
        return useInput_unstable;
    }
});
const _reactfield = require("@fluentui/react-field");
const _reactutilities = require("@fluentui/react-utilities");
const _reactsharedcontexts = require("@fluentui/react-shared-contexts");
const useInput_unstable = (props, ref)=>{
    const overrides = (0, _reactsharedcontexts.useOverrides_unstable)();
    var _overrides_inputDefaultAppearance;
    const { size = 'medium', appearance = (_overrides_inputDefaultAppearance = overrides.inputDefaultAppearance) !== null && _overrides_inputDefaultAppearance !== void 0 ? _overrides_inputDefaultAppearance : 'outline', ...baseProps } = props;
    if (process.env.NODE_ENV !== 'production' && (appearance === 'filled-darker-shadow' || appearance === 'filled-lighter-shadow')) {
        // eslint-disable-next-line no-console
        console.error("The 'filled-darker-shadow' and 'filled-lighter-shadow' appearances are deprecated and will be removed in the" + ' future.');
    }
    const state = useInputBase_unstable(baseProps, ref);
    return {
        size,
        appearance,
        ...state
    };
};
const useInputBase_unstable = (props, ref)=>{
    const fieldControlProps = (0, _reactfield.useFieldControlProps_unstable)(props, {
        supportsLabelFor: true,
        supportsRequired: true,
        supportsSize: true
    });
    const [value, setValue] = (0, _reactutilities.useControllableState)({
        state: fieldControlProps.value,
        defaultState: fieldControlProps.defaultValue,
        initialState: ''
    });
    const nativeProps = (0, _reactutilities.getPartitionedNativeProps)({
        props: fieldControlProps,
        primarySlotTagName: 'input',
        excludedPropNames: [
            'onChange',
            'value',
            'defaultValue'
        ]
    });
    const state = {
        components: {
            root: 'span',
            input: 'input',
            contentBefore: 'span',
            contentAfter: 'span'
        },
        input: _reactutilities.slot.always(fieldControlProps.input, {
            defaultProps: {
                type: 'text',
                ref,
                ...nativeProps.primary
            },
            elementType: 'input'
        }),
        contentAfter: _reactutilities.slot.optional(fieldControlProps.contentAfter, {
            elementType: 'span'
        }),
        contentBefore: _reactutilities.slot.optional(fieldControlProps.contentBefore, {
            elementType: 'span'
        }),
        root: _reactutilities.slot.always(fieldControlProps.root, {
            defaultProps: nativeProps.root,
            elementType: 'span'
        })
    };
    state.input.value = value;
    state.input.onChange = (0, _reactutilities.useEventCallback)((ev)=>{
        var _fieldControlProps_onChange;
        const newValue = ev.target.value;
        (_fieldControlProps_onChange = fieldControlProps.onChange) === null || _fieldControlProps_onChange === void 0 ? void 0 : _fieldControlProps_onChange.call(fieldControlProps, ev, {
            value: newValue
        });
        setValue(newValue);
    });
    return state;
};
