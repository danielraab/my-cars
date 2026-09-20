import React from "react";

interface SimpleFormInputProps {
  label: string;
  controlProps: React.InputHTMLAttributes<HTMLInputElement>;
  datalist?: string[];
  className?: string;
  prepend?: string;
  validation?: {
    isValid?: boolean;
    isInvalid?: boolean;
    positiveFeedback?: string;
    negativeFeedback?: string;
  };
}

const FormInput = React.forwardRef<HTMLInputElement, SimpleFormInputProps>((props, ref) => {
  const id = props.controlProps.id || props.label;

  let className = props.className ? props.className : "";
  let hasValidation = "";
  if (props.validation?.isValid || props.validation?.isInvalid) hasValidation = "has-validation";

  let inputClassName = "form-control";
  if (props.validation?.isValid) inputClassName += " is-valid";
  if (props.validation?.isInvalid) inputClassName += " is-invalid";

  const controlProps = props.controlProps;
  if (!controlProps.placeholder) controlProps.placeholder = props.label;

  return (
    <div className={`input-group ${className}`}>
      {props.prepend && <span className="input-group-text">{props.prepend}</span>}
      <div className={`form-floating ${hasValidation}`}>
        {!props.datalist && <input id={id} ref={ref} className={inputClassName} {...controlProps} />}
        {props.datalist && (
          <>
            <input id={id} ref={ref} className={inputClassName} {...controlProps} list={`list_${props.label}`} />
            <datalist id={`list_${props.label}`}>
              {props.datalist.map((s) => {
                return <option key={s} value={s}></option>;
              })}
            </datalist>
          </>
        )}
        <label htmlFor={id}>{props.label}</label>
        {props.validation?.positiveFeedback && props.validation.isValid && (
          <div className="valid-feedback">{props.validation.positiveFeedback}</div>
        )}
        {props.validation?.negativeFeedback && props.validation.isInvalid && (
          <div className="invalid-feedback">{props.validation.negativeFeedback}</div>
        )}
      </div>
    </div>
  );
});
FormInput.displayName = "FormInput";

export default FormInput;
