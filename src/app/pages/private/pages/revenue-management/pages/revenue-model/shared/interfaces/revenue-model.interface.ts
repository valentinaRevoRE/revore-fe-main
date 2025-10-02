export interface IRevenueModel {
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
  finalAveragePrice:  number;
  finalMarket25: number;
  finalMarket75: number;
  finalPrice25: number;
  finalPrice75: number;
  finalPricePerM2: number;
  priceList: number;
  projectedAppreciationOfUnsold: number;
  revenueSimulations: number;
  sales: number;
  simulatedAppreciation: number;
}