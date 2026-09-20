import {
  Chart as ChartJS,
  TimeScale, //Import timescale instead of category for X axis
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Colors,
} from "chart.js";
import "chartjs-adapter-moment";
import { useContext, useMemo } from "react";
import { Line } from "react-chartjs-2";
import CarContext from "../../context/car-context";
import { FuelType } from "../../lib/types/car";
import { FrontendRefuel } from "../../lib/types/refuel";
import Spinner from "../utilities/helper/Spinner";

ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Colors);

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "Fuel-Price",
    },
  },
  scales: {
    x: {
      type: "time" as const,
    },
  },
};

interface FuelPriceChartProps {
  refuelList: FrontendRefuel[];
}

interface RefuelWithFuelType extends FrontendRefuel {
  baseFuel?: FuelType;
}

export default function FuelPriceChart(props: FuelPriceChartProps) {
  const { carList } = useContext(CarContext);

  const chartData = useMemo(
    () =>
      new RefuelAdapter(
        props.refuelList.map((refuel) => {
          const car = carList.find((car) => car.id === refuel.CarId);
          return { ...refuel, baseFuel: car?.fuel };
        })
      ).getChartData(),
    [props.refuelList, carList]
  );

  return (
    <>
      {chartData && props.refuelList && <Line options={options} data={chartData} />}
      {!chartData && <Spinner />}
    </>
  );
}

interface ChartDataSetEntry {
  x: Date;
  y: number;
}

class RefuelAdapter {
  refuelList: RefuelWithFuelType[];

  refuelMap = new Map<string, ChartDataSetEntry[]>();

  constructor(refuelList: RefuelWithFuelType[]) {
    this.refuelList = refuelList;
    this.sortIntoMap();
  }

  sortIntoMap() {
    this.refuelList.forEach((refuel) => {
      if (refuel.perLiter) {
        const fuelString = `${refuel.baseFuel} ${refuel.fuel}`;
        const fuelList = this.refuelMap.get(fuelString) || [];
        fuelList.push({ x: refuel.date, y: refuel.perLiter });
        this.refuelMap.set(fuelString, fuelList);
      }
    });
  }

  getChartData() {
    return {
      datasets: Array.from(this.refuelMap).map((entry) => {
        return { label: entry[0], data: entry[1] };
      }),
    };
  }
}
