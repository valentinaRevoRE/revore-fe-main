import { Injectable } from '@angular/core';
import { environment } from '@environments/environments.local';
import * as CryptoJS from 'crypto-js';

@Injectable({providedIn: 'root'})

export class CommonService {
  private lStorage: Storage = localStorage;
  private key: string = environment.encryptKey;
  
  saveLimitDate(remember: boolean){
    const actualDate: Date = new Date();
    actualDate.toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
    });
    actualDate.setDate( actualDate.getDate() + (remember ? 10 : 1));
    this.lStorage.setItem('ltd', CryptoJS.AES.encrypt(actualDate.toString(), this.key).toString());
  }

  clearTokens(){
    this.lStorage.clear();
  }

  get activeProjectId(): string | null {
    return this.lStorage.getItem('project_id') ?? null;
  }

  set activeProjectId(id: string){
    this.lStorage.setItem('project_id', id ); 
  }

  set localToken(token: string){
    this.lStorage.setItem('sT', token ); 
  }

  get localToken(){
    return this.lStorage.getItem('sT') ?? '';
  }

  get localLimitDate(){
    return CryptoJS.AES.decrypt((this.lStorage.getItem('ltd') ?? ''), this.key).toString(CryptoJS.enc.Utf8);
  }

}