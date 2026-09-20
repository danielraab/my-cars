import { ChangeEventHandler, InputHTMLAttributes, useState } from "react";
import { SimpleInputState } from "./use-simple-input";

export interface ValidatedInputState<U> extends SimpleInputState<U> {
  value: U;
  htmlElement: InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  validation: { isValid: boolean; isInvalid: boolean; positiveFeedback?: string; negativeFeedback?: string };
  isTouched: boolean;
  isValid: boolean;
  setIsTouched: (isTouched: boolean) => void;
  setValue: (value: U) => void;
  clear: () => void;
}

const useValidatedInput = <T>(
  initialValue: T,
  validation?: { validation: (value: T) => boolean; positiveFeedback?: string; negativeFeedback?: string },
  adapterToString?: (value: T) => string,
  adapterFromString?: (value: string) => T
): ValidatedInputState<T> => {
  const [stringValue, setValue] = useState<string>(
    adapterToString ? adapterToString(initialValue) : (initialValue as string)
  );
  const typedValue: T = adapterFromString ? adapterFromString(stringValue) : (stringValue as T);
  const [isTouched, setIsTouched] = useState(false);
  const isValid = validation ? validation.validation(typedValue) : true;
  const hasError = !isValid && isTouched && !!validation;
  const showIsValid = isValid && isTouched && !!validation;

  const onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (event) => {
    setValue(event.target.value);
  };

  const onBlur = () => {
    setValue(adapterToString ? adapterToString(typedValue) : (typedValue as string));
    setIsTouched(true);
  };

  const clear = () => {
    setValue(adapterToString ? adapterToString(initialValue) : (initialValue as string));
    setIsTouched(false);
  };

  return {
    value: typedValue,
    htmlElement: { value: stringValue, onChange, onBlur },
    validation: {
      isValid: showIsValid,
      isInvalid: hasError,
      positiveFeedback: validation?.positiveFeedback,
      negativeFeedback: validation?.negativeFeedback,
    },
    isTouched,
    isValid,
    setIsTouched,
    setValue: (value: T) => (adapterToString ? adapterToString(value) : (value as string)),
    clear,
  };
};

export default useValidatedInput;
