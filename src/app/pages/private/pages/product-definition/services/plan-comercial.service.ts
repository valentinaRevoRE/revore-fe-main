import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environments.local';
import { Observable } from 'rxjs';
import { PlanComercialParams, PlanComercialPreview } from '../models/plan-comercial.model';

@Injectable({ providedIn: 'root' })
export class PlanComercialService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.revore.backendUrl}/api/skills/plan-comercial`;

  preview(params: PlanComercialParams): Observable<PlanComercialPreview> {
    return this.http.post<PlanComercialPreview>(`${this.base}/preview`, params);
  }

  generate(params: PlanComercialParams): Observable<Blob> {
    return this.http.post(`${this.base}/generate`, params, { responseType: 'blob' });
  }
}
