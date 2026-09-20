import { FrontendRefuel, FrontendRefuelWithoutId, SubFuelType } from "../../lib/types/refuel";
import { ToastData } from "../../lib/frontend/toastData";
import useAuthFetch from "./use-auth-fetch";
import useToast from "../use-toast";
import Refuel from "../../db/models/refuel";
import { handleStatus } from "../../lib/backend/middleware/http";

export class RefuelBackendError extends Error {}

function refuelListToFrontendRefuelList(refuelList: Refuel[]): FrontendRefuel[] {
  const carOdometerMap = new Map<number, number>();
  const frontendRefuelList: FrontendRefuel[] = [];

  refuelList.forEach((refuel) => {
    const frontendRefuel = refuelToFrontendRefuel(refuel);
    const oldOdo = carOdometerMap.get(refuel.CarId);
    if (oldOdo && frontendRefuel.odometerReading) {
      frontendRefuel.distance = frontendRefuel.odometerReading - oldOdo;
      frontendRefuel.consumption = Math.round((10000 * frontendRefuel.liter) / frontendRefuel.distance) / 100;
    }

    carOdometerMap.set(frontendRefuel.CarId, frontendRefuel.odometerReading);
    frontendRefuelList.push(frontendRefuel);
  });
  return frontendRefuelList;
}

function refuelToFrontendRefuel(refuel: Refuel): FrontendRefuel {
  return {
    id: refuel.id,
    date: new Date(refuel.date),
    station: refuel.station,
    odometerReading: refuel.odometerReading,
    fuel: refuel.fuel as SubFuelType,
    liter: refuel.liter,
    perLiter: Math.round((1000 * refuel.amount) / refuel.liter) / 1000,
    amount: refuel.amount,
    CarId: refuel.CarId,
  };
}

const useRefuelsBackend = () => {
  const authFetch = useAuthFetch();
  const addToast = useToast();

  const getAllRefuels = async (carId?: number): Promise<FrontendRefuel[]> => {
    const data = await authFetch("GET", carId ? `/api/v1/cars/${carId}/refuels` : "/api/v1/refuels");
    if (data.status === 200) {
      return refuelListToFrontendRefuelList(data.body);
    } else {
      addToast(new ToastData("Refuels", handleStatus(data), "warning"));
      throw new RefuelBackendError();
    }
  };

  const getAllRefuelStations = async (): Promise<string[]> => {
    const data = await authFetch("GET", "/api/v1/refuels/stations");
    if (data.status === 200) {
      return data.body;
    } else {
      addToast(new ToastData("Refuels", handleStatus(data), "warning"));
      throw new RefuelBackendError();
    }
  };

  const createNewRefuel = async (carId: number, refuel: FrontendRefuelWithoutId): Promise<void> => {
    const data = await authFetch("POST", `/api/v1/cars/${carId}/refuels`, refuel);
    if (data.status === 201) {
      addToast(new ToastData("Adding new refuel", "The refuel was successfully added.", "success", true, 3000));
    } else {
      addToast(new ToastData("Refuels", handleStatus(data), "warning"));
      throw new RefuelBackendError();
    }
  };

  const getRefuel = async (refuelId: number): Promise<FrontendRefuel> => {
    const data = await authFetch("GET", "/api/v1/refuels/" + refuelId);
    if (data.status === 200) {
      return refuelToFrontendRefuel(data.body);
    } else {
      addToast(new ToastData("Refuels", handleStatus(data), "warning"));
      throw new RefuelBackendError();
    }
  };

  const updateRefuel = async (refuelId: number, refuel: FrontendRefuelWithoutId): Promise<void> => {
    const data = await authFetch("PUT", "/api/v1/refuels/" + refuelId, refuel);
    if (data.status === 200) {
      addToast(new ToastData("Edit refuel", "The refuel was successfully edited.", "success", true, 3000));
    } else {
      addToast(new ToastData("Refuels", handleStatus(data), "warning"));
      throw new RefuelBackendError();
    }
  };

  const deleteRefuel = async (refuelId: number): Promise<void> => {
    const data = await authFetch("DELETE", "/api/v1/refuels/" + refuelId);
    if (data.status === 200) {
      addToast(new ToastData("Deleting refuel", "The refuel was successfully deleted.", "success", true, 3000));
    } else {
      addToast(new ToastData("Refuels", handleStatus(data), "warning"));
      throw new RefuelBackendError();
    }
  };

  return {
    getRefuel,
    getAllRefuels,
    getAllRefuelStations,
    createNewRefuel,
    updateRefuel,
    deleteRefuel,
  };
};

export default useRefuelsBackend;
