'use client';
import { useOverflowSnapshot } from './useOverflowSnapshot';
/**
 * @param id - unique identifier for a group of overflow items
 * @returns visibility state of the group
 */ export function useIsOverflowGroupVisible(id) {
    return useOverflowSnapshot((snapshot)=>snapshot.groupVisibility[id]);
}
