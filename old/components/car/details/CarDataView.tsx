import moment from "moment";
import { FrontendCar } from "../../../lib/types/car";
import { DataEntry, DataList } from "../../utilities/helper/DataList";

type CarDataProps = {
  car: FrontendCar;
};

export default function CarDataView(props: CarDataProps) {
  return (
    <DataList>
      <DataEntry title="Internal Car Id" value={props.car.id?.toString()} />
      <DataEntry title="Type" value={props.car.type} />
      <DataEntry title="Car make" value={props.car.carMake} />
      <DataEntry title="Name" value={props.car.name} />
      <DataEntry title="Fuel" value={props.car.fuel} />
      <DataEntry title="License Plate" value={props.car.licensePlate} />
      <DataEntry title="FIN" value={props.car.fin} />
      <DataEntry
        title="First Registration"
        value={props.car.firstRegistration && moment(props.car.firstRegistration).format("MM.YYYY")}
      />
      <DataEntry
        title="Purchase Date"
        value={props.car.purchaseDate && moment(props.car.purchaseDate).format("DD. MMMM YYYY")}
      />
      <DataEntry title="Purchase Price" value={`${props.car.purchasePrice} €`} />
    </DataList>
  );
}
