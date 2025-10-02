import { IRevenueModel } from "../interfaces/revenue-model.interface";
import { MRevenueModel } from "../models/revenue-model.model";

export const revenueModelListDto = (revenueModelList: IRevenueModel[]): MRevenueModel[] => {
    return revenueModelList.map((revenueModelItem: IRevenueModel) => {
      return new MRevenueModel(revenueModelItem);
    });
};