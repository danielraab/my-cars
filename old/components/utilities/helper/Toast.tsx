import moment from "moment";
import React, { useCallback, useEffect, useRef } from "react";
import { ToastData } from "../../../lib/frontend/toastData";

type ToastProps = {
  toastData: ToastData;
  onClose?: () => void;
};

function Toast(props: ToastProps) {
  const toastRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback(() => {
    const { Toast: BSToast } = require("bootstrap");
    
    const toastEl = toastRef.current as HTMLDivElement;
    const bsToast = new BSToast(toastEl, {
      autohide: props.toastData.autohide,
      delay: props.toastData.closingDelayMs
    });
    bsToast.show();
  }, [props.toastData.autohide, props.toastData.closingDelayMs]);

  const hideToast = useCallback(() => {
    const { Toast: BSToast } = require("bootstrap");

    const toastEl = toastRef.current as HTMLDivElement;
    const bsToast = BSToast.getInstance(toastEl);
    bsToast && bsToast.hide();
  }, []);

  useEffect(() => {
    if (props.toastData.show) showToast();
    else hideToast();
  }, [showToast, props.toastData.show, hideToast]);

  const variantClass = `text-bg-${props.toastData.variant ? props.toastData.variant.toLowerCase() : "white"}`;

  return (
    <div ref={toastRef} className={`toast fade ${variantClass}`}>
      <div className={`toast-header`}>
        <strong className="me-auto">{props.toastData.title}</strong>
        <small>{moment(props.toastData.date).fromNow()}</small>
        <button
          type="button"
          className="btn-close"
          data-bs-dismiss="toast"
          aria-label="Close"
          onClick={props.onClose}
        ></button>
      </div>
      <div className="toast-body">{props.toastData.message}</div>
    </div>
  );
}

export default Toast;
