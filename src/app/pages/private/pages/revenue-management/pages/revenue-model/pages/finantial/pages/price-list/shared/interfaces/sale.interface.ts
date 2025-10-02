export interface ISale {
  salesAmount: ISalesAmount;
}

export interface ISalesAmount {
  numberDepartment: number;
  totalPrice: number;
  initialPayment: number;
  paymentPerPeriod: number;
  numberOfPeriods: number;
  settlement: number;
}

export interface ISaleForm {
  numberDepartment: number;
  totalPrice: number;
  initialPayment: number;
  paymentPerPeriod: number;
  numberOfPeriods: number;
  settlement: number;
}
