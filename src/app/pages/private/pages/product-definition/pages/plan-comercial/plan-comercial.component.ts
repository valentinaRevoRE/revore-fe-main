import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '@private/shared/components/header/header.component';
import { IHeader } from '@private/shared/interfaces/header.interface';
import { PlanComercialParams, PlanComercialPreview } from '../../models/plan-comercial.model';
import { PlanComercialService } from '../../services/plan-comercial.service';

const CANALES = [
  { key: 'digital', label: 'Digital', hint: 'Pauta en Meta, Google, TikTok' },
  { key: 'brokers', label: 'Brokers', hint: 'Inmobiliarias externas' },
  { key: 'offline', label: 'Offline', hint: 'Espectaculares, eventos, prensa' },
  { key: 'prospeccion', label: 'Prospección', hint: 'Llamadas y salidas del equipo' },
  { key: 'referidos', label: 'Referidos/BDD', hint: 'Recomendados y base de datos' },
] as const;

@Component({
  selector: 'app-plan-comercial',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent],
  template: `
    <app-header [data]="headerData" />
    <section class="content">
      <nav class="breadcrumb" aria-label="Ruta de navegación">
        <a routerLink="/dashboard/product-definition" class="breadcrumb__back" aria-label="Volver a Product Definition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
          </svg>
          Product Definition
        </a>
        <span class="breadcrumb__sep">›</span>
        <span class="breadcrumb__current">Plan Comercial</span>
      </nav>
      <p class="intro">Llena los datos y te calculamos cuántos leads, visitas y presupuesto
      necesitas para lograr tu objetivo de ventas — y si el plan es viable — antes de generar el PDF.</p>

      <form [formGroup]="form" class="card">
        <h3>1 · Datos del proyecto</h3>
        <div class="grid">
          <label>Nombre del proyecto
            <input formControlName="project_name" placeholder="Ej. TARE" />
          </label>
          <label>Ubicación
            <input formControlName="ubicacion" placeholder="Ciudad o zona" />
          </label>
          <label>Etapa
            <select formControlName="is_launch">
              <option [ngValue]="true">Lanzamiento</option>
              <option [ngValue]="false">Proyecto andando</option>
            </select>
            <span class="hint">"Andando" = ya está vendiendo y RevoRE toma el control</span>
          </label>
          <label>Ventas mensuales objetivo
            <input type="number" formControlName="ventas_totales" min="0.5" step="0.5" />
            <span class="hint">Unidades/mes en ritmo estable, sin contar F&F</span>
          </label>
          <label>Ticket promedio (MXN)
            <input type="number" formControlName="ticket" min="100000" step="100000" />
            <span class="hint">{{ ticketFmt() }}</span>
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
          <h3>2 · Arranque con conocidos (Friends & Family)</h3>
          <p class="section-hint">Las primeras ventas de un lanzamiento salen de tu base de datos
          y de la gente cercana al proyecto (amigos, familia, proveedores). Esto amortigua los
          primeros meses mientras la pauta digital madura.</p>
          <div class="grid">
            <label>Base de datos general
              <input type="number" formControlName="bdd_general" min="0" />
              <span class="hint">Registros acumulados (interesados de otros proyectos, eventos, etc.)</span>
            </label>
            <label>F&F + proveedores perfilados
              <input type="number" formControlName="ff_perfilados" min="0" />
              <span class="hint">Contactos cercanos con intención real de compra</span>
            </label>
          </div>
        }

        <h3>{{ form.value.is_launch ? '3' : '2' }} · ¿De dónde saldrán las ventas?
          <span class="sum" [class.bad]="distSum() !== 100">
            {{ distSum() === 100 ? '✓ suma 100%' : 'debe sumar 100% (va en ' + distSum() + '%)' }}
          </span>
        </h3>
        <div class="grid" formGroupName="dist">
          @for (c of canales; track c.key) {
            <label>{{ c.label }} (%)
              <input type="number" [formControlName]="c.key" min="0" max="100" />
              <span class="hint">{{ c.hint }} · ≈ {{ ventasCanal(c.key) }} ventas/mes</span>
            </label>
          }
        </div>

        <h3>{{ form.value.is_launch ? '4' : '3' }} · Funnel digital
          <span class="sum">de cada lead pagado, ¿cuántos avanzan?</span>
        </h3>
        <div class="grid" formGroupName="funnel">
          <label>Lead → visita (%)
            <input type="number" formControlName="conv_lead_visita" min="0.1" max="100" step="0.1" />
            <span class="hint">Default 5%: 1 de cada 20 leads agenda visita</span>
          </label>
          <label>Visita → apartado (%)
            <input type="number" formControlName="conv_visita_apartado" min="0.1" max="100" step="0.1" />
            <span class="hint">Default 12.5%: 1 apartado cada 8 visitas</span>
          </label>
          <label>Apartado → firma (%)
            <input type="number" formControlName="conv_apartado_firma" min="1" max="100" />
            <span class="hint">Default 80%: 4 de cada 5 apartados firman</span>
          </label>
          <label>Costo por lead — CPL (MXN)
            <input type="number" formControlName="cpl" min="1" />
            <span class="hint">Lo que te cuesta cada registro en pauta. Típico: $250–$600</span>
          </label>
        </div>

        <h3>{{ form.value.is_launch ? '5' : '4' }} · Estacionalidad
          <span class="sum" [class.bad]="seasonDesbalance()">
            {{ seasonDesbalance() ? 'año no neutro: suma ' + seasonSum() : '✓ año neutro (suma 12.0)' }}
          </span>
        </h3>
        <p class="section-hint">No todos los meses venden igual. 1.0 = mes normal, 1.2 = mes fuerte (+20%),
        0.7 = mes flojo (-30%). La pauta se ajusta sola al mes en que aterriza cada venta.</p>
        <label class="check" style="margin: 0 0 10px;">
          <input type="checkbox" formControlName="usar_estacionalidad" />
          Aplicar estacionalidad al plan mensual
        </label>
        @if (form.value.usar_estacionalidad) {
          <div class="grid season" formArrayName="estacionalidad">
            @for (m of meses; track m; let i = $index) {
              <label>{{ m }}
                <input type="number" [formControlName]="i" min="0.2" max="3" step="0.1" />
              </label>
            }
          </div>
        }

        <div class="actions">
          <button type="button" (click)="calcular()"
                  [disabled]="form.invalid || distSum() !== 100 || loading()">
            {{ loading() ? 'Calculando…' : 'Calcular plan' }}
          </button>
        </div>
        @if (error()) { <p class="error">{{ error() }}</p> }
      </form>

      @if (preview(); as p) {
        <div class="card preview" id="preview">
          <h3>
            Tu plan · {{ p.plan_period }}
            <span class="pill {{ p.semaforo }}">
              {{ p.semaforo === 'verde' ? '✓ Plan viable' : p.semaforo === 'amarillo' ? 'Viable, con costo alto' : '✗ No viable así' }}
            </span>
          </h3>
          <p class="section-hint">De cada $100 que vendas, <strong>\${{ (p.ratio * 100).toFixed(2) }}</strong>
          se van a marketing. Sano: hasta $2 · Riesgo: $2–$4 · No viable: más de $4.</p>

          <div class="chain">
            <div class="step"><span>{{ p.leads_necesarios | number }}</span>leads<em>comprados con pauta</em></div>
            <div class="arrow">→</div>
            <div class="step"><span>{{ p.visitas_necesarias | number }}</span>visitas<em>al proyecto</em></div>
            <div class="arrow">→</div>
            <div class="step"><span>{{ p.apartados_necesarios | number:'1.0-1' }}</span>apartados</div>
            <div class="arrow">→</div>
            <div class="step hl"><span>{{ p.ventas_digital | number:'1.0-1' }}</span>ventas digitales<em>cada mes</em></div>
          </div>

          <div class="kpis">
            <div><span>{{ p.presupuesto_total | currency:'MXN':'symbol-narrow':'1.0-0' }}</span>
              marketing total/mes
              <em>Digital {{ fmtK(p.presupuesto_lineas['digital']) }} ·
                  Offline {{ fmtK(p.presupuesto_lineas['offline']) }} ·
                  Agencia {{ fmtK(p.presupuesto_lineas['operativos']) }} ·
                  Brokers {{ fmtK(p.presupuesto_lineas['brokers']) }}</em></div>
            <div><span>{{ p.ventas_mensuales_valor | currency:'MXN':'symbol-narrow':'1.0-0' }}</span>
              valor de ventas/mes</div>
            <div><span>{{ (p.ratio * 100).toFixed(2) }}%</span>
              costo de venta<em>marketing total ÷ valor de ventas</em></div>
            @if (form.value.is_launch) {
              <div><span>{{ p.ff_ventas_total | number:'1.0-1' }}</span>
                ventas F&F<em>repartidas en los primeros 4 meses</em></div>
            }
          </div>

          @if (p.advertencias.length) {
            <div class="callout">
              <strong>Para tomar en cuenta</strong>
              @for (w of p.advertencias; track w) { <p>{{ w }}</p> }
            </div>
          }

          <div class="actions">
            <button type="button" (click)="descargar()" [disabled]="!p.viable || generating()">
              {{ generating() ? 'Generando PDF…' : 'Descargar plan comercial (PDF)' }}
            </button>
            @if (!p.viable) {
              <span class="hint block">Ajusta los datos hasta que el plan sea viable para poder generar el PDF.</span>
            }
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .content { padding: 20px; max-width: 980px; margin: 0 auto; text-align: left; }
    .breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 16px; }
    .breadcrumb__back { display: inline-flex; align-items: center; gap: 6px; color: #DD7244; text-decoration: none;
      font-weight: 600; font-size: 13px; padding: 5px 10px 5px 8px; border-radius: 6px; border: 1.5px solid #f5c6a8;
      background: #fff8f5; transition: background 0.15s ease, border-color 0.15s ease; }
    .breadcrumb__back:hover { background: #FEF0E7; border-color: #DD7244; }
    .breadcrumb__sep { color: #d1d5db; }
    .breadcrumb__current { color: #6b7280; font-size: 13px; }
    .intro { color: #657A9B; font-size: 13.5px; margin: 0 0 16px; max-width: 640px; }
    .card { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,.1); padding: 24px; margin-bottom: 20px; }
    h3 { color: #2E3C59; margin: 22px 0 8px; font-size: 15px; }
    h3:first-child { margin-top: 0; }
    .section-hint { color: #657A9B; font-size: 12.5px; margin: 0 0 12px; max-width: 640px; line-height: 1.5; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(215px, 1fr)); gap: 14px; }
    .grid.season { grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); gap: 10px; }
    label { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: #2E3C59; font-weight: 600; }
    label.check { flex-direction: row; align-items: center; gap: 8px; margin-top: 18px; }
    .hint { font-weight: 400; color: #98A5BA; font-size: 11.5px; line-height: 1.4; }
    .hint.block { display: block; margin-top: 8px; }
    input, select { padding: 8px 10px; border: 1px solid #D5D5DD; border-radius: 6px; font-size: 14px; color: #2E3C59; font-weight: 400; }
    .sum { font-weight: normal; font-size: 12px; color: #1e8e3e; margin-left: 6px; }
    .sum.bad { color: #c0392b; font-weight: 600; }
    .actions { margin-top: 18px; }
    button { background: #2E3C59; color: #fff; border: 0; border-radius: 6px; padding: 11px 24px; font-size: 14px; cursor: pointer; }
    button:disabled { opacity: .5; cursor: not-allowed; }
    .error { color: #c0392b; margin-top: 10px; font-size: 13px; }
    .pill { font-size: 12px; padding: 4px 12px; border-radius: 12px; margin-left: 8px; font-weight: 600; }
    .pill.verde { background: #e8f5e9; color: #1e8e3e; }
    .pill.amarillo { background: #fef7e0; color: #b9770e; }
    .pill.rojo { background: #fdecea; color: #c0392b; }
    .chain { display: flex; align-items: stretch; gap: 8px; margin: 16px 0; flex-wrap: wrap; }
    .chain .step { background: #F7F8FA; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #657A9B; display: flex; flex-direction: column; min-width: 110px; }
    .chain .step span { font-size: 20px; font-weight: 700; color: #2E3C59; }
    .chain .step em { font-style: normal; font-size: 10.5px; color: #98A5BA; }
    .chain .step.hl { background: #2E3C59; }
    .chain .step.hl, .chain .step.hl span { color: #fff; }
    .chain .step.hl em { color: #B9C3D6; }
    .chain .arrow { align-self: center; color: #98A5BA; font-size: 18px; }
    .kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin: 12px 0; }
    .kpis div { background: #F7F8FA; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #657A9B; display: flex; flex-direction: column; gap: 2px; }
    .kpis span { font-size: 18px; font-weight: 700; color: #2E3C59; }
    .kpis em { font-style: normal; font-size: 10.5px; color: #98A5BA; }
    .callout { background: #fef7e0; border-left: 3px solid #DD7244; border-radius: 6px; padding: 14px 16px; margin: 14px 0; }
    .callout strong { color: #2E3C59; font-size: 13px; display: block; margin-bottom: 6px; }
    .callout p { color: #6b5b2f; font-size: 13px; line-height: 1.55; margin: 6px 0 0; }
  `],
})
export class PlanComercialComponent {
  headerData: IHeader = { title: 'Plan Comercial', margin_top: '45px' };
  readonly canales = CANALES;
  readonly meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

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
    usar_estacionalidad: [true],
    // Curva RevoRE por defecto (mensualización); editable por proyecto
    estacionalidad: this.fb.nonNullable.array(
      [1, 0.9, 1.1, 0.8, 1.2, 1, 0.9, 1, 1.1, 1.1, 1.2, 0.7].map(f => this.fb.nonNullable.control(f)),
    ),
  });

  private readonly formValues = signal(this.form.getRawValue());

  readonly distSum = computed(() => {
    const d = this.formValues().dist;
    return Math.round(d.digital + d.brokers + d.offline + d.prospeccion + d.referidos);
  });

  readonly ticketFmt = computed(() => {
    const t = this.formValues().ticket;
    return t ? `$${Number(t).toLocaleString('es-MX')} MXN por unidad` : '';
  });

  readonly seasonSum = computed(() => {
    const s = this.formValues().estacionalidad ?? [];
    return (s.reduce((a, b) => a + Number(b || 0), 0)).toFixed(1);
  });

  readonly seasonDesbalance = computed(() =>
    this.formValues().usar_estacionalidad && Math.abs(Number(this.seasonSum()) - 12) > 0.6);

  fmtK(v: number | undefined): string {
    return v != null ? `$${Math.round(v / 1000)}k` : '—';
  }

  constructor() {
    this.form.valueChanges.subscribe(() => this.formValues.set(this.form.getRawValue()));
  }

  ventasCanal(key: string): string {
    const v = this.formValues();
    const pct = (v.dist as Record<string, number>)[key] ?? 0;
    return (v.ventas_totales * pct / 100).toFixed(1);
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
      estacionalidad: v.usar_estacionalidad ? v.estacionalidad.map(Number) : null,
    };
  }

  calcular(): void {
    this.error.set(null);
    this.loading.set(true);
    this.svc.preview(this.buildParams()).subscribe({
      next: p => {
        this.preview.set(p);
        this.loading.set(false);
        setTimeout(() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' }), 50);
      },
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
        this.error.set('No se pudo generar el PDF. Revisa las advertencias o intenta de nuevo.');
      },
    });
  }
}
