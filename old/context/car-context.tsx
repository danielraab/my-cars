import React, { useEffect, useState } from "react";
import useAuth from "../hooks/use-auth";
import useCarsBackend from "../hooks/fetch/use-cars-backend";
import { FrontendCar } from "../lib/types/car";

export interface CarContextType {
  carList: FrontendCar[];
  setCarList: (list: FrontendCar[]) => void;
  reloadCarList: () => Promise<void>;
}

const CarContext = React.createContext<CarContextType>({
  carList: [],
  setCarList: () => {},
  reloadCarList: async () => {},
});

export const CarContextProvider = (props: { children: any }) => {
  const [carList, setCarList] = useState<FrontendCar[]>([]);
  const { currentAuth } = useAuth();
  const { getAllCars } = useCarsBackend();

  const loadCarList = async () => {
    return getAllCars().then((data) => {
      setCarList(data);
    });
  };

  // initial load cars
  useEffect(() => {
    if (currentAuth)
      loadCarList().catch((err) => {
        console.log("failed to load cars", err);
      });
    else setCarList([]);
  }, [currentAuth]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <CarContext.Provider
      value={{
        carList,
        setCarList,
        reloadCarList: loadCarList,
      }}
    >
      {props.children}
    </CarContext.Provider>
  );
};

export default CarContext;
