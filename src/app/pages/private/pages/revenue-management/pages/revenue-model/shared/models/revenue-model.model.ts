import { IRevenueModel } from '../interfaces/revenue-model.interface';

export class MRevenueModel implements IRevenueModel {
  __v: number;
  _id: string;
  accumulatedNPV: number;
  currentAveragePrice: number;
  currentMarket25: number;
  currentMarket75: number;
  currentPrice25: number;
  currentPrice75: number;
  currentPricePerM2: number;
  currentRevenue: number;
  entrysTarget: number;
  finalAveragePrice: number;
  finalMarket25: number;
  finalMarket75: number;
  finalPrice25: number;
  finalPrice75: number;
  finalPricePerM2: number;
  priceList: number;
  revenueSimulations: number;
  sales: number;
  simulatedAppreciation: number;
  projectedAppreciationOfUnsold: number;


  constructor(priceObject: IRevenueModel) {
    this.__v = priceObject.__v;
    this._id = priceObject._id;
    this.accumulatedNPV = priceObject.accumulatedNPV;
    this.currentAveragePrice = priceObject.currentAveragePrice;
    this.currentMarket25 = priceObject.currentMarket25;
    this.currentMarket75 = priceObject.currentMarket75;
    this.currentPrice25 = priceObject.currentPrice25;
    this.currentPrice75 = priceObject.currentPrice75;
    this.currentPricePerM2 = priceObject.currentPricePerM2;
    this.currentRevenue = priceObject.currentRevenue;
    this.entrysTarget = priceObject.entrysTarget;
    this.finalAveragePrice = priceObject.finalAveragePrice;
    this.finalMarket25 = priceObject.finalMarket25;
    this.finalMarket75 = priceObject.finalMarket75;
    this.finalPrice25 = priceObject.finalPrice25;
    this.finalPrice75 = priceObject.finalPrice75;
    this.finalPricePerM2 = priceObject.finalPricePerM2;
    this.priceList = priceObject.priceList;
    this.projectedAppreciationOfUnsold = priceObject.projectedAppreciationOfUnsold;
    this.revenueSimulations = priceObject.revenueSimulations;
    this.sales = priceObject.sales;
    this.simulatedAppreciation = priceObject.simulatedAppreciation;
  }
  

  calculateM2Total110(totalPrice: number): number {
    return totalPrice * 0.1 + totalPrice;
  }
}
