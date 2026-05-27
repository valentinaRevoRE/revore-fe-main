import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '@private/shared/components/header/header.component';
import { IHeader } from '@private/shared/interfaces/header.interface';
import { ToastComponent } from '@shared/components/toast/toast.component';
import { EStates } from '@shared/enums/states.enum';
import { IToast } from '@shared/interfaces/toast.interface';
import { AlertasService } from '../../services/alertas.service';
import {
    Alerta,
    autoName,
    CANALES_ALERTA,
    TIPOS_ALERTA,
} from '../../models/alerta.model';

@Component({
    selector: 'app-alertas-listado',
    standalone: true,
    imports: [CommonModule, RouterLink, HeaderComponent, ToastComponent],
    template: `
        <app-header [data]="headerData" />
        <section class="content">
            <div class="toolbar">
                <a routerLink="/dashboard/alertas/crear" class="btn-primary">+ Nueva alerta</a>
            </div>

            @if (alertas().length === 0) {
                <div class="empty">No hay alertas configuradas todavía.</div>
            } @else {
                <table class="alertas-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Cliente</th>
                            <th>Tipo</th>
                            <th>Canal</th>
                            <th>Periodicidad</th>
                            <th>Destinatarios</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        @for (alerta of alertas(); track alerta.id) {
                            <tr [class.inactive]="!alerta.activo">
                                <td>{{ nombreMostrado(alerta) }}</td>
                                <td>{{ alerta.developer_name ?? '—' }}</td>
                                <td>{{ labelTipo(alerta) }}</td>
                                <td>{{ labelCanal(alerta) }}</td>
                                <td>{{ formatPeriodicidad(alerta) }}</td>
                                <td>{{ countDestinatarios(alerta) }}</td>
                                <td>
                                    <button
                                        class="ss-toggle"
                                        [class.ss-toggle--on]="alerta.activo"
                                        (click)="toggleAlerta(alerta)"
                                        [title]="alerta.activo ? 'Desactivar' : 'Activar'">
                                        <span class="ss-toggle__knob"></span>
                                    </button>
                                </td>
                                <td>
                                    <div class="actions-cell">
                                        <button class="icon-btn" (click)="disparar(alerta)" title="Disparar ahora">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                        </button>
                                        <a [routerLink]="['/dashboard/alertas/editar', alerta.id]" class="icon-btn" title="Editar">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                            </svg>
                                        </a>
                                        <button class="icon-btn icon-btn--danger" (click)="eliminar(alerta)" title="Eliminar">
                                            <img src="assets/icons/trash.svg" alt="Eliminar" width="16" height="16" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        }
                    </tbody>
                </table>
            }

            <!-- Modal de confirmación (eliminar / disparar) -->
            @if (confirmAction()) {
                <div class="modal-overlay" (click)="cancelConfirm()">
                    <div class="modal-dialog" (click)="$event.stopPropagation()">
                        <h3>{{ confirmAction()!.title }}</h3>
                        <p>{{ confirmAction()!.message }}</p>
                        <div class="modal-actions">
                            <button class="btn-secondary" (click)="cancelConfirm()">Cancelar</button>
                            <button
                                class="btn-primary"
                                [class.btn-danger]="confirmAction()!.danger"
                                (click)="acceptConfirm()">
                                {{ confirmAction()!.confirmLabel }}
                            </button>
                        </div>
                    </div>
                </div>
            }
        </section>

        <app-toast [data]="toastData" />
    `,
    styles: [`
        .content { padding: 20px; }
        .toolbar { display: flex; justify-content: flex-end; margin-bottom: 16px; }
        .btn-primary {
            background: #ec6e3c; color: white; padding: 10px 18px;
            border-radius: 6px; text-decoration: none; font-weight: 500;
        }
        .empty {
            background: white; padding: 40px; border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-align: center; color: #6b7280;
        }
        .alertas-table {
            width: 100%; border-collapse: collapse; background: white;
            border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .alertas-table th, .alertas-table td {
            padding: 12px 16px; text-align: left; border-bottom: 1px solid #f1f2f4;
            font-size: 14px;
        }
        .alertas-table th { background: #f9fafb; color: #374151; font-weight: 600; }
        .alertas-table tr.inactive td { color: #9ca3af; }

        .actions-cell { display: flex; gap: 6px; align-items: center; }
        .icon-btn {
            display: inline-flex; align-items: center; justify-content: center;
            width: 32px; height: 32px; border-radius: 6px;
            background: transparent; border: none; cursor: pointer;
            color: #6b7280; text-decoration: none;
            transition: background 0.15s ease, color 0.15s ease;
        }
        .icon-btn:hover { background: #f3f4f6; color: #374151; }
        .icon-btn--danger:hover { background: #fee2e2; color: #dc2626; }

        .ss-toggle {
            width: 44px; height: 24px; border-radius: 12px;
            background: #d1d5db; border: none; cursor: pointer;
            position: relative; transition: background 0.2s ease; padding: 0;
        }
        .ss-toggle--on { background: #1d9d61; }
        .ss-toggle__knob {
            position: absolute; top: 3px; left: 3px;
            width: 18px; height: 18px; border-radius: 50%;
            background: white; transition: transform 0.2s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .ss-toggle--on .ss-toggle__knob { transform: translateX(20px); }

        /* ── Modal ── */
        .modal-overlay {
            position: fixed; inset: 0; background: rgba(17, 27, 48, 0.5);
            display: flex; align-items: center; justify-content: center;
            z-index: 1000; backdrop-filter: blur(2px);
        }
        .modal-dialog {
            background: white; padding: 28px 32px; border-radius: 12px;
            width: 420px; max-width: 90vw;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }
        .modal-dialog h3 {
            margin: 0 0 12px; font-size: 18px; color: #111B30; font-weight: 700;
        }
        .modal-dialog p {
            margin: 0 0 24px; font-size: 14px; color: #4b5563; line-height: 1.5;
        }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
        .modal-actions .btn-primary {
            background: #ec6e3c; color: white; border: none; padding: 10px 20px;
            border-radius: 6px; font-weight: 500; cursor: pointer;
        }
        .modal-actions .btn-primary.btn-danger { background: #dc2626; }
        .modal-actions .btn-secondary {
            background: white; color: #374151; border: 1px solid #d1d5db;
            padding: 10px 18px; border-radius: 6px; font-weight: 500; cursor: pointer;
        }
    `]
})
export class AlertasListadoComponent implements OnInit {
    headerData: IHeader = {
        title: 'Alertas automáticas',
        description: 'Gestiona y configura todas tus alertas automáticas en un solo lugar',
        margin_top: '45px'
    };

