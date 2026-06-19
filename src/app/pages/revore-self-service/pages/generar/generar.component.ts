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

    get groupLabel(): string {
        if (this.subProjects.length > 0) return 'Proyecto';
        const type = this.developerGroups[0]?.group_type;
        if (type === 'líder' && this.selectedService === 'marketing') return 'Agencia';
        if (type === 'líder') return 'Líder';
        if (type === 'proyecto') return 'Proyecto';
        return 'Grupo / Proyecto';
    }

    get hasSelection(): boolean {
        return this.developerGroups.length > 0 || this.subProjects.length > 0;
    }

    /** El reporte de brokers es exclusivo de GSC (Grupo San Carlos). */
    get isBrokersType(): boolean {
        return !!this.selectedReportType && /broker/i.test(this.selectedReportType.name);
    }

    /**
     * El C-Level es a nivel portafolio: cubre todos los proyectos del desarrollo
     * en un solo deck, por lo que no aplica selección de proyecto/grupo.
     */
    get isCLevelType(): boolean {
        return !!this.selectedReportType && /c-?level/i.test(this.selectedReportType.name);
    }

    private isGsc(d: DbDeveloper): boolean {
        return d.name.trim().toUpperCase() === 'GRUPO SAN CARLOS';
    }

    /** Developers visibles en el dropdown: solo GSC cuando el tipo es Brokers. */
    get visibleDevelopers(): DbDeveloper[] {
        return this.isBrokersType ? this.developers.filter(d => this.isGsc(d)) : this.developers;
    }

    private get selectedDeveloperName(): string {
        const developerId = this.form?.get('developer_id')?.value;
        return this.developers.find(d => d.id === developerId)?.name ?? '';
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
            developer_id:       ['', Validators.required],
            developer_group_id: [null],
            sub_project_id:     [null],
            recipients:         [''],
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
        this.form.patchValue({ developer_group_id: null, sub_project_id: null });
        // Brokers usa solo el developer (GSC → script_arg "GRUPO SAN CARLOS 1");
        // no aplica selección de líder ni sub-proyecto.
        if (this.isBrokersType) return;
        // El C-Level es a nivel portafolio (todos los proyectos del desarrollo),
        // así que no se elige proyecto/grupo.
        if (this.isCLevelType) return;
        this.loadingRelated = true;
        const groups = await this.svc.getDeveloperGroups(developerId, this.selectedService ?? undefined);
        if (groups.length > 0) {
            this.developerGroups = groups;
        } else {
            this.subProjects = await this.svc.getSubProjects(developerId);
        }
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

        const devCtrl = this.form?.get('developer_id');
        if (this.isBrokersType) {
            // Brokers solo aplica a GSC: lo auto-seleccionamos.
            const gsc = this.developers.find(d => this.isGsc(d));
            if (gsc && devCtrl?.value !== gsc.id) {
                devCtrl?.setValue(gsc.id);   // dispara valueChanges → onDeveloperChange
                return;
            }
        }
        // Refrescar grupos/sub-proyectos según el tipo recién elegido.
        if (devCtrl?.value) this.onDeveloperChange(devCtrl.value);
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
            if (this.selectedModalidad === 'on_demand') return devOk;
            return devOk && this.form.get('a_las')!.value != null;
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
                date_range_start:   v.fecha_corte || null,
                date_range_end:     v.fecha_corte || null,
            });
            if (error) { this.submitError = error.message; this.isSubmitting = false; return; }
        } else {
            const { error } = await this.svc.createSchedule({
                developer_id:       v.developer_id,
                sub_project_id:     v.sub_project_id || null,
                developer_group_id: v.developer_group_id || null,
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
