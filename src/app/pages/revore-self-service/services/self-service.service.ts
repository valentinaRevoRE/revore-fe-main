import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SupabaseMetasService } from './supabase-metas.service';
import {
    DbDeveloper, DbDeveloperGroup, DbSubProject, DbReportType,
    DbSchedule, DbExecution, ExecutionWithRelations, ScheduleWithRelations,
    ExecutionStatus, ServiceType,
    DbDesarrollador, DbProyecto, DbMeta, MetaWithRelations, GoalType, MetaDetails,
} from '../models/database.types';

@Injectable({ providedIn: 'root' })
export class SelfServiceService {

    constructor(
        private supabaseS: SupabaseService,
        private supabaseMetasS: SupabaseMetasService,
    ) {}

    // ── Developers ────────────────────────────────────────────────────────────

    async getDevelopers(): Promise<DbDeveloper[]> {
        const { data } = await this.supabaseS.db
            .from('developers')
            .select('*')
            .eq('active', true)
            .order('name');
        return (data ?? []) as DbDeveloper[];
    }

    async getDeveloperGroups(developerId: string, service?: string): Promise<DbDeveloperGroup[]> {
        const { data } = await this.supabaseS.db
            .from('developer_groups')
            .select('*')
            .eq('developer_id', developerId)
            .order('display_order');
        const all = (data ?? []) as DbDeveloperGroup[];
        const visible = all.filter(g => {
            const raw: string[] = Array.isArray(g.available_for_services)
                ? g.available_for_services
                : g.available_for_services
                    ? String(g.available_for_services).replace(/[{}]/g, '').split(',').map((s: string) => s.trim()).filter(Boolean)
                    : [];
            if (raw.includes('hidden')) return false;
            if (!service) return true;
            return raw.length === 0 || raw.includes(service);
        });
        return visible;
    }

    async getSubProjects(developerId: string): Promise<DbSubProject[]> {
        const { data } = await this.supabaseS.db
            .from('sub_projects')
            .select('*')
            .eq('developer_id', developerId)
            .order('name');
        return (data ?? []) as DbSubProject[];
    }

    // ── Report Types ──────────────────────────────────────────────────────────

    async getReportTypes(service?: ServiceType): Promise<DbReportType[]> {
        let query = this.supabaseS.db.from('report_types').select('*');
        if (service) query = (query as any).eq('service', service);
        const { data } = await (query as any).order('name');
        return (data ?? []) as DbReportType[];
    }

    // ── Executions ────────────────────────────────────────────────────────────

    async getExecutions(filters?: {
        status?: ExecutionStatus;
        developerId?: string;
        limit?: number;
    }): Promise<ExecutionWithRelations[]> {
        let query = this.supabaseS.db
            .from('executions')
            .select('*, developers(name), sub_projects(name), report_types(name, service), developer_groups(name, script_arg, group_type)')
            .order('created_at', { ascending: false });

        if (filters?.status) query = (query as any).eq('status', filters.status);
        if (filters?.developerId) query = (query as any).eq('developer_id', filters.developerId);
        if (filters?.limit) query = (query as any).limit(filters.limit);

        const { data } = await query;
        return (data ?? []) as ExecutionWithRelations[];
    }

    async createExecution(payload: Omit<DbExecution, 'id' | 'created_at' | 'completed_at' | 'file_url' | 'error_message'>): Promise<{ error: any }> {
        const { error } = await this.supabaseS.db.from('executions').insert(payload as any);
        return { error };
    }

    async getStats(): Promise<{ total: number; completed: number; inProgress: number; failed: number }> {
        const { data } = await this.supabaseS.db.from('executions').select('status');
        const all = (data ?? []) as { status: ExecutionStatus }[];
        return {
            total: all.length,
            completed: all.filter(e => e.status === 'completed').length,
            inProgress: all.filter(e => ['queued', 'generating', 'enriching', 'sending'].includes(e.status)).length,
            failed: all.filter(e => e.status === 'failed').length,
        };
    }

    // ── Schedules ─────────────────────────────────────────────────────────────

    async getSchedules(): Promise<ScheduleWithRelations[]> {
        const { data } = await this.supabaseS.db
            .from('schedules')
            .select('*, developers(name), sub_projects(name), report_types(name, service), developer_groups(name, script_arg, group_type)')
            .order('created_at', { ascending: false });
        return (data ?? []) as ScheduleWithRelations[];
    }

    async createSchedule(payload: Omit<DbSchedule, 'id' | 'created_at' | 'next_run'>): Promise<{ error: any }> {
        const { error } = await this.supabaseS.db.from('schedules').insert(payload as any);
        return { error };
    }

    async updateSchedule(id: string, payload: Partial<DbSchedule>): Promise<{ error: any }> {
        const { error } = await this.supabaseS.db.from('schedules').update(payload as any).eq('id', id);
        return { error };
    }

    async deleteSchedule(id: string): Promise<{ error: any }> {
        const { error } = await this.supabaseS.db.from('schedules').delete().eq('id', id);
        return { error };
    }

    // ── Metas (proyecto Supabase separado: xujscamqorwckpqamnie) ──────────────

    async getDesarrolladores(): Promise<DbDesarrollador[]> {
        const { data } = await this.supabaseMetasS.db
            .from('Desarrolladores')
            .select('*')
            .order('Desarrollador');
        return (data ?? []) as DbDesarrollador[];
    }

    async getProyectos(desarrolladorId?: string): Promise<DbProyecto[]> {
        let query = this.supabaseMetasS.db.from('Proyectos').select('*').order('Nombre');
        if (desarrolladorId) query = (query as any).eq('Desarrollador_id', desarrolladorId);
        const { data } = await query;
        return (data ?? []) as DbProyecto[];
    }

    async getMetas(filters?: { desarrolladorId?: string; proyectoId?: string; period?: string }): Promise<MetaWithRelations[]> {
        let query = this.supabaseMetasS.db
            .from('Metas')
            .select('*, Proyectos(Nombre, Desarrollador_id)')
            .order('period', { ascending: false });

        if (filters?.proyectoId)  query = (query as any).eq('Proyecto_id', filters.proyectoId);
        if (filters?.period)      query = (query as any).eq('period', filters.period);

        const { data } = await query;
        let rows = (data ?? []) as MetaWithRelations[];
        // El filtro por desarrollador se aplica en cliente (FK indirecta vía Proyectos)
        if (filters?.desarrolladorId) {
            rows = rows.filter(m => m.Proyectos?.Desarrollador_id === filters.desarrolladorId);
        }
        return rows;
    }

    async createMeta(payload: { Proyecto_id: string; goal_type: GoalType; period: string; details: MetaDetails }): Promise<{ error: any }> {
        const { error } = await this.supabaseMetasS.db.from('Metas').insert(payload as any);
        return { error };
    }

    async updateMeta(id: string, payload: Partial<Pick<DbMeta, 'goal_type' | 'period' | 'details' | 'Proyecto_id'>>): Promise<{ error: any }> {
        const { error } = await this.supabaseMetasS.db.from('Metas').update(payload as any).eq('id', id);
        return { error };
    }

    async deleteMeta(id: string): Promise<{ error: any }> {
        const { error } = await this.supabaseMetasS.db.from('Metas').delete().eq('id', id);
        return { error };
    }
}
