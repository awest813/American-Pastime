'use client';

import { __styles, mergeClasses } from '@griffel/react';
import { getTriggerChild } from '@fluentui/react-utilities';
import { DATA_OVERFLOWING, DATA_OVERFLOW_MENU } from '../../constants';
export const useOverflowStyles = /*#__PURE__*/__styles({
  overflowMenu: {
    Brvla84: "fyfkpbf"
  },
  overflowingItems: {
    zb22lx: "f10570jf"
  }
}, {
  d: [".fyfkpbf [data-overflow-menu]{flex-shrink:0;}", ".f10570jf [data-overflowing]{display:none;}"]
});
export const useOverflowStyles_unstable = state => {
  const styles = useOverflowStyles();
  const child = getTriggerChild(state.children);
  // eslint-disable-next-line react-hooks/immutability
  state.className = mergeClasses('fui-Overflow', styles.overflowMenu, styles.overflowingItems, child === null || child === void 0 ? void 0 : child.props.className);
  return state;
};