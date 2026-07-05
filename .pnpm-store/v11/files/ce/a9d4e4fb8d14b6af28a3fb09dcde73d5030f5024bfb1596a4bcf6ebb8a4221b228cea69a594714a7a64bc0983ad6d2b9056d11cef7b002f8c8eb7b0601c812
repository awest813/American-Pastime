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
    useTagPickerInputBase_unstable: function() {
        return useTagPickerInputBase_unstable;
    },
    useTagPickerInput_unstable: function() {
        return useTagPickerInput_unstable;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _react = /*#__PURE__*/ _interop_require_wildcard._(require("react"));
const _reactdom = /*#__PURE__*/ _interop_require_wildcard._(require("react-dom"));
const _reactaria = require("@fluentui/react-aria");
const _TagPickerContext = require("../../contexts/TagPickerContext");
const _reactutilities = require("@fluentui/react-utilities");
const _keyboardkeys = require("@fluentui/keyboard-keys");
const _reactcombobox = require("@fluentui/react-combobox");
const _reactfield = require("@fluentui/react-field");
const _tokens = require("../../utils/tokens");
const _reacttabster = require("@fluentui/react-tabster");
const useTagPickerInputBase_unstable = (props, ref)=>{
    const fieldProps = (0, _reactfield.useFieldControlProps_unstable)(props, {
        supportsLabelFor: true,
        supportsRequired: true,
        supportsSize: true
    });
    const { controller: activeDescendantController } = (0, _reactaria.useActiveDescendantContext)();
    const contextDisabled = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.disabled);
    const triggerRef = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.triggerRef);
    const selectedOptions = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.selectedOptions);
    const setValue = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.setValue);
    const setOpen = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.setOpen);
    const setHasFocus = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.setHasFocus);
    const clearSelection = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.clearSelection);
    const open = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.open);
    const popoverId = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.noPopover ? undefined : ctx.popoverId);
    const selectOption = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.selectOption);
    const getOptionById = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.getOptionById);
    const contextValue = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.value);
    (0, _reactutilities.useIsomorphicLayoutEffect)(()=>{
        if (!triggerRef.current) {
            return;
        }
        setTagPickerInputStretchStyle(triggerRef.current);
    }, [
        selectedOptions,
        triggerRef
    ]);
    (0, _reactutilities.useIsomorphicLayoutEffect)(()=>{
        if (triggerRef.current) {
            const input = triggerRef.current;
            const cb = ()=>setTagPickerInputStretchStyle(input);
            input.addEventListener('input', cb);
            return ()=>{
                input.removeEventListener('input', cb);
            };
        }
    }, [
        triggerRef
    ]);
    const { value = contextValue, disabled = contextDisabled } = fieldProps;
    const isTypingRef = _react.useRef(false);
    const root = (0, _reactcombobox.useInputTriggerSlot)({
        type: 'text',
        value: value !== null && value !== void 0 ? value : '',
        'aria-controls': open ? popoverId : undefined,
        disabled,
        ...(0, _reactutilities.getIntrinsicElementProps)('input', fieldProps),
        onKeyDown: (0, _reactutilities.useEventCallback)((event)=>{
            var _fieldProps_onKeyDown;
            (_fieldProps_onKeyDown = fieldProps.onKeyDown) === null || _fieldProps_onKeyDown === void 0 ? void 0 : _fieldProps_onKeyDown.call(fieldProps, event);
            if (event.key === _keyboardkeys.Space) {
                if (open && !isTypingRef.current) {
                    setOpen(event, false);
                }
            } else if (event.key === _keyboardkeys.Enter) {
                if (open) {
                    _reactdom.unstable_batchedUpdates(()=>{
                        setValue(undefined);
                        setOpen(event, false);
                    });
                } else {
                    setOpen(event, true);
                }
            }
            isTypingRef.current = event.key.length === 1 && event.code !== _keyboardkeys.Space && !event.altKey && !event.ctrlKey && !event.metaKey;
        })
    }, (0, _reactutilities.useMergedRefs)(triggerRef, ref), {
        activeDescendantController,
        freeform: false,
        state: {
            clearSelection,
            getOptionById,
            open,
            selectedOptions,
            selectOption,
            setHasFocus,
            setOpen,
            setValue,
            multiselect: true,
            value: fieldProps.value
        }
    });
    return {
        components: {
            root: 'input'
        },
        root,
        disabled
    };
};
const useTagPickerInput_unstable = (props, ref)=>{
    const tagPickerGroupRef = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.tagPickerGroupRef);
    const { findLastFocusable } = (0, _reacttabster.useFocusFinders)();
    const onKeyDown = (0, _reactutilities.useEventCallback)((event)=>{
        var _props_onKeyDown;
        (_props_onKeyDown = props.onKeyDown) === null || _props_onKeyDown === void 0 ? void 0 : _props_onKeyDown.call(props, event);
        if ((event.key === _keyboardkeys.ArrowLeft || event.key === _keyboardkeys.Backspace) && event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0 && tagPickerGroupRef.current) {
            var _findLastFocusable;
            (_findLastFocusable = findLastFocusable(tagPickerGroupRef.current)) === null || _findLastFocusable === void 0 ? void 0 : _findLastFocusable.focus();
        }
    });
    const baseState = useTagPickerInputBase_unstable({
        ...props,
        onKeyDown
    }, ref);
    const size = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.size);
    return {
        ...baseState,
        size
    };
};
/**
 * while typing the user might need a bit more of space to see the text,
 * which means the input should stretch to 100% width
 * occupying a whole new line.
 *
 * This function will set the CSS variable `--width` to `100%` if the scrollWidth is greater than the offsetWidth,
 * meaning the text is overflowing the input.
 *
 * @param input - input element to apply the style
 * @returns void
 */ const setTagPickerInputStretchStyle = (input)=>{
    // first we need to remove the CSS variable
    // to properly calculate the difference between scrollWidth and offsetWidth
    input.style.removeProperty(_tokens.tagPickerInputCSSRules.width);
    if (input.scrollWidth > input.offsetWidth + 1) {
        input.style.setProperty(_tokens.tagPickerInputCSSRules.width, '100%');
    } else {
        input.style.removeProperty(_tokens.tagPickerInputCSSRules.width);
    }
};
