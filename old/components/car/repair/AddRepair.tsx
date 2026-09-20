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
import Spinner from "../../utilities/helper/Spinner";
import RepairForm from "./RepairForm";

type AddRepairProps = {
  preSelectedCarid?: number;
};

const AddRepair = (props: AddRepairProps) => {
  const { createNewRepair, getAllRepairStations } = useRepairsBackend();
  const { carList } = useContext(CarContext);
  const addToast = useToast();
  const router = useRouter();

  //#region states defined
  const [repairStationList, setRepairStationList] = useState<string[]>([]);

  const carIdState = useNumberInput(carList[carList.length - 1]?.id || -1);
  const repairDateState = useDatetimeInput(new Date());
  const repairStationState = useValidatedInput("", {
    validation: (s) => s.trim().length > 0,
    negativeFeedback: "Station name must be set.",
  });
  const repairOdometerReadingState = useNumberInput(0);
  const repairTypeState = useSimpleInput("Check" as RepairType);
  const repairAmountState = useNumberInput(0);
  const repairDescriptionState = useSimpleInput("");
  //#endregion

  const isFormValid = repairStationState.isValid;

  //#region initial load
  useEffect(() => {
    getAllRepairStations()
      .then((stationList) => {
        setRepairStationList([...new Set(stationList)]); // store destinct list
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
    repairDateState.clear();
    repairStationState.clear();
    repairOdometerReadingState.clear();
    repairTypeState.clear();
    repairDescriptionState.clear();
    repairAmountState.clear();
  };

  const addEnteredRepair = () => {
    if (!isFormValid) {
      setAllTouched();
      window.scrollTo(0, 0);
      return;
    }

    let repair = createRepairObject();

    createNewRepair(carIdState.value, repair)
      .then((data) => {
        clearForm();
        router.back();
      })
      .catch((err) => {
        if (!(err instanceof RepairBackendError)) {
          console.error("error while new repair fetch", err);
          addToast(new ToastData("Adding new repair", "An unknown error occurred while adding the repair.", "danger"));
        }
      });
  };
  const setAllTouched = () => {
    carIdState.setIsTouched(true);
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
  //#endregion

  if (carList.length > 0)
    return (
      <>
        <RepairForm
          carList={carList}
          stationList={repairStationList}
          carId={carIdState}
          date={repairDateState}
          station={repairStationState}
          odometerReading={repairOdometerReadingState}
          type={repairTypeState}
          amount={repairAmountState}
          description={repairDescriptionState}
        />
        <Stack horizontal className="mt-3">
          <Button onClick={clearForm} btnClass="secondary">
            Clear Form
          </Button>
          <Button onClick={addEnteredRepair} className="ms-auto" btnClass="success">
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

export default AddRepair;
