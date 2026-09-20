import { FrontendTicket, TicketType } from "../../lib/types/car";
import { JsonResponse } from "../../lib/frontend/customFetches";
import { ToastData } from "../../lib/frontend/toastData";
import useAuthFetch from "./use-auth-fetch";
import useToast from "../use-toast";
import Ticket from "../../db/models/ticket";
import { handleStatus } from "../../lib/backend/middleware/http";

export class TicketBackendError extends Error {}

function ticketToFrontendTicket(ticket: Ticket): FrontendTicket {
  return {
    id: ticket.id,
    date: new Date(ticket.date),
    type: ticket.type as TicketType,
    location: ticket.location,
    amount: ticket.amount,
    description: ticket.description,
    CarId: ticket.CarId,
  };
}

const useTicketsBackend = () => {
  const authFetch = useAuthFetch();
  const addToast = useToast();

  const getAllTickets = async (carId?: number): Promise<FrontendTicket[]> => {
    const data = await authFetch("GET", carId ? `/api/v1/cars/${carId}/tickets` : "/api/v1/tickets");
    if (data.status === 200) {
      return data.body.map(ticketToFrontendTicket);
    } else {
      addToast(new ToastData("Tickets", handleStatus(data), "warning"));
      throw new TicketBackendError();
    }
  };

  const getAllTicketLocations = async (): Promise<string[]> => {
    const data = await authFetch("GET", "/api/v1/tickets/locations");
    if (data.status === 200) {
      return data.body;
    } else {
      addToast(new ToastData("Tickets", handleStatus(data), "warning"));
      throw new TicketBackendError();
    }
  };

  const createNewTicket = async (CarId: number, ticket: FrontendTicket): Promise<void> => {
    const data = await authFetch("POST", `/api/v1/cars/${CarId}/tickets`, ticket);
    if (data.status === 201) {
      addToast(new ToastData("Adding new ticket", "The ticket was successfully added.", "success", true, 3000));
    } else {
      addToast(new ToastData("Tickets", handleStatus(data), "warning"));
      throw new TicketBackendError();
    }
  };

  const getTicket = async (ticketId: number): Promise<FrontendTicket> => {
    const data = await authFetch("GET", "/api/v1/tickets/" + ticketId);
    if (data.status === 200) {
      return ticketToFrontendTicket(data.body);
    } else {
      addToast(new ToastData("Tickets", handleStatus(data), "warning"));
      throw new TicketBackendError();
    }
  };

  const updateTicket = async (ticketId: number, ticket: FrontendTicket): Promise<void> => {
    const data = await authFetch("PUT", "/api/v1/tickets/" + ticketId, ticket);
    if (data.status === 200) {
      addToast(new ToastData("Edit ticket", "The ticket was successfully edited.", "success", true, 3000));
    } else {
      addToast(new ToastData("Tickets", handleStatus(data), "warning"));
      throw new TicketBackendError();
    }
  };

  const deleteTicket = async (ticketId: number): Promise<void> => {
    const data = await authFetch("DELETE", "/api/v1/tickets/" + ticketId);
    if (data.status === 200) {
      addToast(new ToastData("Deleting ticket", "The ticket was successfully deleted.", "success", true, 3000));
    } else {
      addToast(new ToastData("Tickets", handleStatus(data), "warning"));
      throw new TicketBackendError();
    }
  };

  return {
    getTicket,
    getAllTickets,
    getAllTicketLocations,
    createNewTicket,
    updateTicket,
    deleteTicket,
  };
};

export default useTicketsBackend;
