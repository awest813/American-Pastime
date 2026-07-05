import * as React from 'react';
/**
 * Reference object for measured elements, keyed by index string.
 */
type MeasureRefObject = React.MutableRefObject<{
    [key: string]: (HTMLElement & {
        handleResize?: () => void;
    }) | null;
}>;
/**
 * Parameters for configuring the useScrollToItemDynamic hook.
 */
type UseScrollToItemDynamicParams = {
    /** Scroll axis direction */
    axis: 'horizontal' | 'vertical';
    /** Whether the scroll direction is reversed */
    reversed?: boolean;
    /** Gap between items in pixels */
    gap: number;
    /** Reference to the scrollable container element */
    scrollViewRef: React.RefObject<HTMLDivElement | null>;
    /** Function to get the size of an item at a given index */
    getItemSize: (index: number) => number;
    /** Function to get the total size of all items */
    getTotalSize: () => number;
    /** Optional function to get the offset for a specific index */
    getOffsetForIndex?: (index: number) => number | null | undefined;
    /** Reference object containing measured elements */
    measureRefObject: MeasureRefObject;
    /** Maximum number of correction attempts */
    maxCorrections?: number;
    /** Timeout in milliseconds between stability checks */
    stabilityTimeout?: number;
    /** Callback to set a flagged index for rendering */
    setFlaggedIndex?: (index: number | null) => void;
    /** Callback invoked when the scroll operation completes successfully */
    onOperationComplete?: (index: number) => void;
    /** Callback invoked when the scroll operation is cancelled */
    onOperationCancel?: (index: number, reason: 'user' | 'cancelled') => void;
};
/**
 * Return type for the useScrollToItemDynamic hook.
 */
type UseScrollToItemDynamicReturn = {
    /** Initiates a scroll operation to the specified index */
    start: (index: number, behavior: ScrollBehavior, callback?: (index: number) => void) => void;
    /** Handles when an item's size is measured or changes */
    handleItemMeasured: (index: number, size: number, delta: number) => void;
    /** Handles when the target item is rendered in the DOM */
    handleRendered: (index: number) => boolean;
    /** Cancels the current scroll operation */
    cancel: () => void;
    /** Returns true if a scroll operation is currently active */
    isActive: () => boolean;
};
/**
 * Hook for managing scroll-to operations in dynamic virtualized lists.
 * Handles iterative corrections and stability checks when items have
 * dynamic heights that change after rendering.
 *
 * @returns Controller with methods to start, handle measurements, and cancel scroll operations
 */
export declare function useScrollToItemDynamic({ axis, reversed, gap, scrollViewRef, getItemSize, getTotalSize, getOffsetForIndex, measureRefObject, maxCorrections, stabilityTimeout, setFlaggedIndex, onOperationComplete, onOperationCancel, }: UseScrollToItemDynamicParams): UseScrollToItemDynamicReturn;
export {};
