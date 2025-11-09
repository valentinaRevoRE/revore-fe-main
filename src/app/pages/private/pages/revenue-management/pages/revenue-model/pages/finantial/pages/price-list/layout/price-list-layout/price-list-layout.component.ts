import { Component, OnInit } from '@angular/core';
import { NgStyle } from '@angular/common';

import { AdjustPrice1Component } from '../../components/adjust-price1/adjust-price1.component';
import { AdjustPrice2Component } from '../../components/adjust-price2/adjust-price2.component';
import { AppreciationModelService } from '../../../appreciation-model/shared/services/appreciation-model.service';
import { ButtonComponent } from '@shared/atoms/button/button.component';
import { EStates } from '@shared/enums/states.enum';
import { IDepaToSelect } from '../../shared/interfaces/adjustmen-price-1.interface';
import { IPriceItem } from '../../shared/interfaces/price-list.interface';
import { IToast } from '@shared/interfaces/toast.interface';
import { NewAppreciationCalcComponent } from '../../../appreciation-model/components/new-appreciation-calc/new-appreciation-calc.component';
import { NewDepreciationComponent } from '../../components/new-depreciation/new-depreciation.component';
import { NewSaleComponent } from '../../components/new-sale/new-sale.component';
import { PriceListService } from '../../shared/services/price-list.service';
import { ToastComponent } from '@shared/components/toast/toast.component';
import { IHeaderTable } from '@private/pages/revenue-management/pages/revenue-model/shared/interfaces/headers-table.interface';
import { downloadBlobUtil } from '@private/shared/utils/save-local-file.util';
import { RevenueParamsService } from '@private/pages/revenue-management/pages/revenue-model/shared/services/revenue-params.service';
import { ModalConfirmComponent } from '@private/shared/components/modal-confirm/modal-confirm.component';

@Component({
    selector: 'app-price-list-layout',
    templateUrl: './price-list-layout.component.html',
    imports: [
        AdjustPrice1Component,
        AdjustPrice2Component,
        ButtonComponent,
        
        ModalConfirmComponent,
        NewAppreciationCalcComponent,
        NewDepreciationComponent,
        NewSaleComponent,
        NgStyle,
        ToastComponent,
    ],
    providers: [PriceListService, AppreciationModelService]
})
export class PriceListLayoutComponent implements OnInit {
  availableDepas: IDepaToSelect[] = [];
  depasToSelect: IDepaToSelect[] = [];
  enableOperationButtons: boolean = false;
  file!: File;
  gridColums: string = '';
  isDeletingList: boolean = false;
  isDownloadingFile: boolean = false;
  isLoading: boolean = true;
  isUpploadingFile: boolean = false;
  saleDepas: IDepaToSelect[] = [];
  showAdjustPrice1: boolean = false;
  showAdjustPrice2: boolean = false;
  showAprecciationModal: boolean = false;
  showDeletingList: boolean = false;
  showNewDepreciation: boolean = false;
  showNewSale: boolean = false;
  tableBody: IPriceItem[] | any[] = [];
  tableHeader: IHeaderTable[] = [];
  toastData: IToast = { isOpen: false, type: EStates.success, message: '' };

  constructor(private priceListS: PriceListService, private paramsS: RevenueParamsService) {}
  ngOnInit(): void {
    this._getPriceList();
  }
  validateFile(event: any) {
    this.file = <File>event.target.files[0];
    const fileSplitLength: number = this.file.name.split('.').length;
    const fileExtension = this.file.name.split('.')[fileSplitLength - 1];
    if (fileExtension != 'xls' && fileExtension != 'xlsx') {
      this.toastData = {
        type: EStates.error,
        message: '¡Formato no aceptado!',
        isOpen: true,
      };
      return;
    }
    this.isUpploadingFile = true;
    this._uploadFile(this.file);
  }

  showCustomToast({ isCorrectly, showToast, message }: any) {
    this.showNewSale = false;
    this.showNewDepreciation = false;
    this.showAdjustPrice1 = false;
    this.showAdjustPrice2 = false;
    this.showAprecciationModal = false;
    if (showToast) {
      this.toastData = {
        type: isCorrectly ? EStates.success : EStates.error,
        message: message,
        isOpen: true,
      };
      isCorrectly && this._getPriceList();
    }
  }

  private _uploadFile(file: File) {
    this.priceListS.uploadPrieListFile(file).subscribe({
      next: (resp) => {
        this._processResponseUploadFile(resp);
      },
      error: (err) => {
        this._processResponseUploadFile(err);
        
      },
    });
  }

  private _processResponseUploadFile(response: any) {
    const { status } = response;
    const validateStatus: boolean = status >= 200 && status <= 299;
    this.toastData = {
      type: validateStatus ? EStates.success : EStates.error,
      message: validateStatus
        ? '¡Archivo cargado correctamente!'
        : response.error?.message ?? 'Error al cargar archivo',
      isOpen: true,
    };
    validateStatus ? this._getPriceList(validateStatus) : this.deleteList(true);
    this.isUpploadingFile = false;
  }

  private _getPriceList(isFirstLoad?: boolean) {
    this.isLoading = true;
    this.priceListS.getPriceList().subscribe({
      next: (resp: any) => {
        this.tableBody = resp.departments;
        this.depasToSelect = resp.deparmentsNum;
        this.availableDepas = resp.availableDepas;
        this.saleDepas = resp.saleDepas;
        this.tableHeader = resp.headers;
        this.gridColums = `repeat(${this.tableHeader.length}, 1fr)`;
        this.paramsS.getParams().subscribe();
        this.isLoading = false;
        this.tableBody.length > 0 && (this.enableOperationButtons = true);
        isFirstLoad && (this.showAprecciationModal = true);
      },
      error: (err) => {
        this.toastData = {
          type: EStates.error,
          message: err?.error?.message ?? 'Error al cargar lista de precios',
          isOpen: true,
        };
        this.isLoading = false;
      },
    });
  }

  showModalSale() {
    if (this.enableOperationButtons) {
      this.showNewSale = true;
    } else this._showToastForAppreciationLabels();
  }

  showModalDep() {
    if (this.enableOperationButtons) {
      this.showNewDepreciation = true;
    } else this._showToastForAppreciationLabels();
  }

  downloadPriceList() {
    this.isDownloadingFile = true;
    this.priceListS.downloadPriceListUrl().subscribe( blob => {
      downloadBlobUtil(blob, 'Lista_Depas.xlsx')
      this.isDownloadingFile = false;
    });
  }

  deleteList(confirmRes: boolean){
    this.showDeletingList = false;
    this.isDeletingList = true;
    if(confirmRes){
      this.priceListS.deletePriceList().subscribe({
        next: (res) => {
          this.showCustomToast({
            isCorrectly: true,
            showToast: true,
            message: 'Datos reiniciados'
          });
          this._getPriceList();
          this.isDeletingList = false;
        },
        error: () => {
          this.showCustomToast({
            isCorrectly: true,
            showToast: true,
            message: 'Error al reiniciar datos'
          });
          this._getPriceList();
          this.isDeletingList = false;
        }
      })
    }else{
      this.isDeletingList = false;
    }
  }

  private _showToastForAppreciationLabels() {
    this.toastData = {
      type: EStates.error,
      message:
        'Primaro debes seleccionar las columnas para el modelo de apreciación',
      isOpen: true,
      time: 5000,
    };
  }
}
