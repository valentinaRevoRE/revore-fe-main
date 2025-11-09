import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ILogin } from '../interfaces/login.interface';
import { environment } from '@environments/environment';
import { PATHS } from '@shared/constants/paths.const';

@Injectable()
export class AuthService {

  constructor(private hhtp: HttpClient) { }

  login( data: ILogin ){
    const url: string =  `${environment.apiUrl}${PATHS.LOGIN}`;
    return this.hhtp.post(url, data);
  }

  createAccount( data: { email: string; password: string; name: string } ){
    const url: string =  `${environment.apiUrl}${PATHS.CREATE_ACCOUNT}`;
    return this.hhtp.post(url, data);
  }

  recoveryPassMail(email: string){
    const url: string =  `${environment.apiUrl}${PATHS.RECOVERY_PASS_MAIL}`;
    return this.hhtp.post(url, { email });
  }

  setNewPassword(data: { password: string, token: string }){
    const url: string =  `${environment.apiUrl}${PATHS.RECOVERY_PASS_SET_NEW}`;
    return this.hhtp.post(url, data);
  }

  changePassword(data: { currentPassword: string, newPassword: string }){
    const url: string =  `${environment.apiUrl}${PATHS.CHANGE_PASSWORD}`;
    return this.hhtp.post(url, data);
  }

}
