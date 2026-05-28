import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@environments/environments.local';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
    private readonly _client: SupabaseClient;

    constructor() {
        this._client = createClient(
            environment.supabase.url,
            environment.supabase.anonKey,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    // Clave separada para no colisionar con el JWT del repo principal
                    storageKey: 'revore_ss_auth',
                },
            }
        );
    }

    /** Cliente Supabase listo para usar */
    get db(): SupabaseClient {
        return this._client;
    }
}
