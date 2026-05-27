import { Routes } from '@angular/router';

export const alertasRoutes: Routes = [
    {
        path: 'listado',
        loadComponent: () =>
            import('./pages/listado/alertas-listado.component').then(
                c => c.AlertasListadoComponent
            ),
    },
    {
        path: 'crear',
        loadComponent: () =>
            import('./pages/form/alertas-form.component').then(
                c => c.AlertasFormComponent
            ),
    },
    {
        path: 'editar/:id',
        loadComponent: () =>
            import('./pages/form/alertas-form.component').then(
                c => c.AlertasFormComponent
            ),
    },
    {
        path: 'historial',
        loadComponent: () =>
            import('./pages/historial/alertas-historial.component').then(
                c => c.AlertasHistorialComponent
            ),
    },
    { path: '', redirectTo: 'listado', pathMatch: 'full' },
    { path: '**', redirectTo: 'listado' },
];
