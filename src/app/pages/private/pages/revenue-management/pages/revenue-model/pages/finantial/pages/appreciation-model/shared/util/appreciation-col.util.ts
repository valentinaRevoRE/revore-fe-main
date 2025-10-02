import { IAppreciationCol } from '../interface/appreciation-col.interface';
import { AppreciationColModel } from '../models/appreciation-col.model';

// Function to get "Asignar Columnas de apreciación" columns and format for the form
export const appreciationColDtoUtil = (
  list: IAppreciationCol[]
): AppreciationColModel[] => {
  return list.map((col: IAppreciationCol) => new AppreciationColModel(col));
};
export const appreciationColConsultDtoUtil = (
  list: AppreciationColModel[]
): any => {
  const percentages: any = {}
  list.forEach( (item:AppreciationColModel ) => {
    percentages[item.feature] = item.value
  })
  return percentages;
};
// Function to filter columns selected on modal "Asignar Columnas de apreciación"
export const filterappreciationColSelectedUtil = (
  list: IAppreciationCol[]
): IAppreciationCol[] => {
  return list.filter((col: IAppreciationCol) => col.selected);
};

// Function to format selected colums on modal "Asignar Columnas de apreciación" and send them to the database
export const processappreciationColSelectedUtil = (
  selectedCols: any,
  list: AppreciationColModel[],
): { percentages: any } => {
  const formatObject: { percentages: any } = {
    percentages: {}
  }
  list.forEach((item) => {
    if (selectedCols.hasOwnProperty(item.feature)) {
      item.selected = true;
      item.value = selectedCols[item.feature];
      formatObject.percentages[item.feature] = Number(selectedCols[item.feature]);
    } else {
      item.selected = false;
      item.value = 0;
    }
  });
  return formatObject;
};