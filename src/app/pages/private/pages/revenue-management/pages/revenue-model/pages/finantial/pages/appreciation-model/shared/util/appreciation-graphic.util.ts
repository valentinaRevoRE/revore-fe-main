import { CHEADERTABLENAMES } from '@private/pages/revenue-management/pages/revenue-model/shared/constans/table-headers.constant';
import { IHeaderTable } from '@private/pages/revenue-management/pages/revenue-model/shared/interfaces/headers-table.interface';
import { IBottomBars } from '@private/shared/graphics/bottom-bars/interface/bottom-bars.interface';

export const appreciationGraphicDto = (
  headers: IHeaderTable[],
  cols: number[]
): IBottomBars => {
  const formatData: IBottomBars = { body: [], header: [], value_text: 'Porcentaje' };
  const auxCol: number[] = [];
  cols.forEach((col: any) => {
    formatData.header.push(CHEADERTABLENAMES[col.features]);
    auxCol.push(col.percentages * 100);
  });
  formatData.body = [[...auxCol]];
  return formatData;
};
