import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelfServiceService } from '@revore/services/self-service.service';
import {
    ScheduleWithRelations, DbDeveloper, DbDeveloperGroup,
    DbSubProject, DbReportType,
} from '@revore/models/database.types';

@Component({
    selector: 'app-revore-programaciones',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, DatePipe],
    templateUrl: './programaciones.component.html',
    styleUrl: './programaciones.component.scss',
})
export class ProgramacionesComponent implements OnInit {
    schedules: ScheduleWithRelations[] = [];
    isLoading = true;
    showModal = false;
    isEditing = false;
    editingId: string | null = null;
    isSaving = false;
    saveError = '';
    confirmDeleteId: string | null = null;

    developers: DbDeveloper[] = [];
    developerGroups: DbDeveloperGroup[] = [];
    subProjects: DbSubProject[] = [];
    reportTypes: DbReportType[] = [];

    form!: FormGroup;

    readonly FREQ_LABELS: Record<string, string> = {
        weekly: 'Semanal',
        monthly: 'Mensual',
    };

    readonly DAYS = [
        { value: 0, label: 'Domingo' },
        { value: 1, label: 'Lunes' },
        { value: 2, label: 'Martes' },
        { value: 3, label: 'Miércoles' },
        { value: 4, label: 'Jueves' },
        { value: 5, label: 'Viernes' },
        { value: 6, label: 'Sábado' },
    ];

    constructor(private svc: SelfServiceService, private fb: FormBuilder) {}

    async ngOnInit(): Promise<void> {
        const [schedules, developers, reportTypes] = await Promise.all([
            this.svc.getSchedules(),
            this.svc.getDevelopers(),
            this.svc.getReportTypes(),
        ]);
        this.schedules = schedules;
        this.developers = developers;
        this.reportTypes = reportTypes;
        this.isLoading = false;
        this.buildForm();
    }

    private buildForm(): void {
        this.form = this.fb.group({
            developer_id:       ['', Validators.required],
            developer_group_id: [null],
            sub_project_id:     [null],
            report_type_id:     ['', Validators.required],
            frequency:          ['weekly', Validators.required],
            day_of_week:        [1],
            day_of_month:       [1],
            hour:               [9, [Validators.min(0), Validators.max(23)]],
            timezone:           ['America/Mexico_City', Validators.required],
            start_date:         ['', Validators.required],
            end_date:           [null],
            recipients:         ['', Validators.required],
            active:             [true],
        });

        this.form.get('developer_id')!.valueChanges.subscribe(id => {
            if (id) this.onDeveloperChange(id);
        });
    }

    async onDeveloperChange(developerId: string): Promise<void> {
        this.developerGroups = [];
        this.subProjects = [];
        this.form.patchValue({ developer_group_id: null, sub_project_id: null });
        const [groups, subProjects] = await Promise.all([
            this.svc.getDeveloperGroups(developerId),
            this.svc.getSubProjects(developerId),
        ]);
        this.developerGroups = groups;
        this.subProjects = subProjects;
    }

    openCreate(): void {
        this.isEditing = false;
        this.editingId = null;
        this.developerGroups = [];
        this.subProjects = [];
        this.form.reset({ frequency: 'weekly', day_of_week: 1, day_of_month: 1, hour: 9, timezone: 'America/Mexico_City', active: true });
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.saveError = '';
    }

    parseRecipients(raw: string): string[] {
        return raw.split(/[\n,;]+/).map(e => e.trim()).filter(e => e.includes('@'));
    }

    async save(): Promise<void> {
        if (this.form.invalid) return;
        this.isSaving = true;
        this.saveError = '';
        const v = this.form.value;
        const payload = {
            developer_id:       v.developer_id,
            sub_project_id:     v.sub_project_id || null,
            developer_group_id: v.developer_group_id || null,
            report_type_id:     v.report_type_id,
            frequency:          v.frequency,
            day_of_week:        v.frequency === 'weekly' ? v.day_of_week : null,
            day_of_month:       v.frequency === 'monthly' ? v.day_of_month : null,
            hour:               v.hour,
            timezone:           v.timezone,
            start_date:         v.start_date,
            end_date:           v.end_date || null,
            recipients:         this.parseRecipients(v.recipients),
            active:             v.active,
            created_by:         null,
        };

        const { error } = this.isEditing && this.editingId
            ? await this.svc.updateSchedule(this.editingId, payload)
            : await this.svc.createSchedule(payload as any);

        if (error) {
            this.saveError = error.message;
            this.isSaving = false;
            return;
        }

        this.schedules = await this.svc.getSchedules();
        this.isSaving = false;
        this.closeModal();
    }

    async toggleActive(schedule: ScheduleWithRelations): Promise<void> {
        await this.svc.updateSchedule(schedule.id, { active: !schedule.active });
        schedule.active = !schedule.active;
    }

    requestDelete(id: string): void {
        this.confirmDeleteId = id;
    }

    cancelDelete(): void {
        this.confirmDeleteId = null;
    }

    async confirmDelete(): Promise<void> {
        if (!this.confirmDeleteId) return;
        await this.svc.deleteSchedule(this.confirmDeleteId);
        this.schedules = this.schedules.filter(s => s.id !== this.confirmDeleteId);
        this.confirmDeleteId = null;
    }

    freqLabel(s: ScheduleWithRelations): string {
        if (s.frequency === 'weekly') {
            const day = this.DAYS.find(d => d.value === s.day_of_week)?.label ?? '';
            return `${this.FREQ_LABELS[s.frequency]} — ${day} ${s.hour}:00`;
        }
        return `${this.FREQ_LABELS[s.frequency]} — Día ${s.day_of_month}, ${s.hour}:00`;
    }
}
