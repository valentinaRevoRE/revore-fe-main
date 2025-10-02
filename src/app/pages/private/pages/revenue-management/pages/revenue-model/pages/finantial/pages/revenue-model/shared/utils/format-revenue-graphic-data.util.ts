import { IDashboardData } from '@private/pages/revenue-management/pages/revenue-model/shared/interfaces/dashboard.interface';
import { MRevenueModel } from '@private/pages/revenue-management/pages/revenue-model/shared/models/revenue-model.model';
import { IFloatBarsGraphic } from '@private/shared/graphics/float-bars/interface/float-bars-interface';
import { IHorizontalLines } from '@private/shared/graphics/horizontal-lines/interfaces/horizontal-line.interface';

export const formatRevenueGraphicBarsData = (
  body: MRevenueModel[]
): IFloatBarsGraphic => {
  const model: any = body[0];
  const formatData: IFloatBarsGraphic = { breakpoints: [] };
  const points: any[] = [
    {name: 'Realizado Revenue',key:'sales'},
    {name: 'Ganancias en NPV',key:'accumulatedNPV'},
    {name: 'Lista precios de inv disp',key:'priceList'},
    {name: 'Apreciación proy no vend.',key:'projectedAppreciationOfUnsold'}
  ];
  let count: number = 0;
  points.forEach( (el: any) => {
    //@ts-ignore
    formatData.breakpoints.push([el.name, count, count, ( model[el.key] + count), (model[el.key] + count)] );
    count += model[el.key];
  })
  formatData.breakpoints.push(['Target de ingresos.',model.entrysTarget, model.entrysTarget, 0, 0]);
  return formatData;
};

export const formatRevenueGraphicMt2Data = (
  body: IDashboardData
): IHorizontalLines => {
  const formatData: IHorizontalLines = { colums: [], rows: [] };
  formatData.colums.push(['string', 'Valor']);
  formatData.colums.push(['number', 'Precio 25% percentile de competidores por m2']);
  formatData.colums.push(['number', 'Precio 75% percentile de competidores por m2']);
  formatData.colums.push(['number', 'Precio actual propio por m2']);
  formatData.colums.push(['number', 'Precio promedio competencia por m2']);
  formatData.rows.push(['Inicial', body.initialPrice25PerM2, body.initialPrice75PerM2, body.initialAveragePricePerM2OfCompany, body.initialAveragePricePerM2OfCompetition ] );
  formatData.rows.push(['Final', body.finalPrice25PerM2, body.finalPrice75PerM2, body.finalAveragePricePerM2OfCompany, body.finalAveragePricePerM2OfCompetition ] );
  return formatData;
};

export const formatRevenueGraphicPriceEvlData = (
  body: IDashboardData
): IHorizontalLines => {
  const formatData: IHorizontalLines = { colums: [], rows: [] };
  formatData.colums.push(['string', 'Valor']);
  formatData.colums.push(['number', 'Precio 25% percentile de competidores']);
  formatData.colums.push(['number', 'Precio 75% percentile de competidore']);
  formatData.colums.push(['number', 'Precio actual propio']);
  formatData.colums.push(['number', 'Precio promedio competencia']);
  formatData.rows.push(['Inicial', body.initialPrice25, body.initialPrice75, body.initialAveragePriceOfCompany, body.initialAveragePriceOfCompetition ] );
  formatData.rows.push(['Final', body.finalPrice25, body.finalPrice75, body.finalAveragePriceOfCompany, body.finalAveragePriceOfCompetition ] );
  return formatData;
};