import { Component, OnInit } from '@angular/core';
import { NgStyle } from '@angular/common';
import { ButtonComponent } from '@shared/atoms/button/button.component';
import { EStates } from '@shared/enums/states.enum';
import { IToast } from '@shared/interfaces/toast.interface';
import { ToastComponent } from '@shared/components/toast/toast.component';
import { BottomBarsComponent } from '@private/shared/graphics/bottom-bars/bottom-bars.component';
import { downloadBlobUtil } from '@private/shared/utils/save-local-file.util';
import { FloatBarsComponent } from '@private/shared/graphics/float-bars/float-bars.component';
import { IBottomBars } from '@private/shared/graphics/bottom-bars/interface/bottom-bars.interface';
import { IHeaderTable } from '@private/pages/revenue-management/pages/revenue-model/shared/interfaces/headers-table.interface';
import { IRevenueParams } from '@private/pages/revenue-management/pages/revenue-model/shared/interfaces/revenue-params.interface';
import { RevenueParamsService } from '@private/pages/revenue-management/pages/revenue-model/shared/services/revenue-params.service';
import { XlsLibService } from '@private/shared/services/xls-lib.service';
import { AppreciationModelService } from '../../shared/services/appreciation-model.service';
import { extractTableHeaderNames } from '../../shared/util/extract-table-header-names.util';
import { NewAppreciationCalcComponent } from '../../components/new-appreciation-calc/new-appreciation-calc.component';

@Component({
    selector: 'app-appreciation-layout',
    imports: [
        BottomBarsComponent,
        ButtonComponent,
        FloatBarsComponent,
        NewAppreciationCalcComponent,
        NgStyle,
        ToastComponent,
    ],
    providers: [AppreciationModelService, XlsLibService],
    templateUrl: './appreciation-layout.component.html',
    styleUrl: './appreciation-layout.component.scss'
})
export class AppreciationLayoutComponent implements OnInit {
  graphicData: IBottomBars = { header: [], body: [], value_text: 'Porcentaje' };
  gridColums: string = '';
  isDownloadFile: boolean = false;
  isDownloadFileModel: boolean = false;
  isLoading: boolean = true;
  percentages: any = {};
  revenueParams: IRevenueParams = <any>{};
  showApreccationCalculation: boolean = false;
  tableBody: any = [];
  tableHeader: IHeaderTable[] = [];
  toastData: IToast = { isOpen: false, type: EStates.success, message: '' };

  constructor(
    private appreciationS: AppreciationModelService,
    private xlsLib: XlsLibService,
    private paramsS: RevenueParamsService
  ) {
    this.xlsLib.renderScript();
    this._getParams();
  }
  ngOnInit(): void {
    this._getAppreciationList();
  }

  closeModal({ isCorrectly, showToast, message }: any) {
    this.showApreccationCalculation = false;
    if (showToast) {
      this.toastData = {
        type: isCorrectly ? EStates.success : EStates.error,
        message: message,
        isOpen: true,
      };
      isCorrectly && this._getAppreciationList();
    }
  }

  private _getAppreciationList() {
    this.isLoading = true;
    this.appreciationS.getAppreciationModel().subscribe((resp: any) => {
        this.tableHeader = resp?.tableHeader;
        this.tableBody = resp?.tableBody;
        this.graphicData = resp?.graphicData;
        this.gridColums = `repeat(${this.tableHeader.length}, 1fr)`;      
      this.isLoading = false;
    });
  }
  downloadFile() {
    this.isDownloadFile = true;
    this.xlsLib.isScriptLoad$.subscribe((isRender) => {
      if (isRender) {
        this.xlsLib
          .generateXLS(
            [extractTableHeaderNames(this.tableHeader), ...this.tableBody],
            'table_apreciacionß'
          )
          .then((result: boolean) => {
            this.isDownloadFile = false;
            this.toastData = {
              type: result ? EStates.success : EStates.error,
              message: result
                ? 'Documento Generado'
                : 'Error al generar documento',
              isOpen: true,
            };
          });
      }
    });
  }

  downloadAppreciationModel() {
    this.isDownloadFileModel = true;
    this.appreciationS.downloadAppreciationModel().subscribe( blob => {
      downloadBlobUtil(blob, 'Modelo_Apreciacion.xlsx')
      this.isDownloadFileModel = false;
    });
  }

  private _getParams() {
    this.paramsS.params.subscribe((params) => {
      this.revenueParams = params;
    });
  }
}
