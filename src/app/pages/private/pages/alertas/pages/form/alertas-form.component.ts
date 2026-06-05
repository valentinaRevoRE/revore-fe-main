import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '@private/shared/components/header/header.component';
import { IHeader } from '@private/shared/interfaces/header.interface';
import { SelfServiceService } from '@revore/services/self-service.service';
import { SupabaseService } from '@revore/services/supabase.service';
import { DbDeveloper, DbDeveloperGroup, DbSubProject } from '@revore/models/database.types';
import { ToastComponent } from '@shared/components/toast/toast.component';
import { EStates } from '@shared/enums/states.enum';
import { IToast } from '@shared/interfaces/toast.interface';
import { AlertasService } from '../../services/alertas.service';
import { environment } from '@environments/environments.local';
import {
    Alerta,
    autoName,
    CANALES_ALERTA,
    DIAS_SEMANA,
    DiaSemana,
    emptyDestinatarios,
    TIPOS_ALERTA,
} from '../../models/alerta.model';

@Component({
    selector: 'app-alertas-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, HeaderComponent, ToastComponent],
    template: `
        <app-header [data]="headerData" />
        <section class="content">
            <form [formGroup]="form" (ngSubmit)="guardar()" class="card">
                <div class="row autoname">
                    <strong>{{ previewNombre() }}</strong>
                </div>

                <div class="row two-col">
                    <label>
                        Desarrollador
                        <select formControlName="developer_id">
                            <option value="" disabled>Selecciona...</option>
                            @for (d of developers(); track d.id) {
                                <option [value]="d.id">{{ d.name }}</option>
                            }
                        </select>
                    </label>

                    <label>
                        Tipo
                        <select formControlName="tipo" (change)="onTipoChange()">
                            @for (t of tiposDisponibles; track t.value) {
                                <option [value]="t.value" [disabled]="t.disabled">{{ t.label }}</option>
                            }
                        </select>
                    </label>
                </div>

                @if (alcanceOpciones().length > 0) {
                    <div class="row">
                        <label>
                            Alcance (proyecto)
                            <select formControlName="alcance">
                                <option value="">Todos los proyectos</option>
                                @for (o of alcanceOpciones(); track o.value) {
                                    <option [value]="o.value">{{ o.label }}</option>
                                }
                            </select>
                        </label>
                        <small class="hint">Limita la alerta a un proyecto específico. "Todos los proyectos" cubre todos los del cliente.</small>
                    </div>
                }

                <div class="row">
                    <label>
                        Canal de envío
                        <select formControlName="canal" (change)="onCanalChange()">
                            @for (c of canalesDisponibles(); track c.value) {
                                <option [value]="c.value" [disabled]="c.disabled">{{ c.label }}</option>
                            }
                        </select>
                    </label>
                </div>

                <!-- ── Destinatarios EMAIL ── -->
                @if (form.value.canal === 'email') {
                    <div class="row">
                        <label class="block-label">Destinatarios (TO) <span class="req">*</span></label>
                        <input
                            type="text"
                            class="emails-input"
                            placeholder="email1@dominio.com, email2@dominio.com"
                            [value]="destText('to')"
                            (input)="onDestInput('to', $event)" />
                        <small class="hint">Separa varios correos con coma.</small>
                    </div>

                    <div class="row">
                        <label class="block-label">CC (opcional)</label>
                        <input
                            type="text"
                            class="emails-input"
                            placeholder="email-cc@dominio.com"
                            [value]="destText('cc')"
                            (input)="onDestInput('cc', $event)" />
                    </div>

                    <div class="row">
                        <label class="switch-label">
                            <input type="checkbox" [checked]="bccEnabled()" (change)="toggleBcc()" />
                            <span>Habilitar BCC (copia oculta)</span>
                        </label>
                        @if (bccEnabled()) {
                            <input
                                type="text"
                                class="emails-input"
                                placeholder="email-bcc@dominio.com"
                                [value]="destText('bcc')"
                                (input)="onDestInput('bcc', $event)" />
                        }
                    </div>
                }

                <!-- ── Destinatarios WhatsApp ── -->
                @if (form.value.canal === 'whatsapp') {
                    <div class="row">
                        <label class="block-label">Teléfonos <span class="req">*</span></label>
                        <input
                            type="text"
                            class="emails-input"
                            placeholder="+5215512345678, +5215587654321"
                            [value]="destText('telefonos')"
                            (input)="onDestInput('telefonos', $event)" />
                        <small class="hint">Formato E.164. Separa varios con coma.</small>
                    </div>
                }

                <!-- ── Periodicidad ── -->
                <div class="row">
                    <label class="block-label">Periodicidad</label>
                    <div class="dias-grid">
                        @for (d of diasSemana; track d.value) {
                            <button
                                type="button"
                                class="dia-btn"
                                [class.selected]="estaSeleccionado(d.value)"
                                (click)="toggleDia(d.value)">
                                {{ d.label }}
                            </button>
                        }
                    </div>
                    <label class="hora-label">
                        Hora
                        <input type="time" formControlName="hora" />
                    </label>
                </div>

                <div class="row toggle-row">
                    <label class="switch-label">
                        <input type="checkbox" formControlName="activo" />
                        <span>Alerta activa al guardar</span>
                    </label>
                </div>

                <div class="actions">
                    <button type="button" class="btn-secondary" (click)="cancelar()">Cancelar</button>
                    <button type="submit" class="btn-primary" [disabled]="form.invalid || guardando()">
                        {{ guardando() ? 'Guardando...' : (modo() === 'editar' ? 'Actualizar' : 'Crear alerta') }}
                    </button>
                </div>
            </form>
        </section>

        <app-toast [data]="toastData" />
    `,
    styles: [`
        .content { padding: 20px; }
        .card {
            background: white; padding: 28px; border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            max-width: 720px; margin: 0 auto;
        }
        .row { margin-bottom: 22px; }
        .row.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .row.autoname {
            background: #f9fafb; padding: 14px 18px; border-radius: 6px;
            border-left: 3px solid #ec6e3c; text-align: center; font-size: 16px;
        }
        label { display: block; font-size: 14px; color: #374151; font-weight: 500; }
        .block-label { margin-bottom: 8px; }
        .req { color: #dc2626; }
        input[type="text"], input[type="time"], select, .emails-input {
            display: block; width: 100%; margin-top: 6px; padding: 10px 12px;
            border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; background: white;
        }
        .hint { display:block; margin-top:4px; color:#6b7280; font-size:12px; font-weight:400; }
        .dias-grid { display: flex; gap: 8px; margin-bottom: 12px; }
        .dia-btn {
            width: 38px; height: 38px; border-radius: 50%; border: 1px solid #d1d5db;
            background: white; cursor: pointer; font-weight: 500; color: #374151;
        }
        .dia-btn.selected { background: #ec6e3c; color: white; border-color: #ec6e3c; }
        .hora-label { max-width: 200px; }
        .toggle-row { display: flex; align-items: center; }
        .switch-label { display: flex; align-items: center; gap: 10px; font-weight: 500; cursor: pointer; }
        .actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
        .btn-primary { background: #ec6e3c; color: white; border: none; padding: 10px 22px; border-radius: 6px; font-weight: 500; cursor: pointer; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary { background: white; color: #374151; border: 1px solid #d1d5db; padding: 10px 18px; border-radius: 6px; font-weight: 500; cursor: pointer; }
    `]
})
export class AlertasFormComponent implements OnInit {
    readonly tiposDisponibles = TIPOS_ALERTA;

