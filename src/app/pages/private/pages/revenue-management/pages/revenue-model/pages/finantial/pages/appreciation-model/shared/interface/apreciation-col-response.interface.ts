import { AppreciationColModel } from "../models/appreciation-col.model";

export interface IAppreciationCOlsService {
    columsToSelect: AppreciationColModel[];
    columsSelected: AppreciationColModel[];
    allAppreciations: any[],
    all_depa: AppreciationColModel,
    percentages: any;
}