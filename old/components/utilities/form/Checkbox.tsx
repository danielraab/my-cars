import React from "react";

type SimpleFormCheckboxProps = {
  label: string;
  checked?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
  id?: string;
};

const SimpleFormCheckbox = React.forwardRef<
  HTMLInputElement,
  SimpleFormCheckboxProps
>((props, ref) => {
  const id = props.id || props.label;

  const className = props.className ? props.className : "";

  return (
    <div className={`form-check ${className}`}>
      <input
        ref={ref}
        className="form-check-input"
        type="checkbox"
        value=""
        id={id}
        checked={props.checked}
        onChange={props.onChange}
      />
      <label className="form-check-label" htmlFor={id}>
        {props.label}
      </label>
    </div>
  );
});

SimpleFormCheckbox.displayName = "SimpleFormCheckbox"

export default SimpleFormCheckbox;
