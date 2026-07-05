'use client';
import { EMPTY_SNAPSHOT } from '@fluentui/priority-overflow';
import * as React from 'react';
export const OverflowContext = React.createContext(undefined);
/**
 * Provides an {@link OverflowContextValue} to descendant overflow hooks and components.
 * Used by headless consumers that build their own overflow root.
 * @public
 */ export const OverflowProvider = OverflowContext.Provider;
const noop = ()=>{
/* noop */ };
const overflowContextDefaultValue = {
    hasOverflow: false,
    itemVisibility: {},
    groupVisibility: {},
    registerItem: ()=>noop,
    updateOverflow: noop,
    forceUpdateOverflow: noop,
    registerOverflowMenu: ()=>noop,
    registerDivider: ()=>noop,
    getSnapshot: ()=>EMPTY_SNAPSHOT,
    subscribe: ()=>noop
};
export function useOverflowContext(selector) {
    var _React_useContext;
    const context = (_React_useContext = React.useContext(OverflowContext)) !== null && _React_useContext !== void 0 ? _React_useContext : overflowContextDefaultValue;
    return selector ? selector(context) : context;
}
