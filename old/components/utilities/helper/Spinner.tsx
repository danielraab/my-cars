import React from 'react'
import { Variants } from '../../../lib/frontend/bootstrap.t';

type SpinnerProps = {
  type?: "border" | "grow";
  small?:boolean;
  variant?: Variants;
  className?: string;
  useSpan?: boolean;
};

function Spinner(props: SpinnerProps) {
  const spinnerClass = `spinner-${props.type || "border"}`

  const elementProps = {
    className: `${spinnerClass} ${props.small ? spinnerClass+"-sm" : ""} ${props.className}`,
    role: "status"
  };

  if (props.useSpan) return <span {...elementProps}></span>;
  else return <div {...elementProps}></div>;
}

export default Spinner;
