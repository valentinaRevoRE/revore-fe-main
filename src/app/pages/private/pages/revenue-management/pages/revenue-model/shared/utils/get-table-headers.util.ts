import { CHEADERTABLENAMES } from '../constans/table-headers.constant';
import { IPriceItem } from '../../pages/finantial/pages/price-list/shared/interfaces/price-list.interface';
import { IHeaderTable } from '../interfaces/headers-table.interface';

// Function to get table headers from any object type {0:'level', 1:'view', 2:'terreceType', 3:'bedrooms', 4:'allDepts'}
export const UGetTablePriceListHeaders = (
  tableColums: IPriceItem,
  additionalCols?: any
): IHeaderTable[] => {
  const colums: IHeaderTable[] = [];
  if(tableColums == undefined ) return colums;
  Object?.keys(tableColums)?.forEach((key: string) => {
    CHEADERTABLENAMES[key] &&
      (colums.push({ name: CHEADERTABLENAMES[key], key }));
  });
  if (additionalCols) {
    Object?.keys(additionalCols).forEach((key: string) => {
      CHEADERTABLENAMES[key] &&
        colums.push({ name: CHEADERTABLENAMES[key], key });
    });
  }
  return colums;
};