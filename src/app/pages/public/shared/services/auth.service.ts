import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ILogin } from '../interfaces/login.interface';
import { INewAccount } from '../interfaces/new-account.interface';
import { environment } from '@environments/environments.local';
import { PATHS } from '@shared/constants/paths.const';

@Injectable()
export class AuthService {

  constructor(private hhtp: HttpClient) { }

  login( data: ILogin ){
    const url: string =  `${environment.apiUrl}${PATHS.LOGIN}`;
    return this.hhtp.post(url, data);
  }

  createAccount( data: INewAccount ){
    const url: string =  `${environment.apiUrl}${PATHS.CREATE_ACCOUNT}`;
    return this.hhtp.post(url, data);
  }

  recoveryPassMail(email: string){
    const url: string =  `${environment.apiUrl}${PATHS.RECOVERY_PASS_MAIL}/${email}`;
    return this.hhtp.get(url);
  }

  setNewPassword(data: { email: string, newPassword: string, resetToken: string }){
    const url: string =  `${environment.apiUrl}${PATHS.RECOVERY_PASS_SET_NEW}`;
    return this.hhtp.post(url, data);
  }

}
