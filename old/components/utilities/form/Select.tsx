import React, { OptionHTMLAttributes } from "react";

type SimpleFormSelectProps = {
  label: string;
  className?: string;
  optionList: OptionHTMLAttributes<HTMLOptionElement>[];
  id?: string;
  validation?: {
    isValid?: boolean;
    isInvalid?: boolean;
    positiveFeedback?: string;
    negativeFeedback?: string;
  };
  selectProps: React.SelectHTMLAttributes<HTMLSelectElement>;
};

const SimpleFormSelect = React.forwardRef<HTMLSelectElement, SimpleFormSelectProps>((props, ref) => {
  const id = props.id || props.label;

  let className = props.className ? props.className : "";
  if (props.validation?.isValid || props.validation?.isInvalid) className += " has-validation";

  let selectClassName = "form-select";
  if (props.validation?.isValid) selectClassName += " is-valid";
  if (props.validation?.isInvalid) selectClassName += " is-invalid";

  return (
    <div className={`form-floating ${className}`}>
      <select className={selectClassName} id={id} aria-label={props.label} ref={ref} {...props.selectProps}>
        <option hidden disabled value="-1">
          -- select an option --
        </option>
        {props.optionList.map((option) => (
          <option key={option.value?.toString()} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <label htmlFor={id}>{props.label}</label>
      {props.validation?.positiveFeedback && props.validation.isValid && (
        <div className="valid-feedback">{props.validation.positiveFeedback}</div>
      )}
      {props.validation?.negativeFeedback && props.validation.isInvalid && (
        <div className="invalid-feedback">{props.validation.negativeFeedback}</div>
      )}
    </div>
  );
});
SimpleFormSelect.displayName = "SimpleFromSelect";

export default SimpleFormSelect;
