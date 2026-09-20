import { useRouter } from "next/router";
import React from "react";
import AddRepair from "../../components/car/repair/AddRepair";
import SimplePageWrapper from "../../components/SimplePageWrapper";
import { Col } from "../../components/utilities/layout/Container";
import useAuth from "../../hooks/use-auth";

const NewRepairPage = () => {
  useAuth({ redirectTo: "/auth/login" });
  const router = useRouter();

  return (
    <SimplePageWrapper title="Add a new Repair">
      <Col className="col-12 col-lg-6 mt-3">
        <AddRepair preSelectedCarid={Number(router.query.carId)} />
      </Col>
    </SimplePageWrapper>
  );
};

export default NewRepairPage;
