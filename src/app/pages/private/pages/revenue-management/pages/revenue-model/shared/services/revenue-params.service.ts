import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environments.local';
import { PATHS } from '@shared/constants/paths.const';
import { BehaviorSubject, tap } from 'rxjs';
import { IRevenueParams } from '../interfaces/revenue-params.interface';

@Injectable({
  providedIn: 'root',
})
export class RevenueParamsService {
  private _params$: BehaviorSubject<IRevenueParams> = new BehaviorSubject({ numPredictions: 100, target: 1000 });

  constructor(private http: HttpClient) {}

  getParams() {
    const url: string = `${environment.apiUrl}${PATHS.PARAMS_GET}`;
    return this.http.post(url, { limit: 10 }).pipe(tap((data: any) => {
      if(data.parameters.length > 0)
      this._params$.next(data.parameters[0]);
    }));
  }

  updateParams(params: IRevenueParams){
    const newParam: IRevenueParams = {...params};
    const url: string = `${environment.apiUrl}${PATHS.PARAMS_EDIT}/${params._id}`;
    delete newParam?._id;
    return this.http.put(url, newParam);
  }

  get params() {
    return this._params$;
  }
}
