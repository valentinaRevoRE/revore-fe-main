import { Component, OnInit } from '@angular/core';
import { IDashboardCard } from '../../shared/interfaces/cards.interface';
import { CardsComponent } from '../../components/cards/cards.component';
import { IHeader } from '@private/shared/interfaces/header.interface';
import { HeaderComponent } from '@private/shared/components/header/header.component';
import { BottomBarsComponent } from '@private/shared/graphics/bottom-bars/bottom-bars.component';
import { FloatBarsComponent } from '@private/shared/graphics/float-bars/float-bars.component';
import { RevenueModelService } from '../../../revenue-model/pages/finantial/pages/revenue-model/shared/services/revenue-model.service';
import { IBottomBars } from '@private/shared/graphics/bottom-bars/interface/bottom-bars.interface';
import { IToast } from '@shared/interfaces/toast.interface';
import { EStates } from '@shared/enums/states.enum';
import { AppreciationModelService } from '../../../revenue-model/pages/finantial/pages/appreciation-model/shared/services/appreciation-model.service';
import { GraphicsService } from '@private/pages/revenue-management/pages/revenue-model/shared/services/graphics.service';
import { CARD_LIST } from '../../shared/const/card-list.const';
import { IFloatBarsGraphic } from '@private/shared/graphics/float-bars/interface/float-bars-interface';
import { IDashboardData } from '../../../revenue-model/shared/interfaces/dashboard.interface';


@Component({
    selector: 'app-dashboard-layou',
    imports: [CardsComponent, HeaderComponent, BottomBarsComponent, FloatBarsComponent],
    templateUrl: './dashboard-layou.component.html',
    styleUrl: './dashboard-layou.component.scss',
    providers: [AppreciationModelService, GraphicsService, RevenueModelService]
})
export class DashboardLayouComponent implements OnInit {
  isLoading: boolean = true;
  graphicRevenueData: IFloatBarsGraphic = { breakpoints: [] };
  graphicAppreciation: IBottomBars = { header: [], body: [], value_text: 'Porcentaje' };
  toastData: IToast = { isOpen: false, type: EStates.success, message: '' };
  headerData: IHeader = { title:  'Mi dashboard', margin_top: '45px' }
  cardsList: IDashboardCard[] = [...CARD_LIST];

  constructor(private graphicsS: GraphicsService){}
  ngOnInit(): void {
    this._getGaphicsData();
  }

  private _getGaphicsData() {
    this.graphicsS.getGraphics().subscribe({
      next: (resp: any) => {
        console.log('Datos recibidos:', resp); // Debug
        this.graphicAppreciation = resp.appreciationModel?.graphicData || { header: [], body: [], value_text: 'Porcentaje' };
        this.graphicRevenueData = resp.revenuesModel?.graphicData || { breakpoints: [['Sample', 0, 0, 1000000, 1000000]] };
        this._setDataTocards(resp?.dashboardData);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos:', err); // Debug
        this.toastData = {
          type: EStates.error,
          message: err?.error?.message ?? 'Error al cargar datos',
          isOpen: true,
        };
        // Datos de respaldo para que se muestre algo
        this.graphicRevenueData = { breakpoints: [['Datos de ejemplo', 0, 0, 8500000, 8500000]] };
        this.graphicAppreciation = { header: ['Categoría', 'Valor'], body: [['Nivel', 20], ['Vista', 30]], value_text: 'Porcentaje' };
        this.cardsList = [...CARD_LIST];
        this.isLoading = false;
      },
    });
  }

  private _setDataTocards(data: IDashboardData){
    this.cardsList[1].title = data.realizedRevenue.toString();
    this.cardsList[2].title = data.unrealizedRevenue.toString();;
    this.cardsList[5].title = data.averagePrice.toString();;
  }

}
