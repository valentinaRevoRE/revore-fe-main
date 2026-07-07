import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelfServiceService } from '@revore/services/self-service.service';
import {
    ScheduleWithRelations, DbDeveloper, DbDeveloperGroup, DbSubProject,
    DbReportType,
} from '@revore/models/database.types';

function formatHourRange(h: number): string {
    const fmt = (hour: number): string => {
        const suffix = hour < 12 ? 'a.m.' : 'p.m.';
        const h12 = hour % 12 === 0 ? 12 : hour % 12;
        return `${h12}:00 ${suffix}`;
    };
    return `Desde las ${fmt(h)} hasta las ${fmt((h + 1) % 24)}`;
}

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
    loadingRelated = false;
    private loadingToken = 0;

    developers: DbDeveloper[] = [];
    developerGroups: DbDeveloperGroup[] = [];
    subProjects: DbSubProject[] = [];
    reportTypes: DbReportType[] = [];

    form!: FormGroup;

    readonly DAYS = [
        { value: -1, label: 'Todos los días' },
        { value: 0,  label: 'Todos los domingos' },
        { value: 1,  label: 'Todos los lunes' },
        { value: 2,  label: 'Todos los martes' },
        { value: 3,  label: 'Todos los miércoles' },
        { value: 4,  label: 'Todos los jueves' },
        { value: 5,  label: 'Todos los viernes' },
        { value: 6,  label: 'Todos los sábados' },
    ];

    readonly HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
        value: i,
        label: formatHourRange(i),
    }));

    readonly mexicoTzLabel = (() => {
        try {
            return new Intl.DateTimeFormat('en', {
                timeZone: 'America/Mexico_City',
                timeZoneName: 'shortOffset',
            }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value ?? 'GMT-6';
        } catch { return 'GMT-6'; }
    })();

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
            day_of_week:        [1],
            hour:               [9],
            recipients:         ['', Validators.required],
            active:             [true],
        });

        this.form.get('developer_id')!.valueChanges.subscribe(id => {
            if (id) this.onDeveloperChange(id);
        });

        this.form.get('report_type_id')!.valueChanges.subscribe(() => {
            const devId = this.form.get('developer_id')?.value;
            if (devId) this.onDeveloperChange(devId);
        });
    }

    get groupLabel(): string {
        if (this.subProjects.length > 0) return 'Proyecto';
        const type = this.developerGroups[0]?.group_type;
        if (type === 'proyecto') return 'Proyecto';
        if (type === 'líder') return 'Líder';
        return 'Grupo';
    }

    /** El reporte de brokers aplica a todos los desarrollos (uno por desarrollo). */
    private isBrokersReportType(reportTypeId: string | null | undefined): boolean {
        const name = this.reportTypes.find(r => r.id === reportTypeId)?.name ?? '';
        return /broker/i.test(name);
    }

    /** El C-Level es a nivel portafolio: cubre todos los proyectos del desarrollo. */
    private isCLevelReportType(reportTypeId: string | null | undefined): boolean {
        const name = this.reportTypes.find(r => r.id === reportTypeId)?.name ?? '';
        return /c-?level/i.test(name);
    }

    /** Estos tipos no eligen proyecto/grupo (brokers y C-Level). */
    private hidesProjectSelection(reportTypeId: string | null | undefined): boolean {
        return this.isBrokersReportType(reportTypeId) || this.isCLevelReportType(reportTypeId);
    }

    async onDeveloperChange(developerId: string): Promise<void> {
        this.developerGroups = [];
        this.subProjects = [];
        this.form.patchValue({ developer_group_id: null, sub_project_id: null }, { emitEvent: false });
        const selectedTypeId = this.form.get('report_type_id')?.value;
        // Brokers (uno por desarrollo) y C-Level (nivel portafolio) no eligen proyecto.
        if (this.hidesProjectSelection(selectedTypeId)) {
            this.loadingRelated = false;
            return;
        }
        this.loadingRelated = true;
        const token = ++this.loadingToken;
        const service = this.reportTypes.find(r => r.id === selectedTypeId)?.service;
        const groups = await this.svc.getDeveloperGroups(developerId, service ?? undefined);
        if (token !== this.loadingToken) return;
        if (groups.length > 0) {
            this.developerGroups = groups;
        } else {
            // Desarrolladores sin developer_groups (Tare, PROCSA, Nova Habita, …)
            // eligen proyecto vía sub_projects.
            const subs = await this.svc.getSubProjects(developerId);
            if (token !== this.loadingToken) return;
            this.subProjects = subs;
        }
        this.loadingRelated = false;
    }

    formatDeveloperDropdownName(name: string): string {
        return name.toLowerCase() === 'procsa-data' ? 'PROCSA' : name;
    }

    private readonly MKT_AGENCY_NAMES: Record<string, string> = {
        'GRUPO SAN CARLOS 1': 'Madake (P & C)',
        'GRUPO SAN CARLOS 2': 'Madake (PV & SI)',
    };

    private get selectedService(): string | undefined {
        const typeId = this.form?.get('report_type_id')?.value;
        return typeId ? this.reportTypes.find(r => r.id === typeId)?.service : undefined;
    }

    formatGroupOption(g: DbDeveloperGroup): string {
        if (g.group_type === 'líder' && this.selectedService === 'marketing') {
            return this.MKT_AGENCY_NAMES[g.script_arg] ?? g.name;
        }
        return g.name;
    }

    openCreate(): void {
        this.isEditing = false;
        this.editingId = null;
        this.developerGroups = [];
        this.subProjects = [];
        this.loadingRelated = false;
        this.form.reset({ day_of_week: 1, hour: 9, active: true });
        this.showModal = true;
    }

    async openEdit(s: ScheduleWithRelations): Promise<void> {
        this.isEditing = true;
        this.editingId = s.id;
        this.developerGroups = [];
        this.subProjects = [];
        this.showModal = true;
        this.loadingRelated = true;
        const token = ++this.loadingToken;

        if (s.developer_id && !this.hidesProjectSelection(s.report_type_id)) {
            const service = this.reportTypes.find(r => r.id === s.report_type_id)?.service;
            const groups = await this.svc.getDeveloperGroups(s.developer_id, service ?? undefined);
            if (token === this.loadingToken) {
                if (groups.length > 0) {
                    this.developerGroups = groups;
                } else {
                    this.subProjects = await this.svc.getSubProjects(s.developer_id);
                }
            }
        }
        if (token === this.loadingToken) this.loadingRelated = false;

        this.form.patchValue({
            developer_id:       s.developer_id,
            developer_group_id: s.developer_group_id ?? null,
            sub_project_id:     s.sub_project_id ?? null,
            report_type_id:     s.report_type_id,
            day_of_week:        s.day_of_week,
            hour:               s.hour,
            recipients:         s.recipients.join(', '),
            active:             s.active,
        }, { emitEvent: false });
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
        const today = new Date().toISOString().split('T')[0];
        const payload = {
            developer_id:       v.developer_id,
            sub_project_id:     v.sub_project_id || null,
            developer_group_id: v.developer_group_id || null,
            report_type_id:     v.report_type_id,
            frequency:          'weekly' as const,
            day_of_week:        v.day_of_week,
            day_of_month:       null,
            hour:               v.hour,
            timezone:           'America/Mexico_City',
            start_date:         today,
            end_date:           null,
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
        const day = this.DAYS.find(d => d.value === s.day_of_week)?.label ?? '';
        return `${day} · ${formatHourRange(s.hour)}`;
    }

    formatGroupName(s: ScheduleWithRelations): string {
        const g = s.developer_groups as any;
        if (!g?.name) return '';
        if (s.report_types?.service === 'marketing' && g.group_type === 'líder') {
            return this.MKT_AGENCY_NAMES[g.script_arg] ?? g.name;
        }
        return g.name;
    }
}
