import { Component, OnInit } from '@angular/core';

import { ButtonComponent } from '@shared/atoms/button/button.component';
import { TableRevenueComponent } from '../../components/table-revenue/table-revenue.component';

import { EStates } from '@shared/enums/states.enum';
import { extractTableValues } from '../../shared/utils/extract-table-body-values.util';
import { IToast } from '@shared/interfaces/toast.interface';
import { MRevenueModel } from '../../../../../../shared/models/revenue-model.model';
import { REVENUE_TABLE_HEADER } from '../../shared/conts/revenue-table-headers.const';
import { RevenueModelService } from '../../shared/services/revenue-model.service';
import { XlsLibService } from '@private/shared/services/xls-lib.service';

import { FloatBarsComponent } from '@private/shared/graphics/float-bars/float-bars.component';
import { IFloatBarsGraphic } from '@private/shared/graphics/float-bars/interface/float-bars-interface';

@Component({
    selector: 'app-revenue-model-layout',
    imports: [
        ButtonComponent,
        FloatBarsComponent,
        TableRevenueComponent,
    ],
    templateUrl: './revenue-model-layout.component.html',
    styleUrl: './revenue-model-layout.component.scss',
    providers: [RevenueModelService, XlsLibService]
})
export class RevenueModelTableLayoutComponent implements OnInit {
  isLoading: boolean = true;
  tableHeader: string[] = REVENUE_TABLE_HEADER;
  tableBody: MRevenueModel[] = [];
  graphicData: IFloatBarsGraphic = { breakpoints: [] };
  toastData: IToast = { isOpen: false, type: EStates.success, message: '' };
  isDownloadFile: boolean = false;

  constructor(
    private mRevenueS: RevenueModelService,
    private xlsLib: XlsLibService
  ) {
    this.xlsLib.renderScript();
  }
  ngOnInit(): void {
    this._getRevenueModelList();
  }

  downloadFile() {
    this.isDownloadFile = true;
    this.xlsLib.isScriptLoad$.subscribe((isRender) => {
      if (isRender) {
        this.xlsLib
          .generateXLS(
            [[...this.tableHeader], ...extractTableValues(this.tableBody)],
            'revenue_model'
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

  private _getRevenueModelList() {
    this.mRevenueS.getRevenueModel().subscribe({
      next: (resp: any) => {
        this.tableBody = resp?.tableBody;
        this.graphicData = resp?.graphicData;
        this.isLoading = false;
      },
      error: (err) => {
        this.toastData = {
          type: EStates.error,
          message: err?.error?.message ?? 'Error al cargar lista',
          isOpen: true,
        };
        this.isLoading = false;
      },
    });
  }
}
