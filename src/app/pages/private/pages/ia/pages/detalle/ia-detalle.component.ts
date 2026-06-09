import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { SkillsService } from '../../services/skills.service';
import { isNew, NIVEL_COLORS, Skill } from '../../models/skill.model';

type Tab = 'manual' | 'changelog';

@Component({
  selector: 'app-ia-detalle',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="detalle">

      <!-- Breadcrumb -->
      <nav class="breadcrumb" aria-label="Ruta de navegación">
        <a routerLink="/dashboard/ia" class="breadcrumb__link">IA / Asistentes</a>
        <span class="breadcrumb__sep">›</span>
        <span class="breadcrumb__current">{{ skillName() }}</span>
      </nav>

      <!-- Loading -->
      @if (loading()) {
        <div class="skeleton-header"></div>
        <div class="skeleton-body"></div>
      }

      <!-- Error -->
      @if (!loading() && error()) {
        <div class="error-state">
          <p>No se pudo cargar el skill <strong>{{ skillName() }}</strong>.</p>
          <a routerLink="/dashboard/ia" class="btn-primary">← Volver al catálogo</a>
        </div>
      }

      <!-- Contenido -->
      @if (!loading() && skill()) {
        <header class="detalle__header">
          <div class="detalle__title-row">
            <div class="nivel-bar" [style.background]="nivelColor()"></div>
            <div>
              <h1 class="detalle__name">{{ skill()!.name }}</h1>
              <div class="detalle__meta">
                <span class="pill pill--version">v{{ skill()!.version }}</span>
                <span class="pill pill--area">{{ skill()!.area }}</span>
                <span class="pill" [style.background]="nivelColor() + '1a'" [style.color]="nivelColor()">{{ skill()!.nivel }}</span>
                @if (isNewSkill()) {
                  <span class="badge badge--new">🆕 Nuevo</span>
                }
              </div>
              <p class="detalle__updated">Actualizado el {{ formatDate(skill()!.updated_at) }}</p>
            </div>
          </div>

          <div class="detalle__actions">
            <button
              class="btn-primary"
              (click)="descargar()"
              [disabled]="downloading()"
              aria-label="Descargar skill {{ skillName() }} como ZIP">
              @if (downloading()) {
                <svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Descargando…
              } @else {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Descargar .zip
              }
            </button>
          </div>
        </header>

        <!-- Tabs -->
        <div class="tabs" role="tablist">
          <button
            class="tab"
            [class.tab--active]="activeTab() === 'manual'"
            (click)="activeTab.set('manual')"
            role="tab"
            [attr.aria-selected]="activeTab() === 'manual'"
            aria-controls="tab-panel">
            Manual
          </button>
          <button
            class="tab"
            [class.tab--active]="activeTab() === 'changelog'"
            (click)="loadChangelog()"
            role="tab"
            [attr.aria-selected]="activeTab() === 'changelog'"
            aria-controls="tab-panel">
            Changelog
          </button>
        </div>

        <!-- Tab panel -->
        <div class="tab-panel" id="tab-panel" role="tabpanel">
          @if (activeTab() === 'manual') {
            @if (manualLoading()) {
              <div class="skeleton-body"></div>
            } @else if (manualHtml()) {
              <div class="markdown-body" [innerHTML]="manualHtml()"></div>
            } @else {
              <div class="empty-tab">No hay manual disponible para este skill.</div>
            }
          }
          @if (activeTab() === 'changelog') {
            @if (changelogLoading()) {
              <div class="skeleton-body"></div>
            } @else if (changelogHtml()) {
              <div class="markdown-body" [innerHTML]="changelogHtml()"></div>
            } @else {
              <div class="empty-tab">No hay changelog disponible.</div>
            }
          }
        </div>
      }

    </section>
  `,
  styles: [`
    .detalle {
      padding: 32px 24px 60px;
      max-width: 860px;
    }

    /* ── Breadcrumb ── */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      margin-bottom: 24px;
    }
    .breadcrumb__link {
      color: #DD7244;
      text-decoration: none;
      font-weight: 500;
    }
    .breadcrumb__link:hover { text-decoration: underline; }
    .breadcrumb__sep { color: #9ca3af; }
    .breadcrumb__current { color: #4b5563; }

    /* ── Header ── */
    .detalle__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }
    .detalle__title-row {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }
    .nivel-bar {
      width: 6px;
      height: 100%;
      min-height: 70px;
      border-radius: 4px;
      flex-shrink: 0;
      margin-top: 4px;
    }
    .detalle__name {
      margin: 0 0 10px;
      font-size: 26px;
      font-weight: 700;
      color: #2E3C59;
      font-family: 'Courier New', Courier, monospace;
    }
    .detalle__meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .detalle__updated {
      margin: 0;
      font-size: 12px;
      color: #9ca3af;
    }
    .detalle__actions {
      display: flex;
      gap: 10px;
      flex-shrink: 0;
    }

    /* ── Buttons ── */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      background: #DD7244;
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
      text-decoration: none;
    }
    .btn-primary:hover:not(:disabled) { background: #c85e30; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ── Pills ── */
    .pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    .pill--version {
      background: #f0f4ff;
      color: #2E3C59;
      border: 1px solid #dce4f5;
      font-family: 'Courier New', monospace;
    }
    .pill--area {
      background: #f5f5f7;
      color: #374151;
      border: 1px solid #e5e7eb;
    }
    .badge--new {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      background: #FEF0E7;
      color: #DD7244;
      border: 1px solid #f5c6a8;
    }

    /* ── Tabs ── */
    .tabs {
      display: flex;
      border-bottom: 2px solid #f1f2f4;
      margin-bottom: 24px;
      gap: 4px;
    }
    .tab {
      padding: 10px 20px;
      border: none;
      background: none;
      color: #6b7280;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: color 0.15s ease, border-color 0.15s ease;
    }
    .tab:hover { color: #2E3C59; }
    .tab--active {
      color: #DD7244;
      border-bottom-color: #DD7244;
      font-weight: 600;
    }

    /* ── Markdown body ── */
    .markdown-body {
      font-size: 14px;
      line-height: 1.7;
      color: #374151;
    }
    .markdown-body h1 {
      font-size: 22px; font-weight: 700; color: #2E3C59;
      margin: 0 0 16px; padding-bottom: 8px;
      border-bottom: 2px solid #f1f2f4;
    }
    .markdown-body h2 {
      font-size: 18px; font-weight: 700; color: #2E3C59;
      margin: 28px 0 12px;
    }
    .markdown-body h3 {
      font-size: 15px; font-weight: 600; color: #374151;
      margin: 20px 0 8px;
    }
    .markdown-body p { margin: 0 0 14px; }
    .markdown-body ul, .markdown-body ol {
      padding-left: 24px; margin: 0 0 14px;
    }
    .markdown-body li { margin-bottom: 6px; }
    .markdown-body code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      background: #f5f6f8;
      padding: 2px 6px;
      border-radius: 4px;
      color: #DD7244;
    }
    .markdown-body pre {
      background: #1e2a3a;
      padding: 16px 20px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 0 0 16px;
    }
    .markdown-body pre code {
      background: none;
      color: #e2e8f0;
      padding: 0;
      font-size: 13px;
    }
    .markdown-body blockquote {
      border-left: 4px solid #DD7244;
      padding: 8px 16px;
      margin: 0 0 14px;
      background: #FEF0E7;
      border-radius: 0 6px 6px 0;
      color: #7c3d1a;
    }
    .markdown-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 0 0 16px;
      font-size: 13px;
    }
    .markdown-body th {
      background: #f5f6f8;
      padding: 8px 12px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #e5e7eb;
    }
    .markdown-body td {
      padding: 8px 12px;
      border: 1px solid #e5e7eb;
    }
    .markdown-body a {
      color: #DD7244;
      text-decoration: none;
    }
    .markdown-body a:hover { text-decoration: underline; }
    .markdown-body hr {
      border: none;
      border-top: 2px solid #f1f2f4;
      margin: 24px 0;
    }

    /* ── Skeletons ── */
    .skeleton-header {
      height: 100px;
      border-radius: 10px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      margin-bottom: 24px;
    }
    .skeleton-body {
      height: 400px;
      border-radius: 10px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ── States ── */
    .error-state {
      text-align: center;
      padding: 60px 20px;
      color: #6b7280;
    }
    .error-state p { font-size: 15px; margin-bottom: 20px; }
    .empty-tab {
      text-align: center;
      padding: 60px 20px;
      color: #9ca3af;
      font-size: 14px;
    }

    /* ── Spin animation ── */
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
  `]
})
export class IaDetalleComponent implements OnInit {
  private readonly svc = inject(SkillsService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  readonly skillName = signal('');
  readonly skill = signal<Skill | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly manualHtml = signal<SafeHtml | null>(null);
  readonly manualLoading = signal(false);

  readonly changelogHtml = signal<SafeHtml | null>(null);
  readonly changelogLoading = signal(false);
  readonly changelogLoaded = signal(false);

  readonly downloading = signal(false);
  readonly activeTab = signal<Tab>('manual');

  nivelColor(): string {
    return NIVEL_COLORS[this.skill()?.nivel ?? 'Auxiliar'] ?? '#2E3C59';
  }

  isNewSkill(): boolean {
    const s = this.skill();
    return s ? isNew(s) : false;
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const name = params.get('name') ?? '';
      this.skillName.set(name);
      this.loadSkill(name);
    });
  }

  private loadSkill(name: string): void {
    this.loading.set(true);
    this.error.set(false);

    this.svc.detail(name).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (skill) => {
        this.skill.set(skill);
        this.loading.set(false);
        this.loadManual(name);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  private loadManual(name: string): void {
    this.manualLoading.set(true);
    this.svc.manual(name).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (md) => {
        const html = marked.parse(md, { async: false }) as string;
        this.manualHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
        this.manualLoading.set(false);
      },
      error: () => this.manualLoading.set(false),
    });
  }

  loadChangelog(): void {
    this.activeTab.set('changelog');
    if (this.changelogLoaded()) return;
    this.changelogLoading.set(true);
    this.svc.changelog().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (md) => {
        const html = marked.parse(md, { async: false }) as string;
        this.changelogHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
        this.changelogLoading.set(false);
        this.changelogLoaded.set(true);
      },
      error: () => this.changelogLoading.set(false),
    });
  }

  descargar(): void {
    const name = this.skillName();
    if (!name) return;
    this.downloading.set(true);
    this.svc.download(name).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloading.set(false);
      },
      error: () => this.downloading.set(false),
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
