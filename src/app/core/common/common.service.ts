import { Injectable } from '@angular/core';
import { environment } from '@environments/environments.local';
import * as CryptoJS from 'crypto-js';

@Injectable({providedIn: 'root'})

export class CommonService {
  private lStorage: Storage = sessionStorage;
  private persist: Storage = localStorage;
  private key: string = environment.encryptKey;
  
  saveLimitDate(remember: boolean){
    const actualDate: Date = new Date();
    actualDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
    actualDate.setDate(actualDate.getDate() + (remember ? 10 : 1));
    this.persist.setItem('ltd', CryptoJS.AES.encrypt(actualDate.toString(), this.key).toString());
  }

  clearTokens(){
    this.lStorage.clear();
    this.persist.removeItem('ltd');
    this.persist.removeItem('project_id');
  }

  get activeProjectId(): string | null {
    return this.persist.getItem('project_id') ?? null;
  }

  set activeProjectId(id: string){
    this.persist.setItem('project_id', id);
  }

  set localToken(token: string){
    this.lStorage.setItem('sT', token);
  }

  get localToken(){
    return this.lStorage.getItem('sT') ?? '';
  }

  get localLimitDate(){
    return CryptoJS.AES.decrypt((this.persist.getItem('ltd') ?? ''), this.key).toString(CryptoJS.enc.Utf8);
  }

}