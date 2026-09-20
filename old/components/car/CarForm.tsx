import React from "react";
import { SimpleInputState } from "../../hooks/form/use-simple-input";
import { ValidatedInputState } from "../../hooks/form/use-validated-input";
import { CarMake, carMakeValues, CarType, carTypeValues, FuelType, fuelTypeValues } from "../../lib/types/car";
import SimpleFormInput from "../utilities/form/Input";
import SimpleFormSelect from "../utilities/form/Select";

const carTypeList = carTypeValues.map((type) => {
  return {
    value: type,
    label: type as CarType,
    disabled: false,
  };
});

const carMakeList = carMakeValues.map((make) => {
  return {
    value: make,
    label: make as CarMake,
    disabled: false,
  };
});

const fuelTypeList = fuelTypeValues.map((type) => {
  return {
    value: type,
    label: type as FuelType,
    disabled: false,
  };
});

type CarFormProps = {
  carType: SimpleInputState<string>;
  carMake: SimpleInputState<string>;
  carName: ValidatedInputState<string>;
  fuelType: SimpleInputState<string>;
  firstRegistration: SimpleInputState<Date | undefined>;
  licensePlate: SimpleInputState<string>;
  fin: SimpleInputState<string>;
  purchaseDate: SimpleInputState<Date | undefined>;
  purchasePrice: ValidatedInputState<number>;
};

const CarForm = (props: CarFormProps) => {
  return (
    <form noValidate onSubmit={() => {}}>
      <SimpleFormSelect
        className="mb-3"
        label="Car Type"
        optionList={carTypeList}
        selectProps={{
          ...props.carType.htmlElement,
          required: true,
        }}
      />
      <SimpleFormSelect
        className="mb-3"
        label="Car Make"
        optionList={carMakeList}
        selectProps={{
          ...props.carMake.htmlElement,
          required: true,
        }}
      />
      <SimpleFormInput
        className="mb-3"
        label="Name"
        controlProps={{
          ...props.carName.htmlElement,
          type: "text",
          required: true,
        }}
        validation={{
          ...props.carName.validation,
          negativeFeedback: "The car name is required.",
        }}
      />
      <SimpleFormSelect
        className="mb-3"
        label="Fuel"
        optionList={fuelTypeList}
        selectProps={{
          ...props.fuelType.htmlElement,
          required: true,
        }}
      />
      <SimpleFormInput
        className="mb-3"
        label="First Registration"
        controlProps={{
          ...props.firstRegistration.htmlElement,
          type: "date",
        }}
      />

      <SimpleFormInput
        className="mb-3"
        label="License Plate Number"
        controlProps={{
          ...props.licensePlate.htmlElement,
          type: "text",
        }}
      />
      <SimpleFormInput
        className="mb-3"
        label="FIN"
        controlProps={{
          ...props.fin.htmlElement,
          type: "text",
        }}
      />
      <SimpleFormInput
        className="mb-3"
        label="Purchase Date"
        controlProps={{
          ...props.purchaseDate.htmlElement,
          type: "date",
        }}
      />
      <SimpleFormInput
        label="Purchase Price"
        prepend="€"
        controlProps={{
          ...props.purchasePrice.htmlElement,
          type: "number",
          required: true,
        }}
        validation={{
          ...props.purchasePrice.validation,
          negativeFeedback: "Must be a positiv number.",
        }}
      />
    </form>
  );
};

export default CarForm;
