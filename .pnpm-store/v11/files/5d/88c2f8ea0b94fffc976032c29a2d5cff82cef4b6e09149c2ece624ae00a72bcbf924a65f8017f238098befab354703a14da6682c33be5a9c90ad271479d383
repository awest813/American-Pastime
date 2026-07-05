'use client';
import * as React from 'react';
import { useId, useIsomorphicLayoutEffect } from '@fluentui/react-utilities';
import { useOverflowContext } from './overflowContext';
import { useOverflowCount } from './useOverflowCount';
export function useOverflowMenu(id) {
    const elementId = useId('overflow-menu', id);
    const overflowCount = useOverflowCount();
    const { registerOverflowMenu, forceUpdateOverflow } = useOverflowContext();
    const ref = React.useRef(null);
    const isOverflowing = overflowCount > 0;
    useIsomorphicLayoutEffect(()=>{
        if (ref.current) {
            const unregister = registerOverflowMenu(ref.current);
            if (isOverflowing) {
                forceUpdateOverflow();
            }
            return ()=>{
                unregister();
                forceUpdateOverflow();
            };
        }
    }, [
        registerOverflowMenu,
        forceUpdateOverflow,
        isOverflowing,
        elementId
    ]);
    return {
        ref,
        overflowCount,
        isOverflowing
    };
}
