import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '@private/shared/components/header/header.component';
import { IHeader } from '@private/shared/interfaces/header.interface';
import { PlanComercialParams, PlanComercialPreview } from '../../models/plan-comercial.model';
import { PlanComercialService } from '../../services/plan-comercial.service';

@Component({
  selector: 'app-plan-comercial',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent],
  template: `
    <app-header [data]="headerData" />
    <section class="content">
      <a class="back" routerLink="/dashboard/product-definition">← Product Definition</a>

      <form [formGroup]="form" class="card">
        <h3>Datos del proyecto</h3>
        <div class="grid">
          <label>Nombre del proyecto
            <input formControlName="project_name" placeholder="Ej. TARE" />
          </label>
          <label>Ubicación
            <input formControlName="ubicacion" placeholder="Ciudad / zona" />
          </label>
          <label>Etapa
            <select formControlName="is_launch">
              <option [ngValue]="true">Lanzamiento</option>
              <option [ngValue]="false">Proyecto andando</option>
            </select>
          </label>
          <label>Ventas mensuales objetivo (sin F&F)
            <input type="number" formControlName="ventas_totales" min="0.5" step="0.5" />
          </label>
          <label>Ticket promedio (MXN)
            <input type="number" formControlName="ticket" min="100000" step="100000" />
          </label>
          <label>Total de unidades
            <input type="number" formControlName="unidades_totales" min="1" />
          </label>
          <label>{{ form.value.is_launch ? 'Fecha de lanzamiento' : 'Mes de inicio del plan' }}
            <input type="month" formControlName="start" />
          </label>
          <label class="check">
            <input type="checkbox" formControlName="tiene_data_mercado" />
            Tenemos data de mercado
          </label>
        </div>

        @if (form.value.is_launch) {
          <h3>Lanzamiento — Friends & Family</h3>
          <div class="grid">
            <label>Base de datos general (registros)
              <input type="number" formControlName="bdd_general" min="0" />
            </label>
            <label>F&F + proveedores perfilados
              <input type="number" formControlName="ff_perfilados" min="0" />
            </label>
          </div>
        }

        <h3>Distribución por canal (%) <span class="sum" [class.bad]="distSum() !== 100">suma: {{ distSum() }}%</span></h3>
        <div class="grid" formGroupName="dist">
          <label>Digital <input type="number" formControlName="digital" min="0" max="100" /></label>
          <label>Brokers <input type="number" formControlName="brokers" min="0" max="100" /></label>
          <label>Offline <input type="number" formControlName="offline" min="0" max="100" /></label>
          <label>Prospección <input type="number" formControlName="prospeccion" min="0" max="100" /></label>
          <label>Referidos/BDD <input type="number" formControlName="referidos" min="0" max="100" /></label>
        </div>

        <h3>Funnel digital</h3>
        <div class="grid" formGroupName="funnel">
          <label>Apartado → firma (%) <input type="number" formControlName="conv_apartado_firma" min="1" max="100" /></label>
          <label>Visita → apartado (%) <input type="number" formControlName="conv_visita_apartado" min="0.1" max="100" step="0.1" /></label>
          <label>Lead → visita (%) <input type="number" formControlName="conv_lead_visita" min="0.1" max="100" step="0.1" /></label>
          <label>CPL (MXN) <input type="number" formControlName="cpl" min="1" /></label>
        </div>

        <div class="actions">
          <button type="button" (click)="calcular()"
                  [disabled]="form.invalid || distSum() !== 100 || loading()">
            {{ loading() ? 'Calculando…' : 'Calcular plan' }}
          </button>
        </div>
        @if (error()) { <p class="error">{{ error() }}</p> }
      </form>

      @if (preview(); as p) {
        <div class="card preview" [attr.data-semaforo]="p.semaforo">
          <h3>
            Vista previa · {{ p.plan_period }}
            <span class="pill {{ p.semaforo }}">{{ p.semaforo === 'verde' ? 'Viable' : p.semaforo === 'amarillo' ? 'Zona de riesgo' : 'No viable' }}
              · ratio {{ (p.ratio * 100).toFixed(2) }}%</span>
          </h3>
          <div class="kpis">
            <div><span>{{ p.leads_necesarios | number }}</span>leads/mes</div>
            <div><span>{{ p.visitas_necesarias | number }}</span>visitas/mes</div>
            <div><span>{{ p.apartados_necesarios | number:'1.0-1' }}</span>apartados/mes</div>
            <div><span>{{ p.presupuesto_digital | currency:'MXN':'symbol-narrow':'1.0-0' }}</span>ppto. digital/mes</div>
            <div><span>{{ p.presupuesto_total | currency:'MXN':'symbol-narrow':'1.0-0' }}</span>ppto. total/mes</div>
            @if (form.value.is_launch) {
              <div><span>{{ p.ff_ventas_total | number:'1.0-1' }}</span>ventas F&F (4 meses)</div>
            }
          </div>
          @for (w of p.advertencias; track w) { <p class="warn">⚠ {{ w }}</p> }
          <div class="actions">
            <button type="button" (click)="descargar()" [disabled]="!p.viable || generating()">
              {{ generating() ? 'Generando PDF…' : 'Descargar plan comercial (PDF)' }}
            </button>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .content { padding: 20px; max-width: 980px; }
    .back { display: inline-block; margin-bottom: 12px; color: #2E3C59; text-decoration: none; font-size: 14px; }
    .card { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,.1); padding: 24px; margin-bottom: 20px; }
    h3 { color: #2E3C59; margin: 18px 0 10px; font-size: 15px; }
    h3:first-child { margin-top: 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; }
    label { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: #657A9B; }
    label.check { flex-direction: row; align-items: center; gap: 8px; margin-top: 18px; }
    input, select { padding: 8px 10px; border: 1px solid #D5D5DD; border-radius: 6px; font-size: 14px; color: #2E3C59; }
    .sum { font-weight: normal; font-size: 12px; color: #657A9B; }
    .sum.bad { color: #c0392b; font-weight: 600; }
    .actions { margin-top: 18px; }
    button { background: #2E3C59; color: #fff; border: 0; border-radius: 6px; padding: 10px 22px; font-size: 14px; cursor: pointer; }
    button:disabled { opacity: .5; cursor: not-allowed; }
    .error { color: #c0392b; margin-top: 10px; font-size: 13px; }
    .warn { color: #b9770e; font-size: 13px; margin: 6px 0; }
    .pill { font-size: 12px; padding: 3px 10px; border-radius: 12px; margin-left: 8px; }
    .pill.verde { background: #e8f5e9; color: #1e8e3e; }
    .pill.amarillo { background: #fef7e0; color: #b9770e; }
    .pill.rojo { background: #fdecea; color: #c0392b; }
    .kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin: 12px 0; }
    .kpis div { background: #F7F8FA; border-radius: 6px; padding: 12px; font-size: 12px; color: #657A9B; display: flex; flex-direction: column; }
    .kpis span { font-size: 18px; font-weight: 700; color: #2E3C59; }
  `],
})
export class PlanComercialComponent {
  headerData: IHeader = { title: 'Plan Comercial', margin_top: '45px' };

  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(PlanComercialService);

