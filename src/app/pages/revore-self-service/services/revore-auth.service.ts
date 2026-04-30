import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class RevoreAuthService {
    private readonly _currentUser$ = new BehaviorSubject<User | null>(null);

    readonly currentUser$: Observable<User | null> = this._currentUser$.asObservable();

    constructor(private supabaseS: SupabaseService) {
        // Inicializar con la sesión actual
        this.supabaseS.db.auth.getSession().then(({ data }) => {
            this._currentUser$.next(data.session?.user ?? null);
        });

        // Mantener sincronizado con cambios de auth
        this.supabaseS.db.auth.onAuthStateChange((_event, session) => {
            this._currentUser$.next(session?.user ?? null);
        });
    }

    get currentUser(): User | null {
        return this._currentUser$.value;
    }

    async signOut(): Promise<void> {
        await this.supabaseS.db.auth.signOut();
    }
}
