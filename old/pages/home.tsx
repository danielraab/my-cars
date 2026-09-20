import OverallExpensesStackedBar from "../components/chart/OverallExpensesStackedBar";
import SimplePageWrapper from "../components/SimplePageWrapper";
import { Col } from "../components/utilities/layout/Container";
import { RepairType } from "../lib/types/car";
import useExpensesBackend from "../hooks/fetch/use-expenses-backend";
import { useEffect, useState } from "react";
import { ExpensesData } from "../lib/types/stats";
import Spinner from "../components/utilities/helper/Spinner";
import useAuth from "../hooks/use-auth";
import Alert from "../components/utilities/helper/Alert";
import CarCards from "../components/car/CarCards";
import Link from "next/link";
import Button from "../components/utilities/form/Button";

export default function Home() {
  useAuth({ redirectTo: "/auth/login" });
  const [expenses, setExpenses] = useState<ExpensesData>();
  const { getAllExpenses } = useExpensesBackend();

  async function loadExpenses() {
    setExpenses(await getAllExpenses());
  }

  useEffect(() => {
    loadExpenses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const expensesNotEmpty =
    expenses && (expenses.refuels.length > 0 || expenses.repairs.length > 0 || expenses.tickets.length > 0);

  return (
    <SimplePageWrapper title="Home">
      <Col className="col-12 col-lg-10 mt-3 text-center">
        <CarCards className="mb-5 flex-wrap" />
        <div className="d-flex justify-content-around mb-5 w-75 mx-auto flex-wrap">
          <Link href="/refuels/create" className="m-1">
            <Button btnClass="success">Add new refuel</Button>
          </Link>
          <Link href="/repairs/create" className="m-1">
            <Button btnClass="danger">Add new repair</Button>
          </Link>
          <Link href="/tickets/create" className="m-1">
            <Button btnClass="warning">Add new ticket</Button>
          </Link>
        </div>
        {expenses && expensesNotEmpty && <OverallExpensesStackedBar data={expenses} />}
        {expenses && !expensesNotEmpty && <Alert variant="primary">No expenses to show</Alert>}
        {!expenses && <Spinner />}
      </Col>
    </SimplePageWrapper>
  );
}
