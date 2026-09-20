import React from "react";
import { OutlineVariants, Variants } from "../../../lib/frontend/bootstrap.t";

type ButtonProps = {
  btnClass?: Variants | OutlineVariants | "link";
  type?: "button" | "submit"
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children?: any;
  disabled?: boolean;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    let className = `btn btn-${props.btnClass ? props.btnClass : "primary"}`;
    if(props.className) className += ` ${props.className}`

    const type = props.type ? props.type : "button"

    return <button ref={ref} type={type} className={className} onClick={props.onClick} disabled={props.disabled}>{props.children}</button>
  }
);

Button.displayName = "Button"

export default Button;
