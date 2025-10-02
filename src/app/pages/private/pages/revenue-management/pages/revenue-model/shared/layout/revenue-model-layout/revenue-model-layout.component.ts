import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '@private/shared/components/header/header.component';
import { IHeader } from '@private/shared/interfaces/header.interface';
import { TapsComponent } from '../../components/taps/taps.component';
import { AuthService } from '@public/shared/services/auth.service';
import { AppreciationModelService } from '../../../pages/finantial/pages/appreciation-model/shared/services/appreciation-model.service';
import { RevenueParamsService } from '../../services/revenue-params.service';

@Component({
    selector: 'app-revenue-model-layout',
    imports: [HeaderComponent, RouterOutlet, TapsComponent],
    providers: [AuthService, AppreciationModelService, RevenueParamsService],
    templateUrl: './revenue-model-layout.component.html',
    styleUrl: './revenue-model-layout.component.scss'
})
export class RevenueModelLayoutComponent {
  headerData: IHeader = {
    title:  'Modelo de Revenue',
    margin_top: '45px'
  }

  constructor(private paramsS: RevenueParamsService) {
    this.paramsS.getParams().subscribe();
  }
  
}
