import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environments.local';
import { Observable } from 'rxjs';
import { Agent, AgentExecution } from '../models/agent.model';

@Injectable({ providedIn: 'root' })
export class AgentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.revore.backendUrl}/api/agents`;

  list(): Observable<Agent[]> {
    return this.http.get<Agent[]>(this.base);
  }

  runNow(id: string): Observable<{ execution_id: string; status: string }> {
    return this.http.post<{ execution_id: string; status: string }>(`${this.base}/${id}/run`, {});
  }

  toggle(id: string, activo: boolean): Observable<Agent> {
    return this.http.patch<Agent>(`${this.base}/${id}/toggle`, { activo });
  }

  executions(id: string): Observable<AgentExecution[]> {
    return this.http.get<AgentExecution[]>(`${this.base}/${id}/executions`);
  }
}
