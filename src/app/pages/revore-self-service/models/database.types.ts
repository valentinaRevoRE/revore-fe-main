// ─── Enums / Union Types ────────────────────────────────────────────────────

export type ExecutionStatus =
    | 'queued'
    | 'generating'
    | 'enriching'
    | 'sending'
    | 'completed'
    | 'failed';

export type ScheduleFrequency = 'weekly' | 'monthly';

export type TriggeredBy = 'manual' | 'scheduled';

export type ServiceType =
    | 'marketing'
    | 'sales'
    | 'estrategia'
    | 'revenue_management'
    | 'operaciones';

export type GroupType = 'líder' | 'proyecto';

// ─── Table Interfaces ───────────────────────────────────────────────────────

export interface DbUser {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
    last_login: string | null;
    created_at: string;
}

export interface DbDeveloper {
    id: string;
    name: string;
    /** Argumento técnico que recibe el backend Python */
    script_arg: string;
    active: boolean;
    created_at: string;
}

export interface DbDeveloperGroup {
    id: string;
    developer_id: string;
    name: string;
    /** Argumento técnico que recibe el backend Python */
    script_arg: string;
    group_type: GroupType;
    display_order: number;
    created_at: string;
    available_for_services: string[] | null;
}

export interface DbSubProject {
    id: string;
    developer_id: string;
    name: string;
    created_at: string;
}

export interface DbReportType {
    id: string;
    /** Servicio al que pertenece el reporte (renombrado de `module`) */
    service: ServiceType;
    name: string;
    description: string | null;
    created_at: string;
}

export interface DbSchedule {
    id: string;
    developer_id: string;
    sub_project_id: string | null;
    developer_group_id: string | null;
    report_type_id: string;
    frequency: ScheduleFrequency;
    day_of_week: number | null;   // 0=domingo … 6=sábado
    day_of_month: number | null;  // 1–28
    hour: number;                 // 0–23
    timezone: string;
    start_date: string;           // ISO date string
    end_date: string | null;
    recipients: string[];
    active: boolean;
    next_run: string | null;      // ISO datetime string
    created_by: string | null;
    created_at: string;
}

export interface DbExecution {
    id: string;
    schedule_id: string | null;
    developer_id: string;
    sub_project_id: string | null;
    developer_group_id: string | null;
    report_type_id: string;
    triggered_by: TriggeredBy;
    triggered_by_user: string | null;
    recipients: string[];
    status: ExecutionStatus;
    file_url: string | null;
    error_message: string | null;
    date_range_start: string | null;  // ISO date string
    date_range_end: string | null;    // ISO date string
    created_at: string;
    completed_at: string | null;
}

// ─── With Relations (para joins en queries) ─────────────────────────────────

export interface ExecutionWithRelations extends DbExecution {
    developers?: { name: string } | null;
    sub_projects?: { name: string } | null;
    report_types?: { name: string; service: ServiceType } | null;
    developer_groups?: { name: string } | null;
}

export interface ScheduleWithRelations extends DbSchedule {
    developers?: { name: string } | null;
    sub_projects?: { name: string } | null;
    report_types?: { name: string; service: ServiceType } | null;
    developer_groups?: { name: string } | null;
}

// ─── UI Helpers ─────────────────────────────────────────────────────────────

/** Etiqueta legible para un status de ejecución */
export const EXECUTION_STATUS_LABELS: Record<ExecutionStatus, string> = {
    queued:     'En cola',
    generating: 'Generando',
    enriching:  'Enriqueciendo',
    sending:    'Enviando',
    completed:  'Completado',
    failed:     'Fallido',
};

/** Etiquetas para servicios del wizard */
export const SERVICE_LABELS: Record<ServiceType, string> = {
    marketing:          'Marketing',
    sales:              'Ventas',
    estrategia:         'Estrategia',
    revenue_management: 'Revenue Management',
    operaciones:        'Operaciones',
};

/** Servicios disponibles actualmente (los demás son "Próximamente") */
export const ACTIVE_SERVICES: ServiceType[] = ['marketing', 'sales'];