  readonly loading = signal(false);
  readonly generating = signal(false);
  readonly error = signal<string | null>(null);
  readonly preview = signal<PlanComercialPreview | null>(null);

  readonly form = this.fb.nonNullable.group({
    project_name: ['', [Validators.required, Validators.minLength(2)]],
    ubicacion: [''],
    is_launch: [true],
    ventas_totales: [4, [Validators.required, Validators.min(0.5)]],
    ticket: [3000000, [Validators.required, Validators.min(100000)]],
    unidades_totales: [100, [Validators.required, Validators.min(1)]],
    tiene_data_mercado: [false],
    start: [this.nextMonth(), Validators.required],
    bdd_general: [0, Validators.min(0)],
    ff_perfilados: [0, Validators.min(0)],
    dist: this.fb.nonNullable.group({
      digital: [60], brokers: [20], offline: [10], prospeccion: [5], referidos: [5],
    }),
    funnel: this.fb.nonNullable.group({
      conv_apartado_firma: [80], conv_visita_apartado: [12.5], conv_lead_visita: [5], cpl: [400],
    }),
  });

  private readonly distValues = signal(this.form.getRawValue().dist);
  readonly distSum = computed(() => {
    const d = this.distValues();
    return Math.round(d.digital + d.brokers + d.offline + d.prospeccion + d.referidos);
  });

  constructor() {
    this.form.controls.dist.valueChanges.subscribe(() =>
      this.distValues.set(this.form.getRawValue().dist));
  }

  private nextMonth(): string {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private buildParams(): PlanComercialParams {
    const v = this.form.getRawValue();
    const [year, month] = v.start.split('-').map(Number);
    return {
      project_name: v.project_name,
      ubicacion: v.ubicacion,
      is_launch: v.is_launch,
      ventas_totales: v.ventas_totales,
      ticket: v.ticket,
      unidades_totales: v.unidades_totales,
      tiene_data_mercado: v.tiene_data_mercado,
      start_month: month,
      start_year: year,
      bdd_general: v.is_launch ? v.bdd_general : 0,
      ff_perfilados: v.is_launch ? v.ff_perfilados : 0,
      distribucion: {
        digital: v.dist.digital / 100,
        brokers: v.dist.brokers / 100,
        offline: v.dist.offline / 100,
        prospeccion: v.dist.prospeccion / 100,
        referidos: v.dist.referidos / 100,
      },
      funnel: {
        conv_apartado_firma: v.funnel.conv_apartado_firma / 100,
        conv_visita_apartado: v.funnel.conv_visita_apartado / 100,
        conv_lead_visita: v.funnel.conv_lead_visita / 100,
        cpl: v.funnel.cpl,
      },
    };
  }

  calcular(): void {
    this.error.set(null);
    this.loading.set(true);
    this.svc.preview(this.buildParams()).subscribe({
      next: p => { this.preview.set(p); this.loading.set(false); },
      error: e => {
        this.loading.set(false);
        this.error.set(e?.error?.detail?.[0]?.msg ?? e?.error?.detail ?? 'No se pudo calcular el plan. Verifica que el backend esté corriendo.');
      },
    });
  }

  descargar(): void {
    this.generating.set(true);
    this.svc.generate(this.buildParams()).subscribe({
      next: blob => {
        this.generating.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plan-comercial-${this.form.getRawValue().project_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.generating.set(false);
        this.error.set('No se pudo generar el PDF. Revisa las advertencias o los logs del backend.');
      },
    });
  }
}
