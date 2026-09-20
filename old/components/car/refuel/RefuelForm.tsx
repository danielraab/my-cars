import React from "react";
import { SimpleInputState } from "../../../hooks/form/use-simple-input";
import { ValidatedInputState } from "../../../hooks/form/use-validated-input";
import { frontendCarListToSelectOptionList } from "../../../lib/frontend/car";
import { FrontendCar } from "../../../lib/types/car";
import { SubFuelType, subFuelTypeValues } from "../../../lib/types/refuel";
import FormInput from "../../utilities/form/Input";
import SimpleFormSelect from "../../utilities/form/Select";
import Stack from "../../utilities/helper/Stack";

const subFuelTypeList = subFuelTypeValues.map((type) => {
  return {
    value: type,
    label: type as SubFuelType,
    disabled: false,
  };
});

type RefuelFormProps = {
  carList: FrontendCar[];
  stationList: string[];
  carId: ValidatedInputState<number>;
  date: SimpleInputState<Date>;
  station: ValidatedInputState<string>;
  odometerReading: SimpleInputState<number>;
  fuel: SimpleInputState<string>;
  liter: ValidatedInputState<number>;
  amount: SimpleInputState<number>;
};

const RefuelForm = (props: RefuelFormProps) => {
  const pricePerLiter = Math.round((1000 * props.amount.value) / props.liter.value) / 1000;
  return (
    <form noValidate onSubmit={() => {}}>
      <SimpleFormSelect
        className="mb-3"
        label="Car"
        optionList={frontendCarListToSelectOptionList(props.carList)}
        selectProps={{
          ...props.carId.htmlElement,
          required: true,
        }}
        validation={props.carId.validation}
      />
      <FormInput
        className="mb-3"
        label="Date"
        controlProps={{
          ...props.date.htmlElement,
          type: "datetime-local",
        }}
      />
      <FormInput
        className="mb-3"
        label="Station"
        controlProps={{
          ...props.station.htmlElement,
        }}
        validation={props.station.validation}
        datalist={props.stationList}
      />
      <FormInput
        className="mb-3"
        label="Odometer"
        controlProps={{
          ...props.odometerReading.htmlElement,
          type: "number",
        }}
        prepend="km"
      />
      <SimpleFormSelect
        className="mb-3"
        label="Fuel"
        optionList={subFuelTypeList}
        selectProps={{
          ...props.fuel.htmlElement,
          required: true,
        }}
      />

      <FormInput
        className="mb-3"
        label="Liter"
        controlProps={{
          ...props.liter.htmlElement,
          type: "number",
        }}
        prepend="l"
        validation={props.liter.validation}
      />
      <Stack horizontal>
        <FormInput
          label="Amount"
          className=""
          controlProps={{
            ...props.amount.htmlElement,
            type: "number",
          }}
          prepend="€"
        />{" "}
        <FormInput
          label="Price per Liter"
          className="ms-3"
          controlProps={{
            value: pricePerLiter,
            type: "number",
            disabled: true,
          }}
          prepend="€/l"
        />
      </Stack>
    </form>
  );
};

export default RefuelForm;
