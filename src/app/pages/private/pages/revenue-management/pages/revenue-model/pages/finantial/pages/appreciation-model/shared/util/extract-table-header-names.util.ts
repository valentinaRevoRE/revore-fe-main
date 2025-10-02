import { IHeaderTable } from "@private/pages/revenue-management/pages/revenue-model/shared/interfaces/headers-table.interface";

export const extractTableHeaderNames = (tableBody: IHeaderTable[]): any[] => {
    const array: any[] = [];
    tableBody.forEach((col) => {
      array.push(col.name);
    });
    return array;
  };
  