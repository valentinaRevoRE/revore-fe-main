import { CHEADERTABLENAMES } from '@private/pages/revenue-management/pages/revenue-model/shared/constans/table-headers.constant';
import { IHeaderTable } from '@private/pages/revenue-management/pages/revenue-model/shared/interfaces/headers-table.interface';

// Function to get table headers from any array type ['level', 'view', 'terreceType', 'bedrooms', 'allDepts']
export const getCharacteristicsUtil = (tableColums: string[]): string[] => {
  const colums: any[] = [];
  if (tableColums == undefined) return colums;
  tableColums.forEach((el: string) => colums.push(CHEADERTABLENAMES[el]));
  return colums;
};

export const getAppreciationTableBodyUtil = (
  headers: IHeaderTable[],
  resp: any[]
): any[] => {
  const rows: any[] = [];
  resp.forEach((element: any) => {
    const col: any[] = [];
    headers.forEach((header: IHeaderTable, index: number) => {
      index == 0 ? col.push(CHEADERTABLENAMES[element[header.key]]) : col.push(element[header.key]);
    });
    rows.push(col);
  });
  return rows;
};
