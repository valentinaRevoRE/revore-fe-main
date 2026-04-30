import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '@environments/environments.local';
import { SupabaseService } from '@revore/services/supabase.service';

export const revoreAuthGuard: CanActivateFn = async () => {
    const supabaseS = inject(SupabaseService);
    const router = inject(Router);

    const { data: { session } } = await supabaseS.db.auth.getSession();

    if (!session) {
        // Redirigir al login para que haga Google OAuth
        router.navigateByUrl('/login');
        return false;
    }

    const email = session.user.email ?? '';
    if (!email.endsWith(`@${environment.revore.allowedDomain}`)) {
        await supabaseS.db.auth.signOut();
        router.navigateByUrl('/revore/access-denied');
        return false;
    }

    return true;
};
