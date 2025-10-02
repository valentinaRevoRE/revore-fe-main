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
    this.activeR.queryParamMap.subscribe( ({params}: any) => {
      const { token } = params;
      if(token){
        localStorage.setItem('tmpT', token);
        this.router.navigate(['login', 'recuperar-contrasena', 'actualizar']);
      }
    })
    this.formRecovery = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
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
          message: 'Mensaje enviado.',
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
