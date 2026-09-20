import React from "react";
import { Variants } from "../../../lib/frontend/bootstrap.t";

type CardProps = {
    className?: string;
    variant: Variants;
  children?: any;
  dismissible?: boolean;
};

const Alert = (props: CardProps) => {
  return (
    <div className={`alert alert-${props.variant} ${props.className || ""} ${props.dismissible && "alert-dismissible"} fade show`} role="alert">
      { props.dismissible && <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button> }
      {props.children}
  </div>
  );
};

export default Alert;
