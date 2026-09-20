import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import CarContext from "../../../context/car-context";
import useRefuelsBackend, { RefuelBackendError } from "../../../hooks/fetch/use-refuels-backend";
import useDatetimeInput from "../../../hooks/form/use-datetime-input";
import useNumberInput from "../../../hooks/form/use-number-input";
import useSimpleInput from "../../../hooks/form/use-simple-input";
import useValidatedInput from "../../../hooks/form/use-validated-input";
import useToast from "../../../hooks/use-toast";
import { FrontendRefuelWithoutId, SubFuelType } from "../../../lib/types/refuel";
import { ToastData } from "../../../lib/frontend/toastData";
import Button from "../../utilities/form/Button";
import Stack from "../../utilities/helper/Stack";
import RefuelForm from "./RefuelForm";
import Spinner from "../../utilities/helper/Spinner";

type AddRefuelProps = {
  preSelectedCarid?: number;
};

const AddRefuel = (props: AddRefuelProps) => {
  const { createNewRefuel, getAllRefuelStations } = useRefuelsBackend();
  const { carList } = useContext(CarContext);
  const addToast = useToast();
  const router = useRouter();

  //#region states defined
  const [refuelStationList, setRefuelStationList] = useState<string[]>([]);

  const carIdState = useNumberInput(carList[carList.length - 1]?.id || -1);
  const refuelDateState = useDatetimeInput(new Date());
  const refuelStationState = useValidatedInput("", {
    validation: (s) => s.trim().length > 0,
    negativeFeedback: "Station name must be set.",
  });
  const refuelOdometerReadingState = useNumberInput(0);
  const refuelFuelState = useSimpleInput("Normal" as SubFuelType);
  const refuelLiterState = useNumberInput(0, {
    validation: (l) => l > 0,
    negativeFeedback: "Liter must be greater than 0.",
  });
  const refuelAmountState = useNumberInput(0);
  //#endregion

  const isFormValid = refuelStationState.isValid && refuelLiterState.isValid;

  //#region initial load
  useEffect(() => {
    getAllRefuelStations().then((stationList) => {
      setRefuelStationList([...new Set(stationList)]); // store destinct list
    });
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
    refuelDateState.clear();
    refuelStationState.clear();
    refuelOdometerReadingState.clear();
    refuelFuelState.clear();
    refuelLiterState.clear();
    refuelAmountState.clear();
  };

  const addEnteredRefuel = () => {
    if (!isFormValid) {
      setAllTouched();
      return;
    }

    let refuel = createRefuelObject();

    createNewRefuel(getSelectedCarId(), refuel)
      .then((data) => {
        clearForm();
        router.back();
      })
      .catch((err) => {
        if (!(err instanceof RefuelBackendError)) {
          console.error("error while new refuel fetch", err);
          addToast(new ToastData("Adding new refuel", "An unknown error occurred while adding the refuel.", "danger"));
        }
      });
  };
  const setAllTouched = () => {
    carIdState.setIsTouched(true);
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

  const getSelectedCarId = (): number => {
    return carIdState.value;
  };
  //#endregion

  if (carList.length > 0)
    return (
      <>
        <RefuelForm
          carList={carList}
          stationList={refuelStationList}
          carId={carIdState}
          date={refuelDateState}
          station={refuelStationState}
          odometerReading={refuelOdometerReadingState}
          fuel={refuelFuelState}
          liter={refuelLiterState}
          amount={refuelAmountState}
        />
        <Stack horizontal className="mt-3">
          <Button onClick={clearForm} btnClass="secondary">
            Clear Form
          </Button>
          <Button onClick={addEnteredRefuel} className="ms-auto" btnClass="success">
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

export default AddRefuel;
