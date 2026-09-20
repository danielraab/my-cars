import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
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
import CarContext from "../../context/car-context";

interface EditCarProps {
  carToEdit: FrontendCar;
}

const EditCar = (props: EditCarProps) => {
  const addToast = useToast();
  const router = useRouter();
  const { updateCar, deleteCar } = useCarsBackend();
  const { carList } = useContext(CarContext);
  //#region state init

  const carTypeState = useSimpleInput(props.carToEdit.type);
  const carMakeState = useSimpleInput(props.carToEdit.carMake);
  const carNameState = useValidatedInput(props.carToEdit.name, { validation: (value) => value.trim().length > 0 });
  const fuelTypeState = useSimpleInput(props.carToEdit.fuel);
  const firstRegistrationState = useDateInput(props.carToEdit.firstRegistration);
  const licensePlateState = useSimpleInput(props.carToEdit.licensePlate);
  const finState = useSimpleInput(props.carToEdit.fin);
  const purchaseDateState = useDateInput(props.carToEdit.purchaseDate);
  const purchasePriceState = useNumberInput(props.carToEdit.purchasePrice, { validation: (value) => value >= 0 });

  const [deleteInfo, setDeleteInfo] = useState({ deleteBtnText: "delete Car", deleteBtnClkCnt: 0 });

  //#endregion

  const isFormValid = carNameState.isValid && purchasePriceState.isValid;

  //#region form functions

  const setAllTouched = () => {
    carNameState.setIsTouched(true);
    purchasePriceState.setIsTouched(true);
  };

  const sendEditedCar = () => {
    if (!isFormValid) {
      setAllTouched();
      return;
    }

    let editedCar = createCarObject();

    updateCar(props.carToEdit.id!, editedCar)
      .then(() => {
        router.push("/cars");
      })
      .catch((err) => {
        if (!(err instanceof CarBackendError)) {
          console.error("error while edit car fetch", err);
          addToast(new ToastData("Edit car", "An unknown error occurred while editing the car.", "danger"));
        }
      });
  };

  const deleteCarHandler = () => {
    switch (deleteInfo.deleteBtnClkCnt) {
      case 0:
        setDeleteInfo({ deleteBtnClkCnt: 1, deleteBtnText: "Are you sure?" });
        break;
      case 1:
        setDeleteInfo({ deleteBtnClkCnt: 2, deleteBtnText: "Really?" });
        break;
      default:
        deleteCar(props.carToEdit.id!)
          .then(() => {
            router.push("/cars");
          })
          .catch((err) => {
            if (!(err instanceof CarBackendError)) {
              console.error("error while delete car fetch", err);
              addToast(new ToastData("Deleting car", "An unknown error occurred while deleting the car.", "danger"));
            }
          });
    }
  };

  //#endregion

  const createCarObject = (): FrontendCar => {
    const car: FrontendCar = {
      type: carTypeState.value as CarType,
      carMake: carMakeState.value as CarMake,
      name: carNameState.value,
      fuel: fuelTypeState.value as FuelType,
      firstRegistration: firstRegistrationState.value,
      licensePlate: licensePlateState.value,
      fin: finState.value,
      isActive: true,
      purchaseDate: purchaseDateState.value,
      purchasePrice: Number(purchasePriceState.value),
    };

    return car;
  };

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
        <Button onClick={deleteCarHandler} btnClass="danger">
          <FontAwesomeIcon icon={faTrash} className="me-2" />
          {deleteInfo.deleteBtnText}
        </Button>
        <Button onClick={sendEditedCar} className="ms-auto" btnClass="warning">
          Edit
        </Button>
      </Stack>
    </>
  );
};

export default EditCar;
