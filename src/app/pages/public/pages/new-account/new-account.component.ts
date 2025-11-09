import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '@public/shared/services/auth.service';

import { ToastComponent } from '@shared/components/toast/toast.component';

import { EStates } from '@shared/enums/states.enum';
import { IToast } from '@shared/interfaces/toast.interface';

@Component({
    selector: 'app-new-account',
    imports: [RouterLink, ReactiveFormsModule, ToastComponent],
    templateUrl: './new-account.component.html',
    styleUrl: './new-account.component.scss'
})
export class NewAccountComponent {
  passHidden: boolean = true;
  isLoading: boolean = false;
  formAccount: FormGroup;
  toastData: IToast = { isOpen: false, type: EStates.success, message: '' };
  errorMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authS: AuthService
  ) {
      this.formAccount = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email, this.revoreEmailValidator]],
      name: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8), this.strongPasswordValidator]],
    });

    this.formAccount.valueChanges.subscribe(() => {
      if (this.errorMessage) {
        this.errorMessage = '';
      }
    });
  }

  
  revoreEmailValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const email = control.value.toLowerCase();
    const isRevoreEmail = email.endsWith('@revore.mx');
    
    return isRevoreEmail ? null : { revoreEmail: true };
  }


  strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const password = control.value;
    
    const hasNumber = /\d/.test(password);
    
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const errors: ValidationErrors = {};
    
    if (!hasNumber) {
      errors['noNumber'] = true;
    }
    
    if (!hasSpecialChar) {
      errors['noSpecialChar'] = true;
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }
  submitForm() {
    if (this.formAccount.invalid || this.isLoading) {
      this.formAccount.markAllAsTouched();
      this.formAccount.updateValueAndValidity();
      return;
    }
    this.isLoading = true;
    const formValue = {
      email: this.formAccount.get('email')?.value,
      password: this.formAccount.get('password')?.value,
      name: this.formAccount.get('name')?.value,
    };
    this.authS.createAccount(formValue).subscribe({
      next: () => this.nextStep(),
      error: (error) => {
        const { message } = error.error ?? error;
        const errorMsg = Array.isArray(message) ? message.join(', ') : message;
        
        if (errorMsg && errorMsg.includes('ya está registrado')) {
          this.errorMessage = errorMsg;
        } else {
          this.errorMessage = '';
          this.toastData = {
            type: EStates.error,
            message: errorMsg || 'Error al crear cuenta',
            isOpen: true,
          };
        }
        
        this.isLoading = false;
      },
    });
  }

  private nextStep(){
    this.isLoading = false;
    this.toastData = {
      type: EStates.success,
      message: '¡Cuenta creada exitosamente! Redirigiendo al login...',
      isOpen: true,
    };
    
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2500);
  }

  seePassword(isHidden: boolean, input: HTMLInputElement) {
    !this.passHidden ? (input.type = 'password') : (input.type = 'text');
    this.passHidden = isHidden;
  }
}
