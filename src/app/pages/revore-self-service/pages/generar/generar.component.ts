import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SelfServiceService } from '@revore/services/self-service.service';
import {
    DbDeveloper, DbDeveloperGroup, DbSubProject, DbReportType,
    ServiceType, SERVICE_LABELS,
} from '@revore/models/database.types';

function formatHourRange(h: number): string {
    const fmt = (hour: number): string => {
        const suffix = hour < 12 ? 'a.m.' : 'p.m.';
        const h12 = hour % 12 === 0 ? 12 : hour % 12;
        return `${h12}:00 ${suffix}`;
    };
    return `Desde las ${fmt(h)} hasta las ${fmt((h + 1) % 24)}`;
}

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
    private syntheticTypeIds = new Set<string>();

    // Step 3
    selectedModalidad: 'on_demand' | 'recurring' | null = null;

    // Step 4
    developers: DbDeveloper[] = [];
    developerGroups: DbDeveloperGroup[] = [];
    subProjects: DbSubProject[] = [];
    loadingRelated = false;

    /** Módulo de reporte derivado del tipo seleccionado (para filtrar sub-proyectos). */
    get currentModule(): 'diarios' | 'ventas' | 'marketing' | null {
        if (!this.selectedReportType) return null;
        const name = (this.selectedReportType.name || '').toLowerCase();
        if (name.includes('diario') || (this.selectedReportType.id || '').startsWith('diario-')) return 'diarios';
        if (this.selectedService === 'marketing') return 'marketing';
        return 'ventas';
    }

    /** Detecta un proyecto "líder" (asesor): única llave en report_args es `diarios` y `subproyecto` es null. */
    private isLider(sp: DbSubProject): boolean {
        const ra = sp.report_args;
        if (!ra) return false;
        const keys = Object.keys(ra);
        return keys.length === 1 && keys[0] === 'diarios' && ra['diarios']?.subproyecto == null;
    }

    /** Sub-proyectos visibles para el tipo de reporte actual.
     *  Regla pre-migración: si el desarrollador tiene líderes (caso GSC), en
     *  diarios y ventas se muestran SOLO los líderes (no los proyectos).
     *  En el resto de casos: filtro estándar por llave del módulo. */
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

    /** Agencias MKT derivadas: agrupa proyectos visibles por report_args.marketing.script_arg.
     *  SOLO agrupa si el script_arg está mapeado en MKT_AGENCY_NAMES (caso GSC = Madake).
     *  Para el resto (Gran Ciudad, Nova Habita, etc.) el selector cae al de proyectos. */
    get marketingAgencies(): { key: string; label: string; projects: DbSubProject[] }[] {
        if (this.selectedService !== 'marketing') return [];
        const groups = new Map<string, DbSubProject[]>();
        for (const sp of this.visibleSubProjects) {
            const arg = sp.report_args?.['marketing']?.script_arg;
            if (!arg || !this.MKT_AGENCY_NAMES[arg]) continue;
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

    get groupLabel(): string {
        const type = this.developerGroups[0]?.group_type;
        if (type === 'líder' && this.selectedService === 'marketing') return 'Agencia';
        if (type === 'líder') return 'Líder';
        if (type === 'proyecto') return 'Proyecto';
        return 'Grupo / Proyecto';
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

    private readonly LEADER_NAMES: Record<string, string> = {
        'lider 1': 'ALVARO ROMERO MONTIEL',
        'líder 1': 'ALVARO ROMERO MONTIEL',
        'lider 2': 'MARTHA SANDOVAL GONZALEZ',
        'líder 2': 'MARTHA SANDOVAL GONZALEZ',
        'lider 3': 'ARTURO LOPEZ OROZCO',
        'líder 3': 'ARTURO LOPEZ OROZCO',
    };

    private readonly MKT_AGENCY_NAMES: Record<string, string> = {
        'GRUPO SAN CARLOS 1': 'Madake (P & C)',
        'GRUPO SAN CARLOS 2': 'Madake (PV & SI)',
    };

    formatGroupName(g: DbDeveloperGroup): string {
        if (this.selectedService === 'marketing' && g.group_type === 'líder') {
            return this.MKT_AGENCY_NAMES[g.script_arg] ?? g.name;
        }
        return this.LEADER_NAMES[g.name.toLowerCase()] ?? g.name;
    }

    form!: FormGroup;

    readonly DAYS_OPTIONS = [
        { value: -1, label: 'Todos los días' },
        { value: 1,  label: 'Todos los lunes' },
        { value: 2,  label: 'Todos los martes' },
        { value: 3,  label: 'Todos los miércoles' },
        { value: 4,  label: 'Todos los jueves' },
        { value: 5,  label: 'Todos los viernes' },
        { value: 6,  label: 'Todos los sábados' },
        { value: 0,  label: 'Todos los domingos' },
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

    constructor(
        private svc: SelfServiceService,
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
    ) {}

    async ngOnInit(): Promise<void> {
        this.developers = await this.svc.getDevelopers();
        this.buildForm();

        const service = this.route.snapshot.queryParamMap.get('service') as ServiceType | null;
        if (service && this.ALL_SERVICES.includes(service)) {
            this.selectService(service);
            this.step = 2;
        }
    }

    private buildForm(): void {
        this.form = this.fb.group({
            developer_id:           ['', Validators.required],
            developer_group_id:     [null],
            sub_project_id:         [null],
            marketing_agency_key:   [null],
            recipients:             [''],
            // on_demand
            fecha_corte:        [null],
            // recurring
            cada_dia:           [1],
            a_las:              [9],
        });

        this.form.get('developer_id')!.valueChanges.subscribe(id => {
            if (id) this.onDeveloperChange(id);
        });
    }

    todayIso(): string {
        return new Date().toISOString().split('T')[0];
    }

    async onDeveloperChange(developerId: string): Promise<void> {
        this.developerGroups = [];
        this.subProjects = [];
        this.form.patchValue({ developer_group_id: null, sub_project_id: null, marketing_agency_key: null });
        this.loadingRelated = true;
        const [groups, subProjects] = await Promise.all([
            this.svc.getDeveloperGroups(developerId, this.selectedService ?? undefined),
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
        this.syntheticTypeIds.clear();
        const types = await this.svc.getReportTypes(this.selectedService);
        const base = types.length > 0 ? types : FALLBACK_TYPES;
        const hasDiario = base.some(t => t.name.toLowerCase().includes('diario'));
        if (!hasDiario && this.selectedService !== 'marketing') {
            const label = SERVICE_LABELS[this.selectedService];
            const syntheticId = `diario-${this.selectedService}`;
            const diario: DbReportType = {
                id: syntheticId,
                service: this.selectedService,
                name: `Reporte Diario ${label}`,
                description: `Análisis diario del funnel de ${label.toLowerCase()}`,
                created_at: '',
            };
            this.syntheticTypeIds.add(syntheticId);
            this.reportTypes = [diario, ...base];
        } else {
            this.reportTypes = base;
        }
        this.loadingTypes = false;
    }

    isSyntheticType(rt: DbReportType): boolean {
        return this.syntheticTypeIds.has(rt.id);
    }

    selectReportType(rt: DbReportType): void {
        if (this.isSyntheticType(rt)) return;
        this.selectedReportType = rt;
    }

    selectModalidad(mode: 'on_demand' | 'recurring'): void {
        this.selectedModalidad = mode;
    }

    canGoNext(): boolean {
        if (this.step === 1) return this.selectedService !== null;
        if (this.step === 2) return this.selectedReportType !== null;
        if (this.step === 3) return this.selectedModalidad !== null;
        if (this.step === 4) {
            const devOk = !!this.form.get('developer_id')!.value;
            const agencyOk = this.marketingAgencies.length === 0
                || !!this.form.get('marketing_agency_key')!.value;
            if (this.selectedModalidad === 'on_demand') return devOk && agencyOk;
            return devOk && agencyOk && this.form.get('a_las')!.value != null;
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

        // Si se eligió agencia MKT, expandir a una fila por cada proyecto del grupo.
        const agency = v.marketing_agency_key
            ? this.marketingAgencies.find(a => a.key === v.marketing_agency_key)
            : null;
        const subProjectIds: (string | null)[] = agency
            ? agency.projects.map(p => p.id)
            : [v.sub_project_id || null];

        for (const subId of subProjectIds) {
            if (this.selectedModalidad === 'on_demand') {
                const { error } = await this.svc.createExecution({
                    schedule_id:        null,
                    developer_id:       v.developer_id,
                    sub_project_id:     subId,
                    report_type_id:     this.selectedReportType.id,
                    triggered_by:       'manual',
                    triggered_by_user:  null,
                    recipients,
                    status:             'queued',
                    date_range_start:   v.fecha_corte || null,
                    date_range_end:     v.fecha_corte || null,
                });
                if (error) { this.submitError = error.message; this.isSubmitting = false; return; }
            } else {
                const { error } = await this.svc.createSchedule({
                    developer_id:       v.developer_id,
                    sub_project_id:     subId,
                    report_type_id:     this.selectedReportType.id,
                    frequency:          'weekly',
                    day_of_week:        v.cada_dia,
                    day_of_month:       null,
                    hour:               v.a_las,
                    timezone:           'America/Mexico_City',
                    start_date:         this.todayIso(),
                    end_date:           null,
                    recipients,
                    active:             true,
                    created_by:         null,
                });
                if (error) { this.submitError = error.message; this.isSubmitting = false; return; }
            }
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
