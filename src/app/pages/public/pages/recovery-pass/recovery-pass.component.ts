import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@public/shared/services/auth.service';
import { ToastComponent } from '@shared/components/toast/toast.component';
import { EStates } from '@shared/enums/states.enum';
import { IToast } from '@shared/interfaces/toast.interface';

@Component({
    selector: 'app-recovery-pass',
    imports: [RouterLink, ReactiveFormsModule, ToastComponent],
    templateUrl: './recovery-pass.component.html',
    styleUrl: './recovery-pass.component.scss'
})
export class RecoveryPassComponent {
  formRecovery: FormGroup;
  toastData: IToast = { isOpen: false, type: EStates.success, message: '' };
  isLoading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private authS: AuthService,
    private router: Router,
    private activeR: ActivatedRoute
  ) {
    // Inicializar formulario primero
    this.formRecovery = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });

    // Detectar errores de Supabase en el hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const error = hashParams.get('error');
    const errorDescription = hashParams.get('error_description');

    if (error) {
      // Link expirado u otro error
      let message = 'El enlace de recuperación no es válido o ha expirado.';
      
      if (error === 'otp_expired' || errorDescription?.includes('expired')) {
        message = 'El enlace de recuperación ha expirado. Por favor, solicita uno nuevo.';
      }
      
      this.toastData = {
        type: EStates.error,
        message: message,
        isOpen: true,
      };
      
      // Limpiar el hash
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Capturar token del hash (#access_token=...) que Supabase envía
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (accessToken && type === 'recovery') {
      // Guardar token para usar en el cambio de contraseña
      localStorage.setItem('tmpT', accessToken);
      this.router.navigate(['login', 'recuperar-contrasena', 'actualizar']);
      return;
    }

    // Capturar token del query parameter (?token=...)
    this.activeR.queryParamMap.subscribe( ({params}: any) => {
      const { token } = params;
      if(token){
        localStorage.setItem('tmpT', token);
        this.router.navigate(['login', 'recuperar-contrasena', 'actualizar']);
      }
    })
  }

  onSubmit() {
    if (this.formRecovery.invalid) {
      return;
    }
    this.isLoading = true;
    this.authS.recoveryPassMail(this.formRecovery.get('email')?.value).subscribe({
      next: () => {
        this.toastData = {
          type: EStates.success,
          message: 'Mensaje enviado. Revisa tu email para el enlace de recuperación.',
          isOpen: true,
        };
        this.formRecovery.reset();
        this.router.navigate(['login', 'recuperar-contrasena', 'otp']);
        this.isLoading = false;
      }, 
      error: (err) => {
        this.toastData = {
          type: EStates.error,
          message: err?.error?.message ?? 'Tu correo no está registrado.',
          isOpen: true,
        };
        this.isLoading = false;
      }
    })
  }
}
