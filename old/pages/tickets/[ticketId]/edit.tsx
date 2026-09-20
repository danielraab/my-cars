import React, { useEffect, useState } from "react";
import { FrontendTicket } from "../../../lib/types/car";
import { ToastData } from "../../../lib/frontend/toastData";
import useToast from "../../../hooks/use-toast";
import SimplePageWrapper from "../../../components/SimplePageWrapper";
import { Col } from "../../../components/utilities/layout/Container";
import { useRouter } from "next/router";
import useAuth from "../../../hooks/use-auth";
import Spinner from "../../../components/utilities/helper/Spinner";
import useTicketsBackend, { TicketBackendError } from "../../../hooks/fetch/use-tickets-backend";
import EditTicket from "../../../components/car/ticket/EditTicket";
import moment from "moment";

const EditCarPage = () => {
  useAuth({ redirectTo: "/auth/login" });
  const { getTicket } = useTicketsBackend();
  const addToast = useToast();
  const router = useRouter();
  const [ticketToEdit, setTicketToEdit] = useState<FrontendTicket | null>(null);
  const { ticketId: ticketEditId } = router.query;

  useEffect(() => {
    if (ticketEditId) {
      getTicket(Number(ticketEditId))
        .then((ticket) => {
          setTicketToEdit(ticket);
        })
        .catch((err) => {
          if (!(err instanceof TicketBackendError)) {
            console.log("unknwon error occurred while getting ticket information:", err);
            addToast(new ToastData("Edit Ticket", "Unable to load ticket information", "danger"));
          }
          router.back();
        });
    }
  }, [ticketEditId]); // eslint-disable-line react-hooks/exhaustive-deps

  //TODO avoid displaying undefined
  return (
    <SimplePageWrapper
      title={`Edit Ticket: ${ticketEditId} - ${moment(ticketToEdit?.date).format("D. MMM. YYYY HH:mm") || ""}`}
    >
      {!ticketToEdit && <Spinner />}
      {ticketToEdit && (
        <Col className="col-12 col-lg-6 mt-3">
          <EditTicket ticketToEdit={ticketToEdit} />
        </Col>
      )}
    </SimplePageWrapper>
  );
};

export default EditCarPage;
