import { useEffect } from "react";
import useDateInput from "../../../hooks/form/use-date-input";
import Button from "../form/Button";
import FormInput from "../form/Input";
import Stack from "../helper/Stack";

interface FromToFilterProps {
  initial?: { from?: Date; to?: Date };
  onChanged: (from?: Date, to?: Date) => void;
}

export default function FromToFilter(props: FromToFilterProps) {
  const fromState = useDateInput(props.initial?.from);
  const toState = useDateInput(props.initial?.to);

  useEffect(() => {
    if (fromState.value && toState.value && fromState.value > toState.value) toState.setValue(fromState.value);
    props.onChanged(fromState.value, toState.value);
  }, [fromState.value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (fromState.value && toState.value && fromState.value > toState.value) fromState.setValue(toState.value);
    props.onChanged(fromState.value, toState.value);
  }, [toState.value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Stack horizontal>
      <FormInput label="From" controlProps={fromState.htmlElement} />
      <FormInput label="To" controlProps={toState.htmlElement} />
      <Button
        className="ms-2 align-middle"
        onClick={() => {
          fromState.setValue(undefined);
          toState.setValue(undefined);
        }}
        btnClass="secondary"
      >
        clear
      </Button>
    </Stack>
  );
}
