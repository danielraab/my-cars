import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
import TicketForm from "./TicketForm";
import Spinner from "../../utilities/helper/Spinner";

interface EditTicketProps {
  ticketToEdit: FrontendTicket;
}

const EditTicket = (props: EditTicketProps) => {
  const { updateTicket, deleteTicket, getAllTicketLocations } = useTicketsBackend();
  const { carList } = useContext(CarContext);
  const addToast = useToast();
  const router = useRouter();

  //#region states defined
  const [ticketLocationList, setTicketLocationList] = useState<string[]>([]);

  const carIdState = useNumberInput(props.ticketToEdit.CarId);
  const ticketDateState = useDatetimeInput(props.ticketToEdit.date);
  const ticketTypeState = useValidatedInput<string>(props.ticketToEdit.type, { validation: (value) => true });
  const ticketLocationState = useSimpleInput(props.ticketToEdit.location);
  const ticketAmountState = useNumberInput(props.ticketToEdit.amount);
  const ticketDescriptionState = useSimpleInput(props.ticketToEdit.description);

  const isFormValid = carIdState.isValid && ticketDateState.isValid && ticketTypeState.isValid;

  const [deleteInfo, setDeleteInfo] = useState({
    deleteBtnText: "delete Ticket",
    deleteBtnClkCnt: 0,
  });
  //#endregion

  //#region initial load
  useEffect(() => {
    getAllTicketLocations().then((locationList) => {
      setTicketLocationList([...new Set(locationList)]); // store destinct list
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  //#endregion

  //#region form functions
  const updateTicketHandler = () => {
    if (!isFormValid) {
      setAllTouched();
      return;
    }

    let ticket = createTicketObject();
    updateTicket(props.ticketToEdit.id!, ticket)
      .then((data) => {
        router.back();
      })
      .catch((err) => {
        if (!(err instanceof TicketBackendError)) {
          console.error("error while update ticket fetch", err);
          addToast(new ToastData("Updating ticket", "An unknown error occurred while updating the ticket.", "danger"));
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

  const deleteTicketHandler = () => {
    switch (deleteInfo.deleteBtnClkCnt) {
      case 0:
        setDeleteInfo({ deleteBtnClkCnt: 1, deleteBtnText: "Are you sure?" });
        break;
      case 1:
        setDeleteInfo({ deleteBtnClkCnt: 2, deleteBtnText: "Really?" });
        break;
      default:
        deleteTicket(props.ticketToEdit.id!)
          .then(() => {
            router.push("/tickets");
          })
          .catch((err) => {
            if (!(err instanceof TicketBackendError)) {
              console.error("error while delete ticket fetch", err);
              addToast(
                new ToastData("Deleting ticket", "An unknown error occurred while deleting the ticket.", "danger")
              );
            }
          });
    }
  };
  //#endregion

  if (carList.length > 0)
    return (
      <>
        <TicketForm
          carList={carList}
          locationList={ticketLocationList}
          carId={{
            ...carIdState,
            htmlElement: { ...carIdState.htmlElement, disabled: true },
          }}
          date={ticketDateState}
          type={ticketTypeState}
          location={ticketLocationState}
          amount={ticketAmountState}
          description={ticketDescriptionState}
        />
        <Stack horizontal className="mt-3">
          <Button onClick={deleteTicketHandler} btnClass="danger">
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            {deleteInfo.deleteBtnText}
          </Button>
          <Button onClick={updateTicketHandler} className="ms-auto" btnClass="warning">
            Edit
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

export default EditTicket;
