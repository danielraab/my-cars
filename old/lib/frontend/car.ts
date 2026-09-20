import { OptionHTMLAttributes } from "react";
import { FrontendCar } from "../types/car";

export function frontendCarListToSelectOptionList(carList: FrontendCar[]): OptionHTMLAttributes<HTMLOptionElement>[] {
  return carList.map((car) => {
    return { value: car.id!.toString(), label: `${car.carMake} ${car.name}`, disabled: false };
  });
}
