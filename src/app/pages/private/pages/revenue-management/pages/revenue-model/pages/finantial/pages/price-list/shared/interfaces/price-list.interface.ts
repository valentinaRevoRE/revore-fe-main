import { INum } from "../../../../../../shared/interfaces/num.interface";

export interface IPriceItem {
  allDepts?: string;
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
  m2total110?: string;
  terreceType: string;
  viewClumDisaggregated: string;
  price: string;
  pricePerM2: string;
  target: string;
}
