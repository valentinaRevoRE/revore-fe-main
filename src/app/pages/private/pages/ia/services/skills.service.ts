import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environments.local';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { levelToNivel, Skill, SkillCatalogResponse, SkillRelease } from '../models/skill.model';

const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class SkillsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.revore.backendUrl}/api/skills`;

  private catalogCache$: Observable<Skill[]> | null = null;
  private catalogCachedAt = 0;

  private releasesCache$: Observable<SkillRelease[]> | null = null;
  private releasesCachedAt = 0;

  catalog(): Observable<Skill[]> {
    const now = Date.now();
    if (this.catalogCache$ && now - this.catalogCachedAt < CACHE_TTL_MS) {
      return this.catalogCache$;
    }
    this.catalogCachedAt = now;
    this.catalogCache$ = this.http
      .get<SkillCatalogResponse>(`${this.base}/catalog`)
      .pipe(
        map(r => r.skills.map(s => ({
          name: s.name,
          version: s.version,
          area: s.area,
          nivel: levelToNivel(s.level),
          description: s.description,
          updated_at: s.updated_at,
          size: s.zip_size_kb != null ? `${s.zip_size_kb} KB` : undefined,
          tags: s.dependencies?.length ? s.dependencies : undefined,
        }))),
        shareReplay(1),
      );
    return this.catalogCache$;
  }

  detail(name: string): Observable<Skill> {
    return this.http.get<any>(`${this.base}/${name}`).pipe(
      map(d => ({
        name: d.name,
        version: d.version,
        area: d.area,
        nivel: d.nivel ?? levelToNivel(d.level ?? 2),
        description: d.description,
        updated_at: d.updated_at ?? d.last_updated ?? '',
        size: d.zip_size_kb != null ? `${d.zip_size_kb} KB` : undefined,
        tags: d.dependencies?.length ? d.dependencies : undefined,
      })),
    );
  }

  manual(name: string): Observable<string> {
    return this.http.get(`${this.base}/${name}/manual`, { responseType: 'text' });
  }

  releases(): Observable<SkillRelease[]> {
    const now = Date.now();
    if (this.releasesCache$ && now - this.releasesCachedAt < CACHE_TTL_MS) {
      return this.releasesCache$;
    }
    this.releasesCachedAt = now;
    this.releasesCache$ = this.http
      .get<any[]>(`${this.base}/releases`)
      .pipe(
        map(rs => rs.map(r => ({
          version: r.version ?? '',
          date: r.published_at ?? '',
          author: r.name ?? '',
          body: r.body ?? '',
          html_url: r.assets?.[0]?.browser_download_url,
        }))),
        shareReplay(1),
      );
    return this.releasesCache$;
  }

  changelog(): Observable<string> {
    return this.http.get(`${this.base}/changelog`, { responseType: 'text' });
  }

  download(name: string): Observable<Blob> {
    return this.http.get(`${this.base}/${name}/download`, { responseType: 'blob' });
  }
}
