import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '@public/shared/services/auth.service';
import { CommonService } from '@core/common/common.service';

import { ToastComponent } from '@shared/components/toast/toast.component';

import { EStates } from '@shared/enums/states.enum';
import { ILogin } from '@public/shared/interfaces/login.interface';
import { INewAccount } from '@public/shared/interfaces/new-account.interface';
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

  constructor(
    private formBuilder: FormBuilder,
    private commonService: CommonService,
    private router: Router,
    private authS: AuthService
  ) {
    this.formAccount = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      image: ['Image'],
    });
  }
  submitForm() {
    if (this.formAccount.invalid || this.isLoading) {
      this.formAccount.markAllAsTouched();
      this.formAccount.updateValueAndValidity();
      return;
    }
    this.isLoading = true;
    const formValue: INewAccount = {
      ...this.formAccount.value,
      role: '68dae4279225f804cc4ec1af', // ID del rol "Usuario" que creamos
      state: 1 // Estado activo
    };
    this.authS.createAccount(formValue).subscribe({
      next: () => this.nextStep(),
      error: (error) => {
        const { message } = error.error ?? error;
        this.toastData = {
          type: EStates.error,
          message: Array.isArray(message) ? message.join(', ') : message,
          isOpen: true,
        };
        this.isLoading = false;
      },
    });
  }

  private nextStep(){
    const formData = this.formAccount.value;
    const loginData: ILogin = { email: formData.email, password: formData.password };
    this.authS.login(loginData).subscribe({
      next: (resp: any) => {
        this.commonService.localToken = resp.access_token;
        this.commonService.saveLimitDate(false);
        this.router.navigate(['dashboard', 'home']);
      }
    });
  }

  seePassword(isHidden: boolean, input: HTMLInputElement) {
    !this.passHidden ? (input.type = 'password') : (input.type = 'text');
    this.passHidden = isHidden;
  }
}
