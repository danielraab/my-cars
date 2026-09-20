import { faCircleInfo, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";
import Link from "next/link";
import React from "react";
import { FrontendCar } from "../../lib/types/car";
import Alert from "../utilities/helper/Alert";
import Table from "../utilities/helper/Table";

export interface HideCarColumn {
  type?: boolean;
  name?: boolean;
  carMake?: boolean;
  fuel?: boolean;
  firstRegistration?: boolean;
  licensePlateNumber?: boolean;
  fin?: boolean;
  isActive?: boolean;
  purchaseDate?: boolean;
  purchasePrice?: boolean;
  actions?: boolean;
}

type CarListProps = {
  carList: FrontendCar[];
  hideColumns?: HideCarColumn;
};

const CarList = (props: CarListProps) => {
  if (props.carList && props.carList.length > 0) {
    return (
      <>
        <Table striped hoverable small bordered responsive>
          <thead>
            <tr className="text-center align-middle">
              {!props.hideColumns?.type && <th>Type</th>}
              {!props.hideColumns?.name && <th>Name</th>}
              {!props.hideColumns?.carMake && <th>Car Make</th>}
              {!props.hideColumns?.fuel && <th>Fuel</th>}
              {!props.hideColumns?.firstRegistration && <th>First Registration</th>}
              {!props.hideColumns?.licensePlateNumber && <th>License Plate Number</th>}
              {!props.hideColumns?.fin && <th>FIN</th>}
              {!props.hideColumns?.isActive && <th>Is Active</th>}
              {!props.hideColumns?.purchaseDate && <th>Purchase Date</th>}
              {!props.hideColumns?.purchasePrice && <th>Purchase Price</th>}
              {!props.hideColumns?.actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody className="text-center">
            {props.carList.map((item) => (
              <tr key={item.id}>
                {!props.hideColumns?.type && <td>{item.type}</td>}
                {!props.hideColumns?.name && <td>{item.name}</td>}
                {!props.hideColumns?.carMake && <td>{item.carMake}</td>}
                {!props.hideColumns?.fuel && <td>{item.fuel}</td>}
                {!props.hideColumns?.firstRegistration && (
                  <td>{item.firstRegistration && moment(item.firstRegistration)?.format("MM.YYYY")}</td>
                )}
                {!props.hideColumns?.licensePlateNumber && <td>{item.licensePlate}</td>}
                {!props.hideColumns?.fin && <td>{item.fin}</td>}
                {!props.hideColumns?.isActive && <td>{item.isActive ? "active" : "inactive"}</td>}
                {!props.hideColumns?.purchaseDate && (
                  <td>{item.purchaseDate && moment(item.purchaseDate)?.format("DD.MM.YYYY")}</td>
                )}
                {!props.hideColumns?.purchasePrice && <td>{item.purchasePrice} €</td>}
                {!props.hideColumns?.actions && (
                  <td className="text-center">
                    <Link href={`/cars/${item.id}`}>
                      <FontAwesomeIcon icon={faCircleInfo} className="text-success" />
                    </Link>
                    <Link href={`/cars/${item.id}/edit`} className="ms-2 text-warning">
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </Link>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </>
    );
  } else {
    return <Alert variant="primary">No cars to show.</Alert>;
  }
};

export default CarList;
