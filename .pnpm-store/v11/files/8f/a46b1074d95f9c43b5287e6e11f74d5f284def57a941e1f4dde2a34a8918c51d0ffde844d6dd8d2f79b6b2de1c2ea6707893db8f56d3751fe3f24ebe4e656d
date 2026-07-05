'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useOverflowVisibility", {
    enumerable: true,
    get: function() {
        return useOverflowVisibility;
    }
});
const _useOverflowSnapshot = require("./useOverflowSnapshot");
function useOverflowVisibility() {
    return (0, _useOverflowSnapshot.useOverflowSnapshot)(selectVisibility);
}
const selectVisibility = (snapshot)=>({
        itemVisibility: snapshot.itemVisibility,
        groupVisibility: snapshot.groupVisibility
    });
