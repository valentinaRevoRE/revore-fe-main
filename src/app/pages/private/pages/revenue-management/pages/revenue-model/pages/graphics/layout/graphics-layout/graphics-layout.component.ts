import { Component, OnInit } from '@angular/core';
import { BottomBarsComponent } from '@private/shared/graphics/bottom-bars/bottom-bars.component';
import { IBottomBars } from '@private/shared/graphics/bottom-bars/interface/bottom-bars.interface';
import { FloatBarsComponent } from '@private/shared/graphics/float-bars/float-bars.component';
import { HorizontalLinesComponent } from '@private/shared/graphics/horizontal-lines/horizontal-lines.component';
import { GraphicsService } from '@private/pages/revenue-management/pages/revenue-model/shared/services/graphics.service';
import { EStates } from '@shared/enums/states.enum';
import { IToast } from '@shared/interfaces/toast.interface';
import { AppreciationModelService } from '../../../finantial/pages/appreciation-model/shared/services/appreciation-model.service';
import { RevenueModelService } from '../../../finantial/pages/revenue-model/shared/services/revenue-model.service';
import { IHorizontalLines } from '@private/shared/graphics/horizontal-lines/interfaces/horizontal-line.interface';
import { IFloatBarsGraphic } from '@private/shared/graphics/float-bars/interface/float-bars-interface';

@Component({
    selector: 'app-graphics-layout',
    imports: [FloatBarsComponent, BottomBarsComponent, HorizontalLinesComponent],
    templateUrl: './graphics-layout.component.html',
    styleUrl: './graphics-layout.component.scss',
    providers: [AppreciationModelService, GraphicsService, RevenueModelService]
})
export class GraphicsLayoutComponent implements OnInit{
  isLoading: boolean = true;
  graphicRevenue: IFloatBarsGraphic = { breakpoints: [] };
  graphicAppreciation: IBottomBars = { header: [], body: [], value_text: 'Porcentaje' };
  graphicPriceEvl: IHorizontalLines = { colums: [], rows: [] };
  graphicMtsEvl: IHorizontalLines = { colums: [], rows: [] };
  toastData: IToast = { isOpen: false, type: EStates.success, message: '' };

  constructor(private graphicsS: GraphicsService){}
  ngOnInit(): void {
    this._getGraphicsData();
  }

  private _getGraphicsData() {
    this.graphicsS.getGraphics().subscribe({
      next: (resp: any) => {
        this.graphicAppreciation = resp?.appreciationModel?.graphicData;
        this.graphicRevenue = resp?.revenuesModel?.graphicData;
        this.graphicMtsEvl = resp?.mt2Graphic;
        this.graphicPriceEvl = resp?.priceEvolutionGraphic;
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
