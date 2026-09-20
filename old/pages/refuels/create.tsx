import React from "react";
import SimplePageWrapper from "../../components/SimplePageWrapper";
import { Col } from "../../components/utilities/layout/Container";
import useAuth from "../../hooks/use-auth";
import AddRefuel from "../../components/car/refuel/AddRefuel";
import { useRouter } from "next/router";

const NewRefuelPage = () => {
  useAuth({ redirectTo: "/auth/login" });
  const router = useRouter();

  return (
    <SimplePageWrapper title="Add a new Refuel">
      <Col className="col-12 col-lg-6 mt-3">
        <AddRefuel preSelectedCarid={Number(router.query.carId)}/>
      </Col>
    </SimplePageWrapper>
  );
};

export default NewRefuelPage;
