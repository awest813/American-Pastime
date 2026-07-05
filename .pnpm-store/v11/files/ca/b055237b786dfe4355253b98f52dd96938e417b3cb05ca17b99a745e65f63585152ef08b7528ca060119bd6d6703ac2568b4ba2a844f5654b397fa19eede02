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
    updateVisibilityAttribute: function() {
        return updateVisibilityAttribute;
    },
    useOverflowContainer: function() {
        return useOverflowContainer;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _react = /*#__PURE__*/ _interop_require_wildcard._(require("react"));
const _priorityoverflow = require("@fluentui/priority-overflow");
const _reactutilities = require("@fluentui/react-utilities");
const _constants = require("./constants");
const useOverflowContainer = (update, options)=>{
    const { overflowAxis = 'horizontal', overflowDirection = 'end', padding = 10, minimumVisible = 0, onUpdateItemVisibility = noop, hasHiddenItems = false } = options;
    const onUpdateItemVisibilityCallback = (0, _reactutilities.useEventCallback)(onUpdateItemVisibility);
    const observeOptions = _react.useMemo(()=>({
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
    const containerRef = _react.useRef(null);
    const managerRef = _react.useRef(null);
    if (managerRef.current === null) {
        managerRef.current = (0, _reactutilities.canUseDOM)() ? (0, _priorityoverflow.createOverflowManager)(observeOptions) : null;
    }
    (0, _reactutilities.useIsomorphicLayoutEffect)(()=>{
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
    (0, _reactutilities.useIsomorphicLayoutEffect)(()=>{
        var _managerRef_current;
        (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.setOptions(observeOptions);
    }, [
        observeOptions
    ]);
    const registerItem = _react.useCallback((item)=>{
        var _managerRef_current;
        (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.addItem(item);
        item.element.setAttribute(_constants.DATA_OVERFLOW_ITEM, '');
        return ()=>{
            var _managerRef_current;
            item.element.removeAttribute(_constants.DATA_OVERFLOWING);
            item.element.removeAttribute(_constants.DATA_OVERFLOW_ITEM);
            (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.removeItem(item.id);
        };
    }, []);
    const registerDivider = _react.useCallback((divider)=>{
        var _managerRef_current;
        const el = divider.element;
        (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.addDivider(divider);
        el.setAttribute(_constants.DATA_OVERFLOW_DIVIDER, '');
        return ()=>{
            var _managerRef_current;
            (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.removeDivider(divider.groupId);
            el.removeAttribute(_constants.DATA_OVERFLOW_DIVIDER);
        };
    }, []);
    const registerOverflowMenu = _react.useCallback((el)=>{
        var _managerRef_current;
        (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.addOverflowMenu(el);
        el.setAttribute(_constants.DATA_OVERFLOW_MENU, '');
        return ()=>{
            var _managerRef_current;
            (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.removeOverflowMenu();
            el.removeAttribute(_constants.DATA_OVERFLOW_MENU);
        };
    }, []);
    const updateOverflow = _react.useCallback(()=>{
        var _managerRef_current;
        (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.update();
    }, []);
    const getSnapshot = _react.useCallback(()=>{
        var _managerRef_current;
        var _managerRef_current_getSnapshot;
        return (_managerRef_current_getSnapshot = (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.getSnapshot()) !== null && _managerRef_current_getSnapshot !== void 0 ? _managerRef_current_getSnapshot : _priorityoverflow.EMPTY_SNAPSHOT;
    }, []);
    const subscribe = _react.useCallback((listener)=>{
        var _managerRef_current;
        var _managerRef_current_subscribe;
        return (_managerRef_current_subscribe = (_managerRef_current = managerRef.current) === null || _managerRef_current === void 0 ? void 0 : _managerRef_current.subscribe(listener)) !== null && _managerRef_current_subscribe !== void 0 ? _managerRef_current_subscribe : noop;
    }, []);
    const forceUpdateOverflow = _react.useCallback(()=>{
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
const updateVisibilityAttribute = ({ item, visible })=>{
    if (visible) {
        item.element.removeAttribute(_constants.DATA_OVERFLOWING);
    } else {
        item.element.setAttribute(_constants.DATA_OVERFLOWING, '');
    }
};
