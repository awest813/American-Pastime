import * as React from 'react';
import { applyTriggerPropsToChildren, getTriggerChild } from '@fluentui/react-utilities';
import { OverflowContext } from '../../overflowContext';
/**
 * Render the final JSX of Overflow.
 *
 * Griffel-free so it can be reused by headless consumers; all class merging happens in
 * `useOverflowStyles_unstable`.
 */ export const renderOverflow_unstable = (state, contextValues)=>{
    const child = getTriggerChild(state.children);
    var _state_className;
    const clonedChild = applyTriggerPropsToChildren(state.children, {
        ref: state.ref,
        className: (_state_className = state.className) !== null && _state_className !== void 0 ? _state_className : child === null || child === void 0 ? void 0 : child.props.className
    });
    return /*#__PURE__*/ React.createElement(OverflowContext.Provider, {
        value: contextValues.overflow
    }, clonedChild);
};
