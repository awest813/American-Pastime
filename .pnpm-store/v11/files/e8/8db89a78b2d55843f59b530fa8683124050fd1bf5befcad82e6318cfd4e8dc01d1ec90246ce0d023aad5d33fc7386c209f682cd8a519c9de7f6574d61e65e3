"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "renderOverflow_unstable", {
    enumerable: true,
    get: function() {
        return renderOverflow_unstable;
    }
});
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _react = /*#__PURE__*/ _interop_require_wildcard._(require("react"));
const _reactutilities = require("@fluentui/react-utilities");
const _overflowContext = require("../../overflowContext");
const renderOverflow_unstable = (state, contextValues)=>{
    const child = (0, _reactutilities.getTriggerChild)(state.children);
    var _state_className;
    const clonedChild = (0, _reactutilities.applyTriggerPropsToChildren)(state.children, {
        ref: state.ref,
        className: (_state_className = state.className) !== null && _state_className !== void 0 ? _state_className : child === null || child === void 0 ? void 0 : child.props.className
    });
    return /*#__PURE__*/ _react.createElement(_overflowContext.OverflowContext.Provider, {
        value: contextValues.overflow
    }, clonedChild);
};
