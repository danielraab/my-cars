import React, { useEffect, useState } from "react";
import { ToastData } from "../../../lib/frontend/toastData";
import useToast from "../../../hooks/use-toast";
import SimplePageWrapper from "../../../components/SimplePageWrapper";
import { Col } from "../../../components/utilities/layout/Container";
import { useRouter } from "next/router";
import useAuth from "../../../hooks/use-auth";
import Spinner from "../../../components/utilities/helper/Spinner";
import useRefuelsBackend, { RefuelBackendError } from "../../../hooks/fetch/use-refuels-backend";
import EditRefuel from "../../../components/car/refuel/EditRefuel";
import moment from "moment";
import { FrontendRefuel } from "../../../lib/types/refuel";

const EditCarPage = () => {
  useAuth({ redirectTo: "/auth/login" });
  const { getRefuel } = useRefuelsBackend();
  const addToast = useToast();
  const router = useRouter();
  const [refuelToEdit, setRefuelToEdit] = useState<FrontendRefuel | null>(null);
  const { refuelId: refuelEditId } = router.query;

  useEffect(() => {
    if (refuelEditId) {
      getRefuel(Number(refuelEditId))
        .then((refuel) => {
          setRefuelToEdit(refuel);
        })
        .catch((err) => {
          if (!(err instanceof RefuelBackendError)) {
            console.log("unknwon error occurred while getting refuel information:", err);
            addToast(new ToastData("Edit Refuel", "Unable to load refuel information", "danger"));
          }
          router.back();
        });
    }
  }, [refuelEditId]); // eslint-disable-line react-hooks/exhaustive-deps

  //TODO avoid displaying undefined
  return (
    <SimplePageWrapper
      title={`Edit Refuel: ${refuelEditId} - ${moment(refuelToEdit?.date).format("D. MMM. YYYY HH:mm") || ""}`}
    >
      {!refuelToEdit && <Spinner />}
      {refuelToEdit && (
        <Col className="col-12 col-lg-6 mt-3">
          <EditRefuel refuelToEdit={refuelToEdit} />
        </Col>
      )}
    </SimplePageWrapper>
  );
};

export default EditCarPage;
