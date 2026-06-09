import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { SkillsService } from '../../services/skills.service';
import { isNew, NIVEL_COLORS, Skill } from '../../models/skill.model';

function stripFrontmatter(md: string): string {
  const trimmed = md.trimStart();
  if (!trimmed.startsWith('---')) return trimmed;
  const end = trimmed.indexOf('\n---', 3);
  return end === -1 ? trimmed : trimmed.slice(end + 4).trimStart();
}

@Component({
  selector: 'app-ia-detalle',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="detalle">

      <!-- Breadcrumb + back -->
      <nav class="breadcrumb" aria-label="Ruta de navegación">
        <a routerLink="/dashboard/ia" class="breadcrumb__back" aria-label="Volver al catálogo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
          </svg>
          Skills
        </a>
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

        <!-- Manual -->
        <div class="manual-panel" role="region" aria-label="Manual del skill">
          @if (manualLoading()) {
            <div class="skeleton-body"></div>
          } @else if (manualHtml()) {
            <div class="markdown-body" [innerHTML]="manualHtml()"></div>
          } @else {
            <div class="empty-tab">No hay manual disponible para este skill.</div>
          }
        </div>
      }

    </section>
  `,
  styles: [`
    .detalle {
      padding: 32px 24px 60px;
      max-width: 860px;
      text-align: left;
    }

    /* ── Breadcrumb ── */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      margin-bottom: 24px;
    }
    .breadcrumb__back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #DD7244;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
      padding: 5px 10px 5px 8px;
      border-radius: 6px;
      border: 1.5px solid #f5c6a8;
      background: #fff8f5;
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .breadcrumb__back:hover {
      background: #FEF0E7;
      border-color: #DD7244;
    }
    .breadcrumb__sep { color: #d1d5db; }
    .breadcrumb__current { color: #6b7280; font-size: 13px; }

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

    /* ── Manual panel ── */
    .manual-panel {
      border-top: 2px solid #f1f2f4;
      padding-top: 24px;
    }

    /* ── Markdown body ── */
    .markdown-body {
      font-size: 15px;
      line-height: 1.75;
      color: #374151;
      text-align: left;
    }
    .markdown-body * { text-align: left; box-sizing: border-box; }
    .markdown-body h1 {
      font-size: 20px; font-weight: 700; color: #2E3C59;
      margin: 0 0 20px; padding-bottom: 10px;
      border-bottom: 2px solid #eef0f3;
      text-align: left;
    }
    .markdown-body h2 {
      font-size: 16px; font-weight: 700; color: #2E3C59;
      margin: 32px 0 10px; padding-bottom: 6px;
      border-bottom: 1px solid #eef0f3;
      text-transform: uppercase; letter-spacing: 0.5px;
      text-align: left;
    }
    .markdown-body h3 {
      font-size: 14px; font-weight: 600; color: #374151;
      margin: 20px 0 8px; text-align: left;
    }
    .markdown-body p { margin: 0 0 14px; text-align: left; }
    .markdown-body ul, .markdown-body ol {
      padding-left: 20px; margin: 0 0 14px; text-align: left;
    }
    .markdown-body li { margin-bottom: 5px; }
    .markdown-body code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12.5px;
      background: #f0f4ff;
      padding: 2px 6px;
      border-radius: 4px;
      color: #2E3C59;
      border: 1px solid #dce4f5;
      white-space: nowrap;
    }
    .markdown-body pre {
      background: #1e2a3a;
      padding: 16px 20px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 0 0 16px;
      text-align: left;
    }
    .markdown-body pre code {
      background: none; border: none;
      color: #e2e8f0; padding: 0;
      font-size: 13px; white-space: pre;
    }
    .markdown-body blockquote {
      border-left: 4px solid #DD7244;
      padding: 10px 16px;
      margin: 0 0 16px;
      background: #fff8f5;
      border-radius: 0 6px 6px 0;
      color: #7c3d1a;
      text-align: left;
    }
    .markdown-body table {
      width: 100%; border-collapse: collapse;
      margin: 0 0 20px; font-size: 13px;
      text-align: left;
    }
    .markdown-body thead { background: #f5f7fa; }
    .markdown-body th {
      padding: 10px 14px; text-align: left;
      font-weight: 600; color: #2E3C59;
      border-bottom: 2px solid #e5e7eb;
      font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px;
    }
    .markdown-body td {
      padding: 9px 14px; text-align: left;
      border-bottom: 1px solid #f0f0f4;
      vertical-align: top;
    }
    .markdown-body tr:last-child td { border-bottom: none; }
    .markdown-body tbody tr:hover { background: #fafbfc; }
    .markdown-body a { color: #DD7244; text-decoration: none; }
    .markdown-body a:hover { text-decoration: underline; }
    .markdown-body hr {
      border: none; border-top: 1px solid #eef0f3; margin: 28px 0;
    }
    .markdown-body strong { color: #1f2937; }
    .markdown-body em { color: #4b5563; }

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

  readonly downloading = signal(false);

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
        const html = marked.parse(stripFrontmatter(md), { async: false }) as string;
        this.manualHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
        this.manualLoading.set(false);
      },
      error: () => this.manualLoading.set(false),
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
