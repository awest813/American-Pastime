"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useVirtualizerScrollViewDynamic_unstable", {
    enumerable: true,
    get: function() {
        return useVirtualizerScrollViewDynamic_unstable;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _react = /*#__PURE__*/ _interop_require_wildcard._(require("react"));
const _reactutilities = require("@fluentui/react-utilities");
const _useVirtualizer = require("../Virtualizer/useVirtualizer");
const _Hooks = require("../../Hooks");
const _Utilities = require("../../Utilities");
const _useMeasureList = require("../../hooks/useMeasureList");
const _useDynamicPagination = require("../../hooks/useDynamicPagination");
const _useScrollToItemDynamic = require("../../hooks/useScrollToItemDynamic");
function useVirtualizerScrollViewDynamic_unstable(props) {
    'use no memo';
    var _imperativeVirtualizerRef_current;
    const contextState = (0, _Utilities.useVirtualizerContextState_unstable)(props.virtualizerContext);
    const { imperativeRef, axis = 'vertical', reversed, imperativeVirtualizerRef, enablePagination = false, bufferItems: _bufferItems, bufferSize: _bufferSize, enableScrollAnchor, gap = 0 } = props;
    const sizeTrackingArray = _react.useRef(new Array(props.numItems).fill(props.itemSize));
    const getChildSizeAuto = (index)=>{
        if (sizeTrackingArray.current.length <= index || sizeTrackingArray.current[index] <= 0) {
            // Default size for initial state or untracked
            return props.itemSize;
        }
        /* Required to be defined prior to our measure function
     * we use a sizing array ref that we will update post-render
     */ return sizeTrackingArray.current[index];
    };
    var _props_axis, _props_getItemSize;
    const { virtualizerLength, bufferItems, bufferSize, scrollRef, containerSizeRef, updateScrollPosition } = (0, _Hooks.useDynamicVirtualizerMeasure)({
        defaultItemSize: props.itemSize,
        direction: (_props_axis = props.axis) != null ? _props_axis : 'vertical',
        getItemSize: (_props_getItemSize = props.getItemSize) != null ? _props_getItemSize : getChildSizeAuto,
        virtualizerContext: contextState,
        numItems: props.numItems,
        bufferItems: _bufferItems,
        bufferSize: _bufferSize,
        gap
    });
    const _imperativeVirtualizerRef = (0, _reactutilities.useMergedRefs)(_react.useRef(null), imperativeVirtualizerRef);
    var _contextState_contextIndex;
    const paginationRef = (0, _useDynamicPagination.useDynamicVirtualizerPagination)({
        axis,
        progressiveItemSizes: (_imperativeVirtualizerRef_current = _imperativeVirtualizerRef.current) == null ? void 0 : _imperativeVirtualizerRef_current.progressiveSizes,
        actualNodeSizes: sizeTrackingArray,
        virtualizerLength,
        currentIndex: (_contextState_contextIndex = contextState == null ? void 0 : contextState.contextIndex) != null ? _contextState_contextIndex : 0
    }, enablePagination);
    // Store the virtualizer length as a ref for imperative ref access
    const virtualizerLengthRef = _react.useRef(virtualizerLength);
    if (virtualizerLengthRef.current !== virtualizerLength) {
        virtualizerLengthRef.current = virtualizerLength;
    }
    const localScrollRef = _react.useRef(null);
    const scrollViewRef = (0, _reactutilities.useMergedRefs)(props.scrollViewRef, scrollRef, paginationRef, localScrollRef);
    const scrollCallbackRef = _react.useRef(null);
    const handleMeasuredCallbackRef = _react.useRef(null);
    const handleRenderedCallbackRef = _react.useRef(null);
    const measuredIndexSetRef = _react.useRef(new Set());
    const handleItemMeasured = _react.useCallback((index, size, delta)=>{
        measuredIndexSetRef.current.add(index);
        handleMeasuredCallbackRef.current == null ? void 0 : handleMeasuredCallbackRef.current.call(handleMeasuredCallbackRef, index, size, delta);
    }, []);
    const resolveScrollCallback = _react.useCallback((index)=>{
        const callback = scrollCallbackRef.current;
        if (callback) {
            scrollCallbackRef.current = null;
            callback(index);
        }
    }, []);
    const handleRenderedIndex = _react.useCallback((index)=>{
        var _handleRenderedCallbackRef_current;
        const handled = (_handleRenderedCallbackRef_current = handleRenderedCallbackRef.current == null ? void 0 : handleRenderedCallbackRef.current.call(handleRenderedCallbackRef, index)) != null ? _handleRenderedCallbackRef_current : false;
        if (!handled) {
            resolveScrollCallback(index);
        }
    }, [
        resolveScrollCallback
    ]);
    var _props_getItemSize1;
    const virtualizerState = (0, _useVirtualizer.useVirtualizer_unstable)({
        ...props,
        getItemSize: (_props_getItemSize1 = props.getItemSize) != null ? _props_getItemSize1 : getChildSizeAuto,
        virtualizerLength,
        bufferItems,
        bufferSize,
        virtualizerContext: contextState,
        imperativeVirtualizerRef: _imperativeVirtualizerRef,
        onRenderedFlaggedIndex: handleRenderedIndex,
        containerSizeRef,
        scrollViewRef,
        updateScrollPosition
    });
    // Track whether a scrollTo operation is active to disable scroll compensation
    const isScrollToActiveRef = _react.useRef(false);
    const requestScrollBy = _react.useCallback((sizeChange)=>{
        // Skip scroll compensation when scrollTo is active
        // The scroll controller handles its own compensation
        if (isScrollToActiveRef.current) {
            return;
        }
        // Handle any size changes so that scroll view doesn't jump around
        if (enableScrollAnchor) {
            var _localScrollRef_current;
            (_localScrollRef_current = localScrollRef.current) == null ? void 0 : _localScrollRef_current.scrollBy({
                top: axis === 'vertical' ? sizeChange : 0,
                left: axis === 'vertical' ? 0 : sizeChange,
                behavior: 'instant'
            });
        }
    }, [
        enableScrollAnchor,
        axis,
        localScrollRef
    ]);
    const measureObject = (0, _useMeasureList.useMeasureList)({
        currentIndex: Math.max(virtualizerState.virtualizerStartIndex, 0),
        totalLength: props.numItems,
        defaultItemSize: props.itemSize,
        sizeTrackingArray,
        axis,
        virtualizerLength,
        requestScrollBy,
        onItemMeasured: handleItemMeasured
    });
    _react.useEffect(()=>{
        const measuredSet = measuredIndexSetRef.current;
        measuredSet.forEach((value)=>{
            if (value >= props.numItems) {
                measuredSet.delete(value);
            }
        });
    }, [
        props.numItems
    ]);
    const setFlaggedIndex = _react.useCallback((flaggedIndex)=>{
        var _imperativeVirtualizerRef_current;
        (_imperativeVirtualizerRef_current = _imperativeVirtualizerRef.current) == null ? void 0 : _imperativeVirtualizerRef_current.setFlaggedIndex(flaggedIndex);
    }, [
        _imperativeVirtualizerRef
    ]);
    const getTotalSize = _react.useCallback(()=>{
        var _imperativeVirtualizerRef_current;
        const progressiveSizes = (_imperativeVirtualizerRef_current = _imperativeVirtualizerRef.current) == null ? void 0 : _imperativeVirtualizerRef_current.progressiveSizes.current;
        if (progressiveSizes && progressiveSizes.length > 0) {
            return progressiveSizes[Math.max(progressiveSizes.length - 1, 0)];
        }
        return 0;
    }, [
        _imperativeVirtualizerRef
    ]);
    const getOffsetForIndex = _react.useCallback((index)=>{
        var _imperativeVirtualizerRef_current;
        if (index <= 0) {
            return 0;
        }
        const progressiveSizes = (_imperativeVirtualizerRef_current = _imperativeVirtualizerRef.current) == null ? void 0 : _imperativeVirtualizerRef_current.progressiveSizes.current;
        if (progressiveSizes && progressiveSizes.length > 0 && index - 1 < progressiveSizes.length) {
            const value = progressiveSizes[index - 1];
            if (Number.isFinite(value)) {
                return value;
            }
        }
        let total = 0;
        const limit = Math.min(index, sizeTrackingArray.current.length);
        for(let i = 0; i < limit; i++){
            const size = sizeTrackingArray.current[i] > 0 ? sizeTrackingArray.current[i] : props.itemSize;
            total += size;
            if (gap && i < index - 1) {
                total += gap;
            }
        }
        return total;
    }, [
        _imperativeVirtualizerRef,
        gap,
        props.itemSize,
        sizeTrackingArray
    ]);
    const getScrollItemSize = _react.useCallback((index)=>{
        if (measuredIndexSetRef.current.has(index)) {
            var _sizeTrackingArray_current_index;
            return (_sizeTrackingArray_current_index = sizeTrackingArray.current[index]) != null ? _sizeTrackingArray_current_index : props.itemSize;
        }
        if (props.getItemSize) {
            return props.getItemSize(index);
        }
        return getChildSizeAuto(index);
    }, [
        props.getItemSize,
        props.itemSize,
        getChildSizeAuto
    ]);
    // ----- Scroll-to implementation with iterative corrections -----
    const handleOperationComplete = _react.useCallback((index)=>{
        // Re-enable useMeasureList scroll compensation now that the operation is complete
        isScrollToActiveRef.current = false;
        resolveScrollCallback(index);
    }, [
        resolveScrollCallback
    ]);
    const handleOperationCancel = _react.useCallback((_index, _reason)=>{
        void _index;
        void _reason;
        isScrollToActiveRef.current = false;
        scrollCallbackRef.current = null;
    }, []);
    const { start: startScrollToWithCorrections, handleItemMeasured: controllerHandleItemMeasured, handleRendered: controllerHandleRendered, cancel: cancelScrollToOperation } = (0, _useScrollToItemDynamic.useScrollToItemDynamic)({
        axis,
        reversed,
        gap,
        scrollViewRef: localScrollRef,
        getItemSize: getScrollItemSize,
        getTotalSize,
        getOffsetForIndex,
        measureRefObject: measureObject.refObject,
        setFlaggedIndex,
        onOperationComplete: handleOperationComplete,
        onOperationCancel: handleOperationCancel
    });
    // Wire up the controller callbacks
    _react.useEffect(()=>{
        handleMeasuredCallbackRef.current = controllerHandleItemMeasured;
        handleRenderedCallbackRef.current = controllerHandleRendered;
        return ()=>{
            if (handleMeasuredCallbackRef.current === controllerHandleItemMeasured) {
                handleMeasuredCallbackRef.current = null;
            }
            if (handleRenderedCallbackRef.current === controllerHandleRendered) {
                handleRenderedCallbackRef.current = null;
            }
        };
    }, [
        controllerHandleItemMeasured,
        controllerHandleRendered
    ]);
    _react.useImperativeHandle(imperativeRef, ()=>{
        var _imperativeVirtualizerRef_current;
        return {
            scrollToPosition (position, behavior = 'auto', index, callback) {
                if (callback) {
                    scrollCallbackRef.current = callback != null ? callback : null;
                }
                cancelScrollToOperation();
                if (_imperativeVirtualizerRef.current) {
                    var _scrollViewRef_current;
                    if (index !== undefined) {
                        setFlaggedIndex(index);
                    }
                    const positionOptions = axis === 'vertical' ? {
                        top: position
                    } : {
                        left: position
                    };
                    (_scrollViewRef_current = scrollViewRef.current) == null ? void 0 : _scrollViewRef_current.scrollTo({
                        behavior,
                        ...positionOptions
                    });
                }
            },
            scrollTo (index, behavior = 'auto', callback) {
                // Use implementation with iterative corrections
                scrollCallbackRef.current = callback != null ? callback : null;
                isScrollToActiveRef.current = true;
                startScrollToWithCorrections(index, behavior, callback);
            },
            currentIndex: (_imperativeVirtualizerRef_current = _imperativeVirtualizerRef.current) == null ? void 0 : _imperativeVirtualizerRef_current.currentIndex,
            virtualizerLength: virtualizerLengthRef,
            sizeTrackingArray
        };
    }, [
        axis,
        scrollViewRef,
        _imperativeVirtualizerRef,
        startScrollToWithCorrections,
        cancelScrollToOperation,
        setFlaggedIndex,
        reversed
    ]);
    // Enables auto-measuring and tracking post render sizes externally
    _react.Children.map(virtualizerState.virtualizedChildren, (child, index)=>{
        if (/*#__PURE__*/ _react.isValidElement(child)) {
            virtualizerState.virtualizedChildren[index] = /*#__PURE__*/ _react.createElement(child.type, {
                ...child.props,
                key: child.key,
                ref: (element)=>{
                    if (Object.prototype.hasOwnProperty.call(child, 'ref')) {
                        // We must access this from the child directly, not props (forward ref).
                        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
                        const localRef = child == null ? void 0 : child.ref;
                        if (typeof localRef === 'function') {
                            localRef(element);
                        } else if (localRef) {
                            localRef.current = element;
                        }
                    }
                    // Call the auto-measure ref attachment.
                    measureObject.createIndexedRef(index)(element);
                }
            });
        }
    });
    return {
        ...virtualizerState,
        enableScrollAnchor,
        components: {
            ...virtualizerState.components,
            container: 'div'
        },
        container: _reactutilities.slot.always(props.container, {
            defaultProps: {
                ref: scrollViewRef
            },
            elementType: 'div'
        })
    };
}

//# sourceMappingURL=useVirtualizerScrollViewDynamic.js.map