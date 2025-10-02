import { IDepaToSelect, IDepaToSend } from '../interfaces/adjustmen-price-1.interface';
import { IPriceItem } from '../interfaces/price-list.interface';
export const adjustmenDepasList1DTO = (
  priceList: IPriceItem[]
): IDepaToSelect[] => {
  const depas: IDepaToSelect[] = [];
  priceList.forEach((priceItem: IPriceItem) => {
    depas.push({ num: Number(priceItem.num), value: 0 });
  });
  return depas;
};

export const availableDepas = (
  priceList: any[]
): IDepaToSelect[] => {
  const depas: IDepaToSelect[] = [];
  priceList.forEach((priceItem: any) => {
    priceItem?.departmentState?.state?.toLowerCase() == 'disponible' && depas.push({ num: Number(priceItem.num), value: 0 });
  });
  return depas;
};

export const saleDepas = (
  priceList: any[]
): IDepaToSelect[] => {
  const depas: IDepaToSelect[] = [];
  priceList.forEach((priceItem: any) => {
    priceItem?.departmentState?.state?.toLowerCase() != 'disponible' && depas.push({ num: Number(priceItem.num), value: 0 });
  });
  return depas;
};

export const adjustmenDepas1SendDTO = (
  depasList: any
): IDepaToSend => {
  const depas: IDepaToSend = { adjustmentArray: [], departmensArray: [] };
  Object.keys(depasList).forEach((priceItem: string) => {
    depas.departmensArray.push( Number(priceItem) );
    depas.adjustmentArray.push( depasList[priceItem] );
  });
  return depas;
};
