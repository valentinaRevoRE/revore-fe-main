import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '@private/shared/components/header/header.component';
import { IHeader } from '@private/shared/interfaces/header.interface';
import { Agent, AGENT_DESCRIPTIONS, AgentExecution, periodicidadLabel } from '../../models/agent.model';
import { AgentsService } from '../../services/agents.service';

@Component({
  selector: 'app-ia-agentes',
  imports: [CommonModule, RouterLink, HeaderComponent],
  template: `
    <app-header [data]="headerData" />
    <section class="content">
      <nav class="breadcrumb" aria-label="Ruta de navegación">
        <a routerLink="/dashboard/ia" class="breadcrumb__back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
          </svg>
          Skills
        </a>
        <span class="breadcrumb__sep">›</span>
        <span class="breadcrumb__current">Agentes</span>
      </nav>

      <p class="intro">Los agentes corren solos en el servidor según su horario, leen los Sheets
      de los proyectos y avisan por correo cuando encuentran algo que un humano debe revisar.</p>

      @if (loading()) { <p class="muted">Cargando agentes…</p> }
      @if (error()) { <p class="error">{{ error() }}</p> }

      @for (a of agents(); track a.id) {
        <div class="card" [class.paused]="!a.activo">
          <div class="card__head">
            <div class="card__title">
              <div class="avatar">💸</div>
              <div>
                <h3>{{ a.nombre }}<span class="dev">· {{ a.developer_name }}</span></h3>
                <p class="sched">{{ periodicidad(a) }} · correo a {{ (a.destinatarios.to ?? []).join(', ') || '—' }}</p>
              </div>
            </div>
            <span class="pill" [class.on]="a.activo" [class.off]="!a.activo">
              {{ a.activo ? 'Activo' : 'Pausado' }}
            </span>
          </div>

          <p class="desc">{{ describe(a) }}</p>

          @if (a.last_execution; as ex) {
            <div class="last" [attr.data-status]="ex.status">
              <span class="muted">Última corrida ({{ ex.created_at | date:'d MMM, HH:mm' }}):</span>
              @if (ex.status === 'sent' && ex.resultado) {
                <span>{{ ex.resultado.periodo }} · \${{ ex.resultado.inversion_total | number }} invertidos ·
                {{ ex.resultado.leads_totales }} leads ·
                <b>{{ ex.resultado.hallazgos }} hallazgo(s)</b></span>
              } @else if (ex.status === 'failed') {
                <span class="error">falló — {{ ex.error_message }}</span>
              } @else {
                <span class="muted">{{ ex.status === 'queued' ? 'en cola…' : 'corriendo…' }}</span>
              }
            </div>
            @if (ex.status === 'sent' && ex.resultado?.detalle_hallazgos?.length) {
              <ul class="hallazgos">
                @for (h of ex.resultado?.detalle_hallazgos; track h) { <li>⚠ {{ h }}</li> }
              </ul>
            }
          } @else {
            <p class="muted last">Aún no ha corrido. Próxima corrida: {{ a.next_run ? (a.next_run | date:'d MMM, HH:mm') : 'al llegar la hora programada' }}</p>
          }

          <div class="actions">
            <button class="primary" (click)="runNow(a)" [disabled]="running() === a.id">
              {{ running() === a.id ? 'Corriendo…' : '▶ Correr ahora' }}
            </button>
            <button (click)="toggle(a)">{{ a.activo ? 'Pausar' : 'Activar' }}</button>
            <button (click)="verHistorial(a)">{{ historialDe() === a.id ? 'Ocultar historial' : 'Historial' }}</button>
          </div>

          @if (historialDe() === a.id) {
            <table class="hist">
              <tr><th>Fecha</th><th>Disparo</th><th>Estado</th><th>Resultado</th></tr>
              @for (ex of historial(); track ex.created_at) {
                <tr>
                  <td>{{ ex.created_at | date:'d MMM HH:mm' }}</td>
                  <td>{{ ex.triggered_by === 'manual' ? 'Manual' : 'Programado' }}</td>
                  <td>{{ estadoLabel(ex) }}</td>
                  <td>{{ resumen(ex) }}</td>
                </tr>
              }
              @if (!historial().length) { <tr><td colspan="4" class="muted">Sin corridas todavía</td></tr> }
            </table>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .content { padding: 20px; max-width: 880px; margin: 0 auto; text-align: left; }
    .breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 16px; }
    .breadcrumb__back { display: inline-flex; align-items: center; gap: 6px; color: #DD7244; text-decoration: none;
      font-weight: 600; font-size: 13px; padding: 5px 10px 5px 8px; border-radius: 6px; border: 1.5px solid #f5c6a8;
      background: #fff8f5; }
    .breadcrumb__back:hover { background: #FEF0E7; border-color: #DD7244; }
    .breadcrumb__sep { color: #d1d5db; }
    .breadcrumb__current { color: #6b7280; font-size: 13px; }
    .intro { color: #657A9B; font-size: 13.5px; margin: 0 0 16px; max-width: 640px; }
    .card { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,.1); padding: 20px 24px; margin-bottom: 16px; }
    .card.paused { opacity: .7; }
    .card__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .card__title { display: flex; gap: 12px; align-items: center; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #FEF0E7; display: flex; align-items: center; justify-content: center; font-size: 19px; }
    h3 { color: #2E3C59; margin: 0; font-size: 15px; }
    .dev { color: #98A5BA; font-weight: 400; font-size: 13px; margin-left: 6px; }
    .sched { color: #657A9B; font-size: 12px; margin: 2px 0 0; }
    .pill { font-size: 12px; padding: 4px 12px; border-radius: 12px; font-weight: 600; white-space: nowrap; }
    .pill.on { background: #e8f5e9; color: #1e8e3e; }
    .pill.off { background: #F7F8FA; color: #98A5BA; }
    .desc { color: #657A9B; font-size: 13px; line-height: 1.5; margin: 12px 0; }
    .last { font-size: 13px; color: #2E3C59; background: #F7F8FA; border-radius: 6px; padding: 10px 12px; margin: 0 0 10px; }
    .hallazgos { margin: 0 0 10px; padding-left: 4px; list-style: none; }
    .hallazgos li { color: #b9770e; font-size: 12.5px; line-height: 1.5; margin: 4px 0; }
    .muted { color: #98A5BA; font-size: 13px; }
    .error { color: #c0392b; font-size: 13px; }
    .actions { display: flex; gap: 8px; margin-top: 6px; }
    button { background: #fff; color: #2E3C59; border: 1px solid #D5D5DD; border-radius: 6px; padding: 8px 16px; font-size: 13px; cursor: pointer; }
    button.primary { background: #2E3C59; color: #fff; border-color: #2E3C59; }
    button:disabled { opacity: .5; cursor: not-allowed; }
    .hist { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 12px; }
    .hist th { text-align: left; color: #98A5BA; font-weight: 600; padding: 6px 8px; border-bottom: 1px solid #E8E9ED; }
    .hist td { padding: 6px 8px; border-bottom: 1px solid #F7F8FA; color: #2E3C59; }
  `],
})
export class IaAgentesComponent implements OnInit, OnDestroy {
  headerData: IHeader = { title: 'IA Tools · Agentes', margin_top: '45px' };

