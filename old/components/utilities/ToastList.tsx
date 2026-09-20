import React, { useContext, useEffect, useState } from "react";
import ToastContext from "../../context/toast-context";
import Toast from "./helper/Toast";

const TOAST_FORCED_RERENDER_CYCLE_MS = 60000;

const TOAST_CONTAINER_ID = "toastContainer";

type ToastPortalProps = {
  position?: {
    horizontal: "left" | "center" | "right";
    vertical: "top" | "middle" | "bottom";
  };
};

const ToastList = (props: ToastPortalProps) => {
  const toastContainerObject = useContext(ToastContext);
  const [, setDummy] = useState({});  //for updating the displayed duration in the toast elements

  let horizontalClassName = "end-0";
  if (props.position?.horizontal) {
    if (props.position.horizontal === "left") horizontalClassName = "start-0";
    else if (props.position.horizontal === "center")
      horizontalClassName = "start-50 translate-middle-x";
    else if (props.position.horizontal === "right")
      horizontalClassName = "end-0";
  }

  let verticalClassName = "top-0";
  if (props.position?.vertical) {
    if (props.position.vertical === "top") verticalClassName = "top-0";
    else if (props.position.vertical === "middle")
      verticalClassName = "top-50 translate-middle-y";
    else if (props.position.vertical === "bottom")
      verticalClassName = "bottom-0";
  }

  useEffect(() => {
    // force rerendering after specified period of time, to update the time in the toast
    const interval = setInterval(
      () => setDummy({}),
      TOAST_FORCED_RERENDER_CYCLE_MS
    );
    return () => clearInterval(interval);
  });

  return (
    <>
        <div
          className={`toast-container position-fixed ${verticalClassName} ${horizontalClassName} p-3 mt-5`}
        >
          {toastContainerObject.toastList.map((toast) => {
            return (
              <Toast
                toastData={toast}
                key={toast.date.getTime()}
                onClose={() => {
                  toastContainerObject.removeToast(toast);
                }}
              />
            );
          })}
        </div>
    </>
  );
};

export default ToastList;
