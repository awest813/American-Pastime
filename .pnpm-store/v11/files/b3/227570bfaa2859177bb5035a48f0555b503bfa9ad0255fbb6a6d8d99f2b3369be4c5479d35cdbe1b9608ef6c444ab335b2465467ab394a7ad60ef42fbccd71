'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useOverflow_unstable", {
    enumerable: true,
    get: function() {
        return useOverflow_unstable;
    }
});
const _reactutilities = require("@fluentui/react-utilities");
const _useOverflowContainer = require("../../useOverflowContainer");
const useOverflow_unstable = (props, ref)=>{
    const { children, minimumVisible, overflowAxis = 'horizontal', overflowDirection, padding, onOverflowChange, hasHiddenItems } = props;
    const update = (0, _reactutilities.useEventCallback)(()=>{
        // eslint-disable-next-line react-hooks/immutability
        const snapshot = getSnapshot();
        const state = {
            hasOverflow: snapshot.invisibleItemCount > 0,
            itemVisibility: snapshot.itemVisibility,
            groupVisibility: snapshot.groupVisibility
        };
        onOverflowChange === null || onOverflowChange === void 0 ? void 0 : onOverflowChange(null, state);
    });
    const { containerRef, getSnapshot, subscribe, registerItem, updateOverflow, forceUpdateOverflow, registerOverflowMenu, registerDivider } = (0, _useOverflowContainer.useOverflowContainer)(update, {
        overflowDirection,
        overflowAxis,
        padding,
        minimumVisible,
        hasHiddenItems,
        onUpdateItemVisibility: _useOverflowContainer.updateVisibilityAttribute
    });
    const child = (0, _reactutilities.getTriggerChild)(children);
    return {
        containerRef,
        getSnapshot,
        subscribe,
        registerItem,
        updateOverflow,
        forceUpdateOverflow,
        registerOverflowMenu,
        registerDivider,
        ref: (0, _reactutilities.useMergedRefs)(containerRef, ref, (0, _reactutilities.getReactElementRef)(child)),
        children
    };
};