  private readonly svc = inject(AgentsService);
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  readonly agents = signal<Agent[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly running = signal<string | null>(null);
  readonly historialDe = signal<string | null>(null);
  readonly historial = signal<AgentExecution[]>([]);

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.stopPolling(); }

  load(): void {
    this.svc.list().subscribe({
      next: agents => {
        this.agents.set(agents);
        this.loading.set(false);
        const busy = agents.some(a => ['queued', 'running'].includes(a.last_execution?.status ?? ''));
        if (busy) this.startPolling(); else this.stopPolling();
        if (!busy) this.running.set(null);
      },
      error: () => { this.loading.set(false); this.error.set('No se pudieron cargar los agentes.'); },
    });
  }

  private startPolling(): void {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => this.load(), 5000);
  }
  private stopPolling(): void {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
  }

  runNow(a: Agent): void {
    this.running.set(a.id);
    this.svc.runNow(a.id).subscribe({
      next: () => { this.load(); this.startPolling(); },
      error: () => { this.running.set(null); this.error.set('No se pudo encolar la corrida.'); },
    });
  }

  toggle(a: Agent): void {
    this.svc.toggle(a.id, !a.activo).subscribe({ next: () => this.load() });
  }

  verHistorial(a: Agent): void {
    if (this.historialDe() === a.id) { this.historialDe.set(null); return; }
    this.historialDe.set(a.id);
    this.historial.set([]);
    this.svc.executions(a.id).subscribe({ next: h => this.historial.set(h) });
  }

  periodicidad(a: Agent): string { return periodicidadLabel(a.periodicidad); }
  describe(a: Agent): string { return AGENT_DESCRIPTIONS[a.tipo] ?? ''; }

  estadoLabel(ex: AgentExecution): string {
    return { queued: 'En cola', running: 'Corriendo', sent: 'Enviado ✓', failed: 'Falló ✗' }[ex.status] ?? ex.status;
  }

  resumen(ex: AgentExecution): string {
    if (ex.status === 'failed') return ex.error_message ?? '';
    const r = ex.resultado;
    if (!r) return '—';
    return `${r.hallazgos ?? 0} hallazgo(s) · $${(r.inversion_total ?? 0).toLocaleString('es-MX')} · ${r.leads_totales ?? 0} leads`;
  }
}
