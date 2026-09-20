import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import CarContext from "../../../context/car-context";
import useRepairsBackend, { RepairBackendError } from "../../../hooks/fetch/use-repairs-backend";
import useDatetimeInput from "../../../hooks/form/use-datetime-input";
import useNumberInput from "../../../hooks/form/use-number-input";
import useSimpleInput from "../../../hooks/form/use-simple-input";
import useValidatedInput from "../../../hooks/form/use-validated-input";
import useToast from "../../../hooks/use-toast";
import { FrontendRepair, RepairType } from "../../../lib/types/car";
import { ToastData } from "../../../lib/frontend/toastData";
import Button from "../../utilities/form/Button";
import Stack from "../../utilities/helper/Stack";
import RepairForm from "./RepairForm";
import Spinner from "../../utilities/helper/Spinner";

interface EditRepairProps {
  repairToEdit: FrontendRepair;
}

const EditRepair = (props: EditRepairProps) => {
  const { updateRepair, deleteRepair, getAllRepairStations } = useRepairsBackend();
  const { carList } = useContext(CarContext);
  const addToast = useToast();
  const router = useRouter();

  //#region states defined
  const [repairStationList, setRepairStationList] = useState<string[]>([]);

  const carIdState = useNumberInput(props.repairToEdit.CarId);
  const repairDateState = useDatetimeInput(props.repairToEdit.date);
  const repairStationState = useValidatedInput(props.repairToEdit.station, {
    validation: (s) => s.trim().length > 0,
    negativeFeedback: "Station name must be set.",
  });
  const repairOdometerReadingState = useNumberInput(props.repairToEdit.odometerReading);
  const repairTypeState = useSimpleInput(props.repairToEdit.type);
  const repairAmountState = useNumberInput(props.repairToEdit.amount);
  const repairDescriptionState = useSimpleInput(props.repairToEdit.description);

  const [deleteInfo, setDeleteInfo] = useState({
    deleteBtnText: "delete Repair",
    deleteBtnClkCnt: 0,
  });
  //#endregion

  const isFormValid = repairStationState.isValid;

  //#region initial load
  useEffect(() => {
    getAllRepairStations().then((stationList) => {
      setRepairStationList([...new Set(stationList)]); // store destinct list
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  //#endregion

  //#region form functions
  const updateRepairHandler = () => {
    if (!isFormValid) {
      setAllTouched();
      return;
    }

    let repair = createRepairObject();
    updateRepair(props.repairToEdit.id!, repair)
      .then((data) => {
        router.back();
      })
      .catch((err) => {
        if (!(err instanceof RepairBackendError)) {
          console.error("error while update repair fetch", err);
          addToast(new ToastData("Updating repair", "An unknown error occurred while updating the repair.", "danger"));
        }
      });
  };
  const setAllTouched = () => {
    repairStationState.setIsTouched(true);
  };

  const createRepairObject = (): FrontendRepair => {
    return {
      date: repairDateState.value,
      station: repairStationState.value,
      odometerReading: repairOdometerReadingState.value,
      type: repairTypeState.value as RepairType,
      amount: repairAmountState.value,
      description: repairDescriptionState.value,
      CarId: carIdState.value,
    };
  };

  const deleteRepairHandler = () => {
    switch (deleteInfo.deleteBtnClkCnt) {
      case 0:
        setDeleteInfo({ deleteBtnClkCnt: 1, deleteBtnText: "Are you sure?" });
        break;
      case 1:
        setDeleteInfo({ deleteBtnClkCnt: 2, deleteBtnText: "Really?" });
        break;
      default:
        deleteRepair(props.repairToEdit.id!)
          .then(() => {
            router.push("/repairs");
          })
          .catch((err) => {
            if (!(err instanceof RepairBackendError)) {
              console.error("error while delete repair fetch", err);
              addToast(
                new ToastData("Deleting repair", "An unknown error occurred while deleting the repair.", "danger")
              );
            }
          });
    }
  };
  //#endregion

  if (carList.length > 0)
    return (
      <>
        <RepairForm
          carList={carList}
          stationList={repairStationList}
          carId={{
            ...carIdState,
            htmlElement: { ...carIdState.htmlElement, disabled: true },
          }}
          date={repairDateState}
          station={repairStationState}
          odometerReading={repairOdometerReadingState}
          type={repairTypeState}
          amount={repairAmountState}
          description={repairDescriptionState}
        />
        <Stack horizontal className="mt-3">
          <Button onClick={deleteRepairHandler} btnClass="danger">
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            {deleteInfo.deleteBtnText}
          </Button>
          <Button onClick={updateRepairHandler} className="ms-auto" btnClass="warning">
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

export default EditRepair;
