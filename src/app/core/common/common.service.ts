import { Injectable } from '@angular/core';

const INACTIVITY_MS = 8 * 60 * 60 * 1000; // 8 horas

@Injectable({ providedIn: 'root' })
export class CommonService {
  private persist: Storage = localStorage;

  // Inactividad — se actualiza en cada navegación exitosa
  touchActivity(): void {
    this.persist.setItem('last_activity', Date.now().toString());
  }

  isInactive(): boolean {
    const last = Number(this.persist.getItem('last_activity') ?? '0');
    return last > 0 && Date.now() - last > INACTIVITY_MS;
  }

  clearTokens(): void {
    sessionStorage.clear();
    this.persist.removeItem('last_activity');
  }

  get activeProjectId(): string | null {
    return this.persist.getItem('project_id') ?? null;
  }

  set activeProjectId(id: string) {
    this.persist.setItem('project_id', id);
  }
}
