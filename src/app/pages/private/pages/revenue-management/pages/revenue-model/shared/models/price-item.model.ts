import { INum } from '../interfaces/num.interface';
import { IPriceItem } from '../../pages/finantial/pages/price-list/shared/interfaces/price-list.interface';
import { CurrencyPipe } from '@angular/common';

export class MPriceItem implements IPriceItem {
  num: INum | number;
  level: number;
  archetype: string;
  bedrooms: number;
  program: string;
  bathrooms: number;
  view: string;
  m2int: number;
  m2ext: number;
  m2total: number;
  m2total110: string;
  terreceType: string;
  viewClumDisaggregated: string;
  price: string;
  pricePerM2: string;
  target: string;

  constructor(priceObject: IPriceItem, samplePrice: number) {
    this.num = priceObject.num;
    this.level = priceObject.level;
    this.archetype = priceObject.archetype;
    this.bedrooms = priceObject.bedrooms;
    this.program = priceObject.program;
    this.bathrooms = priceObject.bathrooms;
    this.view = priceObject.view;
    this.m2int = priceObject.m2int;
    this.m2ext = priceObject.m2ext;
    this.m2total = priceObject.m2total;
    this.m2total110 = this.currencyFormat(this.calculateM2Total110(Number(priceObject.price), samplePrice));
    this.terreceType = priceObject.terreceType;
    this.viewClumDisaggregated = priceObject.viewClumDisaggregated;
    this.price = this.currencyFormat(Number(priceObject.price));
    this.pricePerM2 = this.currencyFormat(Number(priceObject.pricePerM2));
    this.target = priceObject.target;
  }

  calculateM2Total110(totalPrice: number, samplePrice : number): number {
    return totalPrice * samplePrice;
  }

  currencyFormat( currency: number ): string{
    const currencyPipe: CurrencyPipe = new CurrencyPipe('en-US');
    return currencyPipe.transform(currency) ?? '';
  }

}
