'use client';
import * as React from 'react';
/**
 * Assembles the overflow context values provided to descendants, from the state returned by
 * {@link useOverflow_unstable}.
 *
 * @internal
 */ export const useOverflowContextValues_unstable = (state)=>{
    const { registerItem, registerDivider, registerOverflowMenu, updateOverflow, forceUpdateOverflow, containerRef, getSnapshot, subscribe } = state;
    const overflow = React.useMemo(()=>({
            groupVisibility: {},
            itemVisibility: {},
            hasOverflow: false,
            registerItem,
            registerDivider,
            registerOverflowMenu,
            updateOverflow,
            forceUpdateOverflow,
            containerRef,
            getSnapshot,
            subscribe
        }), [
        registerItem,
        registerDivider,
        registerOverflowMenu,
        updateOverflow,
        forceUpdateOverflow,
        containerRef,
        getSnapshot,
        subscribe
    ]);
    return {
        overflow
    };
};
