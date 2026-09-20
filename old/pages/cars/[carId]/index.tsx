import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import CarDataView from "../../../components/car/details/CarDataView";
import SimplePageWrapper from "../../../components/SimplePageWrapper";
import Button from "../../../components/utilities/form/Button";
import Stack from "../../../components/utilities/helper/Stack";
import { Col } from "../../../components/utilities/layout/Container";
import CarContext from "../../../context/car-context";
import useAuth from "../../../hooks/use-auth";
import CarExpensesLists from "../../../components/car/details/CarExpensesLists";
import Alert from "../../../components/utilities/helper/Alert";
import NavPills, { PillData } from "../../../components/utilities/helper/NavPills";
import ConsumptionChart from "../../../components/chart/ConsumptionChart";
import useRefuelsBackend from "../../../hooks/fetch/use-refuels-backend";
import useRepairsBackend from "../../../hooks/fetch/use-repairs-backend";
import useTicketsBackend from "../../../hooks/fetch/use-tickets-backend";
import { FrontendRefuel } from "../../../lib/types/refuel";
import { FrontendRepair, FrontendTicket } from "../../../lib/types/car";
import Spinner from "../../../components/utilities/helper/Spinner";

type CarExpensesTabs = "carDetail" | "expenseLists" | "graphs";

const carExpenseTabLists: PillData<CarExpensesTabs>[] = [
  { label: "Details", value: "carDetail" },
  { label: "Expenses", value: "expenseLists" },
  { label: "Consumption", value: "graphs" },
];

export default function Car() {
  useAuth({ redirectTo: "/auth/login" });
  const { carList } = useContext(CarContext);
  const [selectedTab, setSelectedTab] = useState<CarExpensesTabs>("carDetail");
  const router = useRouter();
  const { carId } = router.query;
  const car = carList.find((car) => car.id === Number(carId));
  const { getAllRefuels } = useRefuelsBackend();
  const { getAllRepairs } = useRepairsBackend();
  const { getAllTickets } = useTicketsBackend();
  const [carRefuelList, setCarRefuelList] = useState<FrontendRefuel[]>();
  const [carRepairList, setCarRepairList] = useState<FrontendRepair[]>();
  const [carTicketList, setCarTicketList] = useState<FrontendTicket[]>();

  useEffect(() => {
    if (carId) {
      getAllRefuels(Number(carId))
        .then((data) => {
          setCarRefuelList(data);
        })
        .catch((err) => console.error(err));
      getAllRepairs(Number(carId))
        .then((data) => {
          setCarRepairList(data);
        })
        .catch((err) => console.error(err));
      getAllTickets(Number(carId))
        .then((data) => {
          setCarTicketList(data);
        })
        .catch((err) => console.error(err));
    }
  }, [carId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SimplePageWrapper title={`Car - ${car?.carMake || ""} ${car?.name || ""}`}>
      <Col className="col-12 col-lg-10 mt-3">
        {!carId && <Alert variant="primary">Missing car id</Alert>}
        {carId && !car && <Alert variant="warning">Car not found</Alert>}
        {car && (
          <>
            <Stack horizontal>
              <NavPills
                initialPill={"carDetail"}
                pillList={carExpenseTabLists}
                onPillChanged={(p) => {
                  setSelectedTab(p);
                }}
              />
              <Button className="ms-auto" btnClass="warning" onClick={() => router.push(`/cars/${car.id}/edit`)}>
                Edit Car
              </Button>
            </Stack>

            <hr />

            {selectedTab === "carDetail" && (
              <>
                <h4>Car details</h4>
                <CarDataView car={car} />{" "}
              </>
            )}
            {selectedTab === "expenseLists" && (
              <>
                <h4>Car expenses</h4>
                {(carRefuelList && carRepairList && carTicketList && (
                  <CarExpensesLists
                    carId={carId as string}
                    carRefuelList={carRefuelList}
                    carRepairList={carRepairList}
                    carTicketList={carTicketList}
                  />
                )) || <Spinner />}
              </>
            )}
            {selectedTab === "graphs" &&
              ((carRefuelList && <ConsumptionChart refuelList={carRefuelList} />) || <Spinner />)}
          </>
        )}
      </Col>
    </SimplePageWrapper>
  );
}
