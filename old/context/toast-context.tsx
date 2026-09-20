import React, { useReducer } from "react";
import { ToastData } from "../lib/frontend/toastData";

type ContextStateType = ToastData[];
type ReducerActionType = { type: "ADD" | "HIDE"; toast: ToastData };
type ReducerFunctionType = (state: ContextStateType, action: ReducerActionType) => ContextStateType;

const toastReducer: ReducerFunctionType = (state, action) => {
    if (action.type === "ADD") {
        return state.concat(action.toast);
    }
    if (action.type === "HIDE") {
        const found = state.find((elem) => elem === action.toast);
        if (found) {
            found.show = false;
        }
        return [...state];
    }
    return state;
};

type ToastContextType = {
    toastList: ToastData[];
    addToast: (toast: ToastData) => void;
    removeToast: (toast: ToastData) => void;
};

const ToastContext = React.createContext<ToastContextType>({
    toastList: [],
    addToast: () => {},
    removeToast: () => {},
});

export const ToastContextProvider = (props: { children: any }) => {
    const [toastList, dispatchToastListUpdate] = useReducer<ReducerFunctionType>(toastReducer, []);

    const contextValue: ToastContextType = {
        toastList,
        addToast: (toast: ToastData) => dispatchToastListUpdate({ type: "ADD", toast }),
        removeToast: (toast: ToastData) => dispatchToastListUpdate({ type: "HIDE", toast }),
    };

    return <ToastContext.Provider value={contextValue}>{props.children}</ToastContext.Provider>;
};

export default ToastContext;
