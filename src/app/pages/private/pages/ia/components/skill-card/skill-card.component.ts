import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { isNew, NIVEL_COLORS, Skill } from '../../models/skill.model';
import { SkillsService } from '../../services/skills.service';

@Component({
  selector: 'app-skill-card',
  standalone: true,
  template: `
    <article
      class="skill-card"
      [attr.aria-label]="'Skill ' + skill.name"
      tabindex="0"
      (keydown.enter)="verManual()"
      (keydown.space)="$event.preventDefault(); verManual()"
    >
      <div class="skill-card__color-bar" [style.background]="nivelColor"></div>
      <div class="skill-card__body">
        <div class="skill-card__top">
          <div class="skill-card__name-row">
            <span class="skill-card__name">{{ skill.name }}</span>
            @if (isNew) {
              <span class="badge badge--new" aria-label="Skill nuevo">🆕 Nuevo</span>
            }
          </div>
          <span class="pill pill--area">{{ skill.area }}</span>
        </div>
        <p class="skill-card__desc">{{ skill.description }}</p>
        <footer class="skill-card__footer">
          <div class="skill-card__meta">
            <span class="skill-card__meta-item">v{{ skill.version }}</span>
            <span class="skill-card__sep">·</span>
            <span class="skill-card__meta-item">{{ formatDate(skill.updated_at) }}</span>
            @if (skill.size) {
              <span class="skill-card__sep">·</span>
              <span class="skill-card__meta-item">{{ skill.size }}</span>
            }
          </div>
          <div class="skill-card__actions">
            <button
              class="btn-outline"
              (click)="verManual()"
              aria-label="Ver manual del skill {{ skill.name }}">
              Ver manual
            </button>
            <button
              class="btn-primary"
              (click)="descargar($event)"
              [disabled]="downloading"
              aria-label="Descargar skill {{ skill.name }}">
              @if (downloading) { Descargando… } @else { Descargar }
            </button>
          </div>
        </footer>
      </div>
    </article>
  `,
  styles: [`
    .skill-card {
      display: flex;
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.07);
      overflow: hidden;
      transition: box-shadow 0.2s ease, transform 0.15s ease;
      cursor: pointer;
      outline: none;
    }
    .skill-card:hover, .skill-card:focus-visible {
      box-shadow: 0 6px 20px rgba(0,0,0,0.12);
      transform: translateY(-2px);
    }
    .skill-card__color-bar {
      width: 5px;
      flex-shrink: 0;
    }
    .skill-card__body {
      flex: 1;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .skill-card__top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }
    .skill-card__name-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .skill-card__name {
      font-family: 'Courier New', Courier, monospace;
      font-size: 15px;
      font-weight: 700;
      color: #2E3C59;
      letter-spacing: -0.3px;
    }
    .skill-card__desc {
      font-size: 13px;
      color: #4b5563;
      line-height: 1.55;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .skill-card__footer {
      margin-top: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .skill-card__meta {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .skill-card__meta-item {
      font-size: 11px;
      color: #9ca3af;
    }
    .skill-card__sep { color: #d1d5db; font-size: 11px; }
    .skill-card__actions {
      display: flex;
      gap: 8px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge--new {
      background: #FEF0E7;
      color: #DD7244;
      border: 1px solid #f5c6a8;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
    }
    .pill--area {
      background: #f0f4ff;
      color: #2E3C59;
      border: 1px solid #dce4f5;
    }
    .btn-outline {
      padding: 6px 14px;
      border-radius: 6px;
      border: 1px solid #D5D5DD;
      background: white;
      color: #2E3C59;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease;
      white-space: nowrap;
    }
    .btn-outline:hover {
      background: #f5f6f8;
      border-color: #2E3C59;
    }
    .btn-primary {
      padding: 6px 14px;
      border-radius: 6px;
      border: none;
      background: #DD7244;
      color: white;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease;
      white-space: nowrap;
    }
    .btn-primary:hover:not(:disabled) { background: #c85e30; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class SkillCardComponent {
  @Input({ required: true }) skill!: Skill;

  private readonly router = inject(Router);
  private readonly svc = inject(SkillsService);

  downloading = false;

  get nivelColor(): string {
    return NIVEL_COLORS[this.skill.nivel] ?? '#2E3C59';
  }

  get isNew(): boolean {
    return isNew(this.skill);
  }

  verManual(): void {
    this.router.navigate(['/dashboard/ia', this.skill.name]);
  }

  descargar(event: Event): void {
    event.stopPropagation();
    this.downloading = true;
    this.svc.download(this.skill.name).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.skill.name}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloading = false;
      },
      error: () => { this.downloading = false; },
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
