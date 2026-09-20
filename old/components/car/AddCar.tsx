import { useRouter } from "next/router";
import useCarsBackend, { CarBackendError } from "../../hooks/fetch/use-cars-backend";
import useDateInput from "../../hooks/form/use-date-input";
import useNumberInput from "../../hooks/form/use-number-input";
import useSimpleInput from "../../hooks/form/use-simple-input";
import useValidatedInput from "../../hooks/form/use-validated-input";
import useToast from "../../hooks/use-toast";
import { CarMake, CarType, FrontendCar, FuelType } from "../../lib/types/car";
import { ToastData } from "../../lib/frontend/toastData";
import Button from "../utilities/form/Button";
import Stack from "../utilities/helper/Stack";
import CarForm from "./CarForm";

const AddCar = () => {
  const { createNewCar } = useCarsBackend();
  const addToast = useToast();
  const router = useRouter();

  //#region state definition

  const carTypeState = useSimpleInput("Car" as CarType);
  const carMakeState = useSimpleInput("Fiat" as CarMake);
  const carNameState = useValidatedInput("", { validation: (value) => value.trim().length > 0 });
  const fuelTypeState = useSimpleInput("Diesel" as FuelType);
  const firstRegistrationState = useDateInput();
  const licensePlateState = useSimpleInput("");
  const finState = useSimpleInput("");
  const purchaseDateState = useDateInput();
  const purchasePriceState = useNumberInput(0.0, { validation: (value) => value >= 0 });

  //#endregion

  const isFormValid = carNameState.isValid && purchasePriceState.isValid;

  //#region form functions

  const setAllTouched = () => {
    carNameState.setIsTouched(true);
    purchasePriceState.setIsTouched(true);
  };

  const clearForm = () => {
    carTypeState.clear();
    carMakeState.clear();
    carNameState.clear();
    fuelTypeState.clear();
    firstRegistrationState.clear();
    licensePlateState.clear();
    finState.clear();
    purchasePriceState.clear();
  };

  const addEnteredCar = () => {
    if (!isFormValid) {
      setAllTouched();
      return;
    }

    let car = createCarObject();

    createNewCar(car)
      .then(() => {
        clearForm();
        router.back();
      })
      .catch((err) => {
        if (err instanceof CarBackendError) {
          addToast(
            new ToastData("Adding new car", "Error while added the new car: " + err.message, "warning", true, 10000)
          );
        } else {
          console.error("error while new car fetch", err);
          addToast(new ToastData("Adding new car", "An unknown error occurred while adding the car.", "danger"));
        }
      });
  };

  const createCarObject = (): FrontendCar => {
    const newCar: FrontendCar = {
      type: carTypeState.value as CarType,
      carMake: carMakeState.value as CarMake,
      name: carNameState.value,
      fuel: fuelTypeState.value as FuelType,
      firstRegistration: firstRegistrationState.value,
      licensePlate: licensePlateState.value,
      fin: finState.value,
      isActive: true,
      purchaseDate: purchaseDateState.value,
      purchasePrice: purchasePriceState.value,
    };

    return newCar;
  };

  //#endregion

  return (
    <>
      <CarForm
        carType={carTypeState}
        carMake={carMakeState}
        carName={carNameState}
        fuelType={fuelTypeState}
        firstRegistration={firstRegistrationState}
        licensePlate={licensePlateState}
        fin={finState}
        purchaseDate={purchaseDateState}
        purchasePrice={purchasePriceState}
      />
      <Stack horizontal className="mt-3">
        <Button onClick={clearForm} btnClass="secondary">
          Clear Form
        </Button>
        <Button onClick={addEnteredCar} className="ms-auto" btnClass="success">
          Add
        </Button>
      </Stack>
    </>
  );
};

export default AddCar;
