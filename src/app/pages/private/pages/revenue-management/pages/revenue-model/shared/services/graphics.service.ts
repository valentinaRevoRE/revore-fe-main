import { Injectable, inject } from '@angular/core';
import { AppreciationModelService } from '@private/pages/revenue-management/pages/revenue-model/pages/finantial/pages/appreciation-model/shared/services/appreciation-model.service';
import { RevenueModelService } from '@private/pages/revenue-management/pages/revenue-model/pages/finantial/pages/revenue-model/shared/services/revenue-model.service';

import { Observable, map, mergeMap, of, zip } from 'rxjs';
import { PATHS } from '@shared/constants/paths.const';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { IDashboardData } from '../interfaces/dashboard.interface';
import { formatRevenueGraphicMt2Data, formatRevenueGraphicPriceEvlData } from '../../pages/finantial/pages/revenue-model/shared/utils/format-revenue-graphic-data.util';

@Injectable()
export class GraphicsService {
  revenueService = inject(RevenueModelService);
  appreciationService = inject(AppreciationModelService);

  constructor(private http: HttpClient){}

  getGraphics() {
    return this.appreciationService.getAppreciationColums().pipe(
      mergeMap((res: any) => {
        return zip(
          this.appreciationService.getAppreciationModel(),
          this.revenueService.getRevenueModel(),
          this._getDashboardData(),
        );
      }),
      map((mapRes: any) => {
        return {
          appreciationModel: mapRes[0] ?? [],
          revenuesModel: mapRes[1] ?? [],
          dashboardData: mapRes[2] ?? {},
          priceEvolutionGraphic: formatRevenueGraphicPriceEvlData(mapRes[2] ?? {}),
          mt2Graphic: formatRevenueGraphicMt2Data(mapRes[2] ?? {}),
        };
      })
    );
  }

  private _getDashboardData(): Observable<IDashboardData>{
    const url: string = `${environment.apiUrl}${PATHS.DASHBOARD_GET}`;
    return this.http.post<IDashboardData>(url, { limit: 10 }).pipe( map( (res: any) => {
      return {...res?.dashboards[0]}
    } ) );
  }
}
