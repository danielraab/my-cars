import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState } from "react";
import RefuelList from "../refuel/RefuelList";
import RepairList from "../repair/RepairList";
import TicketList from "../ticket/TicketList";
import FromToFilter from "../../utilities/filter/FromToFilter";
import Stack from "../../utilities/helper/Stack";
import useAuth from "../../../hooks/use-auth";
import { DateFilterType, filterDateList } from "../../../lib/general";
import { FrontendRepair, FrontendTicket } from "../../../lib/types/car";
import { FrontendRefuel } from "../../../lib/types/refuel";
import Spinner from "../../utilities/helper/Spinner";
import moment from "moment";

interface CarExpensesListsProps {
  carId: number | string;
  carRefuelList: FrontendRefuel[];
  carRepairList: FrontendRepair[];
  carTicketList: FrontendTicket[];
}

export default function CarExpensesLists(props: CarExpensesListsProps) {
  useAuth({ redirectTo: "/auth/login" });
  const [dateFilter, setDateFilter] = useState<DateFilterType>({ from: moment().subtract(6, "month").toDate() });

  return (
    <>
      {(!props.carRefuelList || !props.carRepairList || !props.carTicketList) && (
        <div className="text-center">
          <Spinner />
        </div>
      )}
      <Stack className="mt-5" horizontal>
        <div className="ms-auto">
          <strong>Filter: </strong>
        </div>
        <div className="ms-3">
          <FromToFilter
            initial={{ from: dateFilter.from, to: dateFilter.to }}
            onChanged={(from, to) => setDateFilter({ from, to })}
          />
        </div>
      </Stack>
      <h4 className="mt-4">
        Refuels{" "}
        <Link href={`/refuels/create?carId=${props.carId}`} title="Add a new Refuel">
          <FontAwesomeIcon icon={faPlusCircle} className="text-success" />
        </Link>
      </h4>
      {props.carRefuelList && (
        <RefuelList refuelList={filterDateList(props.carRefuelList, dateFilter)} hideColumns={{ car: true }} />
      )}
      <h4 className="mt-4">
        Repairs{" "}
        <Link href={`/repairs/create?carId=${props.carId}`} title="Add a new Repair">
          <FontAwesomeIcon icon={faPlusCircle} className="text-success" />
        </Link>
      </h4>
      {props.carRepairList && (
        <RepairList repairList={filterDateList(props.carRepairList, dateFilter)} hideColumns={{ car: true }} />
      )}
      <h4 className="mt-4">
        Tickets{" "}
        <Link href={`/tickets/create?carId=${props.carId}`} title="Add a new Ticket">
          <FontAwesomeIcon icon={faPlusCircle} className="text-success" />
        </Link>
      </h4>
      {props.carTicketList && (
        <TicketList ticketList={filterDateList(props.carTicketList, dateFilter)} hideColumns={{ car: true }} />
      )}
    </>
  );
}
