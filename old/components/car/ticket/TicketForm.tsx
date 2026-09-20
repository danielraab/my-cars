import React from "react";
import { SimpleInputState } from "../../../hooks/form/use-simple-input";
import { ValidatedInputState } from "../../../hooks/form/use-validated-input";
import { frontendCarListToSelectOptionList } from "../../../lib/frontend/car";
import { FrontendCar, TicketType, ticketTypeValues } from "../../../lib/types/car";
import FormInput from "../../utilities/form/Input";
import SimpleFormSelect from "../../utilities/form/Select";
import FormTextarea from "../../utilities/form/Textarea";

const ticketTypeList = ticketTypeValues.map((type) => {
  return {
    value: type,
    label: type as TicketType,
    disabled: false,
  };
});

type TicketFormProps = {
  carList: FrontendCar[];
  locationList: string[];
  carId: ValidatedInputState<number>;
  date: SimpleInputState<Date>;
  type: ValidatedInputState<string>;
  location: SimpleInputState<string>;
  amount: SimpleInputState<number>;
  description: SimpleInputState<string>;
};

const TicketForm = (props: TicketFormProps) => {
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
      <SimpleFormSelect
        label="Type"
        className="mb-3"
        optionList={ticketTypeList}
        selectProps={{
          ...props.type.htmlElement,
          required: true,
        }}
        validation={props.type.validation}
      />
      <FormInput
        label="location"
        className="mb-3"
        controlProps={{
          ...props.location.htmlElement,
        }}
        datalist={props.locationList}
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

export default TicketForm;