    /** Canal disponible según el tipo: reporte_programado → solo WA; resto → solo email. */
    readonly canalesDisponibles = computed(() => {
        const tipo = this.formValue()?.tipo as string;
        if (!environment.enableWhatsappAlerts) return CANALES_ALERTA.filter(c => c.value !== 'whatsapp');
        if (tipo === 'reporte_programado') return CANALES_ALERTA.filter(c => c.value === 'whatsapp');
        return CANALES_ALERTA.filter(c => c.value === 'email');
    });
    readonly diasSemana = DIAS_SEMANA;

    headerData: IHeader = { title: 'Nueva alerta', margin_top: '45px' };

    private readonly fb = inject(FormBuilder);
    private readonly svc = inject(AlertasService);
    private readonly selfSvc = inject(SelfServiceService);
    private readonly supabase = inject(SupabaseService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    readonly modo = signal<'crear' | 'editar'>('crear');
    readonly guardando = signal(false);
    toastData: IToast = { isOpen: false, type: EStates.error, message: '' };

    private showToast(message: string, type: EStates = EStates.error) {
        this.toastData = { isOpen: true, type, message };
    }

    readonly diasSeleccionados = signal<DiaSemana[]>([]);
    readonly developers = signal<DbDeveloper[]>([]);
    readonly grupos = signal<DbDeveloperGroup[]>([]);
    readonly subproyectos = signal<DbSubProject[]>([]);
    readonly bccEnabled = signal(false);
    readonly destinatarios = signal(emptyDestinatarios());

    /** Opciones del selector de alcance: grupos (líder/proyecto) + sub-proyectos.
     *  value codificado como 'g:<id>' o 's:<id>'. */
    readonly alcanceOpciones = computed(() => [
        ...this.grupos().map(g => ({ value: `g:${g.id}`, label: `${g.name} (${g.group_type})` })),
        ...this.subproyectos().map(s => ({ value: `s:${s.id}`, label: s.name })),
    ]);

    form: FormGroup = this.fb.group({
        developer_id: ['', Validators.required],
        alcance: [''],
        tipo: ['leads', Validators.required],
        canal: ['email', Validators.required],
        hora: ['09:00', Validators.required],
        activo: [true],
    });

    private readonly formValue = toSignal(this.form.valueChanges, {
        initialValue: this.form.value,
    });

    readonly previewNombre = computed(() => {
        const v = this.formValue() as { tipo?: 'leads' | 'visitas'; developer_id?: string };
        const dev = this.developers().find(d => d.id === v.developer_id);
        return autoName({ tipo: v.tipo ?? 'leads', developer_name: dev?.name });
    });

    async ngOnInit(): Promise<void> {
        const list = await this.selfSvc.getDevelopers();
        this.developers.set(list);

        // Al cambiar de developer (interacción del usuario): recargar opciones de
        // alcance y resetear la selección.
        this.form.get('developer_id')!.valueChanges.subscribe((devId: string) => {
            this.form.patchValue({ alcance: '' });
            this.loadScopeOptions(devId);
        });

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.modo.set('editar');
            this.headerData = { ...this.headerData, title: 'Editar alerta' };
            this.svc.getById(id).subscribe(a => a && this.cargarAlerta(a));
        }
    }

