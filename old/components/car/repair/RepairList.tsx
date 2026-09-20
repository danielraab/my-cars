import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";
import Link from "next/link";
import React, { useContext } from "react";
import CarContext from "../../../context/car-context";
import { FrontendRepair } from "../../../lib/types/car";
import Alert from "../../utilities/helper/Alert";
import AmountSum from "../../utilities/helper/AmountSum";
import Table from "../../utilities/helper/Table";

export interface HideRepairColumn {
  date?: boolean;
  car?: boolean;
  station?: boolean;
  odometer?: boolean;
  type?: boolean;
  amount?: boolean;
  action?: boolean;
}

type RepairListProps = {
  repairList: FrontendRepair[];
  hideColumns?: HideRepairColumn;
};

const RepairList = (props: RepairListProps) => {
  const { carList } = useContext(CarContext);
  if (props.repairList && props.repairList.length > 0) {
    return (
      <>
        <Table striped hoverable small bordered responsive>
          <thead>
            <tr className="text-center align-middle">
              {!props.hideColumns?.date && <th>Date</th>}
              {!props.hideColumns?.car && <th>Car</th>}
              {!props.hideColumns?.station && <th>Station</th>}
              {!props.hideColumns?.odometer && <th>Odometer</th>}
              {!props.hideColumns?.type && <th>Type</th>}
              {!props.hideColumns?.amount && <th>Amount</th>}
              {!props.hideColumns?.action && <th>Actions</th>}
            </tr>
          </thead>
          <tbody className="text-center">
            {props.repairList
              .sort((elem, next) => next.date.getTime() - elem.date.getTime())
              .map((item) => {
                const car = carList.find((car) => car.id === item.CarId);
                return (
                  <tr key={item.id} title={item.description}>
                    {!props.hideColumns?.date && <td>{moment(item.date)?.format("DD.MM.YYYY HH:mm")}</td>}
                    {!props.hideColumns?.car && (
                      <td>
                        <Link href={`/cars/${item.CarId}`}>{car ? `${car.carMake} ${car.name}` : item.CarId}</Link>
                      </td>
                    )}
                    {!props.hideColumns?.station && <td>{item.station}</td>}
                    {!props.hideColumns?.odometer && <td>{item.odometerReading} km</td>}
                    {!props.hideColumns?.type && <td>{item.type}</td>}
                    {!props.hideColumns?.amount && <td>{item.amount} €</td>}
                    {!props.hideColumns?.action && (
                      <td className="text-center">
                        <Link href={`/repairs/${item.id}/edit`}>
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
          <AmountSum list={props.repairList} />
        </div>
      </>
    );
  } else {
    return <Alert variant="primary">No repairs to show.</Alert>;
  }
};

export default RepairList;
