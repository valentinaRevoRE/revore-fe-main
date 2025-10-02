import { Component } from '@angular/core';
import { MenuComponent } from '../../components/menu/menu.component';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@public/shared/services/auth.service';
import { GoogleChartsService } from '@private/shared/services/google-charts.service';
import { InterceptorService } from '@private/shared/core/interceptors/interceptor.service';

@Component({
    selector: 'app-dashboard-layout',
    imports: [MenuComponent, RouterOutlet],
    providers: [AuthService, GoogleChartsService, InterceptorService],
    templateUrl: './dashboard-layout.component.html',
    styleUrl: './dashboard-layout.component.scss'
})
export class DashboardLayoutComponent {
  constructor(private googleCharts: GoogleChartsService ) {
    this.googleCharts.renderScript();
  }

}
