import { AfterViewInit, Component, Input,  OnChanges,  OnDestroy, SimpleChanges } from '@angular/core';
import { GoogleChartsService } from '@private/shared/services/google-charts.service';
import { Subscription } from 'rxjs';
import { IBottomBars } from './interface/bottom-bars.interface';
import { bottomBarsDataDto } from './util/bottom-bars.dto';

declare let google: any;
@Component({
    selector: 'app-bottom-bars',
    imports: [],
    templateUrl: './bottom-bars.component.html'
})
export class BottomBarsComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) title: string = '';
  @Input() containerID: string = 'bottom-bars';
  @Input({required: true}) data!: IBottomBars;
  subscriptions: Subscription = new Subscription();
  isViewInit: boolean = false;

  constructor(private gooChartS: GoogleChartsService) {}

  ngAfterViewInit(): void {
    this.subscriptions.add(
      this.gooChartS.isScriptLoad$.subscribe((result) => {
        if(this.data.header.length > 0)
        result === true && this.drawGraphic();
        this.isViewInit = true;
      })
    );
  }
  
  ngOnChanges(changes: any): void {
    if(this.isViewInit && !changes?.data?.firstChange){
      this.drawGraphic();
    }
  }

  drawGraphic() {
    const formatData = bottomBarsDataDto(this.data);
    const data = google.visualization.arrayToDataTable([
      ['Criterio', this.data.value_text, { role: 'style' }],
      ...formatData
    ]);
    const options = {
      legend: { position: 'none' },
      colors: ['#2E3C59'],
      vAxis: {
        ticks: this.data?.ticks ?? [0, 25, 50, 75, 100],
        format: this.data.formatData ? this.data.formatData : "#'%'",
        textStyle: {
          fontSize: 10,
          color: '#58637A',
          
        },
      },
      hAxis: {
        textStyle: {
          fontSize: 10,
          color: '#58637A',
        },
      },
      tooltip: {
        color: '#58637A',
        fontSize: 10,
        
      },
      chartArea: { left: 50, top: 20, width: '100%', height: '250' },
    };
    const chart = new google.visualization.ColumnChart(
      document.getElementById(this.containerID)
    );
    chart.draw(data, options);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