    private readonly svc = inject(AlertasService);
    readonly alertas = signal<Alerta[]>([]);

    toastData: IToast = { isOpen: false, type: EStates.success, message: '' };

    readonly confirmAction = signal<{
        title: string;
        message: string;
        confirmLabel: string;
        danger: boolean;
        onAccept: () => void;
    } | null>(null);

    private showToast(message: string, type: EStates = EStates.success) {
        this.toastData = { isOpen: true, type, message };
    }

    cancelConfirm(): void {
        this.confirmAction.set(null);
    }

    acceptConfirm(): void {
        const action = this.confirmAction();
        if (!action) return;
        action.onAccept();
        this.confirmAction.set(null);
    }

    ngOnInit(): void {
        this.svc.list().subscribe(list => this.alertas.set(list));
    }

    nombreMostrado(a: Alerta): string {
        if (a.nombre) return a.nombre;
        const base = autoName(a);
        const scope = a.developer_group_name || a.sub_project_name;
        return scope ? `${base} · ${scope}` : base;
    }

    countDestinatarios(a: Alerta): string {
        if (a.canal === 'whatsapp') {
            const n = a.destinatarios.telefonos?.length ?? 0;
            return `${n} teléfono(s)`;
        }
        const to = a.destinatarios.to?.length ?? 0;
        const cc = a.destinatarios.cc?.length ?? 0;
        const bcc = a.destinatarios.bcc?.length ?? 0;
        const extras = [cc && `${cc} CC`, bcc && `${bcc} BCC`].filter(Boolean).join(', ');
        return extras ? `${to} TO · ${extras}` : `${to} TO`;
    }

    toggleAlerta(alerta: Alerta): void {
        if (!alerta.id) return;
        const activo = !alerta.activo;
        this.svc.toggle(alerta.id, activo).subscribe(() => {
            this.alertas.update(list =>
                list.map(a => (a.id === alerta.id ? { ...a, activo } : a))
            );
        });
    }

    eliminar(alerta: Alerta): void {
        if (!alerta.id) return;
        this.confirmAction.set({
            title: 'Eliminar alerta',
            message: `Esta acción no se puede deshacer. ¿Eliminar "${this.nombreMostrado(alerta)}"?`,
            confirmLabel: 'Eliminar',
            danger: true,
            onAccept: () => {
                this.svc.delete(alerta.id!).subscribe({
                    next: () => {
                        this.alertas.update(list => list.filter(a => a.id !== alerta.id));
                        this.showToast('Alerta eliminada.', EStates.success);
                    },
                    error: (e) => {
                        console.error(e);
                        this.showToast('No se pudo eliminar la alerta.', EStates.error);
                    },
                });
            },
        });
    }

    disparar(alerta: Alerta): void {
        if (!alerta.id) return;
        this.confirmAction.set({
            title: 'Disparar alerta ahora',
            message: `Se enviará "${this.nombreMostrado(alerta)}" a los destinatarios configurados. ¿Continuar?`,
            confirmLabel: 'Disparar',
            danger: false,
            onAccept: () => {
                this.svc.runNow(alerta.id!).subscribe({
                    next: () =>
                        this.showToast(
                            'Alerta encolada. Se procesará en unos segundos — revisa el Historial.',
                            EStates.success
                        ),
                    error: (e) => {
                        console.error(e);
                        this.showToast('No se pudo disparar la alerta.', EStates.error);
                    },
                });
            },
        });
    }

    labelTipo(a: Alerta): string {
        return TIPOS_ALERTA.find(t => t.value === a.tipo)?.label ?? a.tipo;
    }

    labelCanal(a: Alerta): string {
        return CANALES_ALERTA.find(c => c.value === a.canal)?.label ?? a.canal;
    }

    formatPeriodicidad(a: Alerta): string {
        const dias = a.periodicidad.dias.join(', ').toUpperCase();
        return `${dias} · ${a.periodicidad.hora}`;
    }
}
