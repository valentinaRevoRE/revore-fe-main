import { IHeaderTable } from '@private/pages/revenue-management/pages/revenue-model/shared/interfaces/headers-table.interface';
import { IBottomBars } from '../../../../../../../../../../shared/graphics/bottom-bars/interface/bottom-bars.interface';
export interface IAppreciationGetModel {
    tableHeader: IHeaderTable[],
    tableBody: any[],
    graphicData: IBottomBars;
}