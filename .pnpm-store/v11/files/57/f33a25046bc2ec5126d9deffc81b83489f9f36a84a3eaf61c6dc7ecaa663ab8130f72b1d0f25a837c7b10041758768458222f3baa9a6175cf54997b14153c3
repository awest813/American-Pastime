'use client';
import * as React from 'react';
export const useMenuSplitGroupContextValues = (state)=>{
    'use no memo'; // justified: compiler would optimize useMenuSplitGroupContextValues — manual opt-out to preserve runtime behavior
    return React.useMemo(()=>{
        return {
            menuSplitGroup: {
                setMultiline: state.setMultiline
            }
        };
    }, [
        state.setMultiline
    ]);
};
