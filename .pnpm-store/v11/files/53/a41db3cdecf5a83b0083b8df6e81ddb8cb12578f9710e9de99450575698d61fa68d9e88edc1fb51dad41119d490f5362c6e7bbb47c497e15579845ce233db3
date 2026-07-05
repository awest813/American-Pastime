'use client';
import * as React from 'react';
import { elementContains, useEventCallback, useId, useMergedRefs } from '@fluentui/react-utilities';
import { optionClassNames } from '@fluentui/react-combobox';
import { resolvePositioningShorthand, usePositioning } from '@fluentui/react-positioning';
import { useActiveDescendant } from '@fluentui/react-aria';
import { useComboboxBaseState } from '@fluentui/react-combobox';
// Set a default set of fallback positions to try if the dropdown does not fit on screen
const fallbackPositions = [
    'above',
    'after',
    'after-top',
    'before',
    'before-top'
];
/**
 * Create the base state required to render TagPicker, without floating-ui positioning.
 * @param props - props from this instance of TagPicker (without `positioning`)
 */ export const useTagPickerBase_unstable = (props)=>{
    const popoverId = useId('picker-listbox');
    const triggerInnerRef = React.useRef(null);
    const secondaryActionRef = React.useRef(null);
    const tagPickerGroupRef = React.useRef(null);
    const passiveTargetRef = React.useRef(null);
    const { size = 'medium', inline = false, noPopover = false, disableAutoFocus } = props;
    const { controller: activeDescendantController, activeParentRef, listboxRef } = useActiveDescendant({
        matchOption: (el)=>el.classList.contains(optionClassNames.root)
    });
    const comboboxState = useComboboxBaseState({
        ...props,
        onOptionSelect: useEventCallback((event, data)=>{
            var _props_onOptionSelect;
            return (_props_onOptionSelect = props.onOptionSelect) === null || _props_onOptionSelect === void 0 ? void 0 : _props_onOptionSelect.call(props, event, {
                selectedOptions: data.selectedOptions,
                value: data.optionValue,
                type: event.type,
                event
            });
        }),
        onOpenChange: useEventCallback((event, data)=>{
            var _props_onOpenChange;
            return (_props_onOpenChange = props.onOpenChange) === null || _props_onOpenChange === void 0 ? void 0 : _props_onOpenChange.call(props, event, {
                ...data,
                type: event.type,
                event
            });
        }),
        activeDescendantController,
        disableAutoFocus,
        editable: true,
        multiselect: true,
        size: 'medium'
    });
    const { trigger, popover } = childrenToTriggerAndPopover(props.children, noPopover);
    return {
        activeDescendantController,
        components: {},
        trigger,
        popover: comboboxState.open || comboboxState.hasFocus ? popover : undefined,
        popoverId,
        noPopover,
        disabled: comboboxState.disabled,
        triggerRef: useMergedRefs(triggerInnerRef, activeParentRef),
        popoverRef: useMergedRefs(listboxRef),
        secondaryActionRef,
        tagPickerGroupRef,
        targetRef: passiveTargetRef,
        size,
        inline,
        open: comboboxState.open,
        mountNode: comboboxState.mountNode,
        onOptionClick: useEventCallback((event)=>{
            comboboxState.onOptionClick(event);
            comboboxState.setOpen(event, false);
        }),
        appearance: comboboxState.appearance,
        clearSelection: comboboxState.clearSelection,
        getOptionById: comboboxState.getOptionById,
        getOptionsMatchingValue: comboboxState.getOptionsMatchingValue,
        registerOption: comboboxState.registerOption,
        selectedOptions: comboboxState.selectedOptions,
        selectOption: useEventCallback((event, data)=>{
            // if the option is already selected, invoke onOptionSelect callback with current selected values
            // the combobox state would unselect the option, which is not the behavior expected
            if (comboboxState.selectedOptions.includes(data.value) && !elementContains(tagPickerGroupRef.current, event.target)) {
                var _props_onOptionSelect;
                (_props_onOptionSelect = props.onOptionSelect) === null || _props_onOptionSelect === void 0 ? void 0 : _props_onOptionSelect.call(props, event, {
                    selectedOptions: comboboxState.selectedOptions,
                    value: data.value,
                    type: event.type,
                    event
                });
                return;
            }
            comboboxState.selectOption(event, data);
        }),
        setHasFocus: comboboxState.setHasFocus,
        setOpen: comboboxState.setOpen,
        setValue: comboboxState.setValue,
        value: comboboxState.value
    };
};
/**
 * Create the state required to render Picker.
 *
 * The returned state can be modified with hooks such as usePickerStyles_unstable,
 * before being passed to renderPicker_unstable.
 *
 * @param props - props from this instance of Picker
 */ export const useTagPicker_unstable = (props)=>{
    const { positioning } = props;
    const { targetRef, containerRef } = usePositioning({
        position: 'below',
        align: 'start',
        offset: {
            crossAxis: 0,
            mainAxis: 2
        },
        fallbackPositions,
        matchTargetSize: 'width',
        ...resolvePositioningShorthand(positioning)
    });
    const baseState = useTagPickerBase_unstable(props);
    return {
        ...baseState,
        targetRef,
        popoverRef: useMergedRefs(baseState.popoverRef, containerRef)
    };
};
const childrenToTriggerAndPopover = (children, noPopover)=>{
    const childrenArray = React.Children.toArray(children);
    if (process.env.NODE_ENV !== 'production') {
        if (childrenArray.length === 0) {
            // eslint-disable-next-line no-console
            console.warn('TagPicker must contain at least one child');
        }
        if (childrenArray.length > 2) {
            // eslint-disable-next-line no-console
            console.warn('TagPicker must contain at most two children');
        }
    }
    if (noPopover) {
        return {
            trigger: childrenArray[0]
        };
    }
    let trigger = undefined;
    let popover = undefined;
    if (childrenArray.length === 2) {
        trigger = childrenArray[0];
        popover = childrenArray[1];
    } else if (childrenArray.length === 1) {
        popover = childrenArray[0];
    }
    return {
        trigger,
        popover
    };
};
