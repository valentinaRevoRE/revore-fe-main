import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SelfServiceService } from '@revore/services/self-service.service';
import { ExecutionWithRelations, ExecutionStatus, EXECUTION_STATUS_LABELS } from '@revore/models/database.types';

@Component({
    selector: 'app-revore-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, DatePipe],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
    stats = { total: 0, completed: 0, inProgress: 0, failed: 0 };
    recentExecutions: ExecutionWithRelations[] = [];
    isLoading = true;

    readonly STATUS_LABELS = EXECUTION_STATUS_LABELS;

    constructor(private svc: SelfServiceService) {}

    async ngOnInit(): Promise<void> {
        const [stats, executions] = await Promise.all([
            this.svc.getStats(),
            this.svc.getExecutions({ limit: 5 }),
        ]);
        this.stats = stats;
        this.recentExecutions = executions;
        this.isLoading = false;
    }

    statusClass(status: ExecutionStatus): string {
        const map: Record<ExecutionStatus, string> = {
            queued:     'badge--queued',
            generating: 'badge--progress',
            enriching:  'badge--progress',
            sending:    'badge--progress',
            completed:  'badge--success',
            failed:     'badge--error',
        };
        return map[status] ?? '';
    }

}
