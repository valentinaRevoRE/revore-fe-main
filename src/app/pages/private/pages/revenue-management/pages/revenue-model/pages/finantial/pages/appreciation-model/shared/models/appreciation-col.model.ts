import { IAppreciationCol } from "../interface/appreciation-col.interface";

export class AppreciationColModel implements IAppreciationCol {
    _id;
    feature;
    nameSP;
    selected;
    value;
    percentage;
    constructor(data: IAppreciationCol){
        this._id = data._id;
        this.feature = data.feature;
        this.nameSP = data.nameSP;
        this.selected = data.selected;
        this.value = Number(data?.percentage.toFixed(5));
        this.percentage = Number(data?.percentage.toFixed(5));
    }
}