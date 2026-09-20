import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { HashMap } from "../../lib/CustomMap";
import { AmountStats, ExpensesData } from "../../lib/types/stats";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function OverallExpensesStackedBar(props: { data: ExpensesData }) {
  const chartDataConverter = new StatsConverter(props.data);
  const options = {
    plugins: {
      title: {
        display: true,
        text: "Overall expenses history",
      },
    },
    responsive: true,
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
      },
    },
  };

  return <Bar options={options} data={chartDataConverter.getBarData()} />;
}

class StatsConverter {
  data: ExpensesData;
  datasetMap = new HashMap<ChartLabel, DataEntrySet>();
  min: ChartLabel | undefined = undefined;
  max: ChartLabel | undefined = undefined;
  constructor(data: ExpensesData) {
    this.data = data;
    this.prepareAllDatasets();
  }

  getBarData() {
    return {
      labels: this.datasetMap.realKeys(),
      datasets: [
        {
          label: "Refuels",
          data: this.datasetMap.realValues().map((ds) => ds.refuelSum),
          backgroundColor: "rgb(255, 99, 132)",
        },
        {
          label: "Repairs",
          data: this.datasetMap.realValues().map((ds) => ds.repairSum),
          backgroundColor: "rgb(75, 192, 192)",
        },
        {
          label: "Tickets",
          data: this.datasetMap.realValues().map((ds) => ds.ticketSum),
          backgroundColor: "rgb(53, 162, 235)",
        },
      ],
    };
  }

  prepareAllDatasets() {
    this.initDatasets();
    this.prepareDataset(this.data.refuels, (ds, v) => ds.addRefuel(v));
    this.prepareDataset(this.data.repairs, (ds, v) => ds.addRepair(v));
    this.prepareDataset(this.data.tickets, (ds, v) => ds.addTicket(v));
  }
  initDatasets() {
    this.findMinAndMax();
    this.fillEmptyDatasetEntries();
  }

  findMinAndMax() {
    this.data.refuels.forEach(this.checkAmountStats.bind(this));
    this.data.repairs.forEach(this.checkAmountStats.bind(this));
    this.data.tickets.forEach(this.checkAmountStats.bind(this));
  }

  checkAmountStats(amountStats: AmountStats) {
    const lbl = new ChartLabel(amountStats.date);
    if (!this.min) this.min = this.max = lbl;
    else if (this.min!.compareTo(lbl) > 0) this.min = lbl;
    else if (this.max!.compareTo(lbl) < 0) this.max = lbl;
  }

  fillEmptyDatasetEntries() {
    let loopVar: ChartLabel = this.min!;
    while (loopVar.compareTo(this.max!) <= 0) {
      this.datasetMap.set(loopVar, new DataEntrySet());
      loopVar = loopVar.getNext();
    }
  }

  prepareDataset(dataset: AmountStats[], addHandler: (ds: DataEntrySet, value: number) => void): void {
    dataset.forEach((stat, i) => {
      const yearMonth = new ChartLabel(stat.date);
      let entry = this.datasetMap.get(yearMonth);
      if (!entry) {
        entry = new DataEntrySet();
        this.datasetMap.set(yearMonth, entry);
      }
      addHandler(entry, stat.amount);
    });
  }
}

class DataEntrySet {
  refuelSum = 0;
  repairSum = 0;
  ticketSum = 0;

  addRefuel(value: number) {
    this.refuelSum += value;
  }
  addRepair(value: number) {
    this.repairSum += value;
  }
  addTicket(value: number) {
    this.ticketSum += value;
  }
}

class ChartLabel {
  year: number;
  month: number;
  constructor(date: Date) {
    this.year = date.getFullYear();
    this.month = date.getMonth() + 1;
  }
  toString() {
    return `${this.year}-${this.month}`;
  }

  getHash(): string {
    return `hash${this.year.toString()}del${this.month.toString()}`;
  }
  compareTo(elem: ChartLabel): number {
    return this.year * 100 + this.month - (elem.year * 100 + elem.month);
  }
  getNext(): ChartLabel {
    const next = { ...this };
    if (next.month == 12) {
      next.year++;
      next.month = 1;
    } else next.month++;
    Object.setPrototypeOf(next, ChartLabel.prototype);
    return next;
  }
}
