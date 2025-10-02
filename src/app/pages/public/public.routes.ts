import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { MainLayoutComponent } from './shared/layout/main-layout/main-layout.component';
import { NewAccountComponent } from './pages/new-account/new-account.component';
import { RecoveryPassComponent } from './pages/recovery-pass/recovery-pass.component';
import { OtpComponent } from './pages/otp/otp.component';
import { NewPasswordComponent } from './pages/new-password/new-password.component';

export const routes: Routes = [
    {
        path: '',
        component: MainLayoutComponent,
        children: [
            {
                path: '',
                component: LoginComponent
            },
            {
                path: 'crear-cuenta',
                component: NewAccountComponent
            },
            {
                path: 'recuperar-contrasena',
                component: RecoveryPassComponent
            },
            {
                path: 'recuperar-contrasena/otp',
                component: OtpComponent
            },
            {
                path: 'recuperar-contrasena/actualizar',
                component: NewPasswordComponent
            },
        ]
    }
];
