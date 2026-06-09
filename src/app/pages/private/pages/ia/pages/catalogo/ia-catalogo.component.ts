import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { HeaderComponent } from '@private/shared/components/header/header.component';
import { IHeader } from '@private/shared/interfaces/header.interface';
import { SkillCardComponent } from '../../components/skill-card/skill-card.component';
import { ReleasesDrawerComponent } from '../../components/releases-drawer/releases-drawer.component';
import { SkillsService } from '../../services/skills.service';
import { FILTER_OPTIONS, isReleaseNew, Skill, SkillRelease } from '../../models/skill.model';

type FilterOption = typeof FILTER_OPTIONS[number];

@Component({
  selector: 'app-ia-catalogo',
  standalone: true,
  imports: [HeaderComponent, SkillCardComponent, ReleasesDrawerComponent],
  template: `
    <app-header [data]="headerData" />

    <section class="content">

      <!-- Notificación release reciente -->
      @if (latestRelease()) {
        <div class="release-pill-wrapper">
          <button
            class="release-pill"
            (click)="showReleases()"
            aria-label="Ver releases recientes">
            🔔 {{ latestRelease()!.version }} disponible
          </button>
        </div>
      }

      <!-- Toolbar: filtros + búsqueda -->
      <div class="toolbar">
        <div class="filters" role="group" aria-label="Filtrar por tipo">
          @for (opt of filterOptions; track opt) {
            <button
              class="filter-chip"
              [class.filter-chip--active]="activeFilter() === opt"
              (click)="setFilter(opt)"
              [attr.aria-pressed]="activeFilter() === opt">
              {{ opt }}
            </button>
          }
        </div>
        <div class="search-wrapper">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            class="search-input"
            type="search"
            placeholder="Buscar skill…"
            [value]="searchDisplay()"
            (input)="onSearch($event)"
            aria-label="Buscar skill por nombre o descripción"
          />
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-grid">
          @for (_ of skeletons; track $index) {
            <div class="skeleton-card"></div>
          }
        </div>
      }

      <!-- Grid de skills -->
      @if (!loading()) {
        @if (filteredSkills().length === 0) {
          <div class="empty-state">
            <div class="empty-state__icon">🤖</div>
            <p class="empty-state__text">Ningún skill coincide con tu búsqueda.</p>
            <button class="btn-link" (click)="resetFilters()">Limpiar filtros</button>
          </div>
        } @else {
          <div class="skills-grid">
            @for (skill of filteredSkills(); track skill.name) {
              <app-skill-card [skill]="skill" />
            }
          </div>
          <p class="count-label">{{ filteredSkills().length }} de {{ allSkills().length }} skills</p>
        }
      }

    </section>

    <!-- Drawer de releases -->
    <app-releases-drawer
      [open]="releasesOpen()"
      [releases]="releases()"
      (close)="releasesOpen.set(false)"
    />
  `,
  styles: [`
    .content {
      padding: 0 24px 40px;
      position: relative;
    }

    /* ── Release pill ── */
    .release-pill-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 12px;
    }
    .release-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #DD7244;
      color: white;
      border: none;
      padding: 7px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.1s ease;
      box-shadow: 0 2px 8px rgba(221,114,68,0.35);
    }
    .release-pill:hover {
      background: #c85e30;
      transform: scale(1.03);
    }

    /* ── Toolbar ── */
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .filters {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .filter-chip {
      padding: 6px 16px;
      border-radius: 20px;
      border: 1.5px solid #D5D5DD;
      background: white;
      color: #4b5563;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-chip:hover { border-color: #2E3C59; color: #2E3C59; }
    .filter-chip--active {
      background: #2E3C59;
      border-color: #2E3C59;
      color: white;
    }
    .search-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
      background: white;
      border: 1.5px solid #D5D5DD;
      border-radius: 8px;
      padding: 7px 14px;
      min-width: 240px;
      transition: border-color 0.15s ease;
    }
    .search-wrapper:focus-within { border-color: #2E3C59; }
    .search-icon { color: #9ca3af; flex-shrink: 0; }
    .search-input {
      border: none;
      outline: none;
      font-size: 14px;
      color: #111b30;
      background: transparent;
      width: 100%;
    }
    .search-input::placeholder { color: #9ca3af; }

    /* ── Grid ── */
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }

    /* ── Skeleton loading ── */
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }
    .skeleton-card {
      height: 200px;
      border-radius: 10px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ── Empty state ── */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }
    .empty-state__icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state__text {
      font-size: 15px;
      color: #6b7280;
      margin: 0 0 16px;
    }
    .btn-link {
      background: none;
      border: none;
      color: #DD7244;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: underline;
    }

    .count-label {
      margin-top: 16px;
      font-size: 12px;
      color: #9ca3af;
      text-align: right;
    }
  `]
})
export class IaCatalogoComponent implements OnInit {
  private readonly svc = inject(SkillsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly headerData: IHeader = {
    title: 'Librería de Skills',
    description: 'IA Tools — 8 skills especializados activos',
    margin_top: '45px',
  };

  readonly filterOptions = FILTER_OPTIONS;
  readonly skeletons = Array(6);

  readonly loading = signal(true);
  readonly allSkills = signal<Skill[]>([]);
  readonly releases = signal<SkillRelease[]>([]);
  readonly activeFilter = signal<FilterOption>('Todos');
  readonly searchQuery = signal('');
  readonly searchDisplay = signal('');
  readonly releasesOpen = signal(false);

  private readonly searchSubject$ = new Subject<string>();

  readonly filteredSkills = computed<Skill[]>(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.activeFilter();
    return this.allSkills().filter(s =>
      (filter === 'Todos' || s.nivel === filter) &&
      (q === '' || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.area.toLowerCase().includes(q))
    );
  });

  readonly latestRelease = computed<SkillRelease | null>(() => {
    const recent = this.releases().find(r => isReleaseNew(r));
    return recent ?? null;
  });

  ngOnInit(): void {
    // Debounce search
    this.searchSubject$.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(q => this.searchQuery.set(q));

    // Restore filter from URL ?area=
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const area = params['area'] as FilterOption | undefined;
      if (area && this.filterOptions.includes(area)) {
        this.activeFilter.set(area);
      }
    });

    // Load catalog
    this.svc.catalog().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (skills) => {
        this.allSkills.set(skills);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Load releases
    this.svc.releases().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (rels) => this.releases.set(rels),
    });
  }

  onSearch(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.searchDisplay.set(q);
    this.searchSubject$.next(q);
  }

  setFilter(opt: FilterOption): void {
    this.activeFilter.set(opt);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: opt === 'Todos' ? {} : { area: opt },
      queryParamsHandling: 'merge',
    });
  }

  showReleases(): void {
    this.releasesOpen.set(true);
  }

  resetFilters(): void {
    this.activeFilter.set('Todos');
    this.searchQuery.set('');
    this.searchDisplay.set('');
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }
}
