import { AppreciationColModel } from '../models/appreciation-col.model';
import { appreciationGraphicDto } from '../util/appreciation-graphic.util';
import { environment } from '@environments/environment';
import { getAppreciationTableBodyUtil } from '../util/aprecciation-table.util';
import { HttpClient } from '@angular/common/http';
import { IAppreciationGetModel } from '../interface/appreciation-get-model.interface';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PATHS } from '@shared/constants/paths.const';
import { appreciationColConsultDtoUtil, appreciationColDtoUtil, filterappreciationColSelectedUtil } from '../util/appreciation-col.util';
import { IAppreciationCOlsService } from '../interface/apreciation-col-response.interface';
import { UGetTablePriceListHeaders } from '@private/pages/revenue-management/pages/revenue-model/shared/utils/get-table-headers.util';

@Injectable()
export class AppreciationModelService {
  constructor(private http: HttpClient) {}

  getAppreciationColums(): Observable<IAppreciationCOlsService> {
    const url: string = `${environment.apiUrl}${PATHS.APPRECIATION_COLUMNS_GET}`;
    return this.http.post(url, { limit: 1000 }).pipe(
      map((res: any) => {
        const filterCols: any[] = res?.selectedAppreciations?.filter((element: any) => element.feature != 'allDepts'); 
        const columsSelected: any[] = appreciationColDtoUtil(filterappreciationColSelectedUtil(filterCols));
        return {
          columsToSelect: appreciationColDtoUtil(filterCols),
          columsSelected,
          allAppreciations: res?.selectedAppreciations?.filter((element: any) => element.feature != 'allDepts'),
          all_depa: new AppreciationColModel({ ...res?.selectedAppreciations?.filter((element: any) => element.feature == 'allDepts')[0], selected: true }),
          percentages: appreciationColConsultDtoUtil(columsSelected)
        };
      })
    );
  }


  editAppreciationColums(appreciationCol: any) {
    const url: string = `${environment.apiUrl}${PATHS.APPRECIATION_COLUMNS_SAVE}`;
    return this.http.post(url, appreciationCol );
  }

  getAppreciationModel(): Observable<IAppreciationGetModel> {
    const url: string = `${environment.apiUrl}${PATHS.APPRECIATION_MODEL}`;
    return this.http.post<IAppreciationGetModel>(url, { limit: 50 }).pipe(
      map((resp: any) => {
        const tableHeader = UGetTablePriceListHeaders(resp?.appreciationsProcess[0] ?? []);
        const tableBody = getAppreciationTableBodyUtil(tableHeader, resp?.appreciationsProcess);
        return {
          tableHeader,
          tableBody,
          graphicData: appreciationGraphicDto(tableHeader, resp?.appreciationsProcess),
        };
      })
    );
  }

  downloadAppreciationModel(){
    const url: string = `${environment.apiUrl}${PATHS.APPRECIATION_DOWNLOAD}`;
    return this.http.get(url, { responseType: 'blob' })
  }
}
