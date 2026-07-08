import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './shared/layout/dashboard-layout/dashboard-layout.component';
import { HomeLayoutComponent } from './pages/home/layout/home-layout/home-layout.component';
import { GuardianByProject } from '@core/guards/guardian.guard';
import { adminGuard } from '@core/guards/admin.guard';
import { MarketingComponent } from './pages/marketing/marketing.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { revoreAuthGuard } from '@revore/guards/revore-auth.guard';

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
                loadChildren: () => import('./pages/revenue-management/revenue.routes').then( r => r.routes )
            },
            {
                path: 'sales-tools',
                loadChildren: () => import('@revore/revore-self-service.routes').then( r => r.revoreRoutes ),
                canActivate: [revoreAuthGuard]
            },
            {
                path: 'product-definition',
                loadChildren: () => import('./pages/product-definition/product-definition.routes').then(r => r.productDefinitionRoutes)
            },
            {
                path: 'marketing',
                component: MarketingComponent
            },
            {
                path: 'alertas',
                loadChildren: () => import('./pages/alertas/alertas.routes').then(r => r.alertasRoutes),
                canActivate: [revoreAuthGuard]
            },
            {
                path: 'ia',
                loadChildren: () => import('./pages/ia/ia.routes').then(r => r.iaRoutes),
            },
            {
                path: 'admin/users',
                component: AdminDashboardComponent,
                canActivate: [adminGuard]
            },
            {
                path: '**',
                redirectTo: 'home'
            }
        ],
    },
];
