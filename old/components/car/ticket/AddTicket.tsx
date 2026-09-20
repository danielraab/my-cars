import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import CarContext from "../../../context/car-context";
import useTicketsBackend, { TicketBackendError } from "../../../hooks/fetch/use-tickets-backend";
import useDatetimeInput from "../../../hooks/form/use-datetime-input";
import useNumberInput from "../../../hooks/form/use-number-input";
import useSimpleInput from "../../../hooks/form/use-simple-input";
import useValidatedInput from "../../../hooks/form/use-validated-input";
import useToast from "../../../hooks/use-toast";
import { FrontendTicket, TicketType } from "../../../lib/types/car";
import { ToastData } from "../../../lib/frontend/toastData";
import Button from "../../utilities/form/Button";
import Stack from "../../utilities/helper/Stack";
import Spinner from "../../utilities/helper/Spinner";
import TicketForm from "./TicketForm";

type AddTicketProps = {
  preSelectedCarid?: number;
};

const AddTicket = (props: AddTicketProps) => {
  const { createNewTicket, getAllTicketLocations } = useTicketsBackend();
  const { carList } = useContext(CarContext);
  const addToast = useToast();
  const router = useRouter();

  //#region states defined
  const [ticketLocationList, setTicketLocationList] = useState<string[]>([]);

  const carIdState = useNumberInput(carList[carList.length - 1]?.id || -1);
  const ticketDateState = useDatetimeInput(new Date());
  const ticketTypeState = useValidatedInput("-1", { validation: (value) => value != "-1" });
  const ticketLocationState = useSimpleInput("");
  const ticketAmountState = useNumberInput(0);
  const ticketDescriptionState = useSimpleInput("");
  //#endregion

  const isFormValid = carIdState.isValid && ticketDateState.isValid && ticketTypeState.isValid;

  //#region initial load
  useEffect(() => {
    getAllTicketLocations()
      .then((locationList) => {
        setTicketLocationList([...new Set(locationList)]); // store destinct list
      })
      .catch((err) => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  //#endregion

  useEffect(() => {
    if (props.preSelectedCarid && carList && carList.find((car) => car.id === props.preSelectedCarid)) {
      carIdState.setValue(props.preSelectedCarid);
    }
  }, [props.preSelectedCarid, carList]); // eslint-disable-line react-hooks/exhaustive-deps

  //#region form functions
  const clearForm = () => {
    carIdState.clear();
    ticketDateState.clear();
    ticketTypeState.clear();
    ticketLocationState.clear();
    ticketDescriptionState.clear();
    ticketAmountState.clear();
  };

  const addEnteredTicket = () => {
    console.log(ticketTypeState);
    if (!isFormValid) {
      setAllTouched();
      window.scrollTo(0, 0);
      return;
    }

    let ticket = createTicketObject();

    createNewTicket(carIdState.value, ticket)
      .then((data) => {
        clearForm();
        router.back();
      })
      .catch((err) => {
        if (!(err instanceof TicketBackendError)) {
          console.error("error while new ticket fetch", err);
          addToast(new ToastData("Adding new ticket", "An unknown error occurred while adding the ticket.", "danger"));
        }
      });
  };
  const setAllTouched = () => {
    carIdState.setIsTouched(true);
    ticketDateState.setIsTouched(true);
    ticketTypeState.setIsTouched(true);
  };

  const createTicketObject = (): FrontendTicket => {
    return {
      date: ticketDateState.value,
      type: ticketTypeState.value as TicketType,
      location: ticketLocationState.value,
      amount: ticketAmountState.value,
      description: ticketDescriptionState.value,
      CarId: carIdState.value,
    };
  };
  //#endregion

  if (carList.length > 0)
    return (
      <>
        <TicketForm
          carList={carList}
          locationList={ticketLocationList}
          carId={carIdState}
          date={ticketDateState}
          type={ticketTypeState}
          location={ticketLocationState}
          amount={ticketAmountState}
          description={ticketDescriptionState}
        />
        <Stack horizontal className="mt-3">
          <Button onClick={clearForm} btnClass="secondary">
            Clear Form
          </Button>
          <Button onClick={addEnteredTicket} className="ms-auto" btnClass="success">
            Add
          </Button>
        </Stack>
      </>
    );
  return (
    <div className="text-center">
      <Spinner />
    </div>
  );
};

export default AddTicket;
