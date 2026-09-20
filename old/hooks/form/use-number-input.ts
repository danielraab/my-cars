import useValidatedInput from "./use-validated-input";

const useNumberInput = (
  initialValue?: number,
  validation?: {
    validation: (value: number) => boolean;
    positiveFeedback?: string;
    negativeFeedback?: string;
  }
) => {
  let updatedValidation = validation
    ? validation
    : { validation: (value: number) => value > 0 };

  const data = useValidatedInput(
    initialValue === undefined ? -1 : initialValue,
    updatedValidation,
    (numb) => numb.toString(),
    (val) => Number(val)
  );
  data.htmlElement.type = "number";
  return data;
};

export default useNumberInput;
