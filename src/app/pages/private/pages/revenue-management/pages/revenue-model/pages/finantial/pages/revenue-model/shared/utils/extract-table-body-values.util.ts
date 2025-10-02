import { MRevenueModel } from '@private/pages/revenue-management/pages/revenue-model/shared/models/revenue-model.model';

export const extractTableValues = (tableBody: MRevenueModel[]): any[] => {
  const array: any[] = [];
  tableBody.forEach((col) => {
    array.push([
      col.entrysTarget,
      col.sales,
      col.priceList,
      col.accumulatedNPV,
      col.currentRevenue,
      col.revenueSimulations,
      // col.currentMarket25,
      // col.currentMarket75,
      // col.finalMarket25,
      // col.finalMarket75,
      // col.simulatedAppreciation,
      col.currentPricePerM2,
      col.finalPricePerM2,
      col.currentAveragePrice,
      col.finalAveragePrice,
    ]);
  });
  return array;
};
