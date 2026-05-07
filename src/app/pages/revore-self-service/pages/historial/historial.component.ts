import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SelfServiceService } from '@revore/services/self-service.service';
import {
    ExecutionWithRelations, ExecutionStatus,
    EXECUTION_STATUS_LABELS, DbDeveloper,
} from '@revore/models/database.types';

const IN_PROGRESS: ExecutionStatus[] = ['queued', 'generating', 'enriching', 'sending'];

@Component({
    selector: 'app-revore-historial',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe, RouterLink],
    templateUrl: './historial.component.html',
    styleUrl: './historial.component.scss',
})
export class HistorialComponent implements OnInit, OnDestroy {
    allExecutions: ExecutionWithRelations[] = [];
    filtered: ExecutionWithRelations[] = [];
    developers: DbDeveloper[] = [];
    isLoading = true;

    filterStatus: ExecutionStatus | '' = '';
    filterDeveloper = '';

    readonly STATUS_LABELS = EXECUTION_STATUS_LABELS;
    readonly STATUSES: Array<{ value: ExecutionStatus | ''; label: string }> = [
        { value: '', label: 'Todos los estados' },
        { value: 'queued',     label: 'En cola' },
        { value: 'generating', label: 'Generando' },
        { value: 'enriching',  label: 'Enriqueciendo' },
        { value: 'sending',    label: 'Enviando' },
        { value: 'completed',  label: 'Completado' },
        { value: 'failed',     label: 'Fallido' },
    ];

    private pollInterval: any;

    constructor(private svc: SelfServiceService) {}

    async ngOnInit(): Promise<void> {
        const [executions, developers] = await Promise.all([
            this.svc.getExecutions(),
            this.svc.getDevelopers(),
        ]);
        this.developers = developers;
        this.setExecutions(executions);
        this.isLoading = false;
        this.startPollingIfNeeded();
    }

    ngOnDestroy(): void {
        clearInterval(this.pollInterval);
    }

    private setExecutions(list: ExecutionWithRelations[]): void {
        this.allExecutions = list;
        this.applyFilters();
    }

    applyFilters(): void {
        this.filtered = this.allExecutions.filter(ex => {
            const matchStatus = !this.filterStatus || ex.status === this.filterStatus;
            const matchDev = !this.filterDeveloper || ex.developer_id === this.filterDeveloper;
            return matchStatus && matchDev;
        });
    }

    private startPollingIfNeeded(): void {
        const hasInProgress = this.allExecutions.some(e => IN_PROGRESS.includes(e.status));
        if (!hasInProgress || this.pollInterval) return;

        this.pollInterval = setInterval(async () => {
            const executions = await this.svc.getExecutions();
            this.setExecutions(executions);
            const stillInProgress = executions.some(e => IN_PROGRESS.includes(e.status));
            if (!stillInProgress) {
                clearInterval(this.pollInterval);
                this.pollInterval = null;
            }
        }, 5000);
    }

    statusClass(status: ExecutionStatus): string {
        if (status === 'completed') return 'badge--success';
        if (status === 'failed')    return 'badge--error';
        if (IN_PROGRESS.includes(status)) return 'badge--progress';
        return 'badge--queued';
    }

    isInProgress(status: ExecutionStatus): boolean {
        return IN_PROGRESS.includes(status);
    }

    errorLabel(msg: string): string {
        // Show only the first line (friendly message), detail goes in tooltip
        return msg.split('\n')[0];
    }

    private readonly MKT_AGENCY_NAMES: Record<string, string> = {
        'GRUPO SAN CARLOS 1': 'Madake (P & C)',
        'GRUPO SAN CARLOS 2': 'Madake (PV & SI)',
    };

    formatGroupName(ex: ExecutionWithRelations): string {
        const g = ex.developer_groups as any;
        if (!g?.name) return '';
        if (ex.report_types?.service === 'marketing' && g.group_type === 'líder') {
            return this.MKT_AGENCY_NAMES[g.script_arg] ?? g.name;
        }
        return g.name;
    }
}
