import { toDateLocal } from "../../lib/general";
import useValidatedInput from "./use-validated-input";

const useDateInput = (
  initialValue?: Date,
  validation?: {
    validation: (value: Date | undefined) => boolean;
    positiveFeedback?: string;
    negativeFeedback?: string;
  }
) => {
  const data = useValidatedInput(
    initialValue,
    validation,
    (value) => (value ? toDateLocal(value) : ""),
    (val) => (val ? new Date(val) : undefined)
  );
  data.htmlElement.type = "date";
  return data;
};

export default useDateInput;
