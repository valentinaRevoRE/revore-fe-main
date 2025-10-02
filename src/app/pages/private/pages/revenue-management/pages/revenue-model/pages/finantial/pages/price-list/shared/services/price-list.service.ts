import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@environments/environments.local';
import { PATHS } from '@shared/constants/paths.const';
import { SaleModel } from '../models/sale.model';
import { IDepaToSend } from '../interfaces/adjustmen-price-1.interface';
import { Observable, map, mergeMap, of, zip } from 'rxjs';
import { priceListDto } from '../utils/price-list.dto';
import { adjustmenDepasList1DTO, availableDepas, saleDepas } from '../utils/adjuntsment-price-1.util';
import { UGetTablePriceListHeaders } from '@private/pages/revenue-management/pages/revenue-model/shared/utils/get-table-headers.util';
import { RevenueParamsService } from '@private/pages/revenue-management/pages/revenue-model/shared/services/revenue-params.service';

@Injectable()
export class PriceListService {
  paramsS = inject(RevenueParamsService);
  constructor(private http: HttpClient) {}

  getPriceList() {
    const url: string = `${environment.apiUrl}${PATHS.PRICE_LIST_GET}`;
    return this.http.post(url, { limit: 1000 }).pipe(
      mergeMap( (res: any) => {
        return zip(
          of(res),
          this.paramsS.getParams()
        )
      }),
      map((res: any) => {
        const { samplePrice = [] }: any = res[1].parameters[0] ?? [];
        const addtionalCols: any = { price110: '110%' };
        const departments = priceListDto(res[0].departments, samplePrice);
        return {
          departments,
          deparmentsNum: adjustmenDepasList1DTO(res[0].departments),
          availableDepas: availableDepas(res[0].departments),
          saleDepas: saleDepas(res[0].departments),
          headers: UGetTablePriceListHeaders(departments[0], addtionalCols)
        };
      })
    );
  }

  uploadPrieListFile(file: File) {
    const url: string = `${environment.apiUrl}${PATHS.PRICE_LIST_UPLOAD}`;
    const data = new FormData();
    data.append('spreadsheet', file);
    return this.http.post(url, data);
  }

  registerSale(sale: SaleModel) {
    const url: string = `${environment.apiUrl}${PATHS.PRICE_LIST_REGISTER_SALE}`;
    return this.http.post(url, sale);
  }

  registerDepreciation(department: { department: number }) {
    const url: string = `${environment.apiUrl}${PATHS.PRICE_LIST_REGISTER_DEPRECIATION}`;
    return this.http.post(url, department);
  }

  registerAdjustmentPrice1(depasList: IDepaToSend) {
    const url: string = `${environment.apiUrl}${PATHS.PRICE_LIST_REGISTER_ADJUSTMENT_PRICE_1}`;
    return this.http.post(url, depasList);
  }

  registerAdjustmentPrice2(data: any) {
    const url: string = `${environment.apiUrl}${PATHS.PRICE_LIST_REGISTER_ADJUSTMENT_PRICE_2}`;
    return this.http.post(url, data);
  }

  downloadPriceListUrl(): Observable<any> {
    const url: string = `${environment.apiUrl}${PATHS.PRICE_LIST_DOWNLOAD}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  deletePriceList(){
    const url: string = `${environment.apiUrl}${PATHS.PRICE_DELETE}`;
    return this.http.delete(url);
  }
}
