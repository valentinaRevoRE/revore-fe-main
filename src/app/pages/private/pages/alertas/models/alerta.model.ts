export type TipoAlerta = 'leads' | 'visitas' | 'metrica_custom' | 'reporte_programado';

export type CanalAlerta = 'whatsapp' | 'email';

export type DiaSemana = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom';

export interface Destinatarios {
    to: string[];
    cc: string[];
    bcc: string[];
    telefonos: string[];
}

export interface Periodicidad {
    dias: DiaSemana[];
    hora: string; // HH:mm
}

export interface Alerta {
    id?: string;
    developer_id: string;
    developer_name?: string;   // populated client-side para mostrar en listado
    nombre?: string;           // si está vacío, el front muestra autoname
    tipo: TipoAlerta;
    canal: CanalAlerta;
    destinatarios: Destinatarios;
    periodicidad: Periodicidad;
    activo: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface AlertaHistorialItem {
    id: string;
    alertaId: string;
    alertaNombre: string;
    tipo?: TipoAlerta;
    developerName?: string;
    canal: CanalAlerta;
    destinatarios: string[];
    enviadoEn: string;
    estado: 'enviado' | 'fallido' | 'pendiente';
    mensaje?: string;
}

export const TIPOS_ALERTA: Array<{ value: TipoAlerta; label: string; disabled: boolean }> = [
    { value: 'leads', label: 'Leads', disabled: false },
    { value: 'visitas', label: 'Visitas', disabled: false },
    { value: 'metrica_custom', label: 'Métrica custom (próximamente)', disabled: true },
    { value: 'reporte_programado', label: 'Reporte programado (próximamente)', disabled: true },
];

export const CANALES_ALERTA: Array<{ value: CanalAlerta; label: string; disabled: boolean }> = [
    { value: 'whatsapp', label: 'WhatsApp', disabled: false },
    { value: 'email', label: 'Email', disabled: false },
];

export const DIAS_SEMANA: Array<{ value: DiaSemana; label: string }> = [
    { value: 'lun', label: 'L' },
    { value: 'mar', label: 'M' },
    { value: 'mie', label: 'X' },
    { value: 'jue', label: 'J' },
    { value: 'vie', label: 'V' },
    { value: 'sab', label: 'S' },
    { value: 'dom', label: 'D' },
];

/** Auto-name: "Alerta de leads faltantes — TARE" / "Alerta de visitas mensual — TARE" */
export function autoName(alerta: Pick<Alerta, 'tipo' | 'developer_name'>): string {
    const dev = alerta.developer_name ?? '';
    if (alerta.tipo === 'leads') return `Alerta de leads faltantes${dev ? ' — ' + dev : ''}`;
    if (alerta.tipo === 'visitas') return `Alerta de visitas mensual${dev ? ' — ' + dev : ''}`;
    return 'Alerta';
}

export function emptyDestinatarios(): Destinatarios {
    return { to: [], cc: [], bcc: [], telefonos: [] };
}
