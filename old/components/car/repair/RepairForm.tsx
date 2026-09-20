import React from "react";
import { SimpleInputState } from "../../../hooks/form/use-simple-input";
import { ValidatedInputState } from "../../../hooks/form/use-validated-input";
import { frontendCarListToSelectOptionList } from "../../../lib/frontend/car";
import { FrontendCar, RepairType, repairTypeValues } from "../../../lib/types/car";
import FormInput from "../../utilities/form/Input";
import SimpleFormSelect from "../../utilities/form/Select";
import FormTextarea from "../../utilities/form/Textarea";

const repairTypeList = repairTypeValues.map((type) => {
  return {
    value: type,
    label: type as RepairType,
    disabled: false,
  };
});

type RepairFormProps = {
  carList: FrontendCar[];
  stationList: string[];
  carId: ValidatedInputState<number>;
  date: SimpleInputState<Date>;
  station: ValidatedInputState<string>;
  odometerReading: SimpleInputState<number>;
  type: SimpleInputState<string>;
  amount: SimpleInputState<number>;
  description: SimpleInputState<string>;
};

const RepairForm = (props: RepairFormProps) => {
  return (
    <form noValidate onSubmit={() => {}}>
      <SimpleFormSelect
        label="Car"
        className="mb-3"
        optionList={frontendCarListToSelectOptionList(props.carList)}
        selectProps={{
          ...props.carId.htmlElement,
          required: true,
        }}
        validation={props.carId.validation}
      />
      <FormInput
        label="Date"
        className="mb-3"
        controlProps={{
          ...props.date.htmlElement,
          type: "datetime-local",
        }}
      />
      <FormInput
        label="Station"
        className="mb-3"
        controlProps={{
          ...props.station.htmlElement,
        }}
        validation={props.station.validation}
        datalist={props.stationList}
      />
      <FormInput
        label="Odometer"
        className="mb-3"
        controlProps={{
          ...props.odometerReading.htmlElement,
          type: "number",
        }}
        prepend="km"
      />
      <SimpleFormSelect
        label="Type"
        className="mb-3"
        optionList={repairTypeList}
        selectProps={{
          ...props.type.htmlElement,
          required: true,
        }}
      />

      <FormInput
        label="Amount"
        className="mb-3"
        controlProps={{
          ...props.amount.htmlElement,
          type: "number",
        }}
        prepend="€"
      />
      <FormTextarea
        label="Description"
        controlProps={{
          ...props.description.htmlElement,
        }}
      />
    </form>
  );
};

export default RepairForm;
