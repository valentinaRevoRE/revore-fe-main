import {
  ISale,
  ISaleForm,
  ISalesAmount,
} from '../interfaces/sale.interface';

export class SaleModel implements ISale {
  salesAmount: ISalesAmount;

  constructor(data: ISaleForm) {
    this.salesAmount = {
      numberDepartment: data.numberDepartment,
      totalPrice: data.totalPrice,
      initialPayment: data.initialPayment,
      paymentPerPeriod: data.paymentPerPeriod,
      numberOfPeriods: data.numberOfPeriods,
      settlement: data.settlement
    };
  }
}
