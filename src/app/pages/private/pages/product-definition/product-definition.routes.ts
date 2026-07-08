import { Routes } from '@angular/router';

export const productDefinitionRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./product-definition.component').then(c => c.ProductDefinitionComponent),
  },
  {
    path: 'plan-comercial',
    loadComponent: () =>
      import('./pages/plan-comercial/plan-comercial.component').then(c => c.PlanComercialComponent),
  },
];