    private async loadScopeOptions(developerId: string): Promise<void> {
        // Alertas = developer + proyecto. No hay líderes/grupos aquí.
        this.grupos.set([]);
        if (!developerId) {
            this.subproyectos.set([]);
            return;
        }
        const { data } = await this.supabase.db
            .from('Proyectos')
            .select('id, Nombre')
            .eq('Desarrollador_id', developerId)
            .order('Nombre');
        this.subproyectos.set(
            (data ?? []).map((p: any) => ({ id: p.id, name: p.Nombre, developer_id: developerId })) as any,
        );
    }

    destText(key: 'to' | 'cc' | 'bcc' | 'telefonos'): string {
        return (this.destinatarios()[key] ?? []).join(', ');
    }

    onDestInput(key: 'to' | 'cc' | 'bcc' | 'telefonos', evt: Event): void {
        const raw = (evt.target as HTMLInputElement).value;
        const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
        this.destinatarios.update(d => ({ ...d, [key]: parts }));
    }

    toggleBcc(): void {
        const next = !this.bccEnabled();
        this.bccEnabled.set(next);
        if (!next) this.destinatarios.update(d => ({ ...d, bcc: [] }));
    }

    onTipoChange(): void {
        const tipo = this.form.value.tipo;
        if (tipo === 'reporte_programado') {
            this.form.patchValue({ canal: 'whatsapp' });
            this.destinatarios.update(d => ({ ...d, to: [], cc: [], bcc: [] }));
            this.bccEnabled.set(false);
        } else {
            this.form.patchValue({ canal: 'email' });
            this.destinatarios.update(d => ({ ...d, telefonos: [] }));
        }
    }

