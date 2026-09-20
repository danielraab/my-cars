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
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
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
      text: "Consumption",
    },
  },
  scales: {
    x: {
      type: "time" as const,
    },
  },
};

interface ConsumptionChartProps {
  refuelList: FrontendRefuel[];
}

export default function ConsumptionChart(props: ConsumptionChartProps) {
  const chartData = useMemo(() => new RefuelAdapter(props.refuelList).getChartData(), [props.refuelList]);

  return (
    <>
      {chartData && props.refuelList && <Line options={options} data={chartData} />}
      {!chartData && <Spinner />}
    </>
  );
}

class RefuelAdapter {
  refuelList: FrontendRefuel[];

  constructor(refuelList: FrontendRefuel[]) {
    this.refuelList = refuelList;
  }

  getChartData() {
    return {
      datasets: [
        {
          label: "Consumption l/100km",
          data: this.refuelList.map((refuel) => {
            return { x: refuel.date, y: refuel.consumption };
          }),
        },
      ],
    };
  }
}
