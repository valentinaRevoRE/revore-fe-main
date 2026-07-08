export interface AgentExecution {
  id?: string;
  status: 'queued' | 'running' | 'sent' | 'failed';
  triggered_by: 'scheduled' | 'manual';
  resultado?: {
    proyecto?: string;
    periodo?: string;
    inversion_total?: number;
    leads_totales?: number;
    cpl_promedio?: number;
    campanias_analizadas?: number;
    hallazgos?: number;
    detalle_hallazgos?: string[];
    correo_enviado_a?: string[];
  } | null;
  error_message?: string | null;
  finished_at?: string | null;
  created_at: string;
}

export interface Agent {
  id: string;
  nombre: string;
  tipo: string;
  developer_name?: string | null;
  destinatarios: { to?: string[] };
  periodicidad: { dias: string[]; hora: string };
  activo: boolean;
  next_run?: string | null;
  last_run?: string | null;
  last_execution?: AgentExecution | null;
}

export const AGENT_DESCRIPTIONS: Record<string, string> = {
  budget_guardian:
    'Revisa la inversión por anuncio (hoja MKT) y el CPL de cada campaña. Avisa por correo cuando una campaña gasta sin generar leads o su CPL se dispara vs. el promedio del proyecto.',
};

export function periodicidadLabel(p: { dias: string[]; hora: string }): string {
  const dias = p?.dias ?? [];
  const hora = p?.hora ?? '';
  if (dias.length === 7) return `Diario ${hora}`;
  if (dias.length === 5 && !dias.includes('sab') && !dias.includes('dom')) return `L–V ${hora}`;
  return `${dias.join(', ')} ${hora}`;
}
