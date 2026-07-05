'use client';
import { getTriggerChild, getReactElementRef, useMergedRefs, useEventCallback } from '@fluentui/react-utilities';
import { updateVisibilityAttribute, useOverflowContainer } from '../../useOverflowContainer';
/**
 * The state required to render Overflow.
 *
 * @param props - props from this instance of Overflow
 * @param ref - reference forwarded to the single child's root element
 */ export const useOverflow_unstable = (props, ref)=>{
    const { children, minimumVisible, overflowAxis = 'horizontal', overflowDirection, padding, onOverflowChange, hasHiddenItems } = props;
    const update = useEventCallback(()=>{
        // eslint-disable-next-line react-hooks/immutability
        const snapshot = getSnapshot();
        const state = {
            hasOverflow: snapshot.invisibleItemCount > 0,
            itemVisibility: snapshot.itemVisibility,
            groupVisibility: snapshot.groupVisibility
        };
        onOverflowChange === null || onOverflowChange === void 0 ? void 0 : onOverflowChange(null, state);
    });
    const { containerRef, getSnapshot, subscribe, registerItem, updateOverflow, forceUpdateOverflow, registerOverflowMenu, registerDivider } = useOverflowContainer(update, {
        overflowDirection,
        overflowAxis,
        padding,
        minimumVisible,
        hasHiddenItems,
        onUpdateItemVisibility: updateVisibilityAttribute
    });
    const child = getTriggerChild(children);
    return {
        containerRef,
        getSnapshot,
        subscribe,
        registerItem,
        updateOverflow,
        forceUpdateOverflow,
        registerOverflowMenu,
        registerDivider,
        ref: useMergedRefs(containerRef, ref, getReactElementRef(child)),
        children
    };
};
