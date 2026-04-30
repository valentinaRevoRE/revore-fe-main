import { Routes } from '@angular/router';
import { GuardianGuard } from '@core/guards/guardian.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadChildren: () => import('./pages/public/public.routes').then( r => r.routes )
    },
    {
        path: 'dashboard',
        loadChildren: () => import('./pages/private/private.routes').then( r => r.routes ),
        canActivate: [GuardianGuard]
    },
    // ── RevoRE Self-Service: rutas públicas (sin GuardianGuard) ──────────────
    // El callback y access-denied no pueden vivir dentro de /dashboard porque
    // no requieren JWT — son parte del flujo Supabase OAuth independiente.
    {
        path: 'revore/auth/callback',
        loadComponent: () => import('./pages/revore-self-service/auth/callback/auth-callback.component')
            .then(c => c.AuthCallbackComponent)
    },
    {
        path: 'revore/access-denied',
        loadComponent: () => import('./pages/revore-self-service/auth/access-denied/access-denied.component')
            .then(c => c.AccessDeniedComponent)
    }
];
