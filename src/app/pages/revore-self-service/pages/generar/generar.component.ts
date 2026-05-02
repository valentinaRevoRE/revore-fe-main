import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SelfServiceService } from '@revore/services/self-service.service';
import {
    DbDeveloper, DbDeveloperGroup, DbSubProject, DbReportType,
    ServiceType, SERVICE_LABELS,
} from '@revore/models/database.types';

const FALLBACK_TYPES: DbReportType[] = [
    { id: 'fallback-diario',  service: 'marketing', name: 'Diario',  description: null, created_at: '' },
    { id: 'fallback-semanal', service: 'marketing', name: 'Semanal', description: null, created_at: '' },
];

@Component({
    selector: 'app-revore-generar',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './generar.component.html',
    styleUrl: './generar.component.scss',
})
export class GenerarComponent implements OnInit {
    step = 1;
    totalSteps = 4;
    isSubmitting = false;
    submitError = '';
    submitSuccess = false;

    // Step 1 — todos activos, 4 servicios
    selectedService: ServiceType | null = null;
    readonly SERVICE_LABELS = SERVICE_LABELS;
    readonly ALL_SERVICES: ServiceType[] = ['marketing', 'sales', 'estrategia', 'revenue_management'];

    // Step 2
    reportTypes: DbReportType[] = [];
    selectedReportType: DbReportType | null = null;
    loadingTypes = false;

    // Step 3
    selectedModalidad: 'on_demand' | 'recurring' | null = null;

    // Step 4
    developers: DbDeveloper[] = [];
    developerGroups: DbDeveloperGroup[] = [];
    subProjects: DbSubProject[] = [];
    loadingRelated = false;
    form!: FormGroup;

    readonly DAYS_OPTIONS = [
        { value: 1, label: 'Lunes' },
        { value: 2, label: 'Martes' },
        { value: 3, label: 'Miércoles' },
        { value: 4, label: 'Jueves' },
        { value: 5, label: 'Viernes' },
        { value: 6, label: 'Sábado' },
        { value: 0, label: 'Domingo' },
    ];

    constructor(
        private svc: SelfServiceService,
        private fb: FormBuilder,
        private router: Router,
    ) {}

    async ngOnInit(): Promise<void> {
        this.developers = await this.svc.getDevelopers();
        this.buildForm();
    }

    private buildForm(): void {
        this.form = this.fb.group({
            developer_id:       ['', Validators.required],
            developer_group_id: [null],
            sub_project_id:     [null],
            recipients:         ['', Validators.required],
            // on_demand
            fecha:              [this.todayIso()],
            // recurring
            cada_dia:           [1],
            a_las:              ['09:00'],
            timezone:           ['America/Mexico_City'],
            start_date:         [this.todayIso()],
            end_date:           [null],
        });

        this.form.get('developer_id')!.valueChanges.subscribe(id => {
            if (id) this.onDeveloperChange(id);
        });
    }

    private todayIso(): string {
        return new Date().toISOString().split('T')[0];
    }

    async onDeveloperChange(developerId: string): Promise<void> {
        this.developerGroups = [];
        this.subProjects = [];
        this.form.patchValue({ developer_group_id: null, sub_project_id: null });
        this.loadingRelated = true;
        const [groups, subProjects] = await Promise.all([
            this.svc.getDeveloperGroups(developerId),
            this.svc.getSubProjects(developerId),
        ]);
        this.developerGroups = groups;
        this.subProjects = subProjects;
        this.loadingRelated = false;
    }

    selectService(service: ServiceType): void {
        this.selectedService = service;
        this.selectedReportType = null;
        this.reportTypes = [];
        this.loadReportTypes();
    }

    async loadReportTypes(): Promise<void> {
        if (!this.selectedService) return;
        this.loadingTypes = true;
        const types = await this.svc.getReportTypes(this.selectedService);
        this.reportTypes = types.length > 0 ? types : FALLBACK_TYPES;
        this.loadingTypes = false;
    }

    selectReportType(rt: DbReportType): void {
        this.selectedReportType = rt;
    }

    selectModalidad(mode: 'on_demand' | 'recurring'): void {
        this.selectedModalidad = mode;
    }

    setDateShortcut(type: 'today' | 'month_start' | 'minus_90'): void {
        const d = new Date();
        if (type === 'month_start') d.setDate(1);
        if (type === 'minus_90') d.setDate(d.getDate() - 90);
        this.form.patchValue({ fecha: d.toISOString().split('T')[0] });
    }

    canGoNext(): boolean {
        if (this.step === 1) return this.selectedService !== null;
        if (this.step === 2) return this.selectedReportType !== null;
        if (this.step === 3) return this.selectedModalidad !== null;
        if (this.step === 4) {
            const devOk = !!this.form.get('developer_id')!.value;
            const recipOk = !!this.form.get('recipients')!.value?.trim();
            if (this.selectedModalidad === 'on_demand') return devOk && recipOk && !!this.form.get('fecha')!.value;
            return devOk && recipOk && !!this.form.get('a_las')!.value;
        }
        return false;
    }

    next(): void {
        if (this.canGoNext() && this.step < this.totalSteps) this.step++;
    }

    back(): void {
        if (this.step > 1) this.step--;
    }

    parseRecipients(raw: string): string[] {
        return raw.split(/[\n,;]+/).map(e => e.trim()).filter(e => e.includes('@'));
    }

    async submit(): Promise<void> {
        if (!this.selectedReportType || !this.selectedModalidad) return;
        this.isSubmitting = true;
        this.submitError = '';
        const v = this.form.value;
        const recipients = this.parseRecipients(v.recipients);

        if (this.selectedModalidad === 'on_demand') {
            const { error } = await this.svc.createExecution({
                schedule_id:        null,
                developer_id:       v.developer_id,
                sub_project_id:     v.sub_project_id || null,
                developer_group_id: v.developer_group_id || null,
                report_type_id:     this.selectedReportType.id,
                triggered_by:       'manual',
                triggered_by_user:  null,
                recipients,
                status:             'queued',
                date_range_start:   v.fecha || null,
                date_range_end:     v.fecha || null,
            });
            if (error) { this.submitError = error.message; this.isSubmitting = false; return; }
        } else {
            const [hourStr] = (v.a_las as string).split(':');
            const { error } = await this.svc.createSchedule({
                developer_id:       v.developer_id,
                sub_project_id:     v.sub_project_id || null,
                developer_group_id: v.developer_group_id || null,
                report_type_id:     this.selectedReportType.id,
                frequency:          'weekly',
                day_of_week:        v.cada_dia,
                day_of_month:       null,
                hour:               parseInt(hourStr, 10),
                timezone:           v.timezone,
                start_date:         v.start_date,
                end_date:           v.end_date || null,
                recipients,
                active:             true,
                created_by:         null,
            });
            if (error) { this.submitError = error.message; this.isSubmitting = false; return; }
        }

        this.submitSuccess = true;
        this.isSubmitting = false;
        setTimeout(() => {
            const dest = this.selectedModalidad === 'on_demand'
                ? '/dashboard/sales-tools/historial'
                : '/dashboard/sales-tools/programaciones';
            this.router.navigateByUrl(dest);
        }, 1500);
    }
}
