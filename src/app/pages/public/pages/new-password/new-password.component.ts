import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@public/shared/services/auth.service';
import { ToastComponent } from '@shared/components/toast/toast.component';
import { EStates } from '@shared/enums/states.enum';
import { IToast } from '@shared/interfaces/toast.interface';

@Component({
    selector: 'app-new-password',
    imports: [RouterLink, ReactiveFormsModule, ToastComponent],
    templateUrl: './new-password.component.html',
    styleUrl: './new-password.component.scss'
})
export class NewPasswordComponent {
  formNewPassword: FormGroup;
  isLoading: boolean = false;
  passConfHidden: boolean = true;
  passHidden: boolean = true;
  token: string | null;
  toastData: IToast = { isOpen: false, type: EStates.success, message: '' };

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authS: AuthService
  ) {
    this.token = localStorage.getItem('tmpT') ?? null;
    if (!this.token) {
      this.router.navigate(['login']);
    }
    this.formNewPassword = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.formNewPassword.invalid) {
      return;
    }

    const password = this.formNewPassword.get('password')?.value;
    const confirmPassword = this.formNewPassword.get('confirmPassword')?.value;

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      this.toastData = {
        type: EStates.error,
        message: 'Las contraseñas no coinciden',
        isOpen: true,
      };
      return;
    }

    this.isLoading = true;
    
    // Enviar password y token (el que viene del email de recuperación)
    this.authS.setNewPassword({ 
      password: password, 
      token: this.token! 
    }).subscribe({
      next: () => {
        this.toastData = {
          type: EStates.success,
          message: 'Se restableció tu contraseña. Ve al login e inicia sesión normalmente.',
          isOpen: true,
        };
        this.isLoading = false;
        
        // Limpiar formulario y token
        this.formNewPassword.reset();
        localStorage.removeItem('tmpT');
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          this.router.navigate(['login']);
        }, 3000);
      },
      error: (err: any) => {
        this.isLoading = false;
        
        // Mostrar mensaje específico del backend
        const errorMessage = err?.error?.message || 'Error al restablecer tu contraseña. Intenta nuevamente.';
        
        this.toastData = {
          type: EStates.error,
          message: errorMessage,
          isOpen: true,
        };
        
        // NO limpiar el formulario ni el token para que el usuario pueda intentar de nuevo
        // NO redirigir, mantener en la misma pantalla
      },
    });
  }

  seePassword(
    isHidden: boolean,
    input: HTMLInputElement,
    inputType: 'pass' | 'passConf'
  ) {
    const attributeToUpdate =
      inputType === 'pass' ? 'passHidden' : 'passConfHidden';
    !this[attributeToUpdate]
      ? (input.type = 'password')
      : (input.type = 'text');
    this[attributeToUpdate] = isHidden;
  }
}
