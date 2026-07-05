/**
 * Creates an overflow manager instance for a single container.
 *
 * @internal
 * @param initialOptions - Initial observe options. Missing values are filled with defaults.
 * @returns overflow manager instance
 */
export declare function createOverflowManager(initialOptions?: Partial<OverflowOptions>): OverflowManager;

/**
 * An empty, frozen overflow snapshot used as the default before anything has been measured.
 * @internal
 */
export declare const EMPTY_SNAPSHOT: OverflowSnapshot;

export declare interface ObserveOptions extends Partial<OverflowOptions> {
    /**
     * forces update when observation begins, ensuring initial overflow state is correct. This is useful when the container starts with items that should be overflowed, or when the container resizes immediately after mounting.
     * @default false
     */
    forceUpdate?: boolean;
}

/**
 * Callback invoked when a single item's visibility changes.
 */
export declare type OnUpdateItemVisibility = (data: OnUpdateItemVisibilityPayload) => void;

/**
 * Payload for item-level visibility updates.
 */
export declare interface OnUpdateItemVisibilityPayload {
    /**
     * Item whose visibility changed.
     */
    item: OverflowItemEntry;
    /**
     * Whether the item is now visible.
     */
    visible: boolean;
}

/**
 * Signature similar to standard event listeners, typed for overflow updates.
 */
export declare type OnUpdateOverflow = (data: OverflowEventPayload) => void;

/**
 * Axis used to measure overflow.
 */
export declare type OverflowAxis = 'horizontal' | 'vertical';

/**
 * Direction where items are removed when overflow occurs.
 */
export declare type OverflowDirection = 'start' | 'end';

/**
 * Tracked divider in the overflow manager.
 */
export declare interface OverflowDividerEntry {
    /**
     * HTML element that disappears when its group overflows.
     */
    element: HTMLElement;
    /**
     * Id of the group controlled by this divider.
     */
    groupId: string;
}

/**
 * Payload of the custom DOM event for overflow updates
 */
export declare interface OverflowEventPayload {
    /**
     * Items currently visible in the container.
     */
    visibleItems: OverflowItemEntry[];
    /**
     * Items currently moved to overflow.
     */
    invisibleItems: OverflowItemEntry[];
    /**
     * Current visibility state by group id.
     */
    groupVisibility: Record<string, OverflowGroupState>;
}

/**
 * Visibility state for an overflow group.
 */
export declare type OverflowGroupState = 'visible' | 'hidden' | 'overflow';

/**
 * Tracked item in the overflow manager.
 */
export declare interface OverflowItemEntry {
    /**
     * HTML element that disappears when the item overflows.
     */
    element: HTMLElement;
    /**
     * Lower-priority items become invisible first when the container overflows.
     * @default 0
     */
    priority: number;
    /**
     * Stable item id used to track visibility and emit updates.
     */
    id: string;
    /**
     * Optional group id used to coordinate divider and grouped visibility states.
     */
    groupId?: string;
    /**
     * If true, the item will never overflow and will always be visible.
     * Pinned items are excluded from the overflow count.
     * @default false
     */
    pinned?: boolean;
}

/**
 * Internal manager contract used to observe and compute priority overflow.
 *
 * @internal
 */
export declare interface OverflowManager {
    /**
     * Starts observing the container and managing the overflow state
     */
    observe: (container: HTMLElement, options?: ObserveOptions) => void;
    /**
     * Stops observing the container
     */
    disconnect: () => void;
    /**
     * Updates engine options without restarting observation.
     */
    setOptions: (options: Partial<OverflowOptions>) => void;
    /**
     * Add overflow items
     */
    addItem: (items: OverflowItemEntry) => void;
    /**
     * Remove overflow item
     */
    removeItem: (itemId: string) => void;
    /**
     * Manually update the overflow, updates are batched and async
     */
    update: () => void;
    /**
     * Manually update the overflow sync
     */
    forceUpdate: () => void;
    /**
     * Adds an element that opens an overflow menu. This is used to calculate
     * available space and check if additional items need to overflow
     */
    addOverflowMenu: (element: HTMLElement) => void;
    /**
     * Add overflow divider
     */
    addDivider: (divider: OverflowDividerEntry) => void;
    /**
     * Remove overflow divider
     */
    removeDivider: (groupId: string) => void;
    /**
     * Unsets the overflow menu element
     */
    removeOverflowMenu: () => void;
    /**
     * Returns the current overflow snapshot.
     */
    getSnapshot: () => OverflowSnapshot;
    /**
     * Subscribes to snapshot changes.
     */
    subscribe: (listener: () => void) => () => void;
}

/**
 * Options used to initialize or reconfigure overflow observation.
 */
export declare interface OverflowOptions {
    /**
     * Padding in pixels reserved at the end of the container before overflow occurs.
     * Useful for accounting for extra elements (for example an overflow menu button)
     * or margins between items that are difficult to measure in JavaScript.
     * @default 10
     */
    padding?: number;
    /**
     * Direction where items are removed when overflow occurs.
     * @default end
     */
    overflowDirection?: OverflowDirection;
    /**
     * Overflow axis used for size measurement.
     * @default horizontal
     */
    overflowAxis?: OverflowAxis;
    /**
     * Minimum number of items that must remain visible.
     */
    minimumVisible?: number;
    /**
     * Callback invoked when an individual item's visibility changes.
     */
    onUpdateItemVisibility: OnUpdateItemVisibility;
    /**
     * Callback invoked after overflow state is recomputed.
     */
    onUpdateOverflow: OnUpdateOverflow;
    /**
     * When true, reserve space as if the overflow menu were visible even with no overflowing items.
     * @default false
     */
    hasHiddenItems?: boolean;
}

/**
 * Indexed, immutable overflow state returned by `OverflowManager.getSnapshot`.
 *
 * Unlike {@link OverflowEventPayload}, this is shaped for O(1) consumer lookups (item/group
 * visibility by id, item count) rather than ordered item entries.
 */
export declare interface OverflowSnapshot {
    /**
     * Visibility of each registered item, keyed by item id.
     */
    itemVisibility: Record<string, boolean>;
    /**
     * Current visibility state by group id.
     */
    groupVisibility: Record<string, OverflowGroupState>;
    /**
     * Number of items currently moved to overflow (invisible).
     */
    invisibleItemCount: number;
}

export { }
