import { faCar, faCarSide, faCircleQuestion, faMotorcycle, faTruck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { useContext } from "react";
import CarContext from "../../context/car-context";
import Card from "../utilities/helper/Card";

interface CarCardsProps {
  className?: string;
}

export default function CarCards(props: CarCardsProps) {
  const { carList } = useContext(CarContext);

  const router = useRouter();

  if (carList && carList.length > 0)
    return (
      <div className={`d-flex justify-content-around ${props.className || ""}`}>
        {carList.map((car) => {
          return (
            <Card key={car.id} onClick={() => router.push(`/cars/${car.id}`)} className="m-1">
              <p>
                {
                  <FontAwesomeIcon
                    icon={
                      (car.type === "Car" && faCarSide) ||
                      (car.type === "Truck" && faTruck) ||
                      (car.type === "Bike" && faMotorcycle) ||
                      faCircleQuestion
                    }
                  />
                }
              </p>
              {car.carMake} {car.name}
            </Card>
          );
        })}
      </div>
    );
  else return null;
}
