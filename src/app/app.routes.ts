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
    }
];
