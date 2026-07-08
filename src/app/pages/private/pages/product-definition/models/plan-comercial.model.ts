/** Parámetros que consume POST /api/skills/plan-comercial/{preview,generate} */
export interface PlanComercialParams {
  project_name: string;
  ubicacion: string;
  is_launch: boolean;
  ventas_totales: number;
  ticket: number;
  unidades_totales: number;
  tiene_data_mercado: boolean;
  start_month: number;
  start_year: number;
  bdd_general: number;
  ff_perfilados: number;
  distribucion: {
    digital: number;
    brokers: number;
    offline: number;
    prospeccion: number;
    referidos: number;
  };
  funnel: {
    conv_apartado_firma: number;
    conv_visita_apartado: number;
    conv_lead_visita: number;
    cpl: number;
  };
}

export interface PlanComercialPreview {
  ff_ventas_total: number;
  ff_ventas_por_mes: number;
  ventas_digital: number;
  apartados_necesarios: number;
  visitas_necesarias: number;
  leads_necesarios: number;
  presupuesto_digital: number;
  presupuesto_total: number;
  presupuesto_lineas: Record<string, number>;
  ventas_mensuales_valor: number;
  ratio: number;
  semaforo: 'verde' | 'amarillo' | 'rojo';
  viable: boolean;
  advertencias: string[];
  months: string[];
  teaser_month: string;
  plan_period: string;
}
