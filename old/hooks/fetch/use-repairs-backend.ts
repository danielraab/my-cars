import { FrontendRepair, RepairType } from "../../lib/types/car";
import { JsonResponse } from "../../lib/frontend/customFetches";
import { ToastData } from "../../lib/frontend/toastData";
import useAuthFetch from "./use-auth-fetch";
import useToast from "../use-toast";
import Repair from "../../db/models/repair";
import { handleStatus } from "../../lib/backend/middleware/http";

export class RepairBackendError extends Error {}

function repairToFrontendRepair(repair: Repair): FrontendRepair {
  return {
    id: repair.id,
    date: new Date(repair.date),
    station: repair.station,
    odometerReading: repair.odometerReading,
    type: repair.type as RepairType,
    amount: repair.amount,
    description: repair.description,
    CarId: repair.CarId,
  };
}

const useRepairsBackend = () => {
  const authFetch = useAuthFetch();
  const addToast = useToast();

  const getAllRepairs = async (carId?: number): Promise<FrontendRepair[]> => {
    const data = await authFetch("GET", carId ? `/api/v1/cars/${carId}/repairs` : "/api/v1/repairs");
    if (data.status === 200) {
      return data.body.map(repairToFrontendRepair);
    } else {
      addToast(new ToastData("Repairs", handleStatus(data), "warning"));
      throw new RepairBackendError();
    }
  };

  const getAllRepairStations = async (): Promise<string[]> => {
    const data = await authFetch("GET", "/api/v1/repairs/stations");
    if (data.status === 200) {
      return data.body;
    } else {
      addToast(new ToastData("Repairs", handleStatus(data), "warning"));
      throw new RepairBackendError();
    }
  };

  const createNewRepair = async (CarId: number, repair: FrontendRepair): Promise<void> => {
    const data = await authFetch("POST", `/api/v1/cars/${CarId}/repairs`, repair);
    if (data.status === 201) {
      addToast(new ToastData("Adding new repair", "The repair was successfully added.", "success", true, 3000));
    } else {
      addToast(new ToastData("Repairs", handleStatus(data), "warning"));
      throw new RepairBackendError();
    }
  };

  const getRepair = async (repairId: number): Promise<FrontendRepair> => {
    const data = await authFetch("GET", "/api/v1/repairs/" + repairId);
    if (data.status === 200) {
      return repairToFrontendRepair(data.body);
    } else {
      addToast(new ToastData("Repairs", handleStatus(data), "warning"));
      throw new RepairBackendError();
    }
  };

  const updateRepair = async (repairId: number, repair: FrontendRepair): Promise<void> => {
    const data = await authFetch("PUT", "/api/v1/repairs/" + repairId, repair);
    if (data.status === 200) {
      addToast(new ToastData("Edit repair", "The repair was successfully edited.", "success", true, 3000));
    } else {
      addToast(new ToastData("Repairs", handleStatus(data), "warning"));
      throw new RepairBackendError();
    }
  };

  const deleteRepair = async (repairId: number): Promise<void> => {
    const data = await authFetch("DELETE", "/api/v1/repairs/" + repairId);
    if (data.status === 200) {
      addToast(new ToastData("Deleting repair", "The repair was successfully deleted.", "success", true, 3000));
    } else {
      addToast(new ToastData("Repairs", handleStatus(data), "warning"));
      throw new RepairBackendError();
    }
  };

  return {
    getRepair,
    getAllRepairs,
    getAllRepairStations,
    createNewRepair,
    updateRepair,
    deleteRepair,
  };
};

export default useRepairsBackend;
