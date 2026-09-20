import { useRouter } from "next/router";
import React from "react";
import AddTicket from "../../components/car/ticket/AddTicket";
import SimplePageWrapper from "../../components/SimplePageWrapper";
import { Col } from "../../components/utilities/layout/Container";
import useAuth from "../../hooks/use-auth";

const NewTicketPage = () => {
  useAuth({ redirectTo: "/auth/login" });
  const router = useRouter();

  return (
    <SimplePageWrapper title="Add a new Ticket">
      <Col className="col-12 col-lg-6 mt-3">
        <AddTicket preSelectedCarid={Number(router.query.carId)} />
      </Col>
    </SimplePageWrapper>
  );
};

export default NewTicketPage;
