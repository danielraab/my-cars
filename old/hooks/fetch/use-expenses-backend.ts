import { FrontendCar } from "../../lib/types/car";
import { ToastData } from "../../lib/frontend/toastData";
import useAuthFetch from "./use-auth-fetch";
import useToast from "../use-toast";
import { handleStatus } from "../../lib/backend/middleware/http";
import { ExpensesResponse } from "../../pages/api/v1/stats/expenses";
import { KeyValuePairs } from "../../lib/general";
import { AmountStats } from "../../lib/types/stats";

export class ExpensesBackendError extends Error {}

const useExpensesBackend = () => {
  const authFetch = useAuthFetch();
  const addToast = useToast();

  const getAllExpenses = (from?: Date, to?: Date): Promise<ExpensesResponse> => {
    let params: KeyValuePairs = {};
    if (from) params.from = from.toISOString();
    if (to) params.to = to.toISOString();

    return authFetch("GET", "/api/v1/stats/expenses", undefined, params).then((data) => {
      if (data.status === 200) {
        return convertResponse(data.body);
      } else {
        addToast(new ToastData("Get statistics", handleStatus(data), "warning"));
        throw new ExpensesBackendError();
      }
    });
  };

  return {
    getAllExpenses,
  };
};

function convertResponse(response: ExpensesResponse): ExpensesResponse {
  return {
    refuels: response.refuels.map(amountStatConvert),
    repairs: response.repairs.map(amountStatConvert),
    tickets: response.tickets.map(amountStatConvert),
  };
}

function amountStatConvert(stat: AmountStats) {
  return { ...stat, date: new Date(stat.date) };
}

export default useExpensesBackend;
