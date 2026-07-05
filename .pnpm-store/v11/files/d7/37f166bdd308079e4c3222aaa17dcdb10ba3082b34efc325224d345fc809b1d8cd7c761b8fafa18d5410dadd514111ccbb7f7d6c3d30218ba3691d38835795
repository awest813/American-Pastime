'use client';
import * as React from 'react';
import { createOverflowManager, EMPTY_SNAPSHOT } from '@fluentui/priority-overflow';
import { canUseDOM, useEventCallback, useIsomorphicLayoutEffect } from '@fluentui/react-utilities';
import { DATA_OVERFLOWING, DATA_OVERFLOW_DIVIDER, DATA_OVERFLOW_ITEM, DATA_OVERFLOW_MENU } from './constants';
/**
 * @internal
 * @param update - Callback when overflow state changes
 * @param options - Options to configure the overflow container
 * @returns - ref to attach to an intrinsic HTML element and imperative functions
 */ export const useOverflowContainer = (update, options)=>{
    const { overflowAxis = 'horizontal', overflowDirection = 'end', padding = 10, minimumVisible = 0, onUpdateItemVisibility = noop, hasHiddenItems = false } = options;
    const onUpdateItemVisibilityCallback = useEventCallback(onUpdateItemVisibility);
    const observeOptions = React.useMemo(()=>({
            overflowAxis,
            overflowDirection,
            padding,
            minimumVisible,
            onUpdateItemVisibility: onUpdateItemVisibilityCallback,
            onUpdateOverflow: update,
            hasHiddenItems
        }), [
        minimumVisible,
        onUpdateItemVisibilityCallback,
        overflowAxis,
        overflowDirection,
        padding,
        update,
        hasHiddenItems
    ]);
    const containerRef = React.useRef(null);
    const managerRef = React.useRef(null);
    if (managerRef.current === null) {
        managerRef.current = canUseDOM() ? createOverflowManager(observeOptions) : null;
    }
    useIsomorphicLayoutEffect(()=>{
        if (managerRef.current && containerRef.current) {
            // forceUpdate resolves overflow synchronously for a correct first paint; the manager guards it
            // on the container being measured.
            managerRef.current.observe(containerRef.current, {
                forceUpdate: true
            });
            return ()=>{
                var _managerRef_current;
                return (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.disconnect();
            };
        }
    }, []);
    useIsomorphicLayoutEffect(()=>{
        var _managerRef_current;
        (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.setOptions(observeOptions);
    }, [
        observeOptions
    ]);
    const registerItem = React.useCallback((item)=>{
        var _managerRef_current;
        (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.addItem(item);
        item.element.setAttribute(DATA_OVERFLOW_ITEM, '');
        return ()=>{
            var _managerRef_current;
            item.element.removeAttribute(DATA_OVERFLOWING);
            item.element.removeAttribute(DATA_OVERFLOW_ITEM);
            (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.removeItem(item.id);
        };
    }, []);
    const registerDivider = React.useCallback((divider)=>{
        var _managerRef_current;
        const el = divider.element;
        (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.addDivider(divider);
        el.setAttribute(DATA_OVERFLOW_DIVIDER, '');
        return ()=>{
            var _managerRef_current;
            (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.removeDivider(divider.groupId);
            el.removeAttribute(DATA_OVERFLOW_DIVIDER);
        };
    }, []);
    const registerOverflowMenu = React.useCallback((el)=>{
        var _managerRef_current;
        (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.addOverflowMenu(el);
        el.setAttribute(DATA_OVERFLOW_MENU, '');
        return ()=>{
            var _managerRef_current;
            (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.removeOverflowMenu();
            el.removeAttribute(DATA_OVERFLOW_MENU);
        };
    }, []);
    const updateOverflow = React.useCallback(()=>{
        var _managerRef_current;
        (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.update();
    }, []);
    const getSnapshot = React.useCallback(()=>{
        var _managerRef_current;
        var _managerRef_current_getSnapshot;
        return (_managerRef_current_getSnapshot = (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.getSnapshot()) !== null && _managerRef_current_getSnapshot !== void 0 ? _managerRef_current_getSnapshot : EMPTY_SNAPSHOT;
    }, []);
    const subscribe = React.useCallback((listener)=>{
        var _managerRef_current;
        var _managerRef_current_subscribe;
        return (_managerRef_current_subscribe = (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.subscribe(listener)) !== null && _managerRef_current_subscribe !== void 0 ? _managerRef_current_subscribe : noop;
    }, []);
    const forceUpdateOverflow = React.useCallback(()=>{
        var _managerRef_current;
        (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.forceUpdate();
    }, []);
    return {
        registerItem,
        registerDivider,
        registerOverflowMenu,
        updateOverflow,
        forceUpdateOverflow,
        containerRef,
        getSnapshot,
        subscribe
    };
};
const noop = ()=>{
/* noop */ };
export const updateVisibilityAttribute = ({ item, visible })=>{
    if (visible) {
        item.element.removeAttribute(DATA_OVERFLOWING);
    } else {
        item.element.setAttribute(DATA_OVERFLOWING, '');
    }
};
