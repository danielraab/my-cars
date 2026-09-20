import React, { useEffect, useState } from "react";
import { FrontendRepair } from "../../../lib/types/car";
import { ToastData } from "../../../lib/frontend/toastData";
import useToast from "../../../hooks/use-toast";
import SimplePageWrapper from "../../../components/SimplePageWrapper";
import { Col } from "../../../components/utilities/layout/Container";
import { useRouter } from "next/router";
import useAuth from "../../../hooks/use-auth";
import Spinner from "../../../components/utilities/helper/Spinner";
import useRepairsBackend, { RepairBackendError } from "../../../hooks/fetch/use-repairs-backend";
import EditRepair from "../../../components/car/repair/EditRepair";
import moment from "moment";

const EditCarPage = () => {
  useAuth({ redirectTo: "/auth/login" });
  const { getRepair } = useRepairsBackend();
  const addToast = useToast();
  const router = useRouter();
  const [repairToEdit, setRepairToEdit] = useState<FrontendRepair | null>(null);
  const { repairId: repairEditId } = router.query;

  useEffect(() => {
    if (repairEditId) {
      getRepair(Number(repairEditId))
        .then((repair) => {
          setRepairToEdit(repair);
        })
        .catch((err) => {
          if (!(err instanceof RepairBackendError)) {
            console.log("unknwon error occurred while getting repair information:", err);
            addToast(new ToastData("Edit Repair", "Unable to load repair information", "danger"));
          }
          router.back();
        });
    }
  }, [repairEditId]); // eslint-disable-line react-hooks/exhaustive-deps

  //TODO avoid displaying undefined
  return (
    <SimplePageWrapper
      title={`Edit Repair: ${repairEditId} - ${moment(repairToEdit?.date).format("D. MMM. YYYY HH:mm") || ""}`}
    >
      {!repairToEdit && <Spinner />}
      {repairToEdit && (
        <Col className="col-12 col-lg-6 mt-3">
          <EditRepair repairToEdit={repairToEdit} />
        </Col>
      )}
    </SimplePageWrapper>
  );
};

export default EditCarPage;
