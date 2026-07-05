'use client';
import { makeStyles, mergeClasses } from '@griffel/react';
import { getTriggerChild } from '@fluentui/react-utilities';
import { DATA_OVERFLOWING, DATA_OVERFLOW_MENU } from '../../constants';
export const useOverflowStyles = makeStyles({
    overflowMenu: {
        [`& [${DATA_OVERFLOW_MENU}]`]: {
            flexShrink: 0
        }
    },
    overflowingItems: {
        [`& [${DATA_OVERFLOWING}]`]: {
            display: 'none'
        }
    }
});
export const useOverflowStyles_unstable = (state)=>{
    const styles = useOverflowStyles();
    const child = getTriggerChild(state.children);
    // eslint-disable-next-line react-hooks/immutability
    state.className = mergeClasses('fui-Overflow', styles.overflowMenu, styles.overflowingItems, child === null || child === void 0 ? void 0 : child.props.className);
    return state;
};
