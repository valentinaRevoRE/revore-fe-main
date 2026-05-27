import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@environments/environments.local';

// Cliente Supabase separado para el proyecto de Metas (xujscamqorwckpqamnie).
// Distinto del proyecto principal de Self-Service (ywetvbuwyqucijbozeiy).
@Injectable({ providedIn: 'root' })
export class SupabaseMetasService {
    private readonly _client: SupabaseClient;

    constructor() {
        this._client = createClient(
            environment.supabaseMetas.url,
            environment.supabaseMetas.anonKey,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    storageKey: 'revore_metas_auth',
                },
            }
        );
    }

    get db(): SupabaseClient {
        return this._client;
    }
}
