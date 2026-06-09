import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';
import { marked } from 'marked';
import { SkillRelease } from '../../models/skill.model';

@Component({
  selector: 'app-releases-drawer',
  standalone: true,
  template: `
    @if (open) {
      <div class="overlay" role="dialog" aria-modal="true" aria-label="Releases recientes" (click)="close.emit()">
        <div class="drawer" (click)="$event.stopPropagation()">
          <div class="drawer__header">
            <div>
              <h2 class="drawer__title">Releases recientes</h2>
              <p class="drawer__subtitle">Últimas versiones publicadas de la Librería de Skills RevoRE</p>
            </div>
            <button class="drawer__close" (click)="close.emit()" aria-label="Cerrar panel de releases">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="drawer__body">
            @if (releases.length === 0) {
              <div class="empty">No hay releases disponibles.</div>
            }
            @for (rel of releases; track rel.version) {
              <article class="release-item">
                <div class="release-item__header">
                  <div class="release-item__version-row">
                    <span class="release-item__version">{{ rel.version }}</span>
                    @if (rel.skill_name) {
                      <span class="pill pill--skill">{{ rel.skill_name }}</span>
                    }
                  </div>
                  <div class="release-item__meta">
                    <span>{{ formatDate(rel.date) }}</span>
                    @if (rel.author) {
                      <span>· {{ rel.author }}</span>
                    }
                  </div>
                </div>
                @if (rel.body) {
                  <div class="release-item__body markdown-body" [innerHTML]="parseMarkdown(rel.body)"></div>
                }
                @if (rel.html_url) {
                  <a [href]="rel.html_url" target="_blank" rel="noopener noreferrer" class="release-item__link" aria-label="Ver release {{ rel.version }} en GitHub">
                    Ver en GitHub →
                  </a>
                }
              </article>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0;
      background: rgba(17, 27, 48, 0.45);
      backdrop-filter: blur(2px);
      z-index: 1000;
      display: flex;
      justify-content: flex-end;
    }
    .drawer {
      width: min(520px, 95vw);
      height: 100vh;
      background: white;
      display: flex;
      flex-direction: column;
      box-shadow: -8px 0 40px rgba(0,0,0,0.15);
      overflow: hidden;
      animation: slideIn 0.22s ease;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    .drawer__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 24px 28px 20px;
      border-bottom: 1px solid #f1f2f4;
      flex-shrink: 0;
    }
    .drawer__title {
      margin: 0 0 4px;
      font-size: 18px;
      font-weight: 700;
      color: #2E3C59;
    }
    .drawer__subtitle {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
    }
    .drawer__close {
      background: none;
      border: none;
      cursor: pointer;
      color: #6b7280;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .drawer__close:hover { background: #f3f4f6; color: #111b30; }
    .drawer__body {
      flex: 1;
      overflow-y: auto;
      padding: 20px 28px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .release-item {
      padding: 18px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #fafafa;
    }
    .release-item__header {
      margin-bottom: 12px;
    }
    .release-item__version-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    }
    .release-item__version {
      font-family: 'Courier New', Courier, monospace;
      font-size: 16px;
      font-weight: 700;
      color: #2E3C59;
    }
    .release-item__meta {
      font-size: 12px;
      color: #9ca3af;
      display: flex;
      gap: 4px;
    }
    .release-item__body {
      font-size: 13px;
      color: #374151;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .release-item__body :global(h1),
    .release-item__body :global(h2),
    .release-item__body :global(h3) {
      font-size: 14px;
      font-weight: 600;
      margin: 10px 0 4px;
      color: #2E3C59;
    }
    .release-item__body :global(ul),
    .release-item__body :global(ol) {
      padding-left: 20px;
      margin: 6px 0;
    }
    .release-item__body :global(code) {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      background: #f1f2f4;
      padding: 2px 5px;
      border-radius: 4px;
    }
    .release-item__link {
      font-size: 12px;
      color: #DD7244;
      text-decoration: none;
      font-weight: 500;
    }
    .release-item__link:hover { text-decoration: underline; }
    .pill {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 500;
    }
    .pill--skill {
      background: #f0f4ff;
      color: #2E3C59;
      border: 1px solid #dce4f5;
    }
    .empty {
      text-align: center;
      padding: 40px;
      color: #9ca3af;
      font-size: 14px;
    }
  `]
})
export class ReleasesDrawerComponent {
  @Input() open = false;
  @Input() releases: SkillRelease[] = [];
  @Output() close = new EventEmitter<void>();

  private readonly sanitizer = inject(DomSanitizer);

  parseMarkdown(text: string): SafeHtml {
    const html = marked.parse(text, { async: false }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
