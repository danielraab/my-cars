import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import CarContext from "../../../context/car-context";
import useRefuelsBackend, { RefuelBackendError } from "../../../hooks/fetch/use-refuels-backend";
import useDatetimeInput from "../../../hooks/form/use-datetime-input";
import useNumberInput from "../../../hooks/form/use-number-input";
import useSimpleInput from "../../../hooks/form/use-simple-input";
import useValidatedInput from "../../../hooks/form/use-validated-input";
import useToast from "../../../hooks/use-toast";
import { FrontendRefuel, FrontendRefuelWithoutId, SubFuelType } from "../../../lib/types/refuel";
import { ToastData } from "../../../lib/frontend/toastData";
import Button from "../../utilities/form/Button";
import Stack from "../../utilities/helper/Stack";
import RefuelForm from "./RefuelForm";
import Spinner from "../../utilities/helper/Spinner";

interface EditRefuelProps {
  refuelToEdit: FrontendRefuel;
}

const EditRefuel = (props: EditRefuelProps) => {
  const { updateRefuel, deleteRefuel, getAllRefuelStations } = useRefuelsBackend();
  const { carList } = useContext(CarContext);
  const addToast = useToast();
  const router = useRouter();

  //#region states defined
  const [refuelStationList, setRefuelStationList] = useState<string[]>([]);

  const carIdState = useNumberInput(props.refuelToEdit.CarId);
  const refuelDateState = useDatetimeInput(props.refuelToEdit.date);
  const refuelStationState = useValidatedInput(props.refuelToEdit.station, {
    validation: (s) => s.trim().length > 0,
    negativeFeedback: "Station name must be set.",
  });
  const refuelOdometerReadingState = useNumberInput(props.refuelToEdit.odometerReading);
  const refuelFuelState = useSimpleInput(props.refuelToEdit.fuel);
  const refuelLiterState = useNumberInput(props.refuelToEdit.liter, {
    validation: (l) => l > 0,
    negativeFeedback: "Liter must be greater than 0.",
  });
  const refuelAmountState = useNumberInput(props.refuelToEdit.amount);

  const [deleteInfo, setDeleteInfo] = useState({
    deleteBtnText: "delete Refuel",
    deleteBtnClkCnt: 0,
  });
  //#endregion

  const isFormValid = refuelStationState.isValid && refuelLiterState.isValid;

  //#region initial load
  useEffect(() => {
    getAllRefuelStations().then((stationList) => {
      setRefuelStationList([...new Set(stationList)]); // store destinct list
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  //#endregion

  //#region form functions
  const updateRefuelHandler = () => {
    if (!isFormValid) {
      setAllTouched();
      return;
    }

    let refuel = createRefuelObject();
    updateRefuel(props.refuelToEdit.id!, refuel)
      .then((data) => {
        router.back();
      })
      .catch((err) => {
        if (!(err instanceof RefuelBackendError)) {
          console.error("error while update refuel fetch", err);
          addToast(new ToastData("Updating refuel", "An unknown error occurred while updating the refuel.", "danger"));
        }
      });
  };
  const setAllTouched = () => {
    refuelStationState.setIsTouched(true);
    refuelLiterState.setIsTouched(true);
  };

  const createRefuelObject = (): FrontendRefuelWithoutId => {
    return {
      date: refuelDateState.value,
      station: refuelStationState.value,
      odometerReading: refuelOdometerReadingState.value,
      fuel: refuelFuelState.value as SubFuelType,
      liter: refuelLiterState.value,
      amount: refuelAmountState.value,
      CarId: carIdState.value,
    };
  };

  const deleteRefuelHandler = () => {
    switch (deleteInfo.deleteBtnClkCnt) {
      case 0:
        setDeleteInfo({ deleteBtnClkCnt: 1, deleteBtnText: "Are you sure?" });
        break;
      case 1:
        setDeleteInfo({ deleteBtnClkCnt: 2, deleteBtnText: "Really?" });
        break;
      default:
        deleteRefuel(props.refuelToEdit.id!)
          .then(() => {
            router.push("/refuels");
          })
          .catch((err) => {
            if (!(err instanceof RefuelBackendError)) {
              console.error("error while delete refuel fetch", err);
              addToast(
                new ToastData("Deleting refuel", "An unknown error occurred while deleting the refuel.", "danger")
              );
            }
          });
    }
  };
  //#endregion

  if (carList.length > 0)
    return (
      <>
        <RefuelForm
          carList={carList}
          stationList={refuelStationList}
          carId={{
            ...carIdState,
            htmlElement: { ...carIdState.htmlElement, disabled: true },
          }}
          date={refuelDateState}
          station={refuelStationState}
          odometerReading={refuelOdometerReadingState}
          fuel={refuelFuelState}
          liter={refuelLiterState}
          amount={refuelAmountState}
        />
        <Stack horizontal className="mt-3">
          <Button onClick={deleteRefuelHandler} btnClass="danger">
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            {deleteInfo.deleteBtnText}
          </Button>
          <Button onClick={updateRefuelHandler} className="ms-auto" btnClass="warning">
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

export default EditRefuel;
