import SimplePageWrapper from "../../components/SimplePageWrapper";
import { Col } from "../../components/utilities/layout/Container";
import useAuth from "../../hooks/use-auth";
import Stack from "../../components/utilities/helper/Stack";
import Button from "../../components/utilities/form/Button";
import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import Spinner from "../../components/utilities/helper/Spinner";
import RefuelList from "../../components/car/refuel/RefuelList";
import useToast from "../../hooks/use-toast";
import { ToastData } from "../../lib/frontend/toastData";
import useRefuelsBackend, { RefuelBackendError } from "../../hooks/fetch/use-refuels-backend";
import { FilteredCar, FrontendCar } from "../../lib/types/car";
import ButtonSelect from "../../components/utilities/filter/ButtonSelect";
import CarContext from "../../context/car-context";
import { FrontendRefuel } from "../../lib/types/refuel";
import FuelPriceChart from "../../components/chart/FuelPriceChart";

function refuelListToCarFilterList(list: FrontendRefuel[], carList: FrontendCar[]): FilteredCar[] {
  const distinctCarIds = [...new Set(list.map((elem) => elem.CarId))];
  const carObjArr: FrontendCar[] = distinctCarIds.map<FrontendCar>((carId) => {
    return carList.find((car) => car.id === carId)!;
  });
  return carObjArr.map((car) => {
    return { ...car, id: car.id!, label: car?.name, state: true };
  });
}

export default function Refuels() {
  useAuth({ redirectTo: "/auth/login" });
  const { getAllRefuels } = useRefuelsBackend();
  const addToast = useToast();
  const [loaded, setLoaded] = useState(false);

  const { carList } = useContext(CarContext);

  const [refuelList, setRefuelList] = useState<FrontendRefuel[]>([]);
  const [carFilterList, setCarFilterList] = useState<FilteredCar[]>([]);

  const fetchAllRefuels = () => {
    setLoaded(false);
    getAllRefuels()
      .then((list) => {
        setRefuelList(list);
      })
      .catch((err) => {
        if (!(err instanceof RefuelBackendError)) {
          console.error(err);
          addToast(new ToastData("Load refuels", "Error while loading.", "danger", false));
        }
      })
      .finally(() => {
        setLoaded(true);
      });
  };

  useEffect(() => {
    fetchAllRefuels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (refuelList && refuelList.length && carList && carList.length)
      setCarFilterList(refuelListToCarFilterList(refuelList, carList));
  }, [refuelList, carList]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SimplePageWrapper title="Refuels">
      <Col className="col-12 col-lg-10 mt-3">
        <FuelPriceChart refuelList={refuelList} />
        <h3 className="mt-5">List of refuels:</h3>
        <Stack horizontal className="my-3">
          <div>
            Filter:{" "}
            <ButtonSelect
              list={carFilterList}
              onChange={(newCarFilter) => {
                setCarFilterList(newCarFilter);
              }}
            />
          </div>
          <Link className="ms-auto" href="/refuels/create">
            <Button btnClass="success">Add new refuel</Button>
          </Link>
        </Stack>
        {!loaded && (
          <div className="text-center">
            <Spinner />
          </div>
        )}
        {loaded && (
          <RefuelList
            refuelList={refuelList.filter((refuel) =>
              carFilterList.find((car) => car.id === refuel.CarId && car.state)
            )}
          />
        )}
      </Col>
    </SimplePageWrapper>
  );
}
