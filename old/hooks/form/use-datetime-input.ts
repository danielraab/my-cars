import { toDatetimeLocal } from "../../lib/general";
import useValidatedInput from "./use-validated-input";

const useDatetimeInput = (
  initialValue: Date,
  validation?: { validation: (value: Date) => boolean; positiveFeedback?: string; negativeFeedback?: string }
) => {
  const data = useValidatedInput(initialValue, validation, toDatetimeLocal, (val) => new Date(val));
  data.htmlElement.type = "datetime-local";
  return data;
};

export default useDatetimeInput;