    onCanalChange(): void {
        const canal = this.form.value.canal;
        if (canal === 'email') {
            this.destinatarios.update(d => ({ ...d, telefonos: [] }));
        } else {
            this.destinatarios.update(d => ({ ...d, to: [], cc: [], bcc: [] }));
            this.bccEnabled.set(false);
        }
    }

    estaSeleccionado(dia: DiaSemana): boolean {
        return this.diasSeleccionados().includes(dia);
    }

    toggleDia(dia: DiaSemana): void {
        this.diasSeleccionados.update(list =>
            list.includes(dia) ? list.filter(d => d !== dia) : [...list, dia]
        );
    }

    private async cargarAlerta(a: Alerta): Promise<void> {
        // emitEvent:false para no disparar la suscripción de developer_id (que
        // resetearía el alcance).
        this.form.patchValue({
            developer_id: a.developer_id,
            tipo: a.tipo,
            canal: a.canal,
            hora: a.periodicidad.hora,
            activo: a.activo,
        }, { emitEvent: false });

        await this.loadScopeOptions(a.developer_id);
        const alcance = a.developer_group_id
            ? `g:${a.developer_group_id}`
            : a.sub_project_id
                ? `s:${a.sub_project_id}`
                : '';
        this.form.patchValue({ alcance }, { emitEvent: false });

        this.diasSeleccionados.set(a.periodicidad.dias);
        this.destinatarios.set({ ...emptyDestinatarios(), ...a.destinatarios });
        this.bccEnabled.set((a.destinatarios?.bcc?.length ?? 0) > 0);
    }

    guardar(): void {
        if (this.form.invalid || this.diasSeleccionados().length === 0) {
            this.showToast('Completa los campos y selecciona al menos un día.', EStates.warning);
            return;
        }
        const dest = this.destinatarios();
        const canal = this.form.value.canal as 'email' | 'whatsapp';
        const okDest = canal === 'email' ? dest.to.length > 0 : dest.telefonos.length > 0;
        if (!okDest) {
            this.showToast(
                canal === 'email' ? 'Agrega al menos un correo TO.' : 'Agrega al menos un teléfono.',
                EStates.warning
            );
            return;
        }

        this.guardando.set(true);
        const v = this.form.value;
        const alcance: string = v.alcance || '';
        const alerta: Alerta = {
            developer_id: v.developer_id,
            developer_group_id: alcance.startsWith('g:') ? alcance.slice(2) : null,
            sub_project_id: alcance.startsWith('s:') ? alcance.slice(2) : null,
            tipo: v.tipo,
            canal,
            periodicidad: { dias: this.diasSeleccionados(), hora: v.hora },
            destinatarios: dest,
            activo: v.activo,
        };

        const id = this.route.snapshot.paramMap.get('id');
        const obs$ = id ? this.svc.update(id, alerta) : this.svc.create(alerta);
        obs$.subscribe({
            next: () => {
                this.guardando.set(false);
                this.router.navigate(['/dashboard/alertas/listado']);
            },
            error: (e) => {
                console.error('[alerts] guardar falló', e);
                const detail = e?.message || e?.error?.message || 'Revisa los datos e intenta de nuevo.';
                this.showToast(`Error guardando la alerta: ${detail}`, EStates.error);
                this.guardando.set(false);
            },
        });
    }

    cancelar(): void {
        this.router.navigate(['/dashboard/alertas/listado']);
    }
}
