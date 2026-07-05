import * as React from 'react';
import { useTimeout, useAnimationFrame } from '@fluentui/react-utilities';
/** Default maximum number of correction attempts */ const DEFAULT_MAX_CORRECTIONS = 10;
/** Default timeout in milliseconds between stability checks */ const DEFAULT_STABILITY_TIMEOUT = 150;
/** Pixel tolerance for viewport alignment */ const VIEWPORT_TOLERANCE = 1;
/** Number of stable iterations required before finalization */ const DEFAULT_CORRECTION_SETTLE = 2;
/** Delay to wait for smooth scroll animation to complete before corrections */ const SMOOTH_SCROLL_DELAY = 500;
/**
 * Hook for managing scroll-to operations in dynamic virtualized lists.
 * Handles iterative corrections and stability checks when items have
 * dynamic heights that change after rendering.
 *
 * @returns Controller with methods to start, handle measurements, and cancel scroll operations
 */ export function useScrollToItemDynamic({ axis, reversed, gap, scrollViewRef, getItemSize, getTotalSize, getOffsetForIndex, measureRefObject, maxCorrections = DEFAULT_MAX_CORRECTIONS, stabilityTimeout = DEFAULT_STABILITY_TIMEOUT, setFlaggedIndex, onOperationComplete, onOperationCancel }) {
    const operationRef = React.useRef(null);
    const scrollListenerRef = React.useRef(null);
    const operationIdRef = React.useRef(0);
    const scheduleCorrectionRef = React.useRef(null);
    const scheduleStabilityCheckRef = React.useRef(null);
    const scheduleCorrection = React.useCallback((operation)=>{
        scheduleCorrectionRef.current == null ? void 0 : scheduleCorrectionRef.current.call(scheduleCorrectionRef, operation);
    }, []);
    const scheduleStabilityCheck = React.useCallback((operation)=>{
        scheduleStabilityCheckRef.current == null ? void 0 : scheduleStabilityCheckRef.current.call(scheduleStabilityCheckRef, operation);
    }, []);
    const [setStabilityTimeout, clearStabilityTimeoutFn] = useTimeout();
    const [requestProgrammaticFrame] = useAnimationFrame();
    const [requestCorrectionFrame, cancelCorrectionFrame] = useAnimationFrame();
    const clearStabilityTimeout = React.useCallback((operation)=>{
        if (operation.stabilityTimeoutId === null) {
            return;
        }
        clearStabilityTimeoutFn();
        operation.stabilityTimeoutId = null;
    }, [
        clearStabilityTimeoutFn
    ]);
    const cancelScheduledFrame = React.useCallback((operation)=>{
        if (operation.scheduleFrameId === null) {
            return;
        }
        cancelCorrectionFrame();
        operation.scheduleFrameId = null;
    }, [
        cancelCorrectionFrame
    ]);
    const detachScrollListener = React.useCallback(()=>{
        const listener = scrollListenerRef.current;
        const scrollView = scrollViewRef.current;
        if (listener && scrollView) {
            scrollView.removeEventListener('scroll', listener);
        }
        scrollListenerRef.current = null;
    }, [
        scrollViewRef
    ]);
    /**
   * Clears the current operation, cancelling all timers and cleaning up state.
   */ const clearOperation = React.useCallback((reason)=>{
        const active = operationRef.current;
        if (!active) {
            return;
        }
        clearStabilityTimeout(active);
        cancelScheduledFrame(active);
        detachScrollListener();
        operationRef.current = null;
        setFlaggedIndex == null ? void 0 : setFlaggedIndex(null);
        if (reason && onOperationCancel) {
            onOperationCancel(active.targetIndex, reason);
        }
    }, [
        cancelScheduledFrame,
        clearStabilityTimeout,
        detachScrollListener,
        onOperationCancel,
        setFlaggedIndex
    ]);
    /**
   * Gets the DOM element for a given index from the measure ref object.
   */ const getTargetElement = React.useCallback((index)=>{
        const element = measureRefObject.current[index.toString()];
        return element != null ? element : null;
    }, [
        measureRefObject
    ]);
    const ensureScrollListener = React.useCallback(()=>{
        if (scrollListenerRef.current || !scrollViewRef.current) {
            return;
        }
        const listener = ()=>{
            const active = operationRef.current;
            if (!active) {
                return;
            }
            // Don't cancel during programmatic scroll or smooth scroll animation
            if (active.isProgrammaticScroll || active.awaitingSmoothScroll) {
                return;
            }
            // User-initiated scroll cancels the operation (including pinning)
            clearOperation('user');
        };
        scrollViewRef.current.addEventListener('scroll', listener, {
            passive: true
        });
        scrollListenerRef.current = listener;
    }, [
        clearOperation,
        scrollViewRef
    ]);
    /**
   * Evaluates whether the target element is properly aligned within the viewport.
   * Returns alignment status, deltas, and overflow information.
   */ const evaluateTargetAlignment = React.useCallback((index)=>{
        const scrollView = scrollViewRef.current;
        const element = getTargetElement(index);
        if (!scrollView || !element) {
            return {
                elementExists: Boolean(element),
                aligned: false,
                startDelta: 0,
                endOverflow: 0
            };
        }
        const elementRect = element.getBoundingClientRect();
        const containerRect = scrollView.getBoundingClientRect();
        const elementStart = axis === 'vertical' ? elementRect.top : elementRect.left;
        const containerStart = axis === 'vertical' ? containerRect.top : containerRect.left;
        const elementEnd = axis === 'vertical' ? elementRect.bottom : elementRect.right;
        const containerEnd = axis === 'vertical' ? containerRect.bottom : containerRect.right;
        const startDelta = elementStart - containerStart;
        const endOverflow = Math.max(0, elementEnd - containerEnd);
        const aligned = Math.abs(startDelta) <= VIEWPORT_TOLERANCE && endOverflow <= VIEWPORT_TOLERANCE;
        return {
            elementExists: true,
            aligned,
            startDelta,
            endOverflow
        };
    }, [
        axis,
        getTargetElement,
        scrollViewRef
    ]);
    const scheduleProgrammaticScrollReset = React.useCallback((operation)=>{
        requestProgrammaticFrame(()=>{
            const active = operationRef.current;
            if (!active || active.id !== operation.id) {
                return;
            }
            active.isProgrammaticScroll = false;
        });
    }, [
        operationRef,
        requestProgrammaticFrame
    ]);
    /**
   * Applies an instant scroll adjustment by the specified delta.
   * Uses direct property manipulation for synchronous behavior to avoid
   * timing issues with browser reflow.
   */ const applyScrollByDelta = React.useCallback((operation, delta)=>{
        const scrollView = scrollViewRef.current;
        if (!scrollView || delta === 0) {
            return;
        }
        const adjustedDelta = reversed ? -delta : delta;
        operation.isProgrammaticScroll = true;
        scrollView.scrollBy({
            [axis === 'vertical' ? 'top' : 'left']: adjustedDelta,
            behavior: 'instant'
        });
        scheduleProgrammaticScrollReset(operation);
    }, [
        axis,
        reversed,
        scheduleProgrammaticScrollReset,
        scrollViewRef
    ]);
    /**
   * Performs the actual scroll operation to the target index.
   * Uses optimized offset calculation when available, otherwise calculates offset manually.
   */ const performScroll = React.useCallback((operation, behavior)=>{
        const scrollView = scrollViewRef.current;
        if (!scrollView) {
            return;
        }
        operation.isProgrammaticScroll = true;
        // Try optimized offset calculation first
        if (!reversed && axis === 'vertical' && getOffsetForIndex) {
            const offset = getOffsetForIndex(operation.targetIndex);
            if (offset !== undefined && offset !== null && isFinite(offset)) {
                scrollView.scrollTo({
                    top: offset,
                    behavior
                });
                scheduleProgrammaticScrollReset(operation);
                return;
            }
        }
        // Fallback: calculate offset manually
        let itemDepth = 0;
        for(let i = 0; i < operation.targetIndex; i++){
            itemDepth += getItemSize(i) + gap;
        }
        const totalSize = getTotalSize();
        if (axis === 'horizontal') {
            if (reversed) {
                scrollView.scrollTo({
                    left: totalSize - itemDepth,
                    behavior
                });
            } else {
                scrollView.scrollTo({
                    left: itemDepth,
                    behavior
                });
            }
        } else {
            if (reversed) {
                scrollView.scrollTo({
                    top: totalSize - itemDepth,
                    behavior
                });
            } else {
                scrollView.scrollTo({
                    top: itemDepth,
                    behavior
                });
            }
        }
        scheduleProgrammaticScrollReset(operation);
    }, [
        axis,
        gap,
        getItemSize,
        getTotalSize,
        reversed,
        scrollViewRef,
        getOffsetForIndex,
        scheduleProgrammaticScrollReset
    ]);
    /**
   * Finalizes a scroll operation, marking it as stable.
   * Invokes completion callbacks and cleans up timers.
   */ const finalizeOperation = React.useCallback((operation)=>{
        if (operation.status === 'stable') {
            return;
        }
        operation.status = 'stable';
        clearStabilityTimeout(operation);
        cancelScheduledFrame(operation);
        if (operation.callback) {
            operation.callback(operation.targetIndex);
        }
        onOperationComplete == null ? void 0 : onOperationComplete(operation.targetIndex);
        setFlaggedIndex == null ? void 0 : setFlaggedIndex(null);
        operationRef.current = null;
        detachScrollListener();
    }, [
        cancelScheduledFrame,
        clearStabilityTimeout,
        detachScrollListener,
        onOperationComplete,
        setFlaggedIndex
    ]);
    scheduleStabilityCheckRef.current = (operation)=>{
        if (!operation) {
            return;
        }
        clearStabilityTimeout(operation);
        const runCheck = ()=>{
            const active = operationRef.current;
            if (!active || active.id !== operation.id) {
                return;
            }
            active.stabilityTimeoutId = null;
            // After smooth scroll animation completes, apply instant correction
            const wasAwaitingSmoothScroll = active.awaitingSmoothScroll;
            active.awaitingSmoothScroll = false;
            if (wasAwaitingSmoothScroll) {
                // Force an instant correction to fix position after smooth scroll
                performScroll(active, 'instant');
                active.correctionsRemaining -= 1;
                active.stableIterations = DEFAULT_CORRECTION_SETTLE;
                scheduleStabilityCheck(active);
                return;
            }
            const alignment = evaluateTargetAlignment(active.targetIndex);
            if (!alignment.elementExists || !active.hasMeasuredTarget) {
                if (active.correctionsRemaining > 0) {
                    scheduleCorrection(active);
                }
                scheduleStabilityCheck(active);
                return;
            }
            if (!alignment.aligned) {
                let correctionApplied = false;
                if (Math.abs(alignment.startDelta) > VIEWPORT_TOLERANCE) {
                    applyScrollByDelta(active, alignment.startDelta);
                    correctionApplied = true;
                } else if (alignment.endOverflow > VIEWPORT_TOLERANCE) {
                    applyScrollByDelta(active, alignment.endOverflow);
                    correctionApplied = true;
                }
                if (!correctionApplied && active.correctionsRemaining > 0) {
                    performScroll(active, 'instant');
                    correctionApplied = true;
                    active.correctionsRemaining -= 1;
                } else if (correctionApplied && active.correctionsRemaining > 0) {
                    active.correctionsRemaining -= 1;
                }
                if (correctionApplied) {
                    active.stableIterations = DEFAULT_CORRECTION_SETTLE;
                    scheduleStabilityCheck(active);
                    return;
                }
                if (active.correctionsRemaining <= 0) {
                    finalizeOperation(active);
                    return;
                }
                scheduleStabilityCheck(active);
                return;
            }
            if (active.pendingCorrection) {
                scheduleStabilityCheck(active);
                return;
            }
            if (active.stableIterations > 0) {
                active.stableIterations -= 1;
                scheduleStabilityCheck(active);
                return;
            }
            finalizeOperation(active);
        };
        // Use longer delay for smooth scroll to let animation complete
        const delay = operation.awaitingSmoothScroll ? SMOOTH_SCROLL_DELAY : stabilityTimeout;
        // Mark as having a pending timeout (use 1 as a sentinel value since useTimeout
        // doesn't return actual timeout IDs)
        operation.stabilityTimeoutId = 1;
        setStabilityTimeout(runCheck, delay);
    };
    scheduleCorrectionRef.current = (operation)=>{
        if (!operation) {
            return;
        }
        if (operation.correctionsRemaining <= 0 || operation.pendingCorrection) {
            return;
        }
        operation.pendingCorrection = true;
        const executeCorrection = ()=>{
            const active = operationRef.current;
            if (!active || active.id !== operation.id) {
                return;
            }
            let correctionApplied = false;
            const alignment = evaluateTargetAlignment(active.targetIndex);
            if (alignment.elementExists) {
                if (Math.abs(alignment.startDelta) > VIEWPORT_TOLERANCE) {
                    applyScrollByDelta(active, alignment.startDelta);
                    correctionApplied = true;
                } else if (alignment.endOverflow > VIEWPORT_TOLERANCE) {
                    applyScrollByDelta(active, alignment.endOverflow);
                    correctionApplied = true;
                }
            }
            if (!correctionApplied) {
                performScroll(active, 'instant');
                correctionApplied = true;
            }
            if (correctionApplied) {
                active.correctionsRemaining -= 1;
            }
            active.pendingCorrection = false;
            active.scheduleFrameId = null;
            if (alignment.elementExists && alignment.aligned) {
                finalizeOperation(active);
                return;
            }
            if (active.correctionsRemaining > 0) {
                scheduleCorrection(active);
                return;
            }
            scheduleStabilityCheck(active);
        };
        // Use requestAnimationFrame via useAnimationFrame hook (SSR-safe)
        operation.scheduleFrameId = requestCorrectionFrame(()=>{
            executeCorrection();
        });
    };
    /**
   * Handles when an item's size is measured or changes.
   * Triggers corrections and stability checks as needed.
   */ const handleItemMeasured = React.useCallback((index, _size, delta)=>{
        const active = operationRef.current;
        if (!active) {
            return;
        }
        // Ignore measurements after operation is stable
        if (active.status === 'stable') {
            return;
        }
        // Ignore measurements for items after the target
        if (index > active.targetIndex) {
            return;
        }
        active.lastMeasurementTimestamp = Date.now();
        if (index < active.targetIndex && delta !== 0) {
            // For smooth scrolling, skip compensations while animation is in progress
            // The stability check will handle corrections after the animation completes
            if (active.awaitingSmoothScroll) {
                return;
            }
            // Schedule a correction when items before target change size
            if (active.correctionsRemaining > 0) {
                scheduleCorrection(active);
            }
            active.stableIterations = DEFAULT_CORRECTION_SETTLE;
            return;
        }
        if (index === active.targetIndex) {
            active.hasMeasuredTarget = true;
            if (!active.initialAlignmentPerformed) {
                // Use the original scroll behavior for initial alignment
                // This preserves smooth scrolling if the user requested it
                performScroll(active, active.behavior);
                active.initialAlignmentPerformed = true;
            }
            // For smooth scrolling, don't immediately schedule corrections
            // while animation is in progress
            if (!active.awaitingSmoothScroll && Math.abs(delta) >= VIEWPORT_TOLERANCE && active.correctionsRemaining > 0) {
                scheduleCorrection(active);
                active.stableIterations = DEFAULT_CORRECTION_SETTLE;
            }
            return;
        }
    // For items not matching any condition above (delta=0, not target),
    // don't do anything - let existing stability check complete
    }, [
        applyScrollByDelta,
        scheduleCorrection,
        evaluateTargetAlignment,
        scheduleStabilityCheck,
        performScroll
    ]);
    /**
   * Handles when the target item is rendered in the DOM.
   * Schedules corrections and stability checks to ensure proper alignment.
   */ const handleRendered = React.useCallback((index)=>{
        const active = operationRef.current;
        if (!active || index !== active.targetIndex) {
            return false;
        }
        if (active.status === 'stable') {
            return true;
        }
        scheduleCorrection(active);
        scheduleStabilityCheck(active);
        return true;
    }, [
        scheduleCorrection,
        scheduleStabilityCheck
    ]);
    /**
   * Initiates a scroll operation to the specified index.
   * Cancels any existing operation and starts a new one with corrections and stability checks.
   */ const start = React.useCallback((index, behavior, callback)=>{
        var _operationRef_current;
        cancelScheduledFrame((_operationRef_current = operationRef.current) != null ? _operationRef_current : {
            scheduleFrameId: null
        });
        clearOperation();
        const operationId = ++operationIdRef.current;
        const operation = {
            id: operationId,
            targetIndex: index,
            behavior,
            callback,
            correctionsRemaining: maxCorrections,
            pendingCorrection: false,
            stabilityTimeoutId: null,
            scheduleFrameId: null,
            status: 'initial',
            isProgrammaticScroll: false,
            stableIterations: DEFAULT_CORRECTION_SETTLE,
            lastMeasurementTimestamp: Date.now(),
            hasMeasuredTarget: false,
            initialAlignmentPerformed: false,
            awaitingSmoothScroll: behavior === 'smooth'
        };
        operationRef.current = operation;
        setFlaggedIndex == null ? void 0 : setFlaggedIndex(index);
        ensureScrollListener();
        performScroll(operation, behavior);
        // For smooth scrolling, mark initial alignment as done and don't schedule immediate correction
        // Let the smooth animation play out, then stability checks will trigger corrections if needed
        if (behavior === 'smooth') {
            operation.initialAlignmentPerformed = true;
        } else {
            scheduleCorrection(operation);
        }
        scheduleStabilityCheck(operation);
    }, [
        cancelScheduledFrame,
        clearOperation,
        ensureScrollListener,
        maxCorrections,
        scheduleCorrection,
        performScroll,
        scheduleStabilityCheck,
        setFlaggedIndex
    ]);
    /**
   * Cancels the current scroll operation and cleans up all timers and listeners.
   */ const cancel = React.useCallback(()=>{
        clearOperation('cancelled');
    }, [
        clearOperation
    ]);
    /**
   * Returns true if a scroll operation is currently active (not finalized).
   */ const isActive = React.useCallback(()=>{
        return operationRef.current !== null;
    }, []);
    React.useEffect(()=>{
        return ()=>{
            clearOperation();
        };
    }, [
        clearOperation
    ]);
    return {
        start,
        handleItemMeasured,
        handleRendered,
        cancel,
        isActive
    };
}

//# sourceMappingURL=useScrollToItemDynamic.js.map