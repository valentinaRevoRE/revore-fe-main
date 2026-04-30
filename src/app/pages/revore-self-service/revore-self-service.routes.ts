import { Routes } from '@angular/router';

// Guard y rutas públicas (callback, access-denied) viven en app.routes.ts.
// El revoreAuthGuard se aplica al nivel padre en private.routes.ts.

export const revoreRoutes: Routes = [
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./pages/dashboard/dashboard.component').then(
                c => c.DashboardComponent
            ),
    },
    {
        path: 'generar',
        loadComponent: () =>
            import('./pages/generar/generar.component').then(
                c => c.GenerarComponent
            ),
    },
    {
        path: 'programaciones',
        loadComponent: () =>
            import('./pages/programaciones/programaciones.component').then(
                c => c.ProgramacionesComponent
            ),
    },
    {
        path: 'historial',
        loadComponent: () =>
            import('./pages/historial/historial.component').then(
                c => c.HistorialComponent
            ),
    },
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: '**', redirectTo: 'dashboard' },
];
