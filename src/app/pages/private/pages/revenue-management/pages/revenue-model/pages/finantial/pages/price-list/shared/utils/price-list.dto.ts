import { IPriceItem } from '../interfaces/price-list.interface';
import { MPriceItem } from '../../../../../../shared/models/price-item.model';

export const priceListDto = (priceList: IPriceItem[], samplePrice: number): MPriceItem[] => {
  return priceList.map((priceItem: IPriceItem) => {
    return new MPriceItem(priceItem, samplePrice );
  });
};
