import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '@private/shared/components/header/header.component';
import { IHeader } from '@private/shared/interfaces/header.interface';
import { AlertasService } from '../../services/alertas.service';
import { AlertaHistorialItem, CANALES_ALERTA, TIPOS_ALERTA } from '../../models/alerta.model';

@Component({
    selector: 'app-alertas-historial',
    standalone: true,
    imports: [CommonModule, HeaderComponent],
    template: `
        <app-header [data]="headerData" />
        <section class="content">
            @if (items().length === 0) {
                <div class="empty">
                    No hay envíos registrados todavía. Aquí aparecerá el historial cuando las alertas comiencen a dispararse.
                </div>
            } @else {
                <table class="historial-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Desarrollador</th>
                            <th>Tipo</th>
                            <th>Canal</th>
                            <th>Destinatarios</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        @for (item of items(); track item.id) {
                            <tr>
                                <td>{{ item.enviadoEn | date:'dd/MM/yy HH:mm' }}</td>
                                <td>{{ item.developerName ?? '—' }}</td>
                                <td>{{ labelTipo(item) }}</td>
                                <td>{{ labelCanal(item) }}</td>
                                <td>
                                    <span class="dest-cell" [title]="tooltipDest(item)">
                                        {{ resumenDest(item) }}
                                    </span>
                                </td>
                                <td>
                                    <span class="badge" [class]="'badge-' + item.estado">{{ item.estado }}</span>
                                </td>
                            </tr>
                        }
                    </tbody>
                </table>
            }
        </section>
    `,
    styles: [`
        .content { padding: 20px; }
        .empty {
            background: white; padding: 40px; border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-align: center; color: #6b7280;
        }
        .historial-table {
            width: 100%; border-collapse: collapse; background: white;
            border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .historial-table th, .historial-table td {
            padding: 12px 16px; text-align: left; border-bottom: 1px solid #f1f2f4;
            font-size: 14px;
        }
        .historial-table th { background: #f9fafb; color: #374151; font-weight: 600; }
        .badge {
            padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;
            text-transform: capitalize;
        }
        .badge-enviado { background: #d1fae5; color: #065f46; }
        .badge-fallido { background: #fee2e2; color: #991b1b; }
        .badge-pendiente { background: #fef3c7; color: #92400e; }
        .dest-cell {
            cursor: help; border-bottom: 1px dotted #9ca3af;
            display: inline-block; max-width: 260px; overflow: hidden;
            text-overflow: ellipsis; white-space: nowrap; vertical-align: middle;
        }
    `]
})
export class AlertasHistorialComponent implements OnInit {
    headerData: IHeader = {
        title: 'Historial de alertas',
        description: 'Registro de todas las alertas enviadas',
        margin_top: '45px'
    };

    private readonly svc = inject(AlertasService);
    readonly items = signal<AlertaHistorialItem[]>([]);

    ngOnInit(): void {
        this.svc.historial().subscribe(list => this.items.set(list));
    }

    labelTipo(item: AlertaHistorialItem): string {
        return TIPOS_ALERTA.find(t => t.value === item.tipo)?.label ?? (item.tipo ?? '—');
    }

    labelCanal(item: AlertaHistorialItem): string {
        return CANALES_ALERTA.find(c => c.value === item.canal)?.label ?? item.canal;
    }

    resumenDest(item: AlertaHistorialItem): string {
        const n = item.destinatarios.length;
        if (n === 0) return '—';
        if (n === 1) return item.destinatarios[0];
        return `${item.destinatarios[0]} (+${n - 1})`;
    }

    tooltipDest(item: AlertaHistorialItem): string {
        if (item.destinatarios.length === 0) return 'Sin destinatarios registrados';
        return item.destinatarios.join('\n');
    }
}
