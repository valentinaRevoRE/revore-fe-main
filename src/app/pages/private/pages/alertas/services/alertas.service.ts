import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environments.local';
import { SupabaseService } from '@revore/services/supabase.service';
import { from, Observable, switchMap } from 'rxjs';
import {
    Alerta,
    AlertaHistorialItem,
    autoName,
    emptyDestinatarios,
} from '../models/alerta.model';

/**
 * AlertasService — patrón híbrido:
 *  - CRUD (list/get/create/update/toggle/delete) → Supabase directo (RLS server-side).
 *  - Disparo manual ("Run now") → backend FastAPI (/api/alerts/:id/run) con cookie auth.
 *  - Historial → Supabase directo.
 */
@Injectable({ providedIn: 'root' })
export class AlertasService {
    private readonly supabase = inject(SupabaseService);
    private readonly http = inject(HttpClient);
    private readonly backendUrl = environment.revore.backendUrl;

    private get table() {
        return this.supabase.db.from('alerts');
    }

    list(): Observable<Alerta[]> {
        const promise = this.supabase.db
            .from('alerts')
            .select('*, developers:Desarrolladores(name:Desarrollador), sub_projects:Proyectos(name:Nombre)')
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (error) throw error;
                return (data ?? []).map(this.fromDb);
            });
        return from(promise);
    }

    getById(id: string): Observable<Alerta | undefined> {
        const promise = this.supabase.db
            .from('alerts')
            .select('*, developers:Desarrolladores(name:Desarrollador)')
            .eq('id', id)
            .single()
            .then(({ data, error }) => {
                if (error) return undefined;
                return data ? this.fromDb(data) : undefined;
            });
        return from(promise);
    }

    create(alerta: Alerta): Observable<Alerta> {
        const payload = this.toDb(alerta);
        const promise = this.table
            .insert(payload)
            .select('*, developers:Desarrolladores(name:Desarrollador)')
            .single()
            .then(({ data, error }) => {
                if (error) throw error;
                return this.fromDb(data);
            });
        return from(promise);
    }

    update(id: string, alerta: Alerta): Observable<Alerta> {
        const payload = this.toDb(alerta);
        payload['next_run'] = null;
        const promise = this.table
            .update(payload)
            .eq('id', id)
            .select('*, developers:Desarrolladores(name:Desarrollador)')
            .single()
            .then(({ data, error }) => {
                if (error) throw error;
                return this.fromDb(data);
            });
        return from(promise);
    }

    toggle(id: string, activo: boolean): Observable<void> {
        const promise = this.table
            .update({ activo })
            .eq('id', id)
            .then(({ error }) => {
                if (error) throw error;
            });
        return from(promise);
    }

    delete(id: string): Observable<void> {
        const promise = this.table
            .delete()
            .eq('id', id)
            .then(({ error }) => {
                if (error) throw error;
            });
        return from(promise);
    }

    runNow(id: string): Observable<{ id: string }> {
        // Mandamos el access_token de Supabase en Authorization — el backend lo valida
        // contra Supabase. withCredentials también va por si la cookie HttpOnly existe.
        return from(this.supabase.db.auth.getSession()).pipe(
            switchMap(({ data }) => {
                const token = data.session?.access_token;
                const headers: Record<string, string> = token
                    ? { Authorization: `Bearer ${token}` }
                    : {};
                return this.http.post<{ id: string }>(
                    `${this.backendUrl}/api/alerts/${id}/run`,
                    {},
                    { headers, withCredentials: true }
                );
            })
        );
    }

    historial(alertId?: string): Observable<AlertaHistorialItem[]> {
        let query = this.supabase.db
            .from('alert_executions')
            .select('*, alerts(nombre, tipo, canal, destinatarios, developers:Desarrolladores(name:Desarrollador))')
            .order('started_at', { ascending: false })
            .limit(100);
        if (alertId) query = query.eq('alert_id', alertId);

        const promise = query.then(({ data, error }) => {
            if (error) throw error;
            return (data ?? []).map((row: any) => {
                const dest = row.alerts?.destinatarios ?? {};
                const canal = row.alerts?.canal ?? 'email';
                const lista: string[] =
                    canal === 'whatsapp'
                        ? dest.telefonos ?? []
                        : [...(dest.to ?? []), ...(dest.cc ?? []), ...(dest.bcc ?? [])];
                return {
                    id: row.id,
                    alertaId: row.alert_id,
                    alertaNombre:
                        row.alerts?.nombre ??
                        (row.alerts
                            ? autoName({
                                  tipo: row.alerts.tipo,
                                  developer_name: row.alerts.developers?.name,
                              })
                            : '(eliminada)'),
                    tipo: row.alerts?.tipo,
                    developerName: row.alerts?.developers?.name,
                    canal,
                    destinatarios: lista,
                    enviadoEn: row.started_at,
                    estado: this.mapStatus(row.status),
                    mensaje: row.error_message ?? undefined,
                };
            }) as AlertaHistorialItem[];
        });
        return from(promise);
    }

    // ── mapping helpers ──────────────────────────────────────────────────────

    private fromDb = (row: any): Alerta => ({
        id: row.id,
        developer_id: row.developer_id,
        developer_name: row.developers?.name,
        sub_project_id: row.sub_project_id ?? null,
        developer_group_id: row.developer_group_id ?? null,
        sub_project_name: row.sub_projects?.name,
        developer_group_name: row.developer_groups?.name,
        nombre: row.nombre ?? undefined,
        tipo: row.tipo,
        canal: row.canal,
        destinatarios: { ...emptyDestinatarios(), ...(row.destinatarios ?? {}) },
        periodicidad: row.periodicidad ?? { dias: [], hora: '09:00' },
        activo: !!row.activo,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });

    private toDb(alerta: Alerta): Record<string, any> {
        return {
            developer_id: alerta.developer_id,
            sub_project_id: alerta.sub_project_id ?? null,
            nombre: alerta.nombre || null,
            tipo: alerta.tipo,
            canal: alerta.canal,
            destinatarios: alerta.destinatarios,
            periodicidad: alerta.periodicidad,
            activo: alerta.activo,
        };
    }

    private mapStatus(s: string): 'enviado' | 'fallido' | 'pendiente' {
        if (s === 'sent') return 'enviado';
        if (s === 'failed') return 'fallido';
        return 'pendiente';
    }
}
