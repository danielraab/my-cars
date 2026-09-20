import { ChangeEventHandler, InputHTMLAttributes, useState } from "react";

export interface SimpleInputState<U> {
  value: U;
  htmlElement: InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  setValue: (valud: U) => void;
  clear: () => void;
}

const useSimpleInput = (initialValue: string): SimpleInputState<string> => {
  const [value, setValue] = useState(initialValue);

  const onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (event) => {
    setValue(event.target.value);
  };

  const clear = () => {
    setValue(initialValue);
  };

  return {
    value,
    htmlElement: { value, onChange },
    setValue,
    clear,
  };
};

export default useSimpleInput;
