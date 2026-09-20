import Link from "next/link";
import { useEffect, useState } from "react";
import SimplePageWrapper from "../../components/SimplePageWrapper";
import Button from "../../components/utilities/form/Button";
import Spinner from "../../components/utilities/helper/Spinner";
import Stack from "../../components/utilities/helper/Stack";
import { Col } from "../../components/utilities/layout/Container";
import useTicketsBackend, { TicketBackendError } from "../../hooks/fetch/use-tickets-backend";
import useAuth from "../../hooks/use-auth";
import useToast from "../../hooks/use-toast";
import { FrontendTicket } from "../../lib/types/car";
import { ToastData } from "../../lib/frontend/toastData";
import TicketList from "../../components/car/ticket/TicketList";

export default function Home() {
  useAuth({ redirectTo: "/auth/login" });
  const addToast = useToast();
  const [loaded, setLoaded] = useState(false);

  const { getAllTickets } = useTicketsBackend();
  const [ticketList, setTicketList] = useState<FrontendTicket[]>([]);

  const fetchAllRefuels = () => {
    setLoaded(false);
    getAllTickets()
      .then((list) => {
        setTicketList(list);
      })
      .catch((err) => {
        if (!(err instanceof TicketBackendError)) {
          console.error(err);
          addToast(new ToastData("Load tickets", "Error while loading.", "danger", false));
        }
      })
      .finally(() => {
        setLoaded(true);
      });
  };

  useEffect(() => {
    fetchAllRefuels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SimplePageWrapper title="Repairs">
      <Col className="col-12 col-lg-10 mt-3">
        <Stack>
          <Link className="ms-auto" href="/tickets/create">
            <Button btnClass="success">Add new ticket</Button>
          </Link>
        </Stack>
        <h3>List of tickets:</h3>
        {!loaded && (
          <div className="text-center">
            <Spinner />
          </div>
        )}
        {loaded && <TicketList ticketList={ticketList} />}
      </Col>
    </SimplePageWrapper>
  );
}
