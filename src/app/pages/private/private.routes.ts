import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './shared/layout/dashboard-layout/dashboard-layout.component';
import { HomeLayoutComponent } from './pages/home/layout/home-layout/home-layout.component';
import { GuardianByProject } from '@core/guards/guardian.guard';
import { SalesToolsComponent } from './pages/sales-tools/sales-tools.component';
import { ProductDefinitionComponent } from './pages/product-definition/product-definition.component';
import { MarketingComponent } from './pages/marketing/marketing.component';

export const routes: Routes = [
    {
        path: '',
        component: DashboardLayoutComponent,
        children: [
            {
                path: 'home',
                component: HomeLayoutComponent
            },
            {
                path: 'revenue-management',
                loadChildren: () => import('./pages/revenue-management/revenue.routes').then( r => r.routes ),
                canActivate: [GuardianByProject]
            },
            {
                path: 'sales-tools',
                component: SalesToolsComponent
            },
            {
                path: 'product-definition', 
                component: ProductDefinitionComponent
            },
            {
                path: 'marketing',
                component: MarketingComponent
            },
            {
                path: '**',
                redirectTo: 'home'
            }
        ],
    },
];
