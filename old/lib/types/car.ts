export const carTypeValues = ["Car", "Bike", "Truck", "Others"] as const;
export type CarType = typeof carTypeValues[number];

export const carMakeValues = ["BMW", "Fiat", "Ford", "VW", "Others"] as const;
export type CarMake = typeof carMakeValues[number];

export const fuelTypeValues = ["Others", "Diesel", "Gasoline", "Electric"] as const;
export type FuelType = typeof fuelTypeValues[number];

export interface FrontendCarWithoutId {
  name: string;
  type: CarType;
  carMake: CarMake;
  fuel: FuelType;
  firstRegistration?: Date;
  licensePlate: string;
  fin: string;
  isActive: Boolean;
  purchaseDate?: Date;
  purchasePrice: number;
}
export interface FrontendCar extends FrontendCarWithoutId {
  id?: number;
}
export interface FilteredCar extends FrontendCar {
  id: number;
  state: boolean;
  label: string;
}

export interface FrontendRepair {
  id?: number;
  date: Date;
  station: string;
  odometerReading: number;
  type: RepairType;
  amount: number;
  description: string;
  CarId: number;
}
export const repairTypeValues = ["Check", "Service", "Wearing part", "Crash repair"] as const;
export type RepairType = typeof repairTypeValues[number];

export interface FrontendTicket {
  id?: number;
  date: Date;
  type: TicketType;
  location: string;
  amount: number;
  description: string;
  CarId: number;
}
export const ticketTypeValues = ["Parking", "Velocity", "Others"] as const;
export type TicketType = typeof ticketTypeValues[number];
