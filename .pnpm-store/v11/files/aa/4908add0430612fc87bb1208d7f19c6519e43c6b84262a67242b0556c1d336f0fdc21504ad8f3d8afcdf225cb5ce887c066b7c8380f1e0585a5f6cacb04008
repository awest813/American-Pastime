"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createOverflowManager", {
    enumerable: true,
    get: function() {
        return createOverflowManager;
    }
});
const _consts = require("./consts");
const _createResizeObserver = require("./createResizeObserver");
const _debounce = require("./debounce");
const _priorityQueue = require("./priorityQueue");
const DEFAULT_OPTIONS = {
    overflowAxis: 'horizontal',
    overflowDirection: 'end',
    padding: 10,
    minimumVisible: 0,
    hasHiddenItems: false,
    onUpdateItemVisibility: ()=>{
    /* noop */ },
    onUpdateOverflow: ()=>{
    /* noop */ }
};
function createOverflowManager(initialOptions = {}) {
    // calls to `offsetWidth or offsetHeight` can happen multiple times in an update
    // Use a cache to avoid causing too many recalcs and avoid scripting time to meausure sizes
    const sizeCache = new Map();
    let container;
    let overflowMenu;
    // Set as true when resize observer is observing
    let observing = false;
    // If true, next update will dispatch to onUpdateOverflow even if queue top states don't change
    // Initially true to force dispatch on first mount
    let forceDispatch = true;
    const options = {
        ...DEFAULT_OPTIONS,
        ...initialOptions
    };
    const overflowItems = {};
    const overflowDividers = {};
    const listeners = new Set();
    let disposeResizeObserver = ()=>{
    /* noop */ };
    let snapshot = _consts.EMPTY_SNAPSHOT;
    const takeSnapshot = (nextSnapshot)=>{
        snapshot = nextSnapshot;
        listeners.forEach((listener)=>listener());
    };
    const getNextItem = (queueToDequeue, queueToEnqueue)=>{
        const nextItem = queueToDequeue.dequeue();
        queueToEnqueue.enqueue(nextItem);
        return overflowItems[nextItem];
    };
    const groupManager = createGroupManager();
    function compareItems(lt, rt) {
        if (!lt || !rt) {
            return 0;
        }
        const lte = overflowItems[lt];
        const rte = overflowItems[rt];
        // TODO this should not happen but there have been reports of one of these items being undefined
        // Try to find a consistent repro for this
        if (!lte || !rte) {
            return lte ? 1 : -1;
        }
        // Pinned items have "infinite" priority - they should never be hidden
        if (lte.pinned !== rte.pinned) {
            return lte.pinned ? 1 : -1;
        }
        if (lte.priority !== rte.priority) {
            return lte.priority > rte.priority ? 1 : -1;
        }
        // Node.DOCUMENT_POSITION_FOLLOWING = 4, Node.DOCUMENT_POSITION_PRECEDING = 2
        const positionStatusBit = options.overflowDirection === 'end' ? 4 : 2;
        // eslint-disable-next-line no-bitwise
        return lte.element.compareDocumentPosition(rte.element) & positionStatusBit ? 1 : -1;
    }
    function getElementAxisSize(horizontal, vertical, el) {
        if (!sizeCache.has(el)) {
            sizeCache.set(el, options.overflowAxis === 'horizontal' ? el[horizontal] : el[vertical]);
        }
        return sizeCache.get(el);
    }
    const getOffsetSize = getElementAxisSize.bind(null, 'offsetWidth', 'offsetHeight');
    const getClientSize = getElementAxisSize.bind(null, 'clientWidth', 'clientHeight');
    const invisibleItemQueue = (0, _priorityQueue.createPriorityQueue)((a, b)=>-1 * compareItems(a, b));
    const visibleItemQueue = (0, _priorityQueue.createPriorityQueue)(compareItems);
    function occupiedSize() {
        let totalItemSize = 0;
        for (const id of visibleItemQueue){
            totalItemSize += getOffsetSize(overflowItems[id].element);
        }
        const totalDividerSize = Object.entries(groupManager.groupVisibility()).reduce((acc, [id, state])=>acc + (state !== 'hidden' && overflowDividers[id] ? getOffsetSize(overflowDividers[id].element) : 0), 0);
        const overflowMenuSize = (invisibleItemQueue.size() > 0 || options.hasHiddenItems) && overflowMenu ? getOffsetSize(overflowMenu) : 0;
        return totalItemSize + totalDividerSize + overflowMenuSize;
    }
    const showItem = ()=>{
        const item = getNextItem(invisibleItemQueue, visibleItemQueue);
        options.onUpdateItemVisibility({
            item,
            visible: true
        });
        if (item.groupId) {
            groupManager.showItem(item.id, item.groupId);
            if (groupManager.isSingleItemVisible(item.id, item.groupId)) {
                var _overflowDividers_item_groupId;
                (_overflowDividers_item_groupId = overflowDividers[item.groupId]) === null || _overflowDividers_item_groupId === void 0 ? void 0 : _overflowDividers_item_groupId.element.removeAttribute(_consts.DATA_OVERFLOWING);
            }
        }
    };
    const hideItem = ()=>{
        const item = getNextItem(visibleItemQueue, invisibleItemQueue);
        options.onUpdateItemVisibility({
            item,
            visible: false
        });
        if (item.groupId) {
            if (groupManager.isSingleItemVisible(item.id, item.groupId)) {
                var _overflowDividers_item_groupId;
                (_overflowDividers_item_groupId = overflowDividers[item.groupId]) === null || _overflowDividers_item_groupId === void 0 ? void 0 : _overflowDividers_item_groupId.element.setAttribute(_consts.DATA_OVERFLOWING, '');
            }
            groupManager.hideItem(item.id, item.groupId);
        }
    };
    const dispatchOverflowUpdate = ()=>{
        const groupVisibility = groupManager.groupVisibility();
        // Build the legacy ordered-entry arrays and the snapshot's id -> visible map in a single pass
        // over each queue.
        const itemVisibility = {};
        const visibleItems = [];
        const invisibleItems = [];
        for (const itemId of visibleItemQueue){
            itemVisibility[itemId] = true;
            visibleItems.push(overflowItems[itemId]);
        }
        for (const itemId of invisibleItemQueue){
            itemVisibility[itemId] = false;
            invisibleItems.push(overflowItems[itemId]);
        }
        // Set the snapshot first so `getSnapshot()` is current for both subscribers and any
        // `onUpdateOverflow` consumer that reads it.
        takeSnapshot({
            itemVisibility,
            groupVisibility,
            invisibleItemCount: invisibleItems.length
        });
        // Legacy event payload: ordered item entries for `onUpdateOverflow` consumers.
        options.onUpdateOverflow({
            visibleItems,
            invisibleItems,
            groupVisibility
        });
    };
    const getSnapshot = ()=>snapshot;
    const processOverflowItems = ()=>{
        if (!container) {
            return false;
        }
        sizeCache.clear();
        const availableSize = getClientSize(container) - options.padding;
        // Snapshot of the visible/invisible state to compare for updates
        const visibleTop = visibleItemQueue.peek();
        const invisibleTop = invisibleItemQueue.peek();
        while(compareItems(invisibleItemQueue.peek(), visibleItemQueue.peek()) > 0){
            hideItem(); // hide elements whose priority become smaller than the highest priority of the hidden one
        }
        // Run the show/hide step twice - the first step might not be correct if
        // it was triggered by a new item being added - new items are always visible by default.
        for(let i = 0; i < 2; i++){
            // Add items until available width is filled - can result in overflow
            while(occupiedSize() < availableSize && invisibleItemQueue.size() > 0 || invisibleItemQueue.size() === 1 // attempt to show the last invisible item hoping it's size does not exceed overflow menu size
            ){
                showItem();
            }
            // Remove items until there's no more overflow
            while(occupiedSize() > availableSize && visibleItemQueue.size() > options.minimumVisible){
                var _overflowItems_nextItemId;
                const nextItemId = visibleItemQueue.peek();
                // Never hide pinned items - they should always remain visible
                if (nextItemId && ((_overflowItems_nextItemId = overflowItems[nextItemId]) === null || _overflowItems_nextItemId === void 0 ? void 0 : _overflowItems_nextItemId.pinned)) {
                    break;
                }
                hideItem();
            }
        }
        // only update when the state of visible/invisible items has changed
        return visibleItemQueue.peek() !== visibleTop || invisibleItemQueue.peek() !== invisibleTop;
    };
    const forceUpdate = ()=>{
        if (processOverflowItems() || forceDispatch) {
            forceDispatch = false;
            dispatchOverflowUpdate();
        }
    };
    const update = (0, _debounce.debounce)(forceUpdate);
    const setOptions = (nextOptions)=>{
        if (options === nextOptions) {
            return;
        }
        const shouldTriggerUpdate = nextOptions.overflowAxis && options.overflowAxis !== nextOptions.overflowAxis || nextOptions.overflowDirection && options.overflowDirection !== nextOptions.overflowDirection || nextOptions.padding && options.padding !== nextOptions.padding || nextOptions.minimumVisible && options.minimumVisible !== nextOptions.minimumVisible || nextOptions.hasHiddenItems && options.hasHiddenItems !== nextOptions.hasHiddenItems;
        Object.assign(options, nextOptions);
        if (shouldTriggerUpdate) {
            forceDispatch = true;
            update();
        }
    };
    const observe = (observedContainer, observeOptions)=>{
        const { forceUpdate: shouldForceUpdate, ...userOptions } = observeOptions !== null && observeOptions !== void 0 ? observeOptions : {};
        Object.assign(options, userOptions);
        Object.values(overflowItems).forEach((item)=>{
            if (!visibleItemQueue.contains(item.id) && !invisibleItemQueue.contains(item.id)) {
                visibleItemQueue.enqueue(item.id);
            }
        });
        container = observedContainer;
        observing = true;
        disposeResizeObserver = (0, _createResizeObserver.observeResize)(container, (entries)=>{
            if (!entries[0] || !container) {
                return;
            }
            update();
        });
        if (shouldForceUpdate && getClientSize(observedContainer) > 0) {
            forceUpdate();
        }
    };
    const disconnect = ()=>{
        disposeResizeObserver();
        disposeResizeObserver = ()=>{
        /* noop */ };
        // reset flags
        container = undefined;
        observing = false;
        forceDispatch = true;
        // clear all entries
        Object.keys(overflowItems).forEach((itemId)=>removeItem(itemId));
        Object.keys(overflowDividers).forEach((dividerId)=>removeDivider(dividerId));
        removeOverflowMenu();
        sizeCache.clear();
        // notify subscribers that the manager is no longer tracking anything
        takeSnapshot(_consts.EMPTY_SNAPSHOT);
    };
    const addItem = (items)=>{
        if (overflowItems[items.id]) {
            return;
        }
        overflowItems[items.id] = items;
        // some options can affect priority which are only set on `observe`
        if (observing) {
            // Updates to elements might not change the queue tops
            // i.e. new element is enqueued but the top of the queue stays the same
            // force a dispatch on the next batched update
            forceDispatch = true;
            visibleItemQueue.enqueue(items.id);
            update();
        }
        if (items.groupId) {
            groupManager.addItem(items.id, items.groupId);
            items.element.setAttribute(_consts.DATA_OVERFLOW_GROUP, items.groupId);
        }
    };
    const addOverflowMenu = (el)=>{
        overflowMenu = el;
        if (observing) {
            forceDispatch = true;
            update();
        }
    };
    const addDivider = (divider)=>{
        if (!divider.groupId || overflowDividers[divider.groupId]) {
            return;
        }
        divider.element.setAttribute(_consts.DATA_OVERFLOW_GROUP, divider.groupId);
        overflowDividers[divider.groupId] = divider;
    };
    const removeOverflowMenu = ()=>{
        overflowMenu = undefined;
        if (observing) {
            forceDispatch = true;
            update();
        }
    };
    const removeDivider = (groupId)=>{
        if (!overflowDividers[groupId]) {
            return;
        }
        const divider = overflowDividers[groupId];
        if (divider.groupId) {
            delete overflowDividers[groupId];
            divider.element.removeAttribute(_consts.DATA_OVERFLOW_GROUP);
        }
    };
    const removeItem = (itemId)=>{
        if (!overflowItems[itemId]) {
            return;
        }
        if (observing) {
            // We might be removing an item in an overflow which would not affect the tops,
            // but we need to update anyway to update the overflow menu state
            forceDispatch = true;
        }
        const item = overflowItems[itemId];
        visibleItemQueue.remove(itemId);
        invisibleItemQueue.remove(itemId);
        if (item.groupId) {
            groupManager.removeItem(item.id, item.groupId);
            item.element.removeAttribute(_consts.DATA_OVERFLOW_GROUP);
        }
        sizeCache.delete(item.element);
        delete overflowItems[itemId];
        if (observing) {
            update();
        }
    };
    const subscribe = (listener)=>{
        listeners.add(listener);
        return ()=>{
            listeners.delete(listener);
        };
    };
    return {
        addItem,
        disconnect,
        forceUpdate,
        observe,
        removeItem,
        update,
        addOverflowMenu,
        removeOverflowMenu,
        addDivider,
        removeDivider,
        setOptions,
        getSnapshot,
        subscribe
    };
}
const createGroupManager = ()=>{
    const groupVisibility = {};
    const groups = {};
    function updateGroupVisibility(groupId) {
        const group = groups[groupId];
        if (group.invisibleItemIds.size && group.visibleItemIds.size) {
            groupVisibility[groupId] = 'overflow';
        } else if (group.visibleItemIds.size === 0) {
            groupVisibility[groupId] = 'hidden';
        } else {
            groupVisibility[groupId] = 'visible';
        }
    }
    function isGroupVisible(groupId) {
        return groupVisibility[groupId] === 'visible' || groupVisibility[groupId] === 'overflow';
    }
    return {
        groupVisibility: ()=>groupVisibility,
        isSingleItemVisible (itemId, groupId) {
            return isGroupVisible(groupId) && groups[groupId].visibleItemIds.has(itemId) && groups[groupId].visibleItemIds.size === 1;
        },
        addItem (itemId, groupId) {
            var _groups, _groupId;
            var _;
            (_ = (_groups = groups)[_groupId = groupId]) !== null && _ !== void 0 ? _ : _groups[_groupId] = {
                visibleItemIds: new Set(),
                invisibleItemIds: new Set()
            };
            groups[groupId].visibleItemIds.add(itemId);
            updateGroupVisibility(groupId);
        },
        removeItem (itemId, groupId) {
            groups[groupId].invisibleItemIds.delete(itemId);
            groups[groupId].visibleItemIds.delete(itemId);
            updateGroupVisibility(groupId);
        },
        showItem (itemId, groupId) {
            groups[groupId].invisibleItemIds.delete(itemId);
            groups[groupId].visibleItemIds.add(itemId);
            updateGroupVisibility(groupId);
        },
        hideItem (itemId, groupId) {
            groups[groupId].invisibleItemIds.add(itemId);
            groups[groupId].visibleItemIds.delete(itemId);
            updateGroupVisibility(groupId);
        }
    };
};
