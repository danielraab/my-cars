import React, { useEffect, useState } from "react";
import { FrontendCar } from "../../../lib/types/car";
import { ToastData } from "../../../lib/frontend/toastData";
import useToast from "../../../hooks/use-toast";
import SimplePageWrapper from "../../../components/SimplePageWrapper";
import { Col } from "../../../components/utilities/layout/Container";
import { useRouter } from "next/router";
import useAuth from "../../../hooks/use-auth";
import Spinner from "../../../components/utilities/helper/Spinner";
import useCarsBackend, { CarBackendError } from "../../../hooks/fetch/use-cars-backend";
import EditCar from "../../../components/car/EditCar";

const EditCarPage = () => {
  useAuth({ redirectTo: "/auth/login" });
  const { getCar } = useCarsBackend();
  const addToast = useToast();
  const router = useRouter();
  const [carToEdit, setCarToEdit] = useState<FrontendCar | null>(null);
  const { carId: carEditId } = router.query;

  useEffect(() => {
    if (carEditId) {
      getCar(Number(carEditId))
        .then((car) => {
          setCarToEdit(car);
        })
        .catch((err) => {
          if (!(err instanceof CarBackendError)) {
            console.log("unknwon error occurred while getting car information:", err);
            addToast(new ToastData("Edit Car", "Unable to load car information", "danger"));
          }
          router.back();
        });
    }
  }, [carEditId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SimplePageWrapper title={`Edit Car: ${carEditId} - ${carToEdit?.carMake} ${carToEdit?.name}`}>
      {!carToEdit && <Spinner />}
      {carToEdit && (
        <Col className="col-12 col-lg-6 mt-3">
          <EditCar carToEdit={carToEdit} />
        </Col>
      )}
    </SimplePageWrapper>
  );
};

export default EditCarPage;
