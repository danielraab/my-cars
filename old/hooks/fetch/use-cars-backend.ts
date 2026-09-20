import Car from "../../db/models/car";
import { CarMake, CarType, FrontendCar, FuelType } from "../../lib/types/car";
import { ToastData } from "../../lib/frontend/toastData";
import useAuthFetch from "./use-auth-fetch";
import useToast from "../use-toast";
import { handleStatus } from "../../lib/backend/middleware/http";

export class CarBackendError extends Error {}

function carToFrontendCar(car: Car): FrontendCar {
  const frontCar: FrontendCar = {
    id: car.id,
    name: car.name,
    type: car.type as CarType,
    carMake: car.carMake as CarMake,
    fin: car.fin,
    firstRegistration: car.firstRegistration && new Date(car.firstRegistration),
    isActive: car.isActive,
    licensePlate: car.licensePlate,
    purchaseDate: car.purchaseDate && new Date(car.purchaseDate),
    purchasePrice: car.purchasePrice,
    fuel: car.fuel as FuelType,
  };
  return frontCar;
}

const useCarsBackend = () => {
  const authFetch = useAuthFetch();
  const addToast = useToast();

  const getAllCars = (): Promise<FrontendCar[]> => {
    return authFetch("GET", "/api/v1/cars").then((data) => {
      if (data.status === 200) {
        return data.body.map(carToFrontendCar);
      } else {
        addToast(new ToastData("Cars", handleStatus(data), "warning"));
        throw new CarBackendError();
      }
    });
  };

  const createNewCar = (car: FrontendCar): Promise<void> => {
    return authFetch("POST", "/api/v1/cars", car).then((data) => {
      if (data.status === 201) {
        addToast(new ToastData("Adding new car", "The car was successfully added.", "success", true, 3000));
      } else {
        addToast(new ToastData("Cars", handleStatus(data), "warning"));
        throw new CarBackendError();
      }
    });
  };

  const getCar = (carId: number): Promise<FrontendCar> => {
    return authFetch("GET", "/api/v1/cars/" + carId).then((data) => {
      if (data.status === 200) {
        return carToFrontendCar(data.body);
      } else {
        addToast(new ToastData("Cars", handleStatus(data), "warning"));
        throw new CarBackendError();
      }
    });
  };

  const updateCar = (carId: number, car: FrontendCar): Promise<void> => {
    return authFetch("PUT", "/api/v1/cars/" + carId, car).then((data) => {
      if (data.status === 200) {
        addToast(new ToastData("Edit car", "The car was successfully edited.", "success", true, 3000));
      } else {
        addToast(new ToastData("Cars", handleStatus(data), "warning"));
        throw new CarBackendError();
      }
    });
  };

  const deleteCar = (carId: number): Promise<void> => {
    return authFetch("DELETE", "/api/v1/cars/" + carId).then((data) => {
      if (data.status === 200) {
        addToast(new ToastData("Deleting car", "The car was successfully deleted.", "success", true, 3000));
      } else {
        addToast(new ToastData("Cars", handleStatus(data), "warning"));
        throw new CarBackendError();
      }
    });
  };

  return {
    getCar,
    getAllCars,
    createNewCar,
    updateCar,
    deleteCar,
  };
};

export default useCarsBackend;
