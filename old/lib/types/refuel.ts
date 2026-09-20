export interface FrontendRefuelWithoutId {
  date: Date;
  station: string;
  odometerReading: number;
  distance?: number;
  consumption?: number;
  fuel: SubFuelType;
  liter: number;
  perLiter?: number;
  amount: number;
  CarId: number;
}

export interface FrontendRefuel extends FrontendRefuelWithoutId {
  id: number;
}

export const subFuelTypeValues = ["Normal", "Special", "Others"] as const;
export type SubFuelType = typeof subFuelTypeValues[number];
