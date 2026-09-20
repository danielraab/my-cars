import React from "react";

interface SimpleFormTextareaProps {
  label: string;
  controlProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  className?: string;
  prepend?: string;
  validation?: {
    isValid?: boolean;
    isInvalid?: boolean;
    positiveFeedback?: string;
    negativeFeedback?: string;
  };
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, SimpleFormTextareaProps>((props, ref) => {
  const id = props.controlProps.id || props.label;

  let className = props.className ? props.className : "";
  if (props.validation?.isValid || props.validation?.isInvalid) className += " has-validation";

  let textareaClassName = "form-control";
  if (props.validation?.isValid) textareaClassName += " is-valid";
  if (props.validation?.isInvalid) textareaClassName += " is-invalid";

  const controlProps = props.controlProps;
  if (!controlProps.placeholder) controlProps.placeholder = props.label;

  return (
    <div className="input-group">
      {props.prepend && <span className="input-group-text">{props.prepend}</span>}
      <div className={`form-floating ${className}`}>
        <textarea id={id} ref={ref} className={textareaClassName} {...controlProps} />
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
FormTextarea.displayName = "FormTextarea";

export default FormTextarea;
