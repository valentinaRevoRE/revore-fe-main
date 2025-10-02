import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

declare let google: any;
@Injectable()
export class GoogleChartsService {

  scriptUrl: string = 'https://www.gstatic.com/charts/loader.js';
  isScriptLoad$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  renderScript(){
    if( document.getElementById('charts-js') !== null ) {
      this.isScriptLoad$.next(true);
      return
    };
    const script: HTMLScriptElement = document.createElement('script');
    script.id = 'charts-js';
    script.type = 'text/javascript';
    script.src = this.scriptUrl;
    script.onload = () => {
      google.charts.load('current', {packages:['corechart', 'bar', 'line']});
      setTimeout( () => {
        this.isScriptLoad$.next(true);
      }, 1000 )
    }
    document.head.appendChild(script);
  }
}
