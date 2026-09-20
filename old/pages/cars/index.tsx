import SimplePageWrapper from "../../components/SimplePageWrapper";
import { Col } from "../../components/utilities/layout/Container";
import useAuth from "../../hooks/use-auth";
import CarList from "../../components/car/CarList";
import Stack from "../../components/utilities/helper/Stack";
import Button from "../../components/utilities/form/Button";
import { useContext, useEffect, useState } from "react";
import { FrontendCar } from "../../lib/types/car";
import Link from "next/link";
import Spinner from "../../components/utilities/helper/Spinner";
import CarContext from "../../context/car-context";
import useToast from "../../hooks/use-toast";
import { ToastData } from "../../lib/frontend/toastData";

export default function Cars(initialCarList: FrontendCar[]) {
  const { currentAuth } = useAuth({ redirectTo: "/auth/login" });
  const addToast = useToast();
  const { carList, reloadCarList } = useContext(CarContext);
  const [loaded, setLoaded] = useState(false);

  const fetchAllCars = () => {
    setLoaded(false);
    reloadCarList()
      .catch(() => {
        addToast(new ToastData("Cars", "Unknown error while getting cars.", "danger"));
      })
      .finally(() => {
        setLoaded(true);
      });
  };

  useEffect(() => {
    if (currentAuth) fetchAllCars();
  }, [currentAuth]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SimplePageWrapper title="Cars">
      <Col className="col-12 col-lg-10 mt-3">
        <Stack>
          <Link className="ms-auto" href="/cars/create">
            <Button onClick={() => {}} btnClass="success">
              Add new car
            </Button>
          </Link>
        </Stack>
        <h3>List of cars:</h3>
        {!loaded && (
          <div className="text-center">
            <Spinner />
          </div>
        )}
        {loaded && <CarList carList={carList} hideColumns={{ isActive: true, fin: true, purchaseDate: true }} />}
      </Col>
    </SimplePageWrapper>
  );
}
