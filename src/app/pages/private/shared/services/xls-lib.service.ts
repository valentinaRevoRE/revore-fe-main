import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { downloadBlobUtil } from '../utils/save-local-file.util';
declare const XLSX: any;
@Injectable()
export class XlsLibService {
  scriptUrl: string =
    'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
  isScriptLoad$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  renderScript() {
    if (document.getElementById('xls-lib-js') !== null) {
      this.isScriptLoad$.next(true);
      return;
    }
    const script: HTMLScriptElement = document.createElement('script');
    script.id = 'xls-lib-js';
    script.type = 'text/javascript';
    script.src = this.scriptUrl;
    script.onload = () => {
      setTimeout( () => {
        this.isScriptLoad$.next(true);
      }, 1000 )
    }
    document.head.appendChild(script);
  }
  /**
   * Generating Xslx from array table
   * @param matrix structure format = [[item_1: string | number, item_2...], [item_1, item_2...]]
   * @param fileName Name of file to export
   * @returns promise if the file is created or no
   */
  generateXLS(matrix: any, fileName: string): Promise<any> {
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Author: 'Revore',
      CreatedDate: new Date(),
    };
    wb.SheetNames.push('Test Sheet');
    const ws = XLSX.utils.aoa_to_sheet(matrix);
    wb.Sheets['Test Sheet'] = ws;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    const blob: Blob = new Blob([this._sanitizeBinaryXlsx(wbout)], {
      type: 'application/octet-stream',
    });
    return new Promise((resolve) => {
      downloadBlobUtil(blob, `${fileName}.xlsx`).then( (res: any) => resolve(res) );
    });
  }

  /**
   * Function to sanitize special characters
   * @param s xlsx in binary format
   * @returns sanitizr binary xlsx
   */
  private _sanitizeBinaryXlsx(s: string) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
    return buf;
  }
}
