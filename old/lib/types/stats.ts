export interface AmountStats {
  id: number;
  date: Date;
  amount: number;
  CarId: number;
}

export interface ExpensesData {
  refuels: AmountStats[];
  repairs: AmountStats[];
  tickets: AmountStats[];
}
