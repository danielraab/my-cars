import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";
import Link from "next/link";
import React, { useContext } from "react";
import CarContext from "../../../context/car-context";
import { FrontendRefuel } from "../../../lib/types/refuel";
import Alert from "../../utilities/helper/Alert";
import AmountSum from "../../utilities/helper/AmountSum";
import Table from "../../utilities/helper/Table";

export interface HideRefuelColumn {
  date?: boolean;
  car?: boolean;
  station?: boolean;
  odometer?: boolean;
  consumption?: boolean;
  fuel?: boolean;
  liter?: boolean;
  amount?: boolean;
  perLiter?: boolean;
  action?: boolean;
}

type RefuelListProps = {
  refuelList: FrontendRefuel[];
  hideColumns?: HideRefuelColumn;
};

const RefuelList = (props: RefuelListProps) => {
  const { carList } = useContext(CarContext);
  if (props.refuelList && props.refuelList.length > 0) {
    return (
      <>
        <Table striped hoverable small bordered responsive>
          <thead>
            <tr className="text-center align-middle">
              {!props.hideColumns?.date && <th>Date</th>}
              {!props.hideColumns?.car && <th>Car</th>}
              {!props.hideColumns?.station && <th>Station</th>}
              {!props.hideColumns?.odometer && <th>Odometer</th>}
              {!props.hideColumns?.consumption && <th>Consumption</th>}
              {!props.hideColumns?.fuel && <th>Fuel</th>}
              {!props.hideColumns?.liter && <th>Liter</th>}
              {!props.hideColumns?.amount && <th>Amount</th>}
              {!props.hideColumns?.perLiter && <th>per liter</th>}
              {!props.hideColumns?.action && <th>Actions</th>}
            </tr>
          </thead>
          <tbody className="text-center">
            {props.refuelList
              .sort((elem, next) => next.date.getTime() - elem.date.getTime())
              .map((item) => {
                const car = carList.find((car) => car.id === item.CarId);
                return (
                  <tr key={item.id}>
                    {!props.hideColumns?.date && <td>{moment(item.date)?.format("DD.MM.YYYY")}</td>}
                    {!props.hideColumns?.car && (
                      <td>
                        <Link href={`/cars/${item.CarId}`}>{car ? `${car.carMake} ${car.name}` : item.CarId}</Link>
                      </td>
                    )}
                    {!props.hideColumns?.station && <td>{item.station}</td>}
                    {!props.hideColumns?.odometer && <td>{item.odometerReading} km</td>}
                    {!props.hideColumns?.consumption && <td>{item.consumption && `${item.consumption} l/100km`}</td>}
                    {!props.hideColumns?.fuel && <td>{item.fuel}</td>}
                    {!props.hideColumns?.liter && <td>{item.liter} l</td>}
                    {!props.hideColumns?.amount && <td>{item.amount} €</td>}
                    {!props.hideColumns?.perLiter && <td>{item.perLiter ? `${item.perLiter} €/l` : "-"}</td>}
                    {!props.hideColumns?.action && (
                      <td className="text-center">
                        <Link href={`/refuels/${item.id}/edit`}>
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </Link>
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </Table>
        <div className="float-end">
          <AmountSum list={props.refuelList} />
        </div>
      </>
    );
  } else {
    return <Alert variant="primary">No refuels to show.</Alert>;
  }
};

export default RefuelList;
