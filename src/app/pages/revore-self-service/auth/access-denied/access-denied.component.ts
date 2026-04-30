import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '@revore/services/supabase.service';

@Component({
    selector: 'app-revore-access-denied',
    standalone: true,
    templateUrl: './access-denied.component.html',
    styleUrl: './access-denied.component.scss',
})
export class AccessDeniedComponent {
    constructor(
        private router: Router,
        private supabaseS: SupabaseService
    ) {}

    async goToLogin(): Promise<void> {
        await this.supabaseS.db.auth.signOut();
        this.router.navigateByUrl('/login');
    }
}
