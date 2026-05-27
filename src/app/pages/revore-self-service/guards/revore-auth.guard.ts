import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '@environments/environments.local';
import { SupabaseService } from '@revore/services/supabase.service';

export const revoreAuthGuard: CanActivateFn = async () => {
    const supabaseS = inject(SupabaseService);
    const router = inject(Router);

    // Obtener email del usuario: primero localStorage (login normal), luego sesión Supabase (Google OAuth)
    let email = '';

    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');
    if (storedUser && storedToken) {
        try {
            email = JSON.parse(storedUser).email ?? '';
        } catch { /* ignore */ }
    }

    if (!email) {
        const { data: { session } } = await supabaseS.db.auth.getSession();
        if (session?.user?.email) {
            email = session.user.email;
        }
    }

    if (!email) {
        router.navigateByUrl('/login');
        return false;
    }

    const isDomainUser = email.endsWith(`@${environment.revore.allowedDomain}`);

    let hasAccess = isDomainUser;
    if (!isDomainUser) {
        const { data } = await supabaseS.db
            .from('self_service_allowed_emails')
            .select('email')
            .eq('email', email)
            .maybeSingle();
        hasAccess = !!data;
    }

    if (!hasAccess) {
        router.navigateByUrl('/revore/access-denied');
        return false;
    }

    return true;
};
