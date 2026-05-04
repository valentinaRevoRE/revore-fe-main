import { Routes } from '@angular/router';

import { RevenueManagementPlaceholderComponent } from './revenue-management-placeholder.component';
import { RevenueModelLayoutComponent } from './pages/revenue-model/shared/layout/revenue-model-layout/revenue-model-layout.component';
import { PriceListLayoutComponent } from './pages/revenue-model/pages/finantial/pages/price-list/layout/price-list-layout/price-list-layout.component';
import { AppreciationLayoutComponent } from './pages/revenue-model/pages/finantial/pages/appreciation-model/layout/appreciation-layout/appreciation-layout.component';
import { RevenueModelTableLayoutComponent } from './pages/revenue-model/pages/finantial/pages/revenue-model/layout/revenue-model-layout/revenue-model-layout.component';
import { GraphicsLayoutComponent } from './pages/revenue-model/pages/graphics/layout/graphics-layout/graphics-layout.component';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: RevenueManagementPlaceholderComponent,
  },
  {
    path: 'reportes',
    component: RevenueManagementPlaceholderComponent,
  },
  {
    path: 'revenue-model/finantial',
    component: RevenueModelLayoutComponent,
    children: [
      {
        path: 'price-list',
        component: PriceListLayoutComponent,
      },
      {
        path: 'appreciation-model',
        component: AppreciationLayoutComponent,
      },
      {
        path: 'revenue-model',
        component: RevenueModelTableLayoutComponent,
      },
      {
        path: '**',
        redirectTo: 'price-list',
      },
    ],
  },
  {
    path: 'revenue-model/graphics',
    component: RevenueModelLayoutComponent,
    children: [
      {
        path: '',
        component: GraphicsLayoutComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
