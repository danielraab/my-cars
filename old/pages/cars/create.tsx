import React from "react";
import SimplePageWrapper from "../../components/SimplePageWrapper";
import { Col } from "../../components/utilities/layout/Container";
import useAuth from "../../hooks/use-auth";
import AddCar from "../../components/car/AddCar";

const NewCarPage = () => {
  useAuth({ redirectTo: "/auth/login" });

  return (
    <SimplePageWrapper title="Add a new Car">
      <Col className="col-12 col-lg-6 mt-3">
        <AddCar />
      </Col>
    </SimplePageWrapper>
  );
};

export default NewCarPage;
