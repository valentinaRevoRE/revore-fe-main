import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { environment } from '@environments/environments.local';
import { SupabaseService } from '@revore/services/supabase.service';

@Component({
    selector: 'app-revore-auth-callback',
    standalone: true,
    templateUrl: './auth-callback.component.html',
    styleUrl: './auth-callback.component.scss',
})
export class AuthCallbackComponent implements OnInit {
    hasError = false;

    constructor(
        private router: Router,
        private supabaseS: SupabaseService
    ) {}

    async ngOnInit(): Promise<void> {
        try {
            // PKCE flow: intercambiar code por session
            const code = new URLSearchParams(window.location.search).get('code');
            if (code) {
                const { error } = await this.supabaseS.db.auth.exchangeCodeForSession(code);
                if (error) throw error;
            }

            const { data: { session }, error: sessionError } =
                await this.supabaseS.db.auth.getSession();

            if (sessionError || !session) {
                this.router.navigateByUrl('/login');
                return;
            }

            const email = session.user.email ?? '';
            if (!email.endsWith(`@${environment.revore.allowedDomain}`)) {
                await this.supabaseS.db.auth.signOut();
                this.router.navigateByUrl('/revore/access-denied');
                return;
            }

            await this.upsertUserProfile(session.user);
            this.saveLocalUser(session.user);
            this.router.navigateByUrl('/dashboard/sales-tools/dashboard');

        } catch {
            this.hasError = true;
            setTimeout(() => this.router.navigateByUrl('/login'), 3000);
        }
    }

    private async upsertUserProfile(user: User): Promise<void> {
        const meta = user.user_metadata;
        await this.supabaseS.db.from('app_users').upsert(
            {
                id: user.id,
                email: user.email!,
                full_name: meta['full_name'] ?? meta['name'] ?? null,
                avatar_url: meta['avatar_url'] ?? meta['picture'] ?? null,
                last_login: new Date().toISOString(),
            },
            { onConflict: 'id' }
        );
    }

    private saveLocalUser(user: User): void {
        const meta = user.user_metadata;
        const full_name = meta['full_name'] ?? meta['name'] ?? user.email ?? 'Usuario';
        sessionStorage.setItem('user', JSON.stringify({
            id: user.id,
            email: user.email,
            full_name,
            avatar_url: meta['avatar_url'] ?? meta['picture'] ?? null,
        }));
        sessionStorage.setItem('userRoles', JSON.stringify([]));
    }
}
