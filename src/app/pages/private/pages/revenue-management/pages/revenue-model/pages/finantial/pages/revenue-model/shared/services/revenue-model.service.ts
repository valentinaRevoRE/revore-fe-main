import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { revenueModelListDto } from '@private/pages/revenue-management/pages/revenue-model/shared/utils/revenue-model.dto';
import { PATHS } from '@shared/constants/paths.const';
import { map } from 'rxjs';
import {
  formatRevenueGraphicBarsData,
  formatRevenueGraphicMt2Data,
  formatRevenueGraphicPriceEvlData,
} from '../utils/format-revenue-graphic-data.util';

@Injectable({
  providedIn: 'root',
})
export class RevenueModelService {
  constructor(private http: HttpClient) {}

  getRevenueModel() {
    const url: string = `${environment.apiUrl}${PATHS.REVENUE_MODEL_GET}`;
    return this.http.post(url, { limit: 1000 }).pipe(
      map((res: any) => {
        return {
          tableBody: revenueModelListDto(res.revenuesModel),
          graphicData: formatRevenueGraphicBarsData(
            revenueModelListDto(res.revenuesModel)
          ),
        };
      })
    );
  }
}
