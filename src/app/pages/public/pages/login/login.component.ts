import { Component } from '@angular/core';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormGroup,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonService } from '@core/common/common.service';
import { AuthService } from '@public/shared/services/auth.service';
import { ToastComponent } from '@shared/components/toast/toast.component';
import { EStates } from '@shared/enums/states.enum';
import { ILogin } from '@public/shared/interfaces/login.interface';
import { IToast } from '@shared/interfaces/toast.interface';

@Component({
    selector: 'app-login',
    imports: [RouterLink, ReactiveFormsModule, ToastComponent],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
  passHidden: boolean = true;
  formLogin: FormGroup;
  isLoading: boolean = false;
  toastData: IToast = { isOpen: false, type: EStates.success, message: '' };

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authS: AuthService,
    private commonService: CommonService
  ) {
    this.formLogin = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [false, Validators.required],
    });
  }

  onSubmit() {
    if (this.formLogin.invalid || this.isLoading) {
      this.formLogin.markAllAsTouched();
      this.formLogin.updateValueAndValidity();
      return;
    }
    this.isLoading = true;
    const formValue: ILogin = {...this.formLogin.value};
    delete formValue.remember;
    this.authS.login(formValue).subscribe({
      next: (resp) => this.nextStep(resp) ,
      error: () => {
        this.toastData = {
          type: EStates.error,
          message: '¡Usuario o contraseña incorrecta!',
          isOpen: true,
        };
        this.isLoading = false;
      },
    });
  }

  private nextStep(resp: any){
    this.commonService.localToken = resp.access_token;
    const {remember} = this.formLogin.value;
    this.commonService.saveLimitDate(remember);
    this.router.navigate(['dashboard', 'home']);
  }

  seePassword(isHidden: boolean, input: HTMLInputElement) {
    !this.passHidden ? (input.type = 'password') : (input.type = 'text');
    this.passHidden = isHidden;
  }
}
