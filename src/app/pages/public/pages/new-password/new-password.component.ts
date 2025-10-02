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
      email: ['', [Validators.required, Validators.email]],
      newPassword: ['', [Validators.required]],
      resetToken: [this.token, [Validators.required]],
    });
  }

  onSubmit() {
    if (this.formNewPassword.invalid) {
      return;
    }
    this.isLoading = true;
    this.authS.setNewPassword(this.formNewPassword.value).subscribe({
      next: () => {
        this.toastData = {
          type: EStates.success,
          message:
            'Se restableció tu contraseña. Ve al login e inicia sesión normalmente.',
          isOpen: true,
        };
        localStorage.removeItem('tmpT');
        setTimeout(() => {
          this.router.navigate(['login']);
        }, 5000);
      },
      error: (err: any) => {
        this.toastData = {
          type: EStates.error,
          message: 'Error al restablecer tu contraseña. Contacta con el proveedor.',
          isOpen: true,
        };
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
