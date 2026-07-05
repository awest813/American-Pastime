import * as React from 'react';
import { slot, useMergedRefs } from '@fluentui/react-utilities';
import { useVirtualizer_unstable } from '../Virtualizer/useVirtualizer';
import { useDynamicVirtualizerMeasure } from '../../Hooks';
import { useVirtualizerContextState_unstable } from '../../Utilities';
import { useMeasureList } from '../../hooks/useMeasureList';
import { useDynamicVirtualizerPagination } from '../../hooks/useDynamicPagination';
import { useScrollToItemDynamic } from '../../hooks/useScrollToItemDynamic';
export function useVirtualizerScrollViewDynamic_unstable(props) {
    'use no memo';
    var _imperativeVirtualizerRef_current;
    const contextState = useVirtualizerContextState_unstable(props.virtualizerContext);
    const { imperativeRef, axis = 'vertical', reversed, imperativeVirtualizerRef, enablePagination = false, bufferItems: _bufferItems, bufferSize: _bufferSize, enableScrollAnchor, gap = 0 } = props;
    const sizeTrackingArray = React.useRef(new Array(props.numItems).fill(props.itemSize));
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
    const { virtualizerLength, bufferItems, bufferSize, scrollRef, containerSizeRef, updateScrollPosition } = useDynamicVirtualizerMeasure({
        defaultItemSize: props.itemSize,
        direction: (_props_axis = props.axis) != null ? _props_axis : 'vertical',
        getItemSize: (_props_getItemSize = props.getItemSize) != null ? _props_getItemSize : getChildSizeAuto,
        virtualizerContext: contextState,
        numItems: props.numItems,
        bufferItems: _bufferItems,
        bufferSize: _bufferSize,
        gap
    });
    const _imperativeVirtualizerRef = useMergedRefs(React.useRef(null), imperativeVirtualizerRef);
    var _contextState_contextIndex;
    const paginationRef = useDynamicVirtualizerPagination({
        axis,
        progressiveItemSizes: (_imperativeVirtualizerRef_current = _imperativeVirtualizerRef.current) == null ? void 0 : _imperativeVirtualizerRef_current.progressiveSizes,
        actualNodeSizes: sizeTrackingArray,
        virtualizerLength,
        currentIndex: (_contextState_contextIndex = contextState == null ? void 0 : contextState.contextIndex) != null ? _contextState_contextIndex : 0
    }, enablePagination);
    // Store the virtualizer length as a ref for imperative ref access
    const virtualizerLengthRef = React.useRef(virtualizerLength);
    if (virtualizerLengthRef.current !== virtualizerLength) {
        virtualizerLengthRef.current = virtualizerLength;
    }
    const localScrollRef = React.useRef(null);
    const scrollViewRef = useMergedRefs(props.scrollViewRef, scrollRef, paginationRef, localScrollRef);
    const scrollCallbackRef = React.useRef(null);
    const handleMeasuredCallbackRef = React.useRef(null);
    const handleRenderedCallbackRef = React.useRef(null);
    const measuredIndexSetRef = React.useRef(new Set());
    const handleItemMeasured = React.useCallback((index, size, delta)=>{
        measuredIndexSetRef.current.add(index);
        handleMeasuredCallbackRef.current == null ? void 0 : handleMeasuredCallbackRef.current.call(handleMeasuredCallbackRef, index, size, delta);
    }, []);
    const resolveScrollCallback = React.useCallback((index)=>{
        const callback = scrollCallbackRef.current;
        if (callback) {
            scrollCallbackRef.current = null;
            callback(index);
        }
    }, []);
    const handleRenderedIndex = React.useCallback((index)=>{
        var _handleRenderedCallbackRef_current;
        const handled = (_handleRenderedCallbackRef_current = handleRenderedCallbackRef.current == null ? void 0 : handleRenderedCallbackRef.current.call(handleRenderedCallbackRef, index)) != null ? _handleRenderedCallbackRef_current : false;
        if (!handled) {
            resolveScrollCallback(index);
        }
    }, [
        resolveScrollCallback
    ]);
    var _props_getItemSize1;
    const virtualizerState = useVirtualizer_unstable({
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
    const isScrollToActiveRef = React.useRef(false);
    const requestScrollBy = React.useCallback((sizeChange)=>{
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
    const measureObject = useMeasureList({
        currentIndex: Math.max(virtualizerState.virtualizerStartIndex, 0),
        totalLength: props.numItems,
        defaultItemSize: props.itemSize,
        sizeTrackingArray,
        axis,
        virtualizerLength,
        requestScrollBy,
        onItemMeasured: handleItemMeasured
    });
    React.useEffect(()=>{
        const measuredSet = measuredIndexSetRef.current;
        measuredSet.forEach((value)=>{
            if (value >= props.numItems) {
                measuredSet.delete(value);
            }
        });
    }, [
        props.numItems
    ]);
    const setFlaggedIndex = React.useCallback((flaggedIndex)=>{
        var _imperativeVirtualizerRef_current;
        (_imperativeVirtualizerRef_current = _imperativeVirtualizerRef.current) == null ? void 0 : _imperativeVirtualizerRef_current.setFlaggedIndex(flaggedIndex);
    }, [
        _imperativeVirtualizerRef
    ]);
    const getTotalSize = React.useCallback(()=>{
        var _imperativeVirtualizerRef_current;
        const progressiveSizes = (_imperativeVirtualizerRef_current = _imperativeVirtualizerRef.current) == null ? void 0 : _imperativeVirtualizerRef_current.progressiveSizes.current;
        if (progressiveSizes && progressiveSizes.length > 0) {
            return progressiveSizes[Math.max(progressiveSizes.length - 1, 0)];
        }
        return 0;
    }, [
        _imperativeVirtualizerRef
    ]);
    const getOffsetForIndex = React.useCallback((index)=>{
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
    const getScrollItemSize = React.useCallback((index)=>{
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
    const handleOperationComplete = React.useCallback((index)=>{
        // Re-enable useMeasureList scroll compensation now that the operation is complete
        isScrollToActiveRef.current = false;
        resolveScrollCallback(index);
    }, [
        resolveScrollCallback
    ]);
    const handleOperationCancel = React.useCallback((_index, _reason)=>{
        void _index;
        void _reason;
        isScrollToActiveRef.current = false;
        scrollCallbackRef.current = null;
    }, []);
    const { start: startScrollToWithCorrections, handleItemMeasured: controllerHandleItemMeasured, handleRendered: controllerHandleRendered, cancel: cancelScrollToOperation } = useScrollToItemDynamic({
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
    React.useEffect(()=>{
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
    React.useImperativeHandle(imperativeRef, ()=>{
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
    React.Children.map(virtualizerState.virtualizedChildren, (child, index)=>{
        if (/*#__PURE__*/ React.isValidElement(child)) {
            virtualizerState.virtualizedChildren[index] = /*#__PURE__*/ React.createElement(child.type, {
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
        container: slot.always(props.container, {
            defaultProps: {
                ref: scrollViewRef
            },
            elementType: 'div'
        })
    };
}

//# sourceMappingURL=useVirtualizerScrollViewDynamic.js.map