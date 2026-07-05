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
    useTagPickerButtonBase_unstable: function() {
        return useTagPickerButtonBase_unstable;
    },
    useTagPickerButton_unstable: function() {
        return useTagPickerButton_unstable;
    }
});
const _reactaria = require("@fluentui/react-aria");
const _TagPickerContext = require("../../contexts/TagPickerContext");
const _reactcombobox = require("@fluentui/react-combobox");
const useTagPickerButtonBase_unstable = (props, ref)=>{
    const { controller: activeDescendantController } = (0, _reactaria.useActiveDescendantContext)();
    const triggerRef = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.triggerRef);
    const open = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.open);
    const value = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.value);
    const hasSelectedOption = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.selectedOptions.length > 0);
    const popoverId = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.popoverId);
    const getOptionById = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.getOptionById);
    const selectOption = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.selectOption);
    const setHasFocus = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.setHasFocus);
    const setOpen = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.setOpen);
    // casting is required here as triggerRef can either be button or input,
    // but in this case we can assure it's a button
    const root = (0, _reactcombobox.useButtonTriggerSlot)(props, triggerRef, {
        activeDescendantController,
        defaultProps: {
            type: 'button',
            tabIndex: 0,
            children: value || // @ts-expect-error - FIXME: TS2339: Property 'placeholder' does not exist on type 'TagPickerButtonBaseProps'
            props.placeholder,
            'aria-controls': open ? popoverId : undefined,
            ref
        },
        state: {
            getOptionById,
            open,
            selectOption,
            setHasFocus,
            setOpen,
            multiselect: true
        }
    });
    return {
        components: {
            root: 'button'
        },
        root,
        hasSelectedOption
    };
};
const useTagPickerButton_unstable = (props, ref)=>{
    const baseState = useTagPickerButtonBase_unstable(props, ref);
    const size = (0, _TagPickerContext.useTagPickerContext_unstable)((ctx)=>ctx.size);
    return {
        ...baseState,
        size
    };
};
