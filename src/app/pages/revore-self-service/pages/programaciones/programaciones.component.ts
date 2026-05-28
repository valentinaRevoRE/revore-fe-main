import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelfServiceService } from '@revore/services/self-service.service';
import {
    ScheduleWithRelations, DbDeveloper, DbDeveloperGroup,
    DbSubProject, DbReportType,
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

    developers: DbDeveloper[] = [];
    developerGroups: DbDeveloperGroup[] = [];
    subProjects: DbSubProject[] = [];
    reportTypes: DbReportType[] = [];

    form!: FormGroup;

    /** Módulo del reporte seleccionado en el form (diarios/ventas/marketing) para filtrar sub-proyectos. */
    get currentModule(): 'diarios' | 'ventas' | 'marketing' | null {
        const rtId = this.form?.get('report_type_id')?.value;
        if (!rtId) return null;
        const rt = this.reportTypes.find(r => r.id === rtId);
        if (!rt) return null;
        const name = (rt.name || '').toLowerCase();
        if (name.includes('diario')) return 'diarios';
        if (rt.service === 'marketing') return 'marketing';
        return 'ventas';
    }

    private isLider(sp: DbSubProject): boolean {
        const ra = sp.report_args;
        if (!ra) return false;
        const keys = Object.keys(ra);
        return keys.length === 1 && keys[0] === 'diarios' && ra['diarios']?.subproyecto == null;
    }

    /** Sub-proyectos visibles para el tipo de reporte actual.
     *  Si el desarrollador tiene líderes (caso GSC), en diarios y ventas se
     *  muestran SOLO los líderes. */
    get visibleSubProjects(): DbSubProject[] {
        const m = this.currentModule;
        if (!m) return this.subProjects;

        const lideres = this.subProjects.filter(sp => this.isLider(sp));
        if (lideres.length > 0 && (m === 'diarios' || m === 'ventas')) {
            return lideres;
        }

        return this.subProjects.filter(sp => {
            const ra = sp.report_args;
            return !ra || !!ra[m];
        });
    }

    /** Agencias MKT derivadas: agrupa proyectos visibles por report_args.marketing.script_arg. */
    get marketingAgencies(): { key: string; label: string; projects: DbSubProject[] }[] {
        if (this.currentModule !== 'marketing') return [];
        const groups = new Map<string, DbSubProject[]>();
        for (const sp of this.visibleSubProjects) {
            const arg = sp.report_args?.['marketing']?.script_arg;
            if (!arg) continue;
            const arr = groups.get(arg) ?? [];
            arr.push(sp);
            groups.set(arg, arr);
        }
        return Array.from(groups.entries()).map(([key, projects]) => ({
            key,
            label: this.MKT_AGENCY_NAMES[key] ?? key,
            projects,
        }));
    }

    projectsForAgencyKey(key: string): string {
        const a = this.marketingAgencies.find(x => x.key === key);
        return a ? a.projects.map(p => p.name).join(', ') : '';
    }

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
            developer_id:           ['', Validators.required],
            developer_group_id:     [null],
            sub_project_id:         [null],
            marketing_agency_key:   [null],
            report_type_id:         ['', Validators.required],
            day_of_week:            [1],
            hour:                   [9],
            recipients:             ['', Validators.required],
            active:                 [true],
        });

        this.form.get('developer_id')!.valueChanges.subscribe(id => {
            if (id) this.onDeveloperChange(id);
        });
    }

    async onDeveloperChange(developerId: string): Promise<void> {
        this.developerGroups = [];
        this.subProjects = [];
        this.form.patchValue({ developer_group_id: null, sub_project_id: null, marketing_agency_key: null });
        const [groups, subProjects] = await Promise.all([
            this.svc.getDeveloperGroups(developerId),
            this.svc.getSubProjects(developerId),
        ]);
        this.developerGroups = groups;
        this.subProjects = subProjects;
    }

    get subProjectLabel(): string {
        if (this.visibleSubProjects.length > 0 && this.visibleSubProjects.every(sp => this.isLider(sp))) return 'Líder';
        return 'Proyecto';
    }

    get subProjectEmptyLabel(): string {
        if (this.visibleSubProjects.length > 0 && this.visibleSubProjects.every(sp => this.isLider(sp))) return 'Sin líder';
        return 'Sin proyecto';
    }

    formatDeveloperDropdownName(name: string): string {
        return name.toLowerCase() === 'procsa-data' ? 'PROCSA' : name;
    }

    openCreate(): void {
        this.isEditing = false;
        this.editingId = null;
        this.developerGroups = [];
        this.subProjects = [];
        this.form.reset({ day_of_week: 1, hour: 9, active: true });
        this.showModal = true;
    }

    async openEdit(s: ScheduleWithRelations): Promise<void> {
        this.isEditing = true;
        this.editingId = s.id;
        this.developerGroups = [];
        this.subProjects = [];
        this.showModal = true;
        this.form.patchValue({
            developer_id:       s.developer_id,
            sub_project_id:     s.sub_project_id ?? null,
            report_type_id:     s.report_type_id,
            day_of_week:        s.day_of_week,
            hour:               s.hour,
            recipients:         s.recipients.join(', '),
            active:             s.active,
        });
        if (s.developer_id) await this.onDeveloperChange(s.developer_id);
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
        const basePayload = {
            developer_id:       v.developer_id,
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

        // En edición seguimos editando un solo proyecto.
        if (this.isEditing && this.editingId) {
            const { error } = await this.svc.updateSchedule(this.editingId, {
                ...basePayload,
                sub_project_id: v.sub_project_id || null,
            });
            if (error) { this.saveError = error.message; this.isSaving = false; return; }
        } else {
            // En creación, si hay agencia MKT seleccionada, expandir a una programación por proyecto.
            const agency = v.marketing_agency_key
                ? this.marketingAgencies.find(a => a.key === v.marketing_agency_key)
                : null;
            const subProjectIds: (string | null)[] = agency
                ? agency.projects.map(p => p.id)
                : [v.sub_project_id || null];

            for (const subId of subProjectIds) {
                const { error } = await this.svc.createSchedule({ ...basePayload, sub_project_id: subId } as any);
                if (error) { this.saveError = error.message; this.isSaving = false; return; }
            }
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

    private readonly MKT_AGENCY_NAMES: Record<string, string> = {
        'GRUPO SAN CARLOS 1': 'Madake (P & C)',
        'GRUPO SAN CARLOS 2': 'Madake (PV & SI)',
    };

    formatGroupName(s: ScheduleWithRelations): string {
        const g = s.developer_groups as any;
        if (!g?.name) return '';
        if (s.report_types?.service === 'marketing' && g.group_type === 'líder') {
            return this.MKT_AGENCY_NAMES[g.script_arg] ?? g.name;
        }
        return g.name;
    }
}
