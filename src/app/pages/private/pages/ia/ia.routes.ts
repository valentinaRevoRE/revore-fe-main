import { Routes } from '@angular/router';

export const iaRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/catalogo/ia-catalogo.component').then(c => c.IaCatalogoComponent),
  },
  {
    path: ':name',
    loadComponent: () =>
      import('./pages/detalle/ia-detalle.component').then(c => c.IaDetalleComponent),
  },
];
